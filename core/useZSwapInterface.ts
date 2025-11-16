import { useState, useEffect, useCallback } from 'react';
import { useZSwap } from './useZSwap';
import { useUnifiedWalletSigner } from './wallet/useUnifiedWalletSigner';
import { useFhevm } from '../fhevm/useFhevm';
import { useInMemoryStorage } from './useInMemoryStorage';
import { CONTRACTS } from '../config/contracts';

// Types
export interface Intent {
  id: string;
  transactionHash: string;
  status: 'pending' | 'decrypted' | 'executed';
  amount?: string;
  tokenIn: string;
  tokenOut: string;
  timestamp: number;
  blockNumber?: number;
}

export interface ZSwapInterfaceState {
  // Wallet & Network
  isConnected: boolean;
  isCorrectNetwork: boolean;
  chainId: number | undefined;
  signer: any;
  provider: any;
  fhevmInstance: any;
  connect: () => void;
  
  // ZSwap Hook Methods (passed through)
  deposit: (currency: 'USDC' | 'USDT', amount: string) => Promise<any>;
  withdraw: (currency: 'USDC' | 'USDT', amount: string, recipient?: string) => Promise<any>;
  submitIntent: (tokenIn: 'USDC' | 'USDT', tokenOut: 'USDC' | 'USDT', encryptedAmount: string, inputProof: string, deadline?: number) => Promise<any>;
  executeIntent: (intentId: string) => Promise<any>;
  mintTokens: (currency: 'USDC' | 'USDT', amount: string) => Promise<any>;
  getEncryptedBalance: (currency: 'USDC' | 'USDT', address?: string) => Promise<string | null>;
  getRegularBalance: (currency: 'USDC' | 'USDT') => Promise<string | null>;
  decryptBalance: (encryptedHandle: string, tokenAddress: string, fhevmInstance: any, fhevmDecryptionSignatureStorage: any) => Promise<string | null>;
  fetchUserIntents: () => Promise<any[]>;
  loading: boolean;
  
  // Balances
  balanceUSDC: string | null;
  balanceUSDT: string | null;
  encBalanceUSDC: string | null;
  encBalanceUSDT: string | null;
  decryptedBalanceUSDC: string | null;
  decryptedBalanceUSDT: string | null;
  isDecryptingUSDC: boolean;
  isDecryptingUSDT: boolean;
  setIsDecryptingUSDC: (val: boolean) => void;
  setIsDecryptingUSDT: (val: boolean) => void;
  setDecryptedBalanceUSDC: (val: string | null) => void;
  setDecryptedBalanceUSDT: (val: string | null) => void;
  
  // Deposit Form
  depositCurrency: 'USDC' | 'USDT';
  depositAmount: string;
  setDepositCurrency: (currency: 'USDC' | 'USDT') => void;
  setDepositAmount: (amount: string) => void;
  
  // Withdraw Form
  withdrawCurrency: 'USDC' | 'USDT';
  withdrawAmount: string;
  withdrawRecipient: string;
  setWithdrawCurrency: (currency: 'USDC' | 'USDT') => void;
  setWithdrawAmount: (amount: string) => void;
  setWithdrawRecipient: (recipient: string) => void;
  
  // Swap Form
  tokenIn: 'USDC' | 'USDT';
  tokenOut: 'USDC' | 'USDT';
  swapAmount: string;
  isSubmittingSwap: boolean;
  setTokenIn: (token: 'USDC' | 'USDT') => void;
  setTokenOut: (token: 'USDC' | 'USDT') => void;
  setSwapAmount: (amount: string) => void;
  setIsSubmittingSwap: (val: boolean) => void;
  
  // Intents
  submittedIntents: Intent[];
  isLoadingIntents: boolean;
  executingIntentId: string | null;
  setSubmittedIntents: (intents: Intent[] | ((prev: Intent[]) => Intent[])) => void;
  setExecutingIntentId: (id: string | null) => void;
  addProcessedIntent: (id: string) => void;
  removeProcessedIntent: (id: string) => void;
  isIntentProcessed: (id: string) => boolean;
  
  // Faucet
  faucetAmount: string;
  faucetCurrency: 'USDC' | 'USDT';
  lastFaucetTime: { [key: string]: number };
  setFaucetAmount: (amount: string) => void;
  setFaucetCurrency: (currency: 'USDC' | 'USDT') => void;
  setLastFaucetTime: (time: { [key: string]: number } | ((prev: { [key: string]: number }) => { [key: string]: number })) => void;
  
  // Utilities
  getTokenSymbol: (address: string) => string;
  refreshBalances: () => Promise<void>;
  refreshIntents: () => Promise<void>;
}

/**
 * Hook for shared state management across ZSwap interface.
 * Handlers (with encryption + toasts) remain in components for now.
 */
export function useZSwapInterface(): ZSwapInterfaceState {
  const { ethersSigner: signer, isConnected, connect, provider, chainId } = useUnifiedWalletSigner();
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);
  
  const { storage: fhevmDecryptionSignatureStorage } = useInMemoryStorage();
  
  const { instance: fhevmInstance } = useFhevm({
    provider: provider as any,
    chainId: chainId,
    enabled: isConnected && isCorrectNetwork
  });
  
  const { 
    deposit,
    withdraw, 
    submitIntent, 
    executeIntent,
    getEncryptedBalance,
    getRegularBalance,
    decryptBalance,
    fetchUserIntents,
    mintTokens,
    loading
  } = useZSwap();

  // Form States
  const [depositCurrency, setDepositCurrency] = useState<'USDC' | 'USDT'>('USDC');
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawCurrency, setWithdrawCurrency] = useState<'USDC' | 'USDT'>('USDC');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawRecipient, setWithdrawRecipient] = useState('');
  const [tokenIn, setTokenIn] = useState<'USDC' | 'USDT'>('USDC');
  const [tokenOut, setTokenOut] = useState<'USDC' | 'USDT'>('USDT');
  const [swapAmount, setSwapAmount] = useState('');
  
  // Intent States
  const [submittedIntents, setSubmittedIntents] = useState<Intent[]>([]);
  const [isLoadingIntents, setIsLoadingIntents] = useState(false);
  const [processedIntents, setProcessedIntents] = useState<Set<string>>(new Set());
  
  // Balance States
  const [balanceUSDC, setBalanceUSDC] = useState<string | null>(null);
  const [balanceUSDT, setBalanceUSDT] = useState<string | null>(null);
  const [encBalanceUSDC, setEncBalanceUSDC] = useState<string | null>(null);
  const [encBalanceUSDT, setEncBalanceUSDT] = useState<string | null>(null);
  const [decryptedBalanceUSDC, setDecryptedBalanceUSDC] = useState<string | null>(null);
  const [decryptedBalanceUSDT, setDecryptedBalanceUSDT] = useState<string | null>(null);
  const [isDecryptingUSDC, setIsDecryptingUSDC] = useState(false);
  const [isDecryptingUSDT, setIsDecryptingUSDT] = useState(false);
  
  // Loading States
  const [isSubmittingSwap, setIsSubmittingSwap] = useState(false);
  const [executingIntentId, setExecutingIntentId] = useState<string | null>(null);
  
  // Faucet States
  const [faucetAmount, setFaucetAmount] = useState('100');
  const [faucetCurrency, setFaucetCurrency] = useState<'USDC' | 'USDT'>('USDC');
  const [lastFaucetTime, setLastFaucetTime] = useState<{ [key: string]: number }>({});

  // Helper function to get token symbol from address
  const getTokenSymbol = useCallback((address: string): string => {
    if (!address) return 'Unknown';
    const lowerAddress = address.toLowerCase();
    if (lowerAddress === CONTRACTS.MockUSDC?.toLowerCase() || 
        lowerAddress === CONTRACTS.EncryptedUSDC?.toLowerCase() ||
        lowerAddress === '0x59dd1a3bd1256503cdc023bfc9f10e107d64c3c1') {
      return 'eUSDC';
    }
    if (lowerAddress === CONTRACTS.MockUSDT?.toLowerCase() || 
        lowerAddress === CONTRACTS.EncryptedUSDT?.toLowerCase() ||
        lowerAddress === '0xb1d9519e953b8513a4754f9b33d37edba90c001d') {
      return 'eUSDT';
    }
    return 'Unknown';
  }, []);
  
  // Check if we're on Sepolia
  useEffect(() => {
    setIsCorrectNetwork(chainId === 11155111);
  }, [chainId]);

  // Load processed intents from local storage
  useEffect(() => {
    const stored = localStorage.getItem('processedIntents');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setProcessedIntents(new Set(parsed));
      } catch {
        console.error('Failed to parse processed intents');
      }
    }
  }, []);
  
  // Save processed intents to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('processedIntents', JSON.stringify(Array.from(processedIntents)));
    } catch (error) {
      console.error('Failed to save processed intents:', error);
    }
  }, [processedIntents]);

  // Helper methods for processedIntents (immutable operations)
  const addProcessedIntent = useCallback((id: string) => {
    setProcessedIntents(prev => {
      const newSet = new Set(prev);
      newSet.add(id);
      return newSet;
    });
  }, []);

  const removeProcessedIntent = useCallback((id: string) => {
    setProcessedIntents(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  }, []);

  const isIntentProcessed = useCallback((id: string) => {
    return processedIntents.has(id);
  }, [processedIntents]);

  // Load balances
  const loadBalances = useCallback(async () => {
    const regularUSDC = await getRegularBalance('USDC');
    const regularUSDT = await getRegularBalance('USDT');
    setBalanceUSDC(regularUSDC);
    setBalanceUSDT(regularUSDT);
    
    const encUSDC = await getEncryptedBalance('USDC');
    const encUSDT = await getEncryptedBalance('USDT');
    
    if (encUSDC !== encBalanceUSDC) {
      setDecryptedBalanceUSDC(null);
    }
    if (encUSDT !== encBalanceUSDT) {
      setDecryptedBalanceUSDT(null);
    }
    
    setEncBalanceUSDC(encUSDC);
    setEncBalanceUSDT(encUSDT);
  }, [getEncryptedBalance, getRegularBalance, encBalanceUSDC, encBalanceUSDT]);

  useEffect(() => {
    if (signer && isCorrectNetwork) {
      loadBalances();
      const interval = setInterval(loadBalances, 10000);
      return () => clearInterval(interval);
    }
  }, [signer, isCorrectNetwork, loadBalances]);

  // Load user intents
  const loadIntents = useCallback(async () => {
    if (!signer || !isCorrectNetwork) return;
    
    setIsLoadingIntents(true);
    try {
      const intents = await fetchUserIntents();
      const formattedIntents = intents
        .filter(intent => !processedIntents.has(intent.id))
        .map(intent => ({
          id: intent.id,
          transactionHash: intent.transactionHash,
          status: 'pending' as const,
          tokenIn: intent.tokenIn,
          tokenOut: intent.tokenOut,
          timestamp: intent.timestamp * 1000,
          blockNumber: intent.blockNumber
        }));
      
      setSubmittedIntents(formattedIntents);
    } catch (err) {
      console.error('Failed to load intents:', err);
    } finally {
      setIsLoadingIntents(false);
    }
  }, [signer, isCorrectNetwork, fetchUserIntents, processedIntents]);

  useEffect(() => {
    if (signer && isCorrectNetwork) {
      loadIntents();
      const interval = setInterval(loadIntents, 15000);
      return () => clearInterval(interval);
    }
  }, [signer, isCorrectNetwork, loadIntents]);

  return {
    // Wallet & Network
    isConnected,
    isCorrectNetwork,
    chainId,
    signer,
    provider,
    fhevmInstance,
    connect,
    
    // ZSwap Hook Methods (pass through)
    deposit,
    withdraw,
    submitIntent,
    executeIntent,
    mintTokens,
    getEncryptedBalance,
    getRegularBalance,
    decryptBalance,
    fetchUserIntents,
    loading,
    
    // Balances
    balanceUSDC,
    balanceUSDT,
    encBalanceUSDC,
    encBalanceUSDT,
    decryptedBalanceUSDC,
    decryptedBalanceUSDT,
    isDecryptingUSDC,
    isDecryptingUSDT,
    setIsDecryptingUSDC,
    setIsDecryptingUSDT,
    setDecryptedBalanceUSDC,
    setDecryptedBalanceUSDT,
    
    // Forms
    depositCurrency,
    depositAmount,
    setDepositCurrency,
    setDepositAmount,
    withdrawCurrency,
    withdrawAmount,
    withdrawRecipient,
    setWithdrawCurrency,
    setWithdrawAmount,
    setWithdrawRecipient,
    tokenIn,
    tokenOut,
    swapAmount,
    isSubmittingSwap,
    setTokenIn,
    setTokenOut,
    setSwapAmount,
    setIsSubmittingSwap,
    
    // Intents
    submittedIntents,
    isLoadingIntents,
    executingIntentId,
    setSubmittedIntents,
    setExecutingIntentId,
    addProcessedIntent,
    removeProcessedIntent,
    isIntentProcessed,
    
    // Faucet
    faucetAmount,
    faucetCurrency,
    lastFaucetTime,
    setFaucetAmount,
    setFaucetCurrency,
    setLastFaucetTime,
    
    // Utilities
    getTokenSymbol,
    refreshBalances: loadBalances,
    refreshIntents: loadIntents,
  };
}
