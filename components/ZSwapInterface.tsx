"use client";

import { useState, useEffect } from 'react';
import { useZSwap } from '../core/useZSwap';
import { useMetaMaskEthersSigner } from '../core/metamask/useMetaMaskEthersSigner';
import { CONTRACTS } from '../config/contracts';
import { useFhevm } from '../fhevm/useFhevm';
import { ethers } from 'ethers';
import { useInMemoryStorage } from '../core/useInMemoryStorage';
import toast from 'react-hot-toast';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { 
  AlertCircle, 
  ArrowDownUp,
  ArrowRight,
  Clock, 
  Lock, 
  LogOut, 
  RefreshCw, 
  Wallet,
  Zap,
  Shield,
  Eye,
  DollarSign,
  Layers,
  Fuel
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LoadingSpinner } from './ui/loading-spinner';

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      isMetaMask?: boolean;
    };
  }
}

export function ZSwapInterface() {
  const { ethersSigner: signer, isConnected, connect, provider, chainId } = useMetaMaskEthersSigner();
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);
  
  // Helper function to get token symbol from address
  const getTokenSymbol = (address: string): string => {
    if (!address) return 'Unknown';
    const lowerAddress = address.toLowerCase();
    // Check for USDC addresses
    if (lowerAddress === CONTRACTS.MockUSDC?.toLowerCase() || 
        lowerAddress === CONTRACTS.EncryptedUSDC?.toLowerCase() ||
        lowerAddress === '0x59dd1a3bd1256503cdc023bfc9f10e107d64c3c1') {
      return 'zUSDC';
    }
    // Check for USDT addresses
    if (lowerAddress === CONTRACTS.MockUSDT?.toLowerCase() || 
        lowerAddress === CONTRACTS.EncryptedUSDT?.toLowerCase() ||
        lowerAddress === '0xb1d9519e953b8513a4754f9b33d37edba90c001d') {
      return 'zUSDT';
    }
    return 'Unknown';
  };
  
  // Check if we're on Sepolia
  useEffect(() => {
    setIsCorrectNetwork(chainId === 11155111); // Sepolia chainId
  }, [chainId]);
  
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

  // State management
  const [depositCurrency, setDepositCurrency] = useState<'USDC' | 'USDT'>('USDC');
  const [depositAmount, setDepositAmount] = useState('');
  
  const [withdrawCurrency, setWithdrawCurrency] = useState<'USDC' | 'USDT'>('USDC');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawRecipient, setWithdrawRecipient] = useState('');
  
  const [tokenIn, setTokenIn] = useState<'USDC' | 'USDT'>('USDC');
  const [tokenOut, setTokenOut] = useState<'USDC' | 'USDT'>('USDT');
  const [swapAmount, setSwapAmount] = useState('');
  
  const [submittedIntents, setSubmittedIntents] = useState<Array<{
    id: string;
    transactionHash: string;
    status: 'pending' | 'decrypted' | 'executed';
    amount?: string;
    tokenIn: string;
    tokenOut: string;
    timestamp: number;
    blockNumber?: number;
  }>>([]);
  const [isLoadingIntents, setIsLoadingIntents] = useState(false);
  const [processedIntents, setProcessedIntents] = useState<Set<string>>(new Set());
  
  // Balances
  const [balanceUSDC, setBalanceUSDC] = useState<string | null>(null);
  const [balanceUSDT, setBalanceUSDT] = useState<string | null>(null);
  const [encBalanceUSDC, setEncBalanceUSDC] = useState<string | null>(null);
  const [encBalanceUSDT, setEncBalanceUSDT] = useState<string | null>(null);
  const [decryptedBalanceUSDC, setDecryptedBalanceUSDC] = useState<string | null>(null);
  const [decryptedBalanceUSDT, setDecryptedBalanceUSDT] = useState<string | null>(null);
  const [isDecryptingUSDC, setIsDecryptingUSDC] = useState(false);
  const [isDecryptingUSDT, setIsDecryptingUSDT] = useState(false);
  
  // Loading states
  const [isSubmittingSwap, setIsSubmittingSwap] = useState(false);
  const [executingIntentId, setExecutingIntentId] = useState<string | null>(null);
  
  // Faucet state
  const [faucetAmount, setFaucetAmount] = useState('100');
  const [faucetCurrency, setFaucetCurrency] = useState<'USDC' | 'USDT'>('USDC');
  const [lastFaucetTime, setLastFaucetTime] = useState<{ [key: string]: number }>({});

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
  
  // Save processed intents
  useEffect(() => {
    localStorage.setItem('processedIntents', JSON.stringify(Array.from(processedIntents)));
  }, [processedIntents]);

  // Load balances
  useEffect(() => {
    const loadBalances = async () => {
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
    };
    
    if (signer && isCorrectNetwork) {
      loadBalances();
      const interval = setInterval(loadBalances, 10000);
      return () => clearInterval(interval);
    }
  }, [signer, isCorrectNetwork, getEncryptedBalance, getRegularBalance, encBalanceUSDC, encBalanceUSDT]);

  // Load user intents
  useEffect(() => {
    const loadIntents = async () => {
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
    };
    
    loadIntents();
  }, [signer, isCorrectNetwork, fetchUserIntents, processedIntents]);

  // Handlers
  const handleDecryptUSDC = async () => {
    if (!fhevmInstance || !signer || !fhevmDecryptionSignatureStorage) return;
    if (!encBalanceUSDC || encBalanceUSDC === '0' || encBalanceUSDC === '0x0000000000000000000000000000000000000000000000000000000000000000') return;
    
    setIsDecryptingUSDC(true);
    try {
      const decryptedUSDC = await decryptBalance(
        encBalanceUSDC,
        CONTRACTS.EncryptedUSDC,
        fhevmInstance,
        fhevmDecryptionSignatureStorage
      );
      setDecryptedBalanceUSDC(decryptedUSDC);
    } catch (err) {
      console.error('Error decrypting USDC balance:', err);
    } finally {
      setIsDecryptingUSDC(false);
    }
  };
  
  const handleDecryptUSDT = async () => {
    if (!fhevmInstance || !signer || !fhevmDecryptionSignatureStorage) return;
    if (!encBalanceUSDT || encBalanceUSDT === '0' || encBalanceUSDT === '0x0000000000000000000000000000000000000000000000000000000000000000') return;
    
    setIsDecryptingUSDT(true);
    try {
      const decryptedUSDT = await decryptBalance(
        encBalanceUSDT,
        CONTRACTS.EncryptedUSDT,
        fhevmInstance,
        fhevmDecryptionSignatureStorage
      );
      setDecryptedBalanceUSDT(decryptedUSDT);
    } catch (err) {
      console.error('Error decrypting USDT balance:', err);
    } finally {
      setIsDecryptingUSDT(false);
    }
  };

  const handleDeposit = async () => {
    try {
      const txHash = await deposit(depositCurrency, depositAmount);
      if (txHash) {
        toast.success(
          <div>
            Deposit successful!
            <a 
              href={`https://sepolia.etherscan.io/tx/${txHash}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="block text-xs text-primary hover:underline mt-1"
            >
              View transaction →
            </a>
          </div>
        );
        setDepositAmount('');
      }
    } catch (err: any) {
      toast.error(err.message || 'Deposit failed');
    }
  };

  const handleWithdraw = async () => {
    try {
      const txHash = await withdraw(withdrawCurrency, withdrawAmount, withdrawRecipient || undefined);
      if (txHash) {
        toast.success(
          <div>
            Withdrawal successful!
            <a 
              href={`https://sepolia.etherscan.io/tx/${txHash}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="block text-xs text-primary hover:underline mt-1"
            >
              View transaction →
            </a>
          </div>
        );
        setWithdrawAmount('');
        setWithdrawRecipient('');
      }
    } catch (err: any) {
      toast.error(err.message || 'Withdraw failed');
    }
  };

  const handleSubmitIntent = async () => {
    // Prevent multiple clicks
    if (isSubmittingSwap) return;
    
    setIsSubmittingSwap(true);
    
    try {
      if (!fhevmInstance || !signer) {
        toast.error('FHEVM not initialized');
        return;
      }
      
      const encBalance = tokenIn === 'USDC' ? encBalanceUSDC : encBalanceUSDT;
      if (!encBalance || encBalance === '0') {
        toast.error(`Deposit ${tokenIn} first`);
        return;
      }

      const result = await submitIntent(
        tokenIn,
        tokenOut,
        swapAmount
      );
      
      if (result?.intentId) {
        toast.success(
          <div>
            Intent submitted!
            {result.txHash && (
              <a 
                href={`https://sepolia.etherscan.io/tx/${result.txHash}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="block text-xs text-primary hover:underline mt-1"
              >
                View transaction →
              </a>
            )}
          </div>
        );
        setSwapAmount('');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit intent');
    } finally {
      setIsSubmittingSwap(false);
    }
  };

  const handleExecuteIntent = async (intentId: string) => {
    setExecutingIntentId(intentId);
    try {
      const txHash = await executeIntent(intentId);
      setProcessedIntents(prev => new Set([...prev, intentId]));
      setSubmittedIntents(prev => prev.filter(intent => intent.id !== intentId));
      toast.success(
        <div>
          Swap executed!
          <a 
            href={`https://sepolia.etherscan.io/tx/${txHash}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="block text-xs text-primary hover:underline mt-1"
          >
            View transaction →
          </a>
        </div>
      );
    } catch (err: any) {
      console.error('Execute intent error:', err);
      if (err.message?.includes('0xe450d38c')) {
        toast.error('Intent may have already been executed or expired');
      } else if (err.message?.includes('insufficient')) {
        toast.error('Insufficient balance for swap');
      } else {
        toast.error(err.message || 'Failed to execute intent');
      }
    } finally {
      setExecutingIntentId(null);
    }
  };

  const switchToSepolia = async () => {
    if (!window.ethereum) return;
    
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0xaa36a7' }],
      });
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0xaa36a7',
              chainName: 'Sepolia',
              nativeCurrency: {
                name: 'SepoliaETH',
                symbol: 'ETH',
                decimals: 18
              },
              rpcUrls: ['https://rpc.sepolia.org'],
              blockExplorerUrls: ['https://sepolia.etherscan.io/']
            }],
          });
        } catch (addError) {
          console.error('Failed to add Sepolia:', addError);
        }
      }
    }
  };

  // Not connected state
  if (!isConnected) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="min-h-screen flex items-center justify-center p-4 relative bg-background"
      >
        <Card className="w-full max-w-md card-black">
          <CardHeader className="text-center space-y-4">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="mx-auto w-20 h-20 bg-foreground/5 rounded-2xl flex items-center justify-center"
            >
              <Shield className="w-10 h-10 text-foreground" />
            </motion.div>
            <div className="space-y-2">
              <CardTitle className="text-heading-md">ZSwap</CardTitle>
              <CardDescription className="text-body-sm">
                Private DeFi trading powered by Fully Homomorphic Encryption
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <Button onClick={connect} className="w-full" size="lg" variant="default" data-testid="button-connect-wallet">
              <Wallet className="mr-2 h-[18px] w-[18px]" />
              Connect Wallet
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Wrong network state
  if (isConnected && !isCorrectNetwork) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen flex items-center justify-center p-4 relative bg-background"
      >
        <Card className="w-full max-w-md card-black">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-20 h-20 bg-destructive/10 rounded-2xl flex items-center justify-center">
              <AlertCircle className="w-10 h-10 text-destructive" />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-heading-md">Wrong Network</CardTitle>
              <CardDescription className="text-body-sm">
                Please switch to Sepolia testnet to continue
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="surface-subtle p-4">
              <p className="text-label text-muted-foreground mb-1.5">Current network</p>
              <p className="text-base font-semibold text-foreground">
                {chainId === 31337 ? 'Localhost' : 
                 chainId === 1 ? 'Ethereum Mainnet' : 
                 `Chain ID: ${chainId}`}
              </p>
            </div>
            <Button onClick={switchToSepolia} className="w-full" size="lg" variant="default" data-testid="button-switch-network">
              Switch to Sepolia
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Main app
  return (
    <div className="min-h-screen bg-background py-12 md:py-16 lg:py-20">
      <div className="max-w-7xl mx-auto px-6 md:px-10 xl:px-14">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-6 md:auto-rows-[minmax(220px,_auto)] md:gap-8 lg:grid-cols-12 lg:auto-rows-[minmax(260px,_auto)] lg:gap-10 xl:gap-12">
      
      {/* Trading Interface - Hero Card - MUST BE FIRST FOR GRID PLACEMENT */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="col-span-full md:col-span-6 md:row-span-2 lg:col-span-8 lg:col-start-1 lg:row-span-2 lg:row-start-1 min-h-[420px] md:min-h-[500px]"
      >
        <Card className="card-hero card-black h-full" data-testid="card-trading">
          <CardHeader className="space-y-2">
            <CardTitle className="text-heading-lg">
              Trading Operations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Tabs defaultValue="deposit" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="deposit" data-testid="tab-deposit">Deposit</TabsTrigger>
                <TabsTrigger value="withdraw" data-testid="tab-withdraw">Withdraw</TabsTrigger>
                <TabsTrigger value="swap" data-testid="tab-swap">Private Swap</TabsTrigger>
              </TabsList>
              
              <TabsContent value="deposit" className="space-y-6 mt-6 surface-elevated p-8" data-testid="tab-content-deposit">
              <div className="space-y-3">
                <label className="text-label">Select Token</label>
                <div className="grid grid-cols-2 gap-3">
                  {(['USDC', 'USDT'] as const).map((token) => (
                    <Button
                      key={token}
                      onClick={() => setDepositCurrency(token)}
                      variant={depositCurrency === token ? "default" : "outline"}
                      className="h-14"
                      data-testid={`button-deposit-${token.toLowerCase()}`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-foreground/10 flex items-center justify-center text-foreground font-bold text-sm">
                          {token[0]}
                        </div>
                        <span className="text-label">{token}</span>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
              
              <div className="space-y-3">
                <label className="text-label">Amount</label>
                <div className="relative">
                  <Input
                    type="text"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="0.00"
                    className="pr-20 text-data-md h-14"
                    data-testid="input-deposit-amount"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-label text-muted-foreground">
                    {depositCurrency}
                  </span>
                </div>
                <p className="text-body-sm">
                  Available: <span className="font-semibold text-foreground">{depositCurrency === 'USDC' ? balanceUSDC : balanceUSDT} {depositCurrency}</span>
                </p>
              </div>
              
              <Button
                onClick={handleDeposit}
                disabled={loading || !depositAmount || parseFloat(depositAmount) <= 0}
                className="w-full h-14"
                variant="default"
                data-testid="button-deposit"
              >
                {loading ? <RefreshCw className="mr-2 h-[18px] w-[18px] animate-spin" /> : null}
                Deposit
              </Button>
            </TabsContent>
            
            <TabsContent value="withdraw" className="space-y-6 mt-6 surface-elevated p-8" data-testid="tab-content-withdraw">
              <div className="space-y-3">
                <label className="text-label">Select Encrypted Token</label>
                <div className="grid grid-cols-2 gap-3">
                  {(['USDC', 'USDT'] as const).map((token) => (
                    <Button
                      key={token}
                      onClick={() => setWithdrawCurrency(token)}
                      variant={withdrawCurrency === token ? "default" : "outline"}
                      className="h-14"
                      data-testid={`button-withdraw-${token.toLowerCase()}`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-foreground/10 flex items-center justify-center text-foreground font-bold text-xs">
                          e{token[0]}
                        </div>
                        <span className="text-label">e{token}</span>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
              
              <div className="space-y-3">
                <label className="text-label">Amount</label>
                <div className="relative">
                  <Input
                    type="text"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="0.00"
                    className="pr-20 text-data-md h-14"
                    data-testid="input-withdraw-amount"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-label text-muted-foreground">
                    {withdrawCurrency}
                  </span>
                </div>
              </div>
              
              <div className="space-y-3">
                <label className="text-label">Recipient (Optional)</label>
                <Input
                  type="text"
                  value={withdrawRecipient}
                  onChange={(e) => setWithdrawRecipient(e.target.value)}
                  placeholder="0x..."
                  data-testid="input-withdraw-recipient"
                />
              </div>
              
              <div className="surface-subtle p-4" data-testid="alert-withdraw-warning">
                <p className="text-body-sm flex items-center gap-2">
                  <Shield className="h-[18px] w-[18px] text-muted-foreground flex-shrink-0" />
                  <span>Withdrawing will convert encrypted tokens back to regular tokens</span>
                </p>
              </div>
              
              <Button
                onClick={handleWithdraw}
                disabled={loading || !withdrawAmount || parseFloat(withdrawAmount) <= 0}
                className="w-full h-14"
                variant="default"
                data-testid="button-withdraw-submit"
              >
                {loading ? <RefreshCw className="mr-2 h-[18px] w-[18px] animate-spin" /> : <LogOut className="mr-2 h-[18px] w-[18px]" />}
                Withdraw
              </Button>
            </TabsContent>
            
            <TabsContent value="swap" className="space-y-6 mt-6 surface-elevated p-8" data-testid="tab-content-swap">
              <div className="space-y-3">
                <label className="text-label">From (Encrypted)</label>
                <div className="flex gap-3">
                  <Input
                    type="text"
                    value={swapAmount}
                    onChange={(e) => setSwapAmount(e.target.value)}
                    placeholder="0.00"
                    className="flex-1 text-data-md h-14"
                    data-testid="input-swap-amount"
                  />
                  <Select value={tokenIn} onValueChange={(value) => setTokenIn(value as 'USDC' | 'USDT')}>
                    <SelectTrigger className="w-40 h-14" data-testid="select-token-in">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USDC" data-testid="option-token-in-usdc">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-foreground/10 flex items-center justify-center text-foreground text-xs font-bold">
                            eU
                          </div>
                          <span className="text-label">zUSDC</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="USDT" data-testid="option-token-in-usdt">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-foreground/10 flex items-center justify-center text-foreground text-xs font-bold">
                            zT
                          </div>
                          <span className="text-label">zUSDT</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex justify-center -my-3">
                <Button
                  onClick={() => {
                    setTokenIn(tokenOut);
                    setTokenOut(tokenIn);
                  }}
                  variant="outline"
                  size="icon"
                  className="rounded-full"
                  data-testid="button-swap-tokens"
                >
                  <ArrowDownUp className="h-[18px] w-[18px]" />
                </Button>
              </div>
              
              <div className="space-y-3">
                <label className="text-label">To (Encrypted)</label>
                <div className="flex gap-3">
                  <Input
                    type="text"
                    value={swapAmount ? parseFloat(swapAmount || '0').toFixed(2) : ''}
                    readOnly
                    placeholder="0.00"
                    className="flex-1 text-data-md h-14 opacity-60 cursor-not-allowed"
                    data-testid="input-swap-output"
                  />
                  <Select value={tokenOut} onValueChange={(value) => setTokenOut(value as 'USDC' | 'USDT')}>
                    <SelectTrigger className="w-40 h-14" data-testid="select-token-out">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USDC" data-testid="option-token-out-usdc">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-foreground/10 flex items-center justify-center text-foreground text-xs font-bold">
                            eU
                          </div>
                          <span className="text-label">zUSDC</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="USDT" data-testid="option-token-out-usdt">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-foreground/10 flex items-center justify-center text-foreground text-xs font-bold">
                            zT
                          </div>
                          <span className="text-label">zUSDT</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="surface-subtle p-4" data-testid="alert-swap-info">
                <p className="text-body-sm flex items-center gap-2">
                  <Lock className="h-[18px] w-[18px] text-muted-foreground flex-shrink-0" />
                  <span>Your swap amount is encrypted using FHE</span>
                </p>
              </div>
              
              <Button
                onClick={handleSubmitIntent}
                disabled={isSubmittingSwap || tokenIn === tokenOut || !swapAmount}
                className="w-full h-14"
                variant="default"
                data-testid="button-swap-submit"
              >
                {isSubmittingSwap ? <RefreshCw className="mr-2 h-[18px] w-[18px] animate-spin" /> : <Zap className="mr-2 h-[18px] w-[18px]" />}
                {isSubmittingSwap ? 'Processing...' : 'Submit Private Swap'}
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      </motion.div>

      {/* Stats Grid - 3 Primary Cards */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="col-span-full md:col-span-2 lg:col-span-4 lg:col-start-9 lg:row-start-1 min-h-[200px]"
      >
        <Card className="card-primary h-full" data-testid="card-total-value">
          <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
            <CardTitle className="text-label text-muted-foreground">Total Value</CardTitle>
            <div className="p-2 bg-success/10 rounded-xl">
              <DollarSign className="h-[18px] w-[18px] text-success" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-data-xl text-success">
              ${((parseFloat(balanceUSDC || '0') + parseFloat(balanceUSDT || '0')) * 1).toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="col-span-full md:col-span-2 lg:col-span-4 lg:col-start-9 lg:row-start-2 min-h-[200px]"
      >
        <Card className="card-primary h-full" data-testid="card-gas-price">
          <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
            <CardTitle className="text-label text-muted-foreground">Gas Price</CardTitle>
            <div className="p-2 bg-foreground/5 rounded-xl">
              <Fuel className="h-[18px] w-[18px] text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-data-xl text-foreground">~5 Gwei</div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="col-span-full md:col-span-2 lg:col-span-4 lg:col-start-9 lg:row-start-3 min-h-[200px]"
      >
        <Card className="card-primary h-full" data-testid="card-pending-intents">
          <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
            <CardTitle className="text-label text-muted-foreground">Pending Intents</CardTitle>
            <div className="p-2 bg-primary/10 rounded-xl">
              <Layers className="h-[18px] w-[18px] text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-data-xl text-foreground">{submittedIntents.length}</div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Balance Cards - Primary */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="col-span-full md:col-span-3 lg:col-span-6"
      >
        <Card className="card-primary h-full" data-testid="card-regular-tokens">
          <CardHeader className="space-y-2">
            <CardTitle className="text-heading-sm flex items-center gap-2.5">
              <Wallet className="h-[18px] w-[18px] text-muted-foreground" />
              <span>Regular Tokens</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between gap-4 p-4 surface-subtle hover:-translate-y-0.5 transition-smooth" data-testid="balance-usdc">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-foreground/10 rounded-full flex items-center justify-center text-foreground font-bold text-sm">
                  U
                </div>
                <span className="text-label text-foreground">USDC</span>
              </div>
              <span className="text-data-md">{balanceUSDC || '0.00'}</span>
            </div>
            <div className="flex items-center justify-between gap-4 p-4 surface-subtle hover:-translate-y-0.5 transition-smooth" data-testid="balance-usdt">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-foreground/10 rounded-full flex items-center justify-center text-foreground font-bold text-sm">
                  T
                </div>
                <span className="text-label text-foreground">USDT</span>
              </div>
              <span className="text-data-md">{balanceUSDT || '0.00'}</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="col-span-full md:col-span-3 lg:col-span-6"
      >
        <Card className="card-primary h-full" data-testid="card-encrypted-tokens">
          <CardHeader className="space-y-2">
            <CardTitle className="text-heading-sm flex items-center gap-2.5">
              <Lock className="h-[18px] w-[18px] text-muted-foreground" />
              <span>Encrypted Tokens</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between gap-4 p-4 surface-subtle">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-foreground/10 rounded-full flex items-center justify-center text-foreground font-bold text-xs">
                  eU
                </div>
                <span className="text-label text-foreground">zUSDC</span>
              </div>
              <div className="flex items-center gap-2">
                {decryptedBalanceUSDC ? (
                  <span className="text-data-md">{decryptedBalanceUSDC}</span>
                ) : encBalanceUSDC && encBalanceUSDC !== '0' ? (
                  <div className="flex items-center gap-1.5">
                    <Lock className="h-[18px] w-[18px] text-muted-foreground" />
                    <span className="text-body-sm text-muted-foreground">{Number(encBalanceUSDC).toExponential(2)}</span>
                  </div>
                ) : (
                  <span className="text-data-md">0.00</span>
                )}
                {encBalanceUSDC && encBalanceUSDC !== '0' && !decryptedBalanceUSDC && (
                  <Button
                    onClick={handleDecryptUSDC}
                    disabled={isDecryptingUSDC}
                    size="sm"
                    variant="outline"
                    data-testid="button-decrypt-usdc"
                  >
                    {isDecryptingUSDC ? <RefreshCw className="h-[18px] w-[18px] animate-spin" /> : <Eye className="h-[18px] w-[18px]" />}
                  </Button>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between gap-4 p-4 surface-subtle" data-testid="balance-eusdt">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-foreground/10 rounded-full flex items-center justify-center text-foreground font-bold text-xs">
                  zT
                </div>
                <span className="text-label text-foreground">zUSDT</span>
              </div>
              <div className="flex items-center gap-2">
                {decryptedBalanceUSDT ? (
                  <span className="text-data-md">{decryptedBalanceUSDT}</span>
                ) : encBalanceUSDT && encBalanceUSDT !== '0' ? (
                  <div className="flex items-center gap-1.5">
                    <Lock className="h-[18px] w-[18px] text-muted-foreground" />
                    <span className="text-body-sm text-muted-foreground">{Number(encBalanceUSDT).toExponential(2)}</span>
                  </div>
                ) : (
                  <span className="text-data-md">0.00</span>
                )}
                {encBalanceUSDT && encBalanceUSDT !== '0' && !decryptedBalanceUSDT && (
                  <Button
                    onClick={handleDecryptUSDT}
                    disabled={isDecryptingUSDT}
                    size="sm"
                    variant="outline"
                    data-testid="button-decrypt-usdt"
                  >
                    {isDecryptingUSDT ? <RefreshCw className="h-[18px] w-[18px] animate-spin" /> : <Eye className="h-[18px] w-[18px]" />}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Intent History - Hero Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="col-span-full md:col-span-6 lg:col-span-8 lg:col-start-1 lg:row-span-2 min-h-[360px]"
      >
        <Card className="card-hero card-black h-full" data-testid="card-intent-history">
        <CardHeader className="space-y-2">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-3 text-heading-md">
              <Clock className="h-[18px] w-[18px] text-muted-foreground" />
              Intent History
            </span>
            <Button
              onClick={async () => {
                setIsLoadingIntents(true);
                const intents = await fetchUserIntents();
                const formattedIntents = intents
                  .filter(intent => !processedIntents.has(intent.id))
                  .map(intent => ({
                    id: intent.id,
                    transactionHash: intent.transactionHash || intent.id,
                    status: intent.executed ? 'executed' as const : 
                            intent.decryptedAmount ? 'decrypted' as const : 
                            'pending' as const,
                    amount: intent.decryptedAmount || undefined,
                    tokenIn: intent.tokenIn,
                    tokenOut: intent.tokenOut,
                    timestamp: intent.timestamp * 1000,
                    blockNumber: intent.blockNumber
                  }));
                setSubmittedIntents(formattedIntents);
                setIsLoadingIntents(false);
              }}
              disabled={isLoadingIntents}
              size="sm"
              variant="outline"
              data-testid="button-refresh-intents"
            >
              <RefreshCw className={`h-[18px] w-[18px] ${isLoadingIntents ? 'animate-spin' : ''}`} />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {submittedIntents.length === 0 ? (
            <p className="text-center text-body-sm py-8">
              No pending intents
            </p>
          ) : (
            <div className="space-y-3">
              {submittedIntents.map((intent) => (
                <div key={intent.id} className="flex items-center justify-between p-5 surface-subtle" data-testid={`intent-${intent.id}`}>
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-label font-semibold">
                        {getTokenSymbol(intent.tokenIn)}
                      </span>
                      <ArrowRight className="h-[18px] w-[18px] text-muted-foreground" />
                      <span className="text-label font-semibold">
                        {getTokenSymbol(intent.tokenOut)}
                      </span>
                    </div>
                    <a
                      href={`https://sepolia.etherscan.io/tx/${intent.transactionHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-body-sm font-mono text-primary hover:underline block"
                      data-testid={`link-intent-${intent.id}`}
                    >
                      {intent.transactionHash.slice(0, 10)}...{intent.transactionHash.slice(-8)}
                    </a>
                    <p className="text-body-sm">Block: {intent.blockNumber}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      </motion.div>

      {/* Faucet - Secondary Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="col-span-full md:col-span-3 md:col-start-2 lg:col-span-4 lg:col-start-9"
      >
        <Card className="card-secondary card-black" data-testid="card-faucet">
          <CardHeader className="space-y-2">
            <CardTitle className="text-heading-md">
              Test Token Faucet
            </CardTitle>
            <CardDescription className="text-body-sm">Get test tokens for demo (Max 100 tokens, 1 hour cooldown)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6 surface-elevated p-8">
          <div className="space-y-3">
            <label className="text-label">Select Token</label>
            <div className="grid grid-cols-2 gap-3">
              {(['USDC', 'USDT'] as const).map((token) => (
                <Button
                  key={token}
                  onClick={() => setFaucetCurrency(token)}
                  variant={faucetCurrency === token ? "default" : "outline"}
                  className="h-14"
                  data-testid={`button-faucet-${token.toLowerCase()}`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-foreground/10 flex items-center justify-center text-foreground font-bold text-sm">
                      {token[0]}
                    </div>
                    <span className="text-label">{token}</span>
                  </div>
                </Button>
              ))}
            </div>
          </div>
          
          <div className="space-y-3">
            <label className="text-label">Amount (max 100)</label>
            <div className="relative">
              <Input
                type="number"
                value={faucetAmount}
                onChange={(e) => {
                  const value = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                  setFaucetAmount(value.toString());
                }}
                placeholder="0"
                className="pr-20 text-data-md h-14"
                max="100"
                data-testid="input-faucet-amount"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-label text-muted-foreground">
                {faucetCurrency}
              </span>
            </div>
            <p className="text-body-sm">
              {parseInt(faucetAmount) > 100 ? 
                <span className="text-status-warning font-semibold">Maximum 100 tokens per request</span> : 
                `Mint up to 100 test ${faucetCurrency} tokens`
              }
            </p>
          </div>
          
          <Button
            onClick={async () => {
              try {
                const now = Date.now();
                const lastTime = lastFaucetTime[faucetCurrency] || 0;
                const timeDiff = now - lastTime;
                const oneHour = 60 * 60 * 1000;
                
                if (timeDiff < oneHour) {
                  const remainingMinutes = Math.ceil((oneHour - timeDiff) / 60000);
                  toast.error(`Please wait ${remainingMinutes} minutes before requesting ${faucetCurrency} again`);
                  return;
                }
                
                const txHash = await mintTokens(faucetCurrency, faucetAmount);
                setLastFaucetTime({ ...lastFaucetTime, [faucetCurrency]: now });
                if (txHash) {
                  toast.success(
                    <div>
                      Minted {faucetAmount} {faucetCurrency}!
                      <a 
                        href={`https://sepolia.etherscan.io/tx/${txHash}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="block text-xs text-primary hover:underline mt-1"
                      >
                        View transaction →
                      </a>
                    </div>
                  );
                } else {
                  toast.success(`Minted ${faucetAmount} ${faucetCurrency}`);
                }
              } catch (err: any) {
                toast.error(err.message || 'Mint failed');
              }
            }}
            disabled={loading || !faucetAmount || parseInt(faucetAmount) > 100}
            className="w-full h-14"
            variant="default"
            data-testid="button-faucet-mint"
          >
            {loading ? <RefreshCw className="mr-2 h-[18px] w-[18px] animate-spin" /> : <Zap className="mr-2 h-[18px] w-[18px]" />}
            Mint {faucetAmount || '0'} Test Tokens
          </Button>
          </div>
        </CardContent>
      </Card>
      </motion.div>
        </div>
      </div>
    </div>
  );
}