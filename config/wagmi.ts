import { createAppKit } from '@reown/appkit/react'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { sepolia, mainnet } from '@reown/appkit/networks'
import { cookieStorage, createStorage } from 'wagmi'

// Get projectId from environment
export const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || process.env.NEXT_PUBLIC_REOWN_PROJECT_ID

if (!projectId) {
  throw new Error('NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID or NEXT_PUBLIC_REOWN_PROJECT_ID is required')
}

// Detect if running in Telegram
const isTelegram = typeof window !== 'undefined' && 
  (window.Telegram?.WebApp !== undefined || 'TelegramWebviewProxy' in window);

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

// Create the modal with Telegram support
export const modal = createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks: [sepolia, mainnet],
  defaultNetwork: sepolia,
  metadata: metadata,
  features: {
    analytics: true,
    email: false,
    socials: false,
  },
  themeMode: 'dark',
  themeVariables: {
    '--w3m-z-index': '9999'
  },
  // CRITICAL: Enable mobile linking for Telegram
  enableWalletConnect: true,
  enableInjected: !isTelegram, // Disable injected wallets in Telegram
  enableCoinbase: false,
  // Force WalletConnect mode in Telegram
  ...(isTelegram && {
    mobileWallets: [
      {
        id: 'metamask',
        name: 'MetaMask',
        links: {
          native: 'metamask:',
          universal: 'https://metamask.app.link'
        }
      },
      {
        id: 'trust',
        name: 'Trust Wallet',
        links: {
          native: 'trust:',
          universal: 'https://link.trustwallet.com'
        }
      },
      {
        id: 'rainbow',
        name: 'Rainbow',
        links: {
          native: 'rainbow:',
          universal: 'https://rainbow.me'
        }
      }
    ]
  })
})

// Override link opening in Telegram environment
if (isTelegram && typeof window !== 'undefined') {
  const originalOpen = window.open;
  window.open = function(url: any, target?: string, features?: string): Window | null {
    const urlString = typeof url === 'string' ? url : url?.toString();
    
    if (urlString && window.Telegram?.WebApp) {
      console.log('[Telegram] Opening link via Telegram.WebApp.openLink:', urlString);
      
      // Use Telegram's openLink for external URLs
      window.Telegram.WebApp.openLink(urlString, { 
        try_instant_view: false 
      });
      
      return null;
    }
    
    return originalOpen.call(window, url, target, features);
  };
  
  console.log('[Telegram] Link opening override installed');
}
