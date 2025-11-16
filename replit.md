# ZSwap - Encrypted Private Swaps

## Overview

ZSwap is a privacy-focused decentralized exchange (DEX) that enables users to swap tokens without revealing transaction amounts on-chain. The application uses Fully Homomorphic Encryption (FHE) technology via Zama's FHEVM to keep swap amounts encrypted while still enabling automated matching and execution. Built with Next.js and React, ZSwap provides a user-friendly interface for private token swaps on the Sepolia testnet.

**Core Functionality:**
- Private token swaps with encrypted amounts (USDC, USDT, ETH, BTC)
- Deposit/withdraw flows between regular and encrypted tokens
- Real-time price feeds from Redstone Oracle
- Telegram Mini App integration
- MetaMask wallet connectivity
- Intent-based swap matching system

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework:** Next.js 15 (App Router) with React 19 and TypeScript
- Server-side rendering enabled
- Turbopack for fast development builds
- Route-based code organization under `/app`

**UI Design System:**
- Custom "sketch theme" using hand-drawn, pencil-style aesthetics
- Rough.js library for hand-drawn borders and visual elements
- Patrick Hand Google Font for handwritten typography
- shadcn/ui component library (Radix UI primitives)
- Tailwind CSS with custom HSL color variables
- Framer Motion for animations

**State Management:**
- React hooks and context providers for global state
- Custom hooks for wallet, FHEVM, and contract interactions
- In-memory storage provider for FHEVM decryption signatures

### Backend Architecture

**Smart Contract Layer (Solidity 0.8.24):**
- **ZSwapSimple:** Main swap pool contract handling encrypted intents
- **EncryptedUSDC/USDT/ETH/BTC:** Privacy token wrappers with FHE operations
- **MockUSDC/USDT/ETH/BTC:** Test ERC20 tokens for development
- Deployed on Sepolia testnet (chain ID: 11155111)

**Contract Interaction Pattern:**
1. Users deposit regular tokens to receive encrypted equivalents
2. Submit swap intents with encrypted amounts (FHE handles)
3. Pool matches intents in batches
4. Execute matched swaps and distribute encrypted outputs
5. Withdraw to convert back to regular tokens

**API Routes (Next.js Server):**
- `/api/oracle-prices`: Proxy for Redstone Oracle price feeds
- Implements caching (30s TTL) and retry logic for reliability

### Encryption & Privacy Layer

**FHEVM Integration:**
- Zama Relayer SDK (`@zama-fhe/relayer-sdk`) for FHE operations
- Client-side encryption of swap amounts before submission
- Decryption requires user signatures (EIP-712)
- Public key storage using IndexedDB
- Mock FHEVM instance for local testing (`@fhevm/mock-utils`)

**Encryption Flow:**
1. User inputs swap amount in UI
2. FHEVM instance encrypts amount client-side
3. Encrypted handle + proof submitted to smart contract
4. All computation happens on encrypted values
5. User can decrypt their balances with signature

**Security Headers:**
- Cross-Origin-Opener-Policy: same-origin
- Cross-Origin-Embedder-Policy: require-corp
- Required for SharedArrayBuffer used by FHEVM WASM

### Wallet Integration

**Primary:** MetaMask via EIP-6963 provider detection
- Multi-wallet support (detects all injected wallets)
- Ethers.js v6 for contract interactions
- Automatic network switching to Sepolia
- Signer/provider context management

**Alternative:** Telegram Mini App Web3 wallet
- TWA SDK integration (`@twa-dev/sdk`)
- Telegram user info and haptic feedback
- Conditional rendering based on environment

### Price Oracle Integration

**Redstone Oracle:**
- Real-time price feeds for USDC, USDT, ETH, BTC
- Server-side API proxy to avoid CORS issues
- Auto-refresh every 5 seconds
- Fallback to static prices on failure

**Integration Pattern:**
- Custom `useOraclePrices` hook
- Caching with 30s TTL on server
- Retry logic (3 attempts with exponential backoff)

## External Dependencies

### Blockchain & Web3
- **Hardhat 2.19:** Smart contract development and deployment
- **Ethers.js 6:** Blockchain interaction library
- **@nomicfoundation/hardhat-ethers:** Hardhat + Ethers integration
- **Solidity 0.8.24:** Smart contract language

### Encryption & Privacy
- **@zama-fhe/relayer-sdk:** FHEVM client library for FHE operations
- **@fhevm/mock-utils:** Mock FHEVM for local testing
- **Zama FHE Network:** Sepolia testnet deployment

### Frontend Libraries
- **Next.js 15.4:** React framework with App Router
- **React 19.1:** UI library
- **TypeScript:** Type safety
- **Tailwind CSS:** Utility-first styling
- **Framer Motion:** Animation library
- **Rough.js:** Hand-drawn graphics library

### UI Components
- **shadcn/ui:** Component library built on Radix UI
- **Radix UI primitives:** Accessible component primitives (Dialog, Select, Tabs, etc.)
- **Lucide React:** Icon library
- **class-variance-authority:** Component variant management

### Utilities & Tools
- **react-hot-toast:** Toast notifications
- **idb:** IndexedDB wrapper for browser storage
- **dotenv:** Environment variable management

### APIs & Services
- **Redstone Finance Oracle:** Real-time crypto price feeds via public API
- **Sepolia RPC:** Ethereum testnet RPC endpoint
- **Etherscan API:** Contract verification (optional)

### Telegram Integration
- **@twa-dev/sdk:** Telegram Web App SDK for mini apps

### Development Tools
- **Vitest:** Unit testing framework
- **@testing-library/react:** React testing utilities
- **ESLint:** Code linting (Next.js config)
- **PostCSS & Autoprefixer:** CSS processing

### Network Configuration
- **Sepolia Testnet (11155111):** Primary deployment network
- **Local Hardhat Node (31337):** Development and testing
- Mock chain support for FHEVM testing via configurable RPC URLs