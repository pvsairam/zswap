"use client";

import type { ReactNode } from "react";

import { MetaMaskProvider } from "@/core/metamask/useMetaMaskProvider";
import { InMemoryStorageProvider } from "@/core/useInMemoryStorage";
import { TelegramProvider } from "@/core/useTelegram";
import { UnifiedWalletProvider } from "@/core/wallet/useUnifiedWallet";
import { UnifiedWalletSignerProvider } from "@/core/wallet/useUnifiedWalletSigner";

type Props = {
  children: ReactNode;
};

export function Providers({ children }: Props) {
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
