import { useState, useEffect, useRef } from "react";
import { ethers } from "ethers";
import { useReownWallet } from "./useReownWallet";
import { useAccount } from "wagmi";

export function useUnifiedWalletSigner() {
  const { 
    provider, 
    signer, 
    connect, 
    disconnect, 
    chainId, 
    address, 
    isConnected,
    connector
  } = useReownWallet();

  const [eip1193Provider, setEip1193Provider] = useState<any>(undefined);
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
        const rawProvider = await connector.getProvider();
        setEip1193Provider(rawProvider);
      } catch (error) {
        console.error("Failed to get EIP-1193 provider:", error);
        setEip1193Provider(undefined);
      }
    }

    getEip1193Provider();
  }, [connector]);

  useEffect(() => {
    if (!chainId) {
      setEthersReadonlyProvider(undefined);
      return;
    }

    if (signer) {
      setEthersReadonlyProvider(signer);
    } else {
      const readonlyProvider = ethers.getDefaultProvider(chainId);
      setEthersReadonlyProvider(readonlyProvider);
    }
  }, [chainId]);

  return {
    provider: eip1193Provider,
    chainId,
    accounts: address ? [address] : [],
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
