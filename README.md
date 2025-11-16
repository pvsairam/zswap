# ZSwap - Encrypted Private Swaps

> **Keep your crypto swaps completely private**

ZSwap is a privacy-focused token exchange that lets you swap tokens without anyone seeing how much you're trading. Built with advanced encryption technology, your transaction amounts stay hidden from everyone - including MEV bots and front-runners.

---

## What Makes ZSwap Different?

**Traditional exchanges expose everything:**
- Everyone can see your swap amounts
- Bots can front-run your trades
- Your trading strategy becomes public
- You lose money to MEV attacks

**ZSwap keeps everything private:**
- ✅ Swap amounts are encrypted on the blockchain
- ✅ No one can see how much you're trading
- ✅ Protected from MEV attacks and front-running
- ✅ Your financial privacy is guaranteed

---

## How It Works (Simple Explanation)

Think of it like sending a locked suitcase - you can move it around, but nobody can see what's inside:

1. **Deposit**: You put regular tokens (like USDC) into an encrypted wrapper
2. **Swap**: You submit a swap with the amount locked in a digital suitcase
3. **Privacy**: The blockchain processes your swap without ever revealing the amount
4. **Withdraw**: You take out your tokens whenever you want

All the math happens while everything stays locked up. Pretty cool, right?

---

## Quick Start

### For Users

1. **Connect Your Wallet**
   - Open the app
   - Click "Connect Wallet"
   - Approve the connection in MetaMask

2. **Get Test Tokens** (Sepolia Testnet)
   - Go to the "Faucet" tab
   - Click "Get Test Tokens"
   - You'll receive 100 USDC or USDT to try the app

3. **Deposit Tokens**
   - Go to "Deposit" tab
   - Enter amount (like "50 USDC")
   - Click "Deposit"
   - Your tokens are now encrypted!

4. **Make a Private Swap**
   - Go to "Swap" tab
   - Choose what you want to swap (USDC → USDT)
   - Enter amount
   - Click "Submit Swap"
   - Nobody can see how much you're swapping!

### For Developers

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open browser to localhost:5000
```

**Important Files:**
- `components/ZSwapSimple.tsx` - Main app interface
- `core/useZSwap.ts` - Swap logic
- `config/contracts.ts` - Smart contract addresses
- `app/globals.css` - Design styles

---

## Technical Details (For the Curious)

### Technology Stack

**Frontend:**
- Next.js 15 - Modern React framework
- TypeScript - Type-safe code
- Tailwind CSS - Beautiful styling
- Framer Motion - Smooth animations

**Privacy Layer:**
- Zama FHEVM - Homomorphic encryption (math on encrypted data)
- ethers.js - Ethereum interactions
- MetaMask - Wallet connection

**Smart Contracts:**
- Solidity 0.8.24
- Deployed on Sepolia testnet
- Encrypted token wrappers (zUSDC, zUSDT)

### What is Homomorphic Encryption?

Imagine you have a number written on paper, locked in a box:

- **Normal encryption**: Lock it → Can't use it → Unlock it → Use it
- **Homomorphic encryption**: Lock it → **Do math while locked** → Unlock it → See result

**Example:**
```
Your balance: [LOCKED: ???]
Swap amount: [LOCKED: ???]
After swap: [LOCKED: ???]

Nobody knows the numbers, but the math still works perfectly!
```

### Network Information

**Testnet**: Ethereum Sepolia
- Chain ID: 11155111
- RPC URL: https://ethereum-sepolia-rpc.publicnode.com
- Get test ETH: [Sepolia Faucet](https://sepoliafaucet.com/)

**Contract Addresses** (on Sepolia):
- ZSwapSimple: `0x95134e52cC1436D7F7B111F430EF7eF938a227B7`
- MockUSDC: `0x...` (see config/contracts.ts)
- EncryptedUSDC: `0x...` (see config/contracts.ts)

---

## Design System

ZSwap uses a unique "Celestial Sketch" design:
- Hand-drawn borders using rough.js
- Cosmic navy to parchment gradients
- Patrick Hand font for friendly feel
- Glass morphism with backdrop blur
- 48px minimum touch targets for accessibility

---

## Project Structure

```
zswap/
├── app/                    # Next.js app router
│   ├── page.tsx           # Home page
│   ├── layout.tsx         # Root layout
│   └── api/               # API routes (oracle prices)
├── components/            # React components
│   ├── ZSwapSimple.tsx    # Main app
│   ├── SwapCard.tsx       # Swap interface
│   └── NavBar.tsx         # Top navigation
├── core/                  # Business logic
│   ├── useZSwap.ts        # Swap functionality
│   ├── useOraclePrices.ts # Price feeds
│   └── metamask/          # Wallet connection
├── contracts/             # Smart contracts
│   ├── core/              # Main contracts
│   └── tokens/            # Token contracts
├── fhevm/                 # Encryption SDK
└── config/                # Configuration files
```

---

## Development

### Running Locally

```bash
# Install Node.js dependencies
npm install

