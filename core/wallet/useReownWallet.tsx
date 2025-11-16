"use client";

import { useAccount, useDisconnect, useWalletClient } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import { useMemo } from 'react';

export function useReownWallet() {
  const { address, isConnected, chain } = useAccount();
  const { disconnect } = useDisconnect();
  const { open } = useAppKit();
  const { data: walletClient } = useWalletClient();

  const connect = async () => {
    await open();
  };

  // Create EIP-1193 compatible provider from walletClient
  const provider = useMemo(() => {
    if (!walletClient?.transport) return undefined;

    // The walletClient already has the transport which is EIP-1193 compatible
    // We just need to expose it properly
    return {
      request: async ({ method, params }: { method: string; params?: any[] }) => {
        if (!walletClient) throw new Error('Wallet not connected');

        // Use walletClient.request which forwards to the underlying provider
        return await walletClient.request({ method, params } as any);
      },
      // These are required for ethers.js compatibility
      on: (event: string, listener: any) => {
        // Event listeners are handled by wagmi hooks
      },
      removeListener: (event: string, listener: any) => {
        // Event listeners are handled by wagmi hooks
      },
      // Support legacy providers
      get isMetaMask() { return false; },
      get isConnected() { return isConnected; },
    };
  }, [walletClient, isConnected]);

  const accounts = useMemo(() => {
    return address ? [address] : [];
  }, [address]);

  return {
    provider,
    address,
    accounts,
    isConnected,
    chainId: chain?.id,
    connect,
    disconnect,
    walletType: isConnected ? 'walletconnect' as const : undefined,
    error: undefined,
  };
}
