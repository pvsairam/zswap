"use client";

import { ethers } from "ethers";
import { useReownWallet } from "./useReownWallet";
import {
  RefObject,
  useEffect,
  useRef,
  useState,
} from "react";

export interface UseUnifiedWalletSignerState {
  provider: ethers.Eip1193Provider | undefined;
  chainId: number | undefined;
  accounts: string[] | undefined;
  isConnected: boolean;
  error: Error | undefined;
  connect: (walletType?: 'metamask' | 'walletconnect') => Promise<void>;
  disconnect: () => Promise<void>;
  sameChain: RefObject<(chainId: number | undefined) => boolean>;
  sameSigner: RefObject<
    (ethersSigner: ethers.JsonRpcSigner | undefined) => boolean
  >;
  ethersBrowserProvider: ethers.BrowserProvider | undefined;
  ethersReadonlyProvider: ethers.ContractRunner | undefined;
  ethersSigner: ethers.JsonRpcSigner | undefined;
  walletType: 'metamask' | 'walletconnect' | undefined;
}

export function useUnifiedWalletSigner(): UseUnifiedWalletSignerState {
  const { address, chainId, isConnected, provider, signer, connector, connect, disconnect } = useReownWallet();
  const accounts = address ? [address] : undefined;
  const [eip1193Provider, setEip1193Provider] = useState<ethers.Eip1193Provider | undefined>(undefined);
  const [ethersReadonlyProvider, setEthersReadonlyProvider] = useState<
    ethers.ContractRunner | undefined
  >(undefined);

  const chainIdRef = useRef<number | undefined>(chainId);
  const ethersSignerRef = useRef<ethers.JsonRpcSigner | undefined | null>(null);
  const [walletType, setWalletType] = useState<'metamask' | 'walletconnect' | undefined>(undefined);

  const sameChain = useRef((chainId: number | undefined) => {
    return chainId === chainIdRef.current;
  });

  const sameSigner = useRef(
    (ethersSigner: ethers.JsonRpcSigner | undefined) => {
      return ethersSigner === ethersSignerRef.current;
    }
  );

  useEffect(() => {
    chainIdRef.current = chainId;
    ethersSignerRef.current = signer || undefined;
  }, [chainId, signer]);

  useEffect(() => {
    if (!connector) {
      setWalletType(undefined);
      return;
    }

    const connectorId = connector.id?.toLowerCase() || '';
    const connectorName = connector.name?.toLowerCase() || '';
    
    if (connectorId.includes('metamask') || connectorName.includes('metamask') || 
        connectorId.includes('injected') || connectorName.includes('injected')) {
      setWalletType('metamask');
    } else if (connectorId.includes('walletconnect') || connectorName.includes('walletconnect')) {
      setWalletType('walletconnect');
    } else {
      setWalletType(undefined);
    }
  }, [connector]);

  useEffect(() => {
    async function getEip1193Provider() {
      if (!connector) {
        setEip1193Provider(undefined);
        return;
      }

      try {
        const underlyingProvider = await connector.getProvider();
        setEip1193Provider(underlyingProvider as ethers.Eip1193Provider);
      } catch (error) {
        console.error('Failed to get EIP-1193 provider:', error);
        setEip1193Provider(undefined);
      }
    }

    getEip1193Provider();
  }, [connector]);

  useEffect(() => {
    const rpcUrl = process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || 
      (chainId === 11155111 ? 'https://rpc.sepolia.org' : undefined);
    
    if (rpcUrl) {
      const readonlyProvider = new ethers.JsonRpcProvider(rpcUrl, chainId);
      setEthersReadonlyProvider(readonlyProvider);
    }
  }, [chainId]);

  return {
    provider: eip1193Provider,
    chainId,
    accounts,
    isConnected,
    error: undefined,
    connect: async (requestedWalletType) => {
      await connect();
    },
    disconnect: async () => disconnect(),
    sameChain,
    sameSigner,
    ethersBrowserProvider: provider || undefined,
    ethersReadonlyProvider,
    ethersSigner: signer || undefined,
    walletType,
  };
}
