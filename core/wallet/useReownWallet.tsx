"use client";

import { useAccount, useDisconnect, useWalletClient, usePublicClient } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import { useMemo } from 'react';
import { BrowserProvider } from 'ethers';

export function useReownWallet() {
  const { address, isConnected, chain } = useAccount();
  const { disconnect } = useDisconnect();
  const { open } = useAppKit();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  const connect = async () => {
    await open();
  };

  // Create a full EIP-1193 provider that supports ALL methods
  const provider = useMemo(() => {
    if (!walletClient || !publicClient) return undefined;

    // Convert walletClient to ethers-compatible provider
    const ethersProvider = new BrowserProvider(walletClient as any);
    
    // Return the underlying provider that supports all methods
    return ethersProvider.provider;
  }, [walletClient, publicClient]);

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
