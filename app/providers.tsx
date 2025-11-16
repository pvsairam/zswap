"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";

import { MetaMaskProvider } from "@/core/metamask/useMetaMaskProvider";
import { InMemoryStorageProvider } from "@/core/useInMemoryStorage";
import { TelegramProvider } from "@/core/useTelegram";
import { UnifiedWalletProvider } from "@/core/wallet/useUnifiedWallet";
import { initTelegramWalletFix } from "@/lib/telegramUtils";
import { UnifiedWalletSignerProvider } from "@/core/wallet/useUnifiedWalletSigner";

type Props = {
  children: ReactNode;
};

export function Providers({ children }: Props) {
  useEffect(() => {
    // Initialize Telegram wallet compatibility fix on mount
    initTelegramWalletFix();
  }, []);
  return (
    <TelegramProvider>
      <MetaMaskProvider>
        <UnifiedWalletProvider>
          <UnifiedWalletSignerProvider>
            <InMemoryStorageProvider>{children}</InMemoryStorageProvider>
          </UnifiedWalletSignerProvider>
        </UnifiedWalletProvider>
      </MetaMaskProvider>
    </TelegramProvider>
  );
}