# Start development server
npm run dev

# App opens at http://localhost:5000
```

### Deploying Smart Contracts

```bash
# Compile contracts
npx hardhat compile

# Deploy to Sepolia
npx hardhat run scripts/deploy-zswap.ts --network sepolia

# Verify on Etherscan
npx hardhat verify --network sepolia <CONTRACT_ADDRESS>
```

### Environment Variables

Create a `.env.local` file:

```env
# Required for contract deployment
DEPLOYER_PRIVATE_KEY=your_private_key_here
SEPOLIA_RPC_URL=https://rpc.sepolia.org
ETHERSCAN_API_KEY=your_etherscan_key
```

---

## Privacy & Security

### What's Private:
✅ Swap amounts (encrypted on-chain)
✅ Your wallet balances (encrypted)
✅ Trading patterns (amounts hidden)

### What's Public:
ℹ️ Your wallet address (blockchain is public)
ℹ️ Which tokens you're swapping (USDC/USDT)
ℹ️ When you make transactions (timestamps)

### Security Features:
- User-controlled decryption (only you can see your balance)
- No admin access to funds (non-custodial)
- Emergency pause (if bugs found)
- Reentrancy protection on all contracts

---

## Limitations & Disclaimers

⚠️ **Testnet Only**: This is a demo on Sepolia testnet
⚠️ **Not Audited**: Smart contracts have not been professionally audited
⚠️ **Educational**: Built for learning and demonstration
⚠️ **No Real Money**: Only use test tokens

**Before using on mainnet**, you would need:
- Professional security audit
- Bug bounty program
- Legal review
- Production infrastructure

---

## Frequently Asked Questions

**Q: Is this safe to use with real money?**
A: No! This is a testnet demo. Only use test tokens.

**Q: Can anyone see my swap amounts?**
A: No! Amounts are encrypted. Only you can decrypt your balance.

**Q: What tokens are supported?**
A: Currently USDC and USDT on Sepolia testnet.

**Q: Do I need special hardware?**
A: Nope! Works in any modern web browser with MetaMask.

**Q: Is this faster than normal exchanges?**
A: It's similar speed, but with added privacy.

**Q: Can I use this in Telegram?**
A: Yes! The app works as a Telegram Mini App.

---

## Roadmap & Future Ideas

- [ ] Support more tokens (ETH, BTC, DAI)
- [ ] Mobile app (iOS/Android)
- [ ] Layer 2 deployment (cheaper gas)
- [ ] Advanced trading features
- [ ] Professional security audit
- [ ] Mainnet launch (when ready)

---

## Contributing

Found a bug or have ideas? Contributions welcome!

1. Fork the repository
2. Create your feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

## Resources & Links

**Documentation:**
- [Zama FHEVM Docs](https://docs.zama.ai/fhevm) - Encryption technology
- [Next.js Docs](https://nextjs.org/docs) - Framework docs
- [Ethers.js Docs](https://docs.ethers.org/) - Ethereum library

**Get Help:**
- GitHub Issues - Report bugs
- Discussions - Ask questions
- Telegram - Join our community (coming soon)

**Blockchain Tools:**
- [Sepolia Faucet](https://sepoliafaucet.com/) - Get test ETH
- [Sepolia Explorer](https://sepolia.etherscan.io/) - View transactions

---

## License

MIT License - Free to use and modify

---

## Credits

Built with ❤️ for privacy-preserving DeFi

**Technologies:**
- Zama - Homomorphic encryption
- Ethereum - Blockchain platform
- Next.js - React framework
- Radix UI - Accessible components

---

**Remember**: This is a demo project for learning. Always do your own research and never invest more than you can afford to lose.
