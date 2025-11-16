"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { MetaMaskProvider } from "@/core/metamask/useMetaMaskProvider";
import { InMemoryStorageProvider } from "@/core/useInMemoryStorage";
import { TelegramProvider } from "@/core/useTelegram";
import { config } from "@/config/wagmi";
import { UnifiedWalletSignerProvider } from "@/core/wallet/useUnifiedWalletSigner";

const queryClient = new QueryClient()

type Props = {
  children: ReactNode;
};

// Install Telegram link override BEFORE anything else renders
if (typeof window !== 'undefined') {
  const isTelegram = window.Telegram?.WebApp !== undefined || 'TelegramWebviewProxy' in window;
  
  if (isTelegram) {
    console.log('[Telegram] Detected - installing link override');
    
    // Save original window.open
    const originalOpen = window.open;
    
    // Override window.open globally
    window.open = function(url: any, target?: string, features?: string): Window | null {
      const urlString = typeof url === 'string' ? url : url?.toString();
      
      if (!urlString) {
        return originalOpen.call(window, url, target, features);
      }
      
      console.log('[Telegram] Intercepted window.open:', urlString);
      
      // Handle all external links through Telegram
      if (urlString.startsWith('http://') || urlString.startsWith('https://')) {
        console.log('[Telegram] Opening external link via Telegram.WebApp.openLink');
        
        if (window.Telegram?.WebApp?.openLink) {
          window.Telegram.WebApp.openLink(urlString, { 
            try_instant_view: false 
          });
        } else {
          // Fallback to setting location
          window.location.href = urlString;
        }
        
        return null;
      }
      
      // Handle deep links (metamask://, wc://, etc)
      if (urlString.includes('://') && !urlString.startsWith('http')) {
        console.log('[Telegram] Converting deep link to universal link');
        
        let universalUrl = urlString;
        
        // Convert common wallet deep links to universal links
        if (urlString.startsWith('metamask://')) {
          universalUrl = urlString.replace('metamask://', 'https://metamask.app.link/');
        } else if (urlString.startsWith('trust://')) {
          universalUrl = urlString.replace('trust://', 'https://link.trustwallet.com/');
        } else if (urlString.startsWith('rainbow://')) {
          universalUrl = urlString.replace('rainbow://', 'https://rainbow.me/');
        } else if (urlString.startsWith('wc://')) {
          // WalletConnect deep link
          universalUrl = `https://metamask.app.link/wc?uri=${encodeURIComponent(urlString)}`;
        }
        
        console.log('[Telegram] Opening universal link:', universalUrl);
        
        if (window.Telegram?.WebApp?.openLink) {
          window.Telegram.WebApp.openLink(universalUrl, { 
            try_instant_view: false 
          });
        } else {
          window.location.href = universalUrl;
        }
        
        return null;
      }
      
      // Default to original behavior for relative URLs
      return originalOpen.call(window, url, target, features);
    };
    
    console.log('[Telegram] ✅ Link override installed successfully');
  }
}

export function Providers({ children }: Props) {
  useEffect(() => {
    // Initialize Telegram WebApp if available
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      tg.expand();
      tg.enableClosingConfirmation();
      
      console.log('[Telegram] WebApp initialized:', {
        platform: tg.platform,
        version: tg.version,
        initData: !!tg.initData
      });
    }
  }, []);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <TelegramProvider>
          <MetaMaskProvider>
            <UnifiedWalletSignerProvider>
              <InMemoryStorageProvider>
                {children}
              </InMemoryStorageProvider>
            </UnifiedWalletSignerProvider>
          </MetaMaskProvider>
        </TelegramProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
