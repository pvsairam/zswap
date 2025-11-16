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

  const provider = useMemo(() => {
    if (!walletClient) return undefined;
    
    // Return EIP-1193 compatible provider for ethers.js
    return {
      request: async ({ method, params }: { method: string; params?: any[] }) => {
        if (!walletClient) throw new Error('Wallet not connected');
        
        switch (method) {
          case 'eth_requestAccounts':
            return address ? [address] : [];
          case 'eth_accounts':
            return address ? [address] : [];
          case 'eth_chainId':
            return `0x${chain?.id.toString(16)}`;
          case 'personal_sign':
            if (!params || params.length < 2) throw new Error('Invalid params');
            return await walletClient.signMessage({ 
              message: params[0],
              account: address as `0x${string}`
            });
          case 'eth_signTypedData_v4':
            if (!params || params.length < 2) throw new Error('Invalid params');
            const typedData = JSON.parse(params[1]);
            return await walletClient.signTypedData({
              ...typedData,
              account: address as `0x${string}`
            });
          case 'eth_sendTransaction':
            if (!params || params.length < 1) throw new Error('Invalid params');
            return await walletClient.sendTransaction(params[0]);
          default:
            throw new Error(`Method ${method} not supported`);
        }
      },
      on: () => {},
      removeListener: () => {},
    };
  }, [walletClient, address, chain]);

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
