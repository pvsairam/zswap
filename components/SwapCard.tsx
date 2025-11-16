"use client";

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Input } from './ui/input';
import { ArrowDownUp, ChevronDown, Settings, Lightbulb, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { RoughBorder } from './RoughBorder';

type TokenType = 'zUSDC' | 'zUSDT' | 'zETH' | 'zBTC';

interface SwapCardProps {
  onSwap: (fromToken: string, toToken: string, amount: string) => void;
  loading?: boolean;
  balanceUSDC?: string;
  balanceUSDT?: string;
  balanceETH?: string;
  balanceBTC?: string;
  hasEncryptedUSDC?: boolean;
  hasEncryptedUSDT?: boolean;
  hasEncryptedETH?: boolean;
  hasEncryptedBTC?: boolean;
  usdcPrice?: number;
  usdtPrice?: number;
  ethPrice?: number;
  btcPrice?: number;
  priceLoading?: boolean;
}

export function SwapCard({ 
  onSwap, 
  loading, 
  balanceUSDC = "0.00", 
  balanceUSDT = "0.00",
  balanceETH = "0.00",
  balanceBTC = "0.00",
  hasEncryptedUSDC = false,
  hasEncryptedUSDT = false,
  hasEncryptedETH = false,
  hasEncryptedBTC = false,
  usdcPrice = 1.00,
  usdtPrice = 1.00,
  ethPrice = 3000.00,
  btcPrice = 65000.00,
  priceLoading = false
}: SwapCardProps) {
  const [fromToken, setFromToken] = useState<TokenType>('zUSDC');
  const [toToken, setToToken] = useState<TokenType>('zUSDT');
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [slippage, setSlippage] = useState(0.5);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleSwapDirection = () => {
    const tempToken = fromToken;
    const tempAmount = fromAmount;
    setFromToken(toToken);
    setToToken(tempToken);
    setFromAmount(toAmount);
  };

  const getBalance = (token: TokenType) => {
    switch(token) {
      case 'zUSDC': return balanceUSDC;
      case 'zUSDT': return balanceUSDT;
      case 'zETH': return balanceETH;
      case 'zBTC': return balanceBTC;
    }
  };

  const getPrice = (token: TokenType) => {
    switch(token) {
      case 'zUSDC': return usdcPrice;
      case 'zUSDT': return usdtPrice;
      case 'zETH': return ethPrice;
      case 'zBTC': return btcPrice;
    }
  };

  const calculateUSD = (amount: string | number, price: number): string => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numAmount) || isNaN(price) || price === 0) {
      return '--';
    }
    return (numAmount * price).toFixed(2);
  };

  useEffect(() => {
    if (fromAmount && !isNaN(parseFloat(fromAmount))) {
      const fromValue = parseFloat(fromAmount) * getPrice(fromToken);
      const toTokenPrice = getPrice(toToken);
      
      if (!toTokenPrice || toTokenPrice === 0) {
        setToAmount('');
        return;
      }
      
      const calculatedAmount = fromValue / toTokenPrice;
      setToAmount(calculatedAmount.toFixed(6));
    } else {
      setToAmount('');
    }
  }, [fromAmount, fromToken, toToken, usdcPrice, usdtPrice, ethPrice, btcPrice]);

  const exchangeRate = fromAmount && toAmount && parseFloat(fromAmount) > 0
    ? (parseFloat(toAmount) / parseFloat(fromAmount)).toFixed(6)
    : '0';

  const minReceived = toAmount && !isNaN(parseFloat(toAmount))
    ? (parseFloat(toAmount) * (1 - slippage / 100)).toFixed(6)
    : '0';

  const handleSwap = () => {
    if (!fromAmount || isNaN(parseFloat(fromAmount)) || parseFloat(fromAmount) <= 0) {
      return;
    }
    if (fromToken === 'zETH' || fromToken === 'zBTC' || toToken === 'zETH' || toToken === 'zBTC') {
      return;
    }
    if (fromToken === toToken) {
      return;
    }
    onSwap(fromToken, toToken, fromAmount);
    setFromAmount('');
    setToAmount('');
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Cosmic Gradient Background Wrapper */}
      <div className="bg-cosmic-radial rounded-2xl p-1">
        <RoughBorder className="rounded-2xl" strokeWidth={3} roughness={2}>
          <div className="glass-card rounded-2xl p-6 md:p-8 space-y-6">
            
            {/* Header with Settings */}
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl text-foreground">Swap Tokens</h2>
              <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="icon"
                    className="hover-sketch active-sketch"
                    data-testid="button-settings"
                  >
                    <Settings className="h-5 w-5" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="glass-card">
                  <DialogHeader>
                    <DialogTitle>Slippage Settings</DialogTitle>
                    <DialogDescription>
                      Adjust your slippage tolerance for this swap.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="grid grid-cols-4 gap-2">
                      {[0.1, 0.5, 1.0, 3.0].map((value) => (
                        <Button
                          key={value}
                          variant={slippage === value ? "default" : "outline"}
                          className="w-full"
                          onClick={() => setSlippage(value)}
                          data-testid={`button-slippage-${value}`}
                        >
                          {value}%
                        </Button>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        step="0.1"
                        min="0.1"
                        max="50"
                        value={slippage}
                        onChange={(e) => setSlippage(parseFloat(e.target.value) || 0.5)}
                        className="flex-1"
                        placeholder="Custom"
                        data-testid="input-custom-slippage"
                      />
                      <span className="text-sm text-muted-foreground">%</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Your transaction will revert if the price changes unfavorably by more than this percentage.
                    </p>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* From Token Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">You Pay</span>
                <div className="flex items-center gap-2 text-xs">
                  <Lock className="h-3 w-3 text-primary" />
                  <span className="text-foreground">
                    Balance: <span className="text-primary">{getBalance(fromToken)}</span>
                  </span>
                </div>
              </div>
              
              <RoughBorder className="rounded-xl" strokeWidth={2} roughness={1.2}>
                <div className="glass-panel rounded-xl p-5 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shrink-0 border-2 border-foreground/30">
                      <span className="text-xl text-white">{fromToken[1]}</span>
                    </div>
                    <div className="flex-1">
                      <Input
                        type="text"
                        inputMode="decimal"
                        placeholder="0.0"
                        value={fromAmount}
                        onChange={(e) => setFromAmount(e.target.value)}
                        className="text-3xl h-auto border-none bg-transparent p-0 focus-visible:ring-0 text-foreground placeholder:text-muted-foreground/40"
                        data-testid="input-from-amount"
                      />
                      <div className="text-xs text-muted-foreground mt-1">
                        ≈ ${calculateUSD(fromAmount || '0', getPrice(fromToken))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between gap-2">
                    <Select value={fromToken} onValueChange={(value) => setFromToken(value as TokenType)}>
                      <SelectTrigger className="w-28 rounded-full border-2 border-foreground/20" data-testid="select-from-token">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="zUSDC" data-testid="option-from-usdc">zUSDC</SelectItem>
                        <SelectItem value="zUSDT" data-testid="option-from-usdt">zUSDT</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        const balance = getBalance(fromToken);
                        const rawValue = balance.replace(/,/g, '');
                        setFromAmount(rawValue);
                      }}
                      className="rounded-full border-2 border-primary/40 text-primary hover-sketch"
                      data-testid="button-max-from"
                    >
                      MAX
                    </Button>
                  </div>
                </div>
              </RoughBorder>
            </div>

            {/* Swap Direction Button */}
            <div className="flex justify-center -my-3">
              <motion.button
                onClick={handleSwapDirection}
                className="glass-panel border-2 border-foreground/20 rounded-full p-3 hover-sketch active-sketch"
                whileTap={{ rotate: 180, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                data-testid="button-swap-direction"
              >
                <ArrowDownUp className="h-5 w-5 text-primary" />
              </motion.button>
            </div>

            {/* To Token Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">You Receive</span>
                <div className="flex items-center gap-2 text-xs">
                  <Lock className="h-3 w-3 text-secondary" />
                  <span className="text-foreground">
                    Balance: <span className="text-secondary">{getBalance(toToken)}</span>
                  </span>
                </div>
              </div>
              
              <RoughBorder className="rounded-xl" strokeWidth={2} roughness={1.2}>
                <div className="glass-panel rounded-xl p-5 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-secondary to-primary flex items-center justify-center shrink-0 border-2 border-foreground/30">
                      <span className="text-xl text-white">{toToken[1]}</span>
                    </div>
                    <div className="flex-1">
                      <Input
                        type="text"
                        inputMode="decimal"
                        placeholder="0.0"
                        value={toAmount}
                        readOnly
                        className="text-3xl h-auto border-none bg-transparent p-0 text-foreground placeholder:text-muted-foreground/40"
                        data-testid="input-to-amount"
                      />
                      <div className="text-xs text-muted-foreground mt-1">
                        ≈ ${calculateUSD(toAmount || '0', getPrice(toToken))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between gap-2">
                    <Select value={toToken} onValueChange={(value) => setToToken(value as TokenType)}>
                      <SelectTrigger className="w-28 rounded-full border-2 border-foreground/20" data-testid="select-to-token">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="zUSDC" data-testid="option-to-usdc">zUSDC</SelectItem>
                        <SelectItem value="zUSDT" data-testid="option-to-usdt">zUSDT</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </RoughBorder>
            </div>

            {/* Helper Message */}
            {(!hasEncryptedUSDC && !hasEncryptedUSDT) && (
              <RoughBorder className="rounded-xl" strokeWidth={2} roughness={1.5}>
                <div className="glass-panel bg-accent/10 rounded-xl p-4">
                  <div className="flex items-start gap-3 text-sm text-accent-foreground">
                    <Lightbulb className="h-5 w-5 mt-0.5 flex-shrink-0 text-accent" />
                    <p>
                      Your encrypted balances are empty. Deposit some tokens using the sections below to start swapping privately.
                    </p>
                  </div>
                </div>
              </RoughBorder>
            )}

            {/* Swap Details */}
            {fromAmount && toAmount && parseFloat(fromAmount) > 0 && (
              <RoughBorder className="rounded-xl" strokeWidth={2} roughness={1.5} fill={true} fillStyle="cross-hatch">
                <div className="glass-panel rounded-xl p-4 space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Estimated USD Value</span>
                    <span className="text-foreground">${calculateUSD(fromAmount, getPrice(fromToken))}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Expected Output</span>
                    <span className="text-foreground">{toAmount} {toToken}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Exchange Rate</span>
                    <span className="text-foreground">1 {fromToken} = {exchangeRate} {toToken}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Slippage Tolerance</span>
                    <span className="text-foreground">{slippage}%</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t-2 border-dashed border-foreground/20">
                    <span className="text-muted-foreground">Min. Received</span>
                    <span className="text-primary font-medium">{minReceived} {toToken}</span>
                  </div>
                </div>
              </RoughBorder>
            )}

            {/* Swap Button */}
            <Button
              onClick={handleSwap}
              disabled={loading || !fromAmount || parseFloat(fromAmount) <= 0 || fromToken === toToken}
              className="w-full h-14 text-lg bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl border-2 border-foreground/30 shadow-lg hover-sketch active-sketch"
              data-testid="button-execute-swap"
            >
              {loading ? 'Swapping...' : 'Swap Tokens'}
            </Button>

          </div>
        </RoughBorder>
      </div>
    </div>
  );
}
