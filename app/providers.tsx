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

export function Providers({ children }: Props) {
  useEffect(() => {
    // Initialize Telegram WebApp if available
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();
      console.log('[Telegram] Mini App initialized');
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
