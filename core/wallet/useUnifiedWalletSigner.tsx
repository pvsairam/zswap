"use client";

import { ethers } from "ethers";
import { useReownWallet } from "./useReownWallet";
import {
  createContext,
  ReactNode,
  RefObject,
  useContext,
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

function useUnifiedWalletSignerInternal(): UseUnifiedWalletSignerState {
  const { provider, chainId, accounts, isConnected, connect, disconnect, error, walletType } = useReownWallet();
  const [ethersSigner, setEthersSigner] = useState<
    ethers.JsonRpcSigner | undefined
  >(undefined);
  const [ethersBrowserProvider, setEthersBrowserProvider] = useState<
    ethers.BrowserProvider | undefined
  >(undefined);
  const [ethersReadonlyProvider, setEthersReadonlyProvider] = useState<
    ethers.ContractRunner | undefined
  >(undefined);

  const chainIdRef = useRef<number | undefined>(chainId);
  const ethersSignerRef = useRef<ethers.JsonRpcSigner | undefined>(undefined);

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
  }, [chainId]);

  useEffect(() => {
    if (
      !provider ||
      !chainId ||
      !isConnected ||
      !accounts ||
      accounts.length === 0
    ) {
      ethersSignerRef.current = undefined;
      setEthersSigner(undefined);
      setEthersBrowserProvider(undefined);
      setEthersReadonlyProvider(undefined);
      return;
    }

    console.warn(`[useUnifiedWalletSignerInternal] create new ethers.BrowserProvider(), chainId=${chainId}, wallet=${walletType}`);

    const browserProvider = new ethers.BrowserProvider(provider, chainId);
    setEthersBrowserProvider(browserProvider);

    browserProvider.getSigner().then((signer) => {
      ethersSignerRef.current = signer;
      setEthersSigner(signer);
    });

    const rpcUrl = process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || 
      (chainId === 11155111 ? 'https://rpc.sepolia.org' : undefined);
    
    const readonlyProvider = new ethers.JsonRpcProvider(rpcUrl, chainId);
    setEthersReadonlyProvider(readonlyProvider);
  }, [provider, chainId, isConnected, accounts, walletType]);

  return {
    provider,
    chainId,
    accounts,
    isConnected,
    error,
    connect,
    disconnect,
    sameChain,
    sameSigner,
    ethersBrowserProvider,
    ethersReadonlyProvider,
    ethersSigner,
    walletType,
  };
}

const UnifiedWalletSignerContext = createContext<UseUnifiedWalletSignerState | undefined>(undefined);

export function UnifiedWalletSignerProvider({ children }: { children: ReactNode }) {
  const props = useUnifiedWalletSignerInternal();
  return (
    <UnifiedWalletSignerContext.Provider value={props}>
      {children}
    </UnifiedWalletSignerContext.Provider>
  );
}

export function useUnifiedWalletSigner() {
  const context = useContext(UnifiedWalletSignerContext);
  if (context === undefined) {
    throw new Error("useUnifiedWalletSigner must be used within a UnifiedWalletSignerProvider");
  }
  return context;
}
