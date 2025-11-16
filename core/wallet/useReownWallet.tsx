"use client";

import { useAccount, useDisconnect } from 'wagmi';
import { useCallback, useEffect, useState } from 'react';
import { BrowserProvider, JsonRpcSigner } from 'ethers';
import { modal } from '@/config/wagmi';

export function useReownWallet() {
  const { address, isConnected, chainId, connector } = useAccount();
  const { disconnect } = useDisconnect();
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null);
  const [provider, setProvider] = useState<BrowserProvider | null>(null);

  // Convert wagmi connector to ethers signer using real EIP-1193 provider
  useEffect(() => {
    async function getEthersSigner() {
      if (!connector || !isConnected) {
        setSigner(null);
        setProvider(null);
        return;
      }

      try {
        // Get the real EIP-1193 provider from connector
        const eip1193Provider = await connector.getProvider();
        
        // Create ethers provider from EIP-1193 provider
        const ethersProvider = new BrowserProvider(eip1193Provider as any);
        const ethersSigner = await ethersProvider.getSigner();
        
        setProvider(ethersProvider);
        setSigner(ethersSigner);
      } catch (error) {
        console.error('Failed to get ethers signer:', error);
        setSigner(null);
        setProvider(null);
      }
    }

    getEthersSigner();
  }, [connector, isConnected]);

  const connect = useCallback(async () => {
    try {
      // Open Reown AppKit modal
      await modal.open();
    } catch (error) {
      console.error('Failed to open wallet modal:', error);
      throw error;
    }
  }, []);

  return {
    address,
    isConnected,
    chainId,
    signer,
    provider,
    connector,
    connect,
    disconnect,
  };
}
