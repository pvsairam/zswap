import hre from "hardhat";
import * as fs from "fs";
import * as path from "path";

/**
 * Redeploy all ZSwap contracts with correct addresses
 * NOTE: Users will need to re-deposit as contracts will be at new addresses
 */
async function main() {
  console.log("🚀 Redeploying ZSwap contracts with correct configuration...\n");

  // Access ethers inside main() after HRE initialization
  const { ethers } = hre;

  // Use existing mock token addresses (keep these)
  const MOCK_USDC = "0x594c461bf180258E292bb68e77C643dc96e4E5F0";
  const MOCK_USDT = "0x4B9A2d935b81890599fbbbbD7821A594C67Fafe3";

  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

  // Step 1: Deploy EncryptedUSDC with temporary ZSwap address
  console.log("1️⃣  Deploying EncryptedUSDCSimple...");
  const EncryptedUSDC = await ethers.getContractFactory("EncryptedUSDCSimple");
  const encryptedUSDC = await EncryptedUSDC.deploy(
    MOCK_USDC,
    ethers.ZeroAddress // Temporary - will deploy ZSwap next
  );
  await encryptedUSDC.waitForDeployment();
  const encryptedUSDCAddress = await encryptedUSDC.getAddress();
  console.log("   ✅ EncryptedUSDCSimple deployed to:", encryptedUSDCAddress);

  // Step 2: Deploy EncryptedUSDT with temporary ZSwap address  
  console.log("\n2️⃣  Deploying EncryptedUSDTSimple...");
  const EncryptedUSDT = await ethers.getContractFactory("EncryptedUSDTSimple");
  const encryptedUSDT = await EncryptedUSDT.deploy(
    MOCK_USDT,
    ethers.ZeroAddress // Temporary - will deploy ZSwap next
  );
  await encryptedUSDT.waitForDeployment();
  const encryptedUSDTAddress = await encryptedUSDT.getAddress();
  console.log("   ✅ EncryptedUSDTSimple deployed to:", encryptedUSDTAddress);

  // Step 3: Deploy ZSwapSimple with encrypted token addresses
  console.log("\n3️⃣  Deploying ZSwapSimple...");
  console.log("   EncryptedUSDC:", encryptedUSDCAddress);
  console.log("   EncryptedUSDT:", encryptedUSDTAddress);
  
  const ZSwap = await ethers.getContractFactory("ZSwapSimple");
  const zswap = await ZSwap.deploy(
    encryptedUSDCAddress,
    encryptedUSDTAddress
  );
  await zswap.waitForDeployment();
  const zswapAddress = await zswap.getAddress();
  console.log("   ✅ ZSwapSimple deployed to:", zswapAddress);

  // Step 4: Initialize pool addresses in encrypted tokens
  console.log("\n4️⃣  Initializing pool addresses in encrypted tokens...");
  const initUSDC = await encryptedUSDC.initializePool(zswapAddress);
  await initUSDC.wait();
  console.log("   ✅ EncryptedUSDC pool initialized");
  
  const initUSDT = await encryptedUSDT.initializePool(zswapAddress);
  await initUSDT.wait();
  console.log("   ✅ EncryptedUSDT pool initialized");

  // Authorize deployer as AVS operator
  console.log("\n5️⃣  Authorizing deployer as AVS operator...");
  const tx = await zswap.setAVSAuthorization(deployer.address, true);
  await tx.wait();
  console.log("   ✅ AVS operator authorized");

  // Update config/contracts.ts
  console.log("\n6️⃣  Updating config/contracts.ts...");
  updateConfig(encryptedUSDCAddress, encryptedUSDTAddress, zswapAddress);

  console.log("\n" + "=".repeat(60));
  console.log("🎉 All Contracts Redeployed Successfully!");
  console.log("=".repeat(60));
  console.log("\n📋 New Contract Addresses:");
  console.log("   EncryptedUSDC:", encryptedUSDCAddress);
  console.log("   EncryptedUSDT:", encryptedUSDTAddress);
  console.log("   ZSwapSimple:  ", zswapAddress);
  console.log("\n🔗 View on Etherscan:");
  console.log("   https://sepolia.etherscan.io/address/" + zswapAddress);
  console.log("\n✅ Config updated");
  console.log("\n⚠️  IMPORTANT: Users need to re-deposit (contracts at new addresses)");
  console.log("\n💡 Next: Restart your app to use the new contracts");
  console.log("=".repeat(60) + "\n");
}

function updateConfig(encryptedUSDCAddress: string, encryptedUSDTAddress: string, zswapAddress: string) {
  const configPath = path.join(__dirname, "../config/contracts.ts");
  
  const content = `// ZSwap Contract Addresses (Sepolia)
export const CONTRACTS = {
  MockUSDC: "0x594c461bf180258E292bb68e77C643dc96e4E5F0",
  MockUSDT: "0x4B9A2d935b81890599fbbbbD7821A594C67Fafe3",
  MockETH: "0x0000000000000000000000000000000000000000",
  MockBTC: "0x0000000000000000000000000000000000000000",
  EncryptedUSDC: "${encryptedUSDCAddress}",
  EncryptedUSDT: "${encryptedUSDTAddress}",
  EncryptedETH: "0x0000000000000000000000000000000000000000",
  EncryptedBTC: "0x0000000000000000000000000000000000000000",
  ZSwapPool: "${zswapAddress}",
  chainId: 11155111,
  explorerUrl: "https://sepolia.etherscan.io",
} as const;

// Pool key generator - uses encrypted tokens as currencies
export function getPoolKey() {
  return {
    currency0: CONTRACTS.EncryptedUSDC,
    currency1: CONTRACTS.EncryptedUSDT,
    fee: 3000,
    tickSpacing: 60,
    hooks: CONTRACTS.ZSwapPool,
  };
}
`;

  fs.writeFileSync(configPath, content, "utf-8");
  console.log("   ✅ Updated:", configPath);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });
