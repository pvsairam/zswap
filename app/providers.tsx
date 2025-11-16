"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { InMemoryStorageProvider } from "@/core/useInMemoryStorage";
import { TelegramProvider } from "@/core/useTelegram";
import { initTelegramWalletFix } from "@/lib/telegramUtils";
import { config } from "@/config/wagmi";

const queryClient = new QueryClient();

type Props = {
  children: ReactNode;
};

export function Providers({ children }: Props) {
  useEffect(() => {
    // Initialize Telegram wallet compatibility fix on mount
    initTelegramWalletFix();
  }, []);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <TelegramProvider>
          <InMemoryStorageProvider>{children}</InMemoryStorageProvider>
        </TelegramProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
