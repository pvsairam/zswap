import { createAppKit } from '@reown/appkit/react'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { sepolia, mainnet } from '@reown/appkit/networks'
import { cookieStorage, createStorage } from 'wagmi'

// Get projectId from environment
export const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || process.env.NEXT_PUBLIC_REOWN_PROJECT_ID

if (!projectId) {
  throw new Error('NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is required')
}

// Create wagmi adapter
export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage
  }),
  ssr: true,
  projectId,
  networks: [sepolia, mainnet]
})

export const config = wagmiAdapter.wagmiConfig

// Metadata
const metadata = {
  name: 'ZSwap',
  description: 'Privacy-focused DEX with FHE encryption',
  url: 'https://zswap.vercel.app',
  icons: ['https://zswap.vercel.app/icon.png']
}

// Create the modal with analytics DISABLED for Telegram compatibility
export const modal = createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks: [sepolia, mainnet],
  defaultNetwork: sepolia,
  metadata: metadata,
  features: {
    analytics: false,  // CRITICAL: Disable analytics to prevent CORS blocking
    email: false,
    socials: false,
    swaps: false,
    onramp: false
  },
  themeMode: 'dark',
  themeVariables: {
    '--w3m-z-index': 9999
  }
})
