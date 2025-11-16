"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { ethers } from "ethers";
import EthereumProvider from "@walletconnect/ethereum-provider";
import { useMetaMask } from "../metamask/useMetaMaskProvider";

interface UnifiedWalletState {
  provider: ethers.Eip1193Provider | undefined;
  chainId: number | undefined;
  accounts: string[] | undefined;
  isConnected: boolean;
  error: Error | undefined;
  connect: (walletType?: 'metamask' | 'walletconnect') => Promise<void>;
  disconnect: () => Promise<void>;
  walletType: 'metamask' | 'walletconnect' | undefined;
}

const UnifiedWalletContext = createContext<UnifiedWalletState | undefined>(undefined);

export function UnifiedWalletProvider({ children }: { children: ReactNode }) {
  const metaMask = useMetaMask();
  const [walletConnectProvider, setWalletConnectProvider] = useState<any>(undefined);
  const [activeWallet, setActiveWallet] = useState<'metamask' | 'walletconnect' | undefined>(undefined);
  const [wcChainId, setWcChainId] = useState<number | undefined>(undefined);
  const [wcAccounts, setWcAccounts] = useState<string[] | undefined>(undefined);
  const [error, setError] = useState<Error | undefined>(undefined);
  const providerRef = useRef<any>(undefined);
  const listenersRef = useRef<{
    accountsChanged?: (accounts: string[]) => void;
    chainChanged?: (chainId: string) => void;
    disconnect?: () => void;
  }>({});

  const connectWalletConnect = useCallback(async () => {
    try {
      setError(undefined);
      
      const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
      
      if (!projectId || projectId === 'your_project_id_here') {
        throw new Error('WalletConnect Project ID is not configured. Please add NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID to your .env.local file. Get your project ID from https://cloud.walletconnect.com/');
      }

      if (providerRef.current) {
        try {
          await providerRef.current.disconnect();
        } catch (e) {
          console.warn('Error disconnecting previous provider:', e);
        }
      }
      
      // Detect if in Telegram to disable QR modal
      const isTelegram = typeof window !== 'undefined' && (
        (window as any).Telegram?.WebApp !== undefined ||
        'TelegramWebviewProxy' in window
      );

      const provider = await EthereumProvider.init({
        projectId,
        chains: [11155111],
        optionalChains: [1, 137],
        showQrModal: !isTelegram, // Disable QR modal in Telegram - wallets open externally
        qrModalOptions: !isTelegram ? {
          themeMode: 'dark' as const,
          themeVariables: {
            '--wcm-z-index': '9999'
          }
        } : undefined,
        methods: ['eth_sendTransaction', 'personal_sign', 'eth_signTypedData_v4'],
        events: ['chainChanged', 'accountsChanged'],
        metadata: {
          name: 'ZSwap',
          description: 'Privacy-focused DEX with FHE encryption',
          url: typeof window !== 'undefined' ? window.location.origin : 'https://zswap.vercel.app',
          icons: ['https://zswap.vercel.app/icon.png']
        }
      });

      await provider.connect();
      
      const accounts = provider.accounts;
      const chainId = provider.chainId;

      providerRef.current = provider;
      setWalletConnectProvider(provider);
      setWcAccounts(accounts);
      setWcChainId(chainId);
      setActiveWallet('walletconnect');

      const accountsChangedHandler = (accounts: string[]) => {
        setWcAccounts(accounts);
      };
      const chainChangedHandler = (chainId: string) => {
        setWcChainId(parseInt(chainId));
      };
      const disconnectHandler = () => {
        setWalletConnectProvider(undefined);
        setWcAccounts(undefined);
        setWcChainId(undefined);
        setActiveWallet(undefined);
        providerRef.current = undefined;
      };

      listenersRef.current = {
        accountsChanged: accountsChangedHandler,
        chainChanged: chainChangedHandler,
        disconnect: disconnectHandler
      };

      provider.on('accountsChanged', accountsChangedHandler);
      provider.on('chainChanged', chainChangedHandler);
      provider.on('disconnect', disconnectHandler);

    } catch (err) {
      console.error('WalletConnect error:', err);
      setError(err instanceof Error ? err : new Error('Failed to connect WalletConnect'));
      throw err;
    }
  }, []);

  const connect = useCallback(async (walletType?: 'metamask' | 'walletconnect') => {
    if (typeof window === 'undefined') return;

    const isTelegramOrMobile = typeof window !== 'undefined' && (
      /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ||
      window.Telegram?.WebApp !== undefined
    );

    try {
      setError(undefined);
      
      if (walletType === 'walletconnect' || (!walletType && isTelegramOrMobile)) {
        await connectWalletConnect();
      } else if (walletType === 'metamask' || !walletType) {
        if (metaMask.provider) {
          await new Promise<void>((resolve, reject) => {
            metaMask.connect();
            
            const checkConnection = setInterval(() => {
              if (metaMask.isConnected) {
                clearInterval(checkConnection);
                setActiveWallet('metamask');
                resolve();
              } else if (metaMask.error) {
                clearInterval(checkConnection);
                reject(metaMask.error);
              }
            }, 100);
            
            setTimeout(() => {
              clearInterval(checkConnection);
              if (!metaMask.isConnected) {
                reject(new Error('MetaMask connection timeout'));
              }
            }, 30000);
          });
        } else {
          await connectWalletConnect();
        }
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to connect wallet');
      setError(error);
      throw error;
    }
  }, [metaMask, connectWalletConnect]);

  const disconnect = useCallback(async () => {
    if (activeWallet === 'walletconnect' && providerRef.current) {
      const provider = providerRef.current;
      
      if (listenersRef.current.accountsChanged) {
        provider.off('accountsChanged', listenersRef.current.accountsChanged);
      }
      if (listenersRef.current.chainChanged) {
        provider.off('chainChanged', listenersRef.current.chainChanged);
      }
      if (listenersRef.current.disconnect) {
        provider.off('disconnect', listenersRef.current.disconnect);
      }
      
      listenersRef.current = {};
      
      await provider.disconnect();
      setWalletConnectProvider(undefined);
      setWcAccounts(undefined);
      setWcChainId(undefined);
      providerRef.current = undefined;
    }
    setActiveWallet(undefined);
  }, [activeWallet]);

  useEffect(() => {
    return () => {
      if (providerRef.current && listenersRef.current) {
        const provider = providerRef.current;
        
        if (listenersRef.current.accountsChanged) {
          provider.off('accountsChanged', listenersRef.current.accountsChanged);
        }
        if (listenersRef.current.chainChanged) {
          provider.off('chainChanged', listenersRef.current.chainChanged);
        }
        if (listenersRef.current.disconnect) {
          provider.off('disconnect', listenersRef.current.disconnect);
        }
      }
    };
  }, []);

  const provider = activeWallet === 'walletconnect' ? walletConnectProvider : metaMask.provider;
  const chainId = activeWallet === 'walletconnect' ? wcChainId : metaMask.chainId;
  const accounts = activeWallet === 'walletconnect' ? wcAccounts : metaMask.accounts;
  const isConnected = activeWallet === 'walletconnect' 
    ? !!(walletConnectProvider && wcAccounts && wcAccounts.length > 0 && wcChainId)
    : metaMask.isConnected;

  return (
    <UnifiedWalletContext.Provider
      value={{
        provider,
        chainId,
        accounts,
        isConnected,
        error: error || metaMask.error,
        connect,
        disconnect,
        walletType: activeWallet,
      }}
    >
      {children}
    </UnifiedWalletContext.Provider>
  );
}

export function useUnifiedWallet() {
  const context = useContext(UnifiedWalletContext);
  if (context === undefined) {
    throw new Error('useUnifiedWallet must be used within a UnifiedWalletProvider');
  }
  return context;
}
