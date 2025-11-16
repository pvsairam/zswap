"use client";

import type { ReactNode } from "react";

import { MetaMaskProvider } from "@/core/metamask/useMetaMaskProvider";
import { InMemoryStorageProvider } from "@/core/useInMemoryStorage";
import { MetaMaskEthersSignerProvider } from "@/core/metamask/useMetaMaskEthersSigner";
import { TelegramProvider } from "@/core/useTelegram";

type Props = {
  children: ReactNode;
};

export function Providers({ children }: Props) {
  return (
    <TelegramProvider>
      <MetaMaskProvider>
        <MetaMaskEthersSignerProvider initialMockChains={{ 31337: "http://localhost:8545" }}>
          <InMemoryStorageProvider>{children}</InMemoryStorageProvider>
        </MetaMaskEthersSignerProvider>
      </MetaMaskProvider>
    </TelegramProvider>
  );
}
