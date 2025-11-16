import { useCallback, useState } from 'react';
import { useUnifiedWalletSigner } from './wallet/useUnifiedWalletSigner';
import { ethers } from 'ethers';
import { PrivateSwapPoolABI } from '../abi/PrivateSwapPoolABI';
import { ZSwapSimpleABI } from '../abi/ZSwapSimpleABI';
import { MockERC20ABI } from '../abi/MockERC20ABI';
import { HybridFHERC20ABI } from '../abi/HybridFHERC20ABI';
import { EncryptedUSDCSimpleABI } from '../abi/EncryptedUSDCSimpleABI';
import { EncryptedUSDTSimpleABI } from '../abi/EncryptedUSDTSimpleABI';
import { CONTRACTS, getPoolKey } from '../config/contracts';

export const useZSwap = () => {
  const { ethersSigner: signer, ethersBrowserProvider: provider } = useUnifiedWalletSigner();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deposit = useCallback(async (currency: 'USDC' | 'USDT', amount: string) => {
    if (!signer) {
      setError('Please connect your wallet');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get mock token and encrypted token addresses
      const currencyMap = {
        'USDC': { 
          mockToken: CONTRACTS.MockUSDC, 
          encryptedToken: CONTRACTS.EncryptedUSDC,
          abi: EncryptedUSDCSimpleABI.abi,
          decimals: 6 
        },
        'USDT': { 
          mockToken: CONTRACTS.MockUSDT, 
          encryptedToken: CONTRACTS.EncryptedUSDT,
          abi: EncryptedUSDTSimpleABI.abi,
          decimals: 6 
        },
      };
      const { mockToken, encryptedToken, abi, decimals } = currencyMap[currency];
      
      // Parse amount with correct decimals (uint128)
      const parsedAmount = ethers.parseUnits(amount, decimals);
      
      // Create contract instances
      const mockTokenContract = new ethers.Contract(mockToken, MockERC20ABI.abi, signer);
      const encryptedTokenContract = new ethers.Contract(encryptedToken, abi, signer);
      
      // Check allowance - mock token must approve encrypted token contract
      const userAddress = await signer.getAddress();
      const allowance = await mockTokenContract.allowance(userAddress, encryptedToken);
      
      // Approve if needed (with 2x the amount for safety)
      const approvalAmount = parsedAmount * BigInt(2);
      if (allowance < approvalAmount) {
        console.log('Approving mock token spend to encrypted token contract...');
        const approveTx = await mockTokenContract.approve(encryptedToken, approvalAmount);
        await approveTx.wait();
        console.log('Approval confirmed for', ethers.formatUnits(approvalAmount, decimals));
      }
      
      // Deposit to encrypted token contract
      console.log('Depositing tokens to encrypted contract...');
      const depositTx = await encryptedTokenContract.deposit(parsedAmount);
      await depositTx.wait();
      console.log('Deposit confirmed');
      
      return depositTx.hash;
    } catch (err: any) {
      console.error('Deposit error:', err);
      setError(err.message || 'Deposit failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [signer]);

  const submitIntent = useCallback(async (
    tokenIn: 'USDC' | 'USDT',
    tokenOut: 'USDC' | 'USDT',
    amount: string
  ) => {
    if (!signer) {
      setError('Please connect your wallet');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const tokenInAddress = tokenIn === 'USDC' ? CONTRACTS.EncryptedUSDC : CONTRACTS.EncryptedUSDT;
      const tokenOutAddress = tokenOut === 'USDC' ? CONTRACTS.EncryptedUSDC : CONTRACTS.EncryptedUSDT;
      
      const parsedAmount = ethers.parseUnits(amount, 6);
      
      const pool = new ethers.Contract(CONTRACTS.ZSwapPool, ZSwapSimpleABI.abi, signer);
      
      console.log('Submitting intent with params:', {
        tokenInAddress,
        tokenOutAddress,
        amount: parsedAmount.toString()
      });
      
      const tx = await pool.submitIntent(
        tokenInAddress,
        tokenOutAddress,
        parsedAmount
      );
      
      const receipt = await tx.wait();
      console.log('Intent submitted');
      
      const event = receipt.logs.find((log: any) => {
        try {
          const parsed = pool.interface.parseLog(log);
          return parsed?.name === 'IntentSubmitted';
        } catch {
          return false;
        }
      });
      
      const intentId = event ? pool.interface.parseLog(event)?.args?.intentId : null;
      
      return { txHash: tx.hash, intentId };
    } catch (err: any) {
      console.error('Submit intent error:', err);
      setError(err.message || 'Submit intent failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [signer]);

  const getEncryptedBalance = useCallback(async (currency: 'USDC' | 'USDT', address?: string) => {
    if (!provider) return null;
    
    try {
      const { encryptedToken, abi } = currency === 'USDC' 
        ? { encryptedToken: CONTRACTS.EncryptedUSDC, abi: EncryptedUSDCSimpleABI.abi }
        : { encryptedToken: CONTRACTS.EncryptedUSDT, abi: EncryptedUSDTSimpleABI.abi };
      
      let targetAddress = address;
      if (!targetAddress && signer) {
        targetAddress = await signer.getAddress();
      }
      if (!targetAddress) return null;
      
      const encToken = new ethers.Contract(encryptedToken, abi, provider);
      // balanceOf returns uint128 (not encrypted handle in simplified version)
      const encBalance = await encToken.balanceOf(targetAddress);
      
      // Return the balance as string (uint128 value)
      return encBalance.toString();
    } catch (err) {
      console.error('Error getting encrypted balance:', err);
      return null;
    }
  }, [provider, signer]);

  const getRegularBalance = useCallback(async (currency: 'USDC' | 'USDT', address?: string) => {
    if (!provider) return null;
    
    try {
      const tokenAddress = currency === 'USDC' 
        ? CONTRACTS.MockUSDC 
        : CONTRACTS.MockUSDT;
      
      let targetAddress = address;
      if (!targetAddress && signer) {
        targetAddress = await signer.getAddress();
      }
      if (!targetAddress) return null;
      
      const token = new ethers.Contract(tokenAddress, MockERC20ABI.abi, provider);
      const balance = await token.balanceOf(targetAddress);
      
      return ethers.formatUnits(balance, 6);
    } catch (err) {
      console.error('Error getting regular balance:', err);
      return null;
    }
  }, [provider, signer]);

  const listenForIntentDecrypted = useCallback((callback: (intentId: string, amount: string) => void) => {
    if (!provider) return;
    
    const pool = new ethers.Contract(CONTRACTS.ZSwapPool, PrivateSwapPoolABI.abi, provider);
    
    const filter = pool.filters.IntentDecrypted();
    
    const listener = (intentId: string, decryptedAmount: bigint) => {
      callback(intentId, ethers.formatUnits(decryptedAmount, 6));
    };
    
    pool.on(filter, listener);
    
    // Return cleanup function
    return () => {
      pool.off(filter, listener);
    };
  }, [provider]);
  
  const checkIntentStatus = useCallback(async (intentId: string) => {
    if (!provider) return null;
    
    try {
      const pool = new ethers.Contract(CONTRACTS.ZSwapPool, PrivateSwapPoolABI.abi, provider);
      
      // Get intent details from contract
      const intent = await pool.intents(intentId);
      
      // Check if intent is decrypted (decryptedAmount > 0)
      if (intent && intent.decryptedAmount && intent.decryptedAmount > BigInt(0)) {
        return {
          isDecrypted: intent.decrypted === true || intent[6] === true,
          amount: ethers.formatUnits(intent.decryptedAmount, 6),
          isExecuted: intent.processed === true || intent[5] === true
        };
      }
      
      return {
        isDecrypted: false,
        amount: null,
        isExecuted: false
      };
    } catch (err) {
      console.error('Error checking intent status:', err);
      return null;
    }
  }, [provider]);
  
  const fetchUserIntents = useCallback(async (userAddress?: string) => {
    try {
      let targetAddress = userAddress;
      if (!targetAddress && signer) {
        targetAddress = await signer.getAddress();
      }
      if (!targetAddress) return [];
      
      // Use Cloudflare's public Sepolia RPC (no API key, no rate limits for reasonable usage)
      const publicProvider = new ethers.JsonRpcProvider('https://ethereum-sepolia-rpc.publicnode.com');

      const pool = new ethers.Contract(CONTRACTS.ZSwapPool, PrivateSwapPoolABI.abi, publicProvider);

      // Calculate block range for last 1 hour (approximately 300 blocks on Sepolia)
      const currentBlock = await publicProvider.getBlockNumber();
      const oneHourAgo = currentBlock - 300; // ~12 seconds per block
      
      console.log(`Fetching intents from block ${oneHourAgo} to ${currentBlock} for ${targetAddress}`);
      
      // Get IntentSubmitted events for this user in the last 1 hour
      // Event signature: IntentSubmitted(bytes32 indexed poolId, address tokenIn, address tokenOut, address indexed user, bytes32 intentId)
      // We can only filter by indexed parameters (poolId and user)
      const filter = pool.filters.IntentSubmitted(null, null, null, targetAddress, null);
      const events = await pool.queryFilter(filter, oneHourAgo, currentBlock);
      
      console.log(`Found ${events.length} IntentSubmitted events`);

      // Fetch intent details
      const intents = events.map((event) => {
        // Parse event to get tokenIn, tokenOut, and intentId
        const parsedEvent = pool.interface.parseLog({
          topics: event.topics as string[],
          data: event.data
        });

        return {
          id: event.transactionHash, // Use tx hash as ID
          transactionHash: event.transactionHash,
          blockNumber: event.blockNumber,
          user: targetAddress!,
          tokenIn: parsedEvent?.args?.tokenIn || '',
          tokenOut: parsedEvent?.args?.tokenOut || '',
          deadline: 0,
          decryptedAmount: null,
          executed: false,
          timestamp: 0
        };
      });
      
      // Filter out null values (executed intents are already filtered), then sort by block number (newest first)
      return intents
        .filter((intent): intent is NonNullable<typeof intent> => intent !== null)
        .sort((a, b) => b.blockNumber - a.blockNumber);
    } catch (err) {
      console.error('Error fetching user intents:', err);
      return [];
    }
  }, [signer]);

  const executeIntent = useCallback(async (intentId: string) => {
    if (!signer) {
      setError('Please connect your wallet');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const pool = new ethers.Contract(CONTRACTS.ZSwapPool, PrivateSwapPoolABI.abi, signer);
      
      console.log('Executing intent...');
      
      // Estimate gas and add 20% buffer
      const estimatedGas = await pool.executeIntent.estimateGas(intentId);
      const gasLimit = estimatedGas * BigInt(120) / BigInt(100);
      
      const tx = await pool.executeIntent(intentId, { gasLimit });
      await tx.wait();
      console.log('Intent executed');
      
      return tx.hash;
    } catch (err: any) {
      console.error('Execute intent error:', err);
      setError(err.message || 'Execute intent failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [signer]);

  const decryptBalance = useCallback(async (
    encryptedHandle: string,
    tokenAddress: string,
    fhevmInstance: any,
    fhevmDecryptionSignatureStorage: any
  ) => {
    if (!signer || !provider || !fhevmInstance) return null;

    try {
      // Follow the exact documentation approach for v0.2.0
      console.log('Starting decryption for handle:', encryptedHandle);

      // Generate a keypair for this decryption
      const keypair = fhevmInstance.generateKeypair();
      console.log('Generated keypair');

      // The handle from the contract is already in the correct format
      // It's a euint128 handle represented as bytes32
      let ciphertextHandle = encryptedHandle;

      // Ensure it has 0x prefix and is lowercase
      if (!ciphertextHandle.startsWith('0x')) {
        ciphertextHandle = '0x' + ciphertextHandle;
      }

      // Convert to lowercase for consistency
      ciphertextHandle = ciphertextHandle.toLowerCase();

      console.log('Formatted handle:', ciphertextHandle);
      console.log('Handle length:', ciphertextHandle.length, '(should be 66 for 0x + 64 hex chars)');
      console.log('Token address:', tokenAddress);

      // Ensure contract address is checksummed
      const checksummedAddress = ethers.getAddress(tokenAddress);

      // Prepare handle-contract pairs
      const handleContractPairs = [
        {
          handle: ciphertextHandle,
          contractAddress: checksummedAddress,
        },
      ];

      // Set timestamps - ensure we're using seconds, not milliseconds
      const now = Date.now();
      const startTimeStamp = Math.floor(now / 1000);
      const durationDays = 10;

      // Debug: Check if timestamp is reasonable
      const dateCheck = new Date(startTimeStamp * 1000);
      console.log('Current date/time:', dateCheck.toISOString());
      console.log('Current timestamp (seconds):', startTimeStamp, 'Duration days:', durationDays);

      // Convert to strings for the API
      const startTimeStampStr = startTimeStamp.toString();
      const durationDaysStr = durationDays.toString();
      const contractAddresses = [checksummedAddress];

      console.log('Creating EIP712 message...');
      // Create EIP712 message with string parameters
      const eip712 = fhevmInstance.createEIP712(
        keypair.publicKey,
        contractAddresses,
        startTimeStampStr,
        durationDaysStr
      );

      console.log('Signing typed data...');
      // Sign the typed data
      const signature = await signer.signTypedData(
        eip712.domain,
        {
          UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification,
        },
        eip712.message,
      );

      const userAddress = await signer.getAddress();
      const cleanSignature = signature.replace("0x", "");

      console.log('Calling userDecrypt with params:', {
        handleContractPairs,
        publicKey: keypair.publicKey.substring(0, 20) + '...',
        signature: cleanSignature.substring(0, 20) + '...',
        contractAddresses,
        userAddress,
        startTimeStamp: startTimeStampStr,
        durationDays: durationDaysStr,
      });

      // Call userDecrypt exactly as in documentation
      const result = await fhevmInstance.userDecrypt(
        handleContractPairs,
        keypair.privateKey,
        keypair.publicKey,
        cleanSignature,
        contractAddresses,
        userAddress,
        startTimeStampStr,
        durationDaysStr,
      );

      console.log('Decryption result:', result);

      // Get decrypted value using the ciphertext handle as key
      const decryptedValue = result[ciphertextHandle];

      if (decryptedValue !== undefined) {
        // Convert decrypted value to readable format (assuming 6 decimals)
        return ethers.formatUnits(BigInt(decryptedValue), 6);
      }

      console.log('No decrypted value found in result');
      return null;
    } catch (err) {
      console.error('Error decrypting balance:', err);
      return null;
    }
  }, [provider, signer]);

  const mintTokens = useCallback(async (currency: 'USDC' | 'USDT', amount: string) => {
    if (!signer) {
      setError('Please connect your wallet');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get token address and decimals (only deployed tokens)
      const tokenMap = {
        'USDC': { address: CONTRACTS.MockUSDC, decimals: 6 },
        'USDT': { address: CONTRACTS.MockUSDT, decimals: 6 },
      };
      const { address: tokenAddress, decimals } = tokenMap[currency];
      
      const token = new ethers.Contract(tokenAddress, MockERC20ABI.abi, signer);
      
      // Parse amount with correct decimals
      const parsedAmount = ethers.parseUnits(amount, decimals);
      
      console.log(`Minting ${amount} ${currency}...`);
      const tx = await token.mint(await signer.getAddress(), parsedAmount);
      await tx.wait();
      console.log('Mint confirmed');
      
      return tx.hash;
    } catch (err: any) {
      console.error('Mint error:', err);
      setError(err.message || 'Mint failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [signer]);

  const withdraw = useCallback(async (currency: 'USDC' | 'USDT', amount: string, recipient?: string) => {
    if (!signer) {
      setError('Please connect your wallet');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get encrypted token address and ABI
      const currencyMap = {
        'USDC': { 
          encryptedToken: CONTRACTS.EncryptedUSDC,
          abi: EncryptedUSDCSimpleABI.abi,
          decimals: 6 
        },
        'USDT': { 
          encryptedToken: CONTRACTS.EncryptedUSDT,
          abi: EncryptedUSDTSimpleABI.abi,
          decimals: 6 
        },
      };
      const { encryptedToken, abi, decimals } = currencyMap[currency];
      
      // Parse amount with correct decimals (uint128)
      const parsedAmount = ethers.parseUnits(amount, decimals);
      
      // Note: recipient parameter is not used in EncryptedUSDCSimple.withdraw()
      // Tokens are always sent back to msg.sender
      
      // Create contract instance
      const encryptedTokenContract = new ethers.Contract(encryptedToken, abi, signer);
      
      // Withdraw from encrypted token contract
      console.log('Withdrawing tokens from encrypted contract...');
      const withdrawTx = await encryptedTokenContract.withdraw(parsedAmount);
      await withdrawTx.wait();
      console.log('Withdraw confirmed');
      
      return withdrawTx.hash;
    } catch (err: any) {
      console.error('Withdraw error:', err);
      setError(err.message || 'Withdraw failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [signer]);

  return {
    deposit,
    withdraw,
    submitIntent,
    executeIntent,
    getEncryptedBalance,
    getRegularBalance,
    decryptBalance,
    listenForIntentDecrypted,
    checkIntentStatus,
    fetchUserIntents,
    mintTokens,
    loading,
    error
  };
};
