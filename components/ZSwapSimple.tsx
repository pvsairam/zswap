"use client";

import { useState, useEffect } from 'react';
import { useZSwap } from '../core/useZSwap';
import { useMetaMaskEthersSigner } from '../core/metamask/useMetaMaskEthersSigner';
import { useFhevm } from '../fhevm/useFhevm';
import { useOraclePrices } from '../core/useOraclePrices';
import { CONTRACTS } from '../config/contracts';
import { ethers } from 'ethers';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { SwapCard } from './SwapCard';
import { NavBar } from './NavBar';
import { RoughBorder } from './RoughBorder';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { motion } from 'framer-motion';
import { AlertCircle, ChevronDown, ChevronUp, Wallet, Lock, DollarSign, Zap } from 'lucide-react';
import { Input } from './ui/input';
import toast from 'react-hot-toast';
import { normalizeHandle } from '@/lib/utils';

export function ZSwapSimple() {
  const { ethersSigner: signer, isConnected, connect, provider, chainId } = useMetaMaskEthersSigner();
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);

  const { instance: fhevmInstance } = useFhevm({
    provider: provider as any,
    chainId: chainId,
    enabled: isConnected && isCorrectNetwork
  });

  const { 
    submitIntent,
    getEncryptedBalance,
    getRegularBalance,
    decryptBalance,
    mintTokens,
    deposit,
    withdraw,
    loading
  } = useZSwap();

  const [isSubmittingSwap, setIsSubmittingSwap] = useState(false);
  const [encBalanczUSDC, setEncBalanczUSDC] = useState<string | null>(null);
  const [encBalanczUSDT, setEncBalanczUSDT] = useState<string | null>(null);
  const [balanceMUSDC, setBalanceMUSDC] = useState<string>('0.00');
  const [balanceMUSDT, setBalanceMUSDT] = useState<string>('0.00');
  const [balanceZUSDC, setBalanceZUSDC] = useState<string>('0.00');
  const [balanceZUSDT, setBalanceZUSDT] = useState<string>('0.00');
  
  // Helper to check if user has encrypted tokens (handle is non-null after normalization)
  const hasEncryptedUSDC = encBalanczUSDC !== null;
  const hasEncryptedUSDT = encBalanczUSDT !== null;
  const [faucetCurrency, setFaucetCurrency] = useState<'USDC' | 'USDT'>('USDC');
  const [faucetAmount, setFaucetAmount] = useState('100');
  const [depositCurrency, setDepositCurrency] = useState<'USDC' | 'USDT'>('USDC');
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawCurrency, setWithdrawCurrency] = useState<'USDC' | 'USDT'>('USDC');
  const [withdrawAmount, setWithdrawAmount] = useState('');

  // Real-time oracle prices (refreshes every 5 seconds)
  const { usdcPrice, usdtPrice, ethPrice, btcPrice, loading: priceLoading } = useOraclePrices(true, 5000);

  // Check if we're on Sepolia
  useEffect(() => {
    setIsCorrectNetwork(chainId === 11155111);
  }, [chainId]);

  const fetchBalances = async () => {
    if (!signer || !isCorrectNetwork) return;
    
    try {
      const [usdcBal, usdtBal, encUsdcHandle, encUsdtHandle] = await Promise.all([
        getRegularBalance('USDC'),
        getRegularBalance('USDT'),
        getEncryptedBalance('USDC'),
        getEncryptedBalance('USDT')
      ]);
      
      if (usdcBal) setBalanceMUSDC(usdcBal);
      if (usdtBal) setBalanceMUSDT(usdtBal);
      
      // Format encrypted balances for display (uint128 to decimal string)
      // Only normalize handle if value is truthy (null/undefined means not initialized)
      if (encUsdcHandle) {
        const normalizedUSDC = normalizeHandle(encUsdcHandle);
        setEncBalanczUSDC(normalizedUSDC);
        
        // Format numeric value for display
        if (encUsdcHandle !== '0') {
          setBalanceZUSDC(ethers.formatUnits(encUsdcHandle, 6));
        } else {
          setBalanceZUSDC('0.00');
        }
      } else {
        // No handle means account not initialized - keep previous handle if any
        setBalanceZUSDC('0.00');
      }
      
      if (encUsdtHandle) {
        const normalizedUSDT = normalizeHandle(encUsdtHandle);
        setEncBalanczUSDT(normalizedUSDT);
        
        // Format numeric value for display  
        if (encUsdtHandle !== '0') {
          setBalanceZUSDT(ethers.formatUnits(encUsdtHandle, 6));
        } else {
          setBalanceZUSDT('0.00');
        }
      } else {
        // No handle means account not initialized - keep previous handle if any
        setBalanceZUSDT('0.00');
      }
    } catch (err) {
      console.error('Error fetching balances:', err);
      // Reset encrypted balances on error to prevent stale state
      setEncBalanczUSDC(null);
      setEncBalanczUSDT(null);
      setBalanceZUSDC('0.00');
      setBalanceZUSDT('0.00');
    }
  };

  const refreshBalances = async () => {
    await fetchBalances();
  };

  useEffect(() => {
    if (isConnected && isCorrectNetwork) {
      void fetchBalances();
      const interval = setInterval(() => void fetchBalances(), 10000);
      return () => clearInterval(interval);
    }
  }, [isConnected, isCorrectNetwork, signer, getRegularBalance, getEncryptedBalance]);

  const handleFaucet = async () => {
    try {
      const txHash = await mintTokens(faucetCurrency, faucetAmount);
      if (txHash) {
        toast.success(
          <div>
            Minted {faucetAmount} m{faucetCurrency}!
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
        // Refresh balances after successful mint
        setTimeout(refreshBalances, 2000);
      }
    } catch (err: any) {
      toast.error(err.message || 'Mint failed');
    }
  };

  const handleDeposit = async () => {
    if (!depositAmount) {
      toast.error('Please enter an amount');
      return;
    }
    try {
      const txHash = await deposit(depositCurrency, depositAmount);
      if (txHash) {
        toast.success(
          <div>
            Deposited {depositAmount} m{depositCurrency}!
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
        // Refresh balances after successful deposit
        setTimeout(refreshBalances, 2000);
      }
    } catch (err: any) {
      toast.error(err.message || 'Deposit failed');
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount) {
      toast.error('Please enter an amount');
      return;
    }
    try {
      const txHash = await withdraw(withdrawCurrency, withdrawAmount);
      if (txHash) {
        toast.success(
          <div>
            Withdrawn {withdrawAmount} z{withdrawCurrency}!
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
        // Refresh balances after successful withdraw
        setTimeout(refreshBalances, 2000);
      }
    } catch (err: any) {
      toast.error(err.message || 'Withdraw failed');
    }
  };

  const handleSwap = async (fromToken: string, toToken: string, amount: string) => {
    if (isSubmittingSwap) return;
    
    setIsSubmittingSwap(true);
    
    try {
      if (!fhevmInstance || !signer) {
        toast.error('FHEVM not initialized');
        return;
      }
      
      // Parse USDC/USDT token names - strip 'z' prefix from zUSDC/zUSDT
      const tokenIn = fromToken.replace('z', '');
      const tokenOut = toToken.replace('z', '');
      
      // Validate that only supported tokens (USDC/USDT) are used
      if (tokenIn !== 'USDC' && tokenIn !== 'USDT') {
        toast.error(`Unsupported token: ${fromToken}. Only zUSDC and zUSDT are supported.`);
        return;
      }
      if (tokenOut !== 'USDC' && tokenOut !== 'USDT') {
        toast.error(`Unsupported token: ${toToken}. Only zUSDC and zUSDT are supported.`);
        return;
      }
      
      // Type-safe cast after validation
      const validTokenIn = tokenIn as 'USDC' | 'USDT';
      const validTokenOut = tokenOut as 'USDC' | 'USDT';
      
      // CRITICAL: Validate encrypted balance before swap
      const hasEncBalance = validTokenIn === 'USDC' ? hasEncryptedUSDC : hasEncryptedUSDT;
      if (!hasEncBalance) {
        toast.error(`Please deposit m${validTokenIn} first to get encrypted z${validTokenIn} for swapping`);
        return;
      }

      const result = await submitIntent(
        validTokenIn,
        validTokenOut,
        amount
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
        
        setTimeout(() => {
          toast(
            <div className="text-sm">
              <div className="font-medium mb-1">⏳ Swap Pending</div>
              <div className="text-xs text-muted-foreground">
                Your swap is waiting in a batch. Balances update after batch settlement.
              </div>
            </div>,
            {
              duration: 8000,
              icon: 'ℹ️',
            }
          );
        }, 1000);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit intent');
    } finally {
      setIsSubmittingSwap(false);
    }
  };

  // Not connected state
  if (!isConnected) {
    return (
      <div className="min-h-screen flex flex-col bg-white overflow-hidden">
        {/* Updated NavBar */}
        <div className="px-4 py-6">
          <NavBar />
        </div>

        {/* Main Content - Connect Wallet Card */}
        <div className="flex-1 flex items-center justify-center px-4 pb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md"
          >
            <Card className="card-hero">
              <CardContent className="p-8 md:p-10 space-y-6">
                {/* Lock Icon */}
                <div className="flex justify-center">
                  <div className="bg-muted rounded-2xl p-6">
                    <Lock className="w-12 h-12 text-primary" strokeWidth={2.5} />
                  </div>
                </div>

                {/* Title - Use text size instead of font-bold */}
                <h1 className="text-4xl md:text-5xl text-center text-primary" data-testid="text-app-title">
                  zSwap
                </h1>

                {/* Description */}
                <p className="text-center text-muted-foreground text-base md:text-lg leading-relaxed">
                  Private DeFi trading powered by<br/>
                  Fully Homomorphic Encryption
                </p>

                {/* Connect Wallet Button - Use size variant only */}
                <Button
                  onClick={connect}
                  size="lg"
                  className="w-full text-lg rounded-2xl"
                  data-testid="button-connect-wallet"
                >
                  <Wallet className="mr-3 h-5 w-5" />
                  Connect Wallet
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Bottom Safe Area for Mobile */}
        <div className="h-safe-area-inset-bottom bg-white"></div>
      </div>
    );
  }

  // Wrong network
  if (!isCorrectNetwork) {
    return (
      <div className="min-h-screen flex flex-col bg-white overflow-hidden">
        {/* Updated NavBar */}
        <div className="px-4 py-6">
          <NavBar />
        </div>
        
        <div className="flex-1 flex items-center justify-center px-4 pb-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md"
          >
            <Card className="card-hero">
              <CardContent className="p-8 md:p-10 space-y-6">
                {/* Alert Icon */}
                <div className="flex justify-center">
                  <div className="bg-destructive/10 rounded-2xl p-6">
                    <AlertCircle className="w-12 h-12 text-destructive" strokeWidth={2.5} />
                  </div>
                </div>
                
                {/* Title - Use text size instead of font-bold */}
                <h2 className="text-3xl md:text-4xl text-center text-destructive">
                  Wrong Network
                </h2>
                
                {/* Description */}
                <p className="text-center text-muted-foreground text-base md:text-lg">
                  Please switch to Sepolia testnet
                </p>
                
                {/* Switch Network Button - Use size variant only */}
                <Button 
                  onClick={async () => {
                    try {
                      if (provider && 'request' in provider) {
                        await provider.request({
                          method: "wallet_switchEthereumChain",
                          params: [{ chainId: '0xaa36a7' }]
                        });
                      }
                    } catch (error: any) {
                      if (error.code === 4902 && provider && 'request' in provider) {
                        await provider.request({
                          method: "wallet_addEthereumChain",
                          params: [{
                            chainId: '0xaa36a7',
                            chainName: 'Sepolia',
                            rpcUrls: ['https://rpc.sepolia.org'],
                            nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
                            blockExplorerUrls: ['https://sepolia.etherscan.io']
                          }]
                        });
                      }
                    }
                  }}
                  size="lg" 
                  className="w-full text-lg rounded-2xl"
                  data-testid="button-switch-network"
                >
                  Switch to Sepolia
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
        
        {/* Bottom Safe Area for Mobile */}
        <div className="h-safe-area-inset-bottom bg-white"></div>
      </div>
    );
  }

  // Main app - Connected & Correct Network
  return (
    <div className="min-h-screen bg-white overflow-hidden">
      {/* NavBar - Clean design without glassmorphism */}
      <div className="px-4 py-6">
        <NavBar />
      </div>

      {/* Main Content - Vertical Stack */}
      <div className="container mx-auto px-4 pb-6 md:pb-12 max-w-3xl">
        <div className="space-y-6">
          {/* Hero: Swap Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <SwapCard 
              onSwap={handleSwap}
              loading={isSubmittingSwap}
              balanceUSDC={balanceZUSDC}
              balanceUSDT={balanceZUSDT}
              balanceETH="0.00"
              balanceBTC="0.00"
              hasEncryptedUSDC={hasEncryptedUSDC}
              hasEncryptedUSDT={hasEncryptedUSDT}
              hasEncryptedETH={false}
              hasEncryptedBTC={false}
              usdcPrice={usdcPrice}
              usdtPrice={usdtPrice}
              ethPrice={ethPrice}
              btcPrice={btcPrice}
              priceLoading={priceLoading}
            />
          </motion.div>

          {/* Tab-Based Notebook Design for Faucet/Deposit/Withdraw */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <RoughBorder className="rounded-3xl" strokeWidth={2.5} roughness={1.8}>
              <div className="glass-panel rounded-3xl overflow-hidden">
                <Tabs defaultValue="faucet" className="w-full">
                  {/* Notebook Tab Headers */}
                  <div className="relative px-4 pt-4 md:px-6 md:pt-6">
                    <TabsList className="grid w-full grid-cols-3 gap-2 bg-transparent p-0 h-auto">
                      <TabsTrigger 
                        value="faucet" 
                        className="rounded-t-2xl rounded-b-none border-2 border-b-0 border-border bg-background/50 data-[state=active]:bg-background data-[state=active]:shadow-[0_-2px_4px_rgba(0,0,0,0.1)] hover-sketch min-h-[48px] md:min-h-[56px]"
                        data-testid="tab-faucet"
                        aria-label="Get Test Tokens - Faucet"
                      >
                        <Zap className="h-4 w-4 md:h-5 md:w-5 mr-2" strokeWidth={2.5} aria-hidden="true" />
                        <span className="text-sm md:text-base">Faucet</span>
                      </TabsTrigger>
                      <TabsTrigger 
                        value="deposit" 
                        className="rounded-t-2xl rounded-b-none border-2 border-b-0 border-border bg-background/50 data-[state=active]:bg-background data-[state=active]:shadow-[0_-2px_4px_rgba(0,0,0,0.1)] hover-sketch min-h-[48px] md:min-h-[56px]"
                        data-testid="tab-deposit"
                        aria-label="Deposit Funds - Convert tokens to encrypted"
                      >
                        <DollarSign className="h-4 w-4 md:h-5 md:w-5 mr-2" strokeWidth={2.5} aria-hidden="true" />
                        <span className="text-sm md:text-base">Deposit</span>
                      </TabsTrigger>
                      <TabsTrigger 
                        value="withdraw" 
                        className="rounded-t-2xl rounded-b-none border-2 border-b-0 border-border bg-background/50 data-[state=active]:bg-background data-[state=active]:shadow-[0_-2px_4px_rgba(0,0,0,0.1)] hover-sketch min-h-[48px] md:min-h-[56px]"
                        data-testid="tab-withdraw"
                        aria-label="Withdraw Funds - Convert encrypted back to regular"
                      >
                        <Lock className="h-4 w-4 md:h-5 md:w-5 mr-2" strokeWidth={2.5} aria-hidden="true" />
                        <span className="text-sm md:text-base">Withdraw</span>
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  {/* Faucet Tab Content */}
                  <TabsContent value="faucet" className="mt-0 p-6 md:p-7 space-y-5 border-t-2 border-border">
                    <div className="flex items-center gap-3 mb-4">
                      <RoughBorder className="rounded-2xl" strokeWidth={2} roughness={1.5}>
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-gradient-to-br from-accent to-accent/70 flex items-center justify-center">
                          <Zap className="h-5 w-5 md:h-6 md:w-6 text-white" strokeWidth={2.5} />
                        </div>
                      </RoughBorder>
                      <div>
                        <h3 className="text-lg md:text-xl text-primary">Get Test Tokens</h3>
                        <p className="text-sm text-muted-foreground">Free test tokens for testing</p>
                      </div>
                    </div>
                    
                    <p className="text-sm md:text-base text-muted-foreground">
                      Claim free test tokens to try ZSwap on Sepolia testnet.
                    </p>
                    
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <Button
                          variant={faucetCurrency === 'USDC' ? 'default' : 'outline'}
                          onClick={() => setFaucetCurrency('USDC')}
                          size="lg"
                          className="rounded-full"
                          data-testid="button-select-usdc"
                        >
                          mUSDC
                        </Button>
                        <Button
                          variant={faucetCurrency === 'USDT' ? 'default' : 'outline'}
                          onClick={() => setFaucetCurrency('USDT')}
                          size="lg"
                          className="rounded-full"
                          data-testid="button-select-usdt"
                        >
                          mUSDT
                        </Button>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm md:text-base">Amount</label>
                        <Input
                          type="number"
                          value={faucetAmount}
                          onChange={(e) => setFaucetAmount(e.target.value)}
                          placeholder="100"
                          max="1000"
                          className="rounded-2xl h-12 md:h-14"
                          data-testid="input-faucet-amount"
                        />
                        <p className="text-xs md:text-sm text-muted-foreground">Maximum: 1000 tokens</p>
                      </div>
                      
                      <Button 
                        onClick={handleFaucet}
                        disabled={loading || !faucetAmount || parseFloat(faucetAmount) > 1000}
                        className="w-full rounded-full bg-accent hover:bg-accent/90 text-white border-2 border-accent"
                        size="lg"
                        data-testid="button-claim-faucet"
                      >
                        {loading ? 'Minting...' : `Claim ${faucetAmount} m${faucetCurrency}`}
                      </Button>
                    </div>
                  </TabsContent>

                  {/* Deposit Tab Content */}
                  <TabsContent value="deposit" className="mt-0 p-6 md:p-7 space-y-5 border-t-2 border-border">
                    <div className="flex items-center gap-3 mb-4">
                      <RoughBorder className="rounded-2xl" strokeWidth={2} roughness={1.5}>
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                          <DollarSign className="h-5 w-5 md:h-6 md:w-6 text-white" strokeWidth={2.5} />
                        </div>
                      </RoughBorder>
                      <div>
                        <h3 className="text-lg md:text-xl text-primary">Deposit Funds</h3>
                        <p className="text-sm text-muted-foreground">Convert tokens to encrypted</p>
                      </div>
                    </div>
                    
                    <p className="text-sm md:text-base text-muted-foreground">
                      Deposit your regular tokens to convert them into encrypted tokens for private swaps.
                    </p>
                    
                    <RoughBorder className="rounded-2xl" strokeWidth={1.5} roughness={1.3}>
                      <div className="rounded-2xl p-4 space-y-2 bg-muted/30">
                        <div className="text-xs md:text-sm text-muted-foreground">Your Balances</div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-0.5">
                            <div className="text-xs md:text-sm text-muted-foreground">mUSDC</div>
                            <div className="text-base md:text-lg font-semibold" data-testid="text-balance-musdc">{balanceMUSDC}</div>
                          </div>
                          <div className="space-y-0.5">
                            <div className="text-xs md:text-sm text-muted-foreground">mUSDT</div>
                            <div className="text-base md:text-lg font-semibold" data-testid="text-balance-musdt">{balanceMUSDT}</div>
                          </div>
                          <div className="space-y-0.5">
                            <div className="text-xs md:text-sm text-muted-foreground">zUSDC</div>
                            <div className="text-base md:text-lg font-semibold" data-testid="text-balance-zusdc">{balanceZUSDC}</div>
                          </div>
                          <div className="space-y-0.5">
                            <div className="text-xs md:text-sm text-muted-foreground">zUSDT</div>
                            <div className="text-base md:text-lg font-semibold" data-testid="text-balance-zusdt">{balanceZUSDT}</div>
                          </div>
                        </div>
                      </div>
                    </RoughBorder>
                    
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <Button
                          variant={depositCurrency === 'USDC' ? 'default' : 'outline'}
                          onClick={() => setDepositCurrency('USDC')}
                          size="lg"
                          className="rounded-full"
                          data-testid="button-deposit-usdc"
                        >
                          mUSDC
                        </Button>
                        <Button
                          variant={depositCurrency === 'USDT' ? 'default' : 'outline'}
                          onClick={() => setDepositCurrency('USDT')}
                          size="lg"
                          className="rounded-full"
                          data-testid="button-deposit-usdt"
                        >
                          mUSDT
                        </Button>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm md:text-base">Amount</label>
                        <Input
                          type="number"
                          value={depositAmount}
                          onChange={(e) => setDepositAmount(e.target.value)}
                          placeholder="0.0"
                          className="rounded-2xl h-12 md:h-14"
                          data-testid="input-deposit-amount"
                        />
                      </div>
                      
                      <Button 
                        onClick={handleDeposit}
                        disabled={loading || !depositAmount}
                        className="w-full rounded-full"
                        size="lg"
                        data-testid="button-deposit-submit"
                      >
                        {loading ? 'Depositing...' : `Deposit m${depositCurrency} → z${depositCurrency}`}
                      </Button>
                    </div>
                  </TabsContent>

                  {/* Withdraw Tab Content */}
                  <TabsContent value="withdraw" className="mt-0 p-6 md:p-7 space-y-5 border-t-2 border-border">
                    <div className="flex items-center gap-3 mb-4">
                      <RoughBorder className="rounded-2xl" strokeWidth={2} roughness={1.5}>
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-gradient-to-br from-secondary to-primary flex items-center justify-center">
                          <Lock className="h-5 w-5 md:h-6 md:w-6 text-white" strokeWidth={2.5} />
                        </div>
                      </RoughBorder>
                      <div>
                        <h3 className="text-lg md:text-xl text-primary">Withdraw Funds</h3>
                        <p className="text-sm text-muted-foreground">Convert encrypted back to regular</p>
                      </div>
                    </div>
                    
                    <p className="text-sm md:text-base text-muted-foreground">
                      Withdraw your encrypted tokens back to regular tokens.
                    </p>
                    
                    <RoughBorder className="rounded-2xl" strokeWidth={1.5} roughness={1.3}>
                      <div className="rounded-2xl p-4 space-y-2 bg-muted/30">
                        <div className="text-xs md:text-sm text-muted-foreground">Encrypted Balances</div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-0.5">
                            <div className="text-xs md:text-sm text-muted-foreground">zUSDC</div>
                            <div className="text-base md:text-lg font-semibold" data-testid="text-withdraw-balance-zusdc">{balanceZUSDC}</div>
                          </div>
                          <div className="space-y-0.5">
                            <div className="text-xs md:text-sm text-muted-foreground">zUSDT</div>
                            <div className="text-base md:text-lg font-semibold" data-testid="text-withdraw-balance-zusdt">{balanceZUSDT}</div>
                          </div>
                        </div>
                      </div>
                    </RoughBorder>
                    
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <Button
                          variant={withdrawCurrency === 'USDC' ? 'default' : 'outline'}
                          onClick={() => setWithdrawCurrency('USDC')}
                          size="lg"
                          className="rounded-full"
                          data-testid="button-withdraw-usdc"
                        >
                          zUSDC
                        </Button>
                        <Button
                          variant={withdrawCurrency === 'USDT' ? 'default' : 'outline'}
                          onClick={() => setWithdrawCurrency('USDT')}
                          size="lg"
                          className="rounded-full"
                          data-testid="button-withdraw-usdt"
                        >
                          zUSDT
                        </Button>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm md:text-base">Amount</label>
                        <Input
                          type="number"
                          value={withdrawAmount}
                          onChange={(e) => setWithdrawAmount(e.target.value)}
                          placeholder="0.0"
                          className="rounded-2xl h-12 md:h-14"
                          data-testid="input-withdraw-amount"
                        />
                      </div>
                      
                      <Button 
                        onClick={handleWithdraw}
                        disabled={loading || !withdrawAmount}
                        className="w-full rounded-full"
                        size="lg"
                        data-testid="button-withdraw-submit"
                      >
                        {loading ? 'Withdrawing...' : `Withdraw z${withdrawCurrency} → m${withdrawCurrency}`}
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </RoughBorder>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
