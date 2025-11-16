"use client";

import { useUnifiedWalletSigner } from '../core/wallet/useUnifiedWalletSigner';
import { useTelegram } from '../core/useTelegram';
import { useState, useEffect } from 'react';
import { Wallet, User, Crown, Shield } from 'lucide-react';
import { RoughBorder } from './RoughBorder';
import { Button } from './ui/button';

export function NavBar() {
  const { ethersSigner: signer, isConnected, connect } = useUnifiedWalletSigner();
  const { user: telegramUser, isTelegramEnv } = useTelegram();
  const [walletAddress, setWalletAddress] = useState<string>('');

  useEffect(() => {
    if (signer) {
      signer.getAddress().then(setWalletAddress).catch(console.error);
    } else {
      setWalletAddress('');
    }
  }, [signer]);

  return (
    <RoughBorder className="rounded-2xl mb-6" strokeWidth={2} roughness={1.5}>
      <div className="glass-panel rounded-2xl p-4 md:p-5">
        <div className="flex items-center justify-between w-full flex-wrap gap-3">
          {/* Logo and Brand - Cosmic Sketch Style */}
          <div className="flex items-center gap-3">
            <RoughBorder className="rounded-xl" strokeWidth={2} roughness={1.3}>
              <div className="w-12 h-12 flex items-center justify-center bg-gradient-to-br from-primary to-secondary rounded-xl">
                <Shield className="w-6 h-6 text-white" strokeWidth={2.5} />
              </div>
            </RoughBorder>
            
            <div className="flex flex-col">
              <span className="text-xl md:text-2xl text-primary" data-testid="text-brand">
                zSwap
              </span>
              <span className="hidden sm:block text-xs text-muted-foreground">Encrypted Private Swaps</span>
            </div>
          </div>
          
          {/* Right side - Info pills with hand-drawn borders */}
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {/* Telegram User Info */}
            {isTelegramEnv && telegramUser && (
              <RoughBorder className="rounded-full" strokeWidth={2} roughness={1.2}>
                <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-full" data-testid="telegram-user-info">
                  <User className="h-4 w-4 text-primary" />
                  <span className="text-sm text-foreground" data-testid="text-telegram-username">
                    {telegramUser.username || telegramUser.first_name}
                  </span>
                  {telegramUser.is_premium && (
                    <Crown className="h-4 w-4 text-accent" />
                  )}
                </div>
              </RoughBorder>
            )}
            
            {/* Wallet Connection */}
            {isConnected && walletAddress ? (
              <RoughBorder className="rounded-full" strokeWidth={2} roughness={1.2}>
                <div className="flex items-center gap-2 px-3 py-2 glass-panel rounded-full" data-testid="wallet-info">
                  <Wallet className="h-4 w-4 text-secondary" />
                  <span className="text-sm font-mono text-foreground" data-testid="text-wallet-address">
                    <span className="hidden sm:inline">{walletAddress.substring(0, 6)}...{walletAddress.substring(38)}</span>
                    <span className="sm:hidden">{walletAddress.substring(0, 4)}...{walletAddress.substring(40)}</span>
                  </span>
                </div>
              </RoughBorder>
            ) : (
              <RoughBorder className="rounded-full" strokeWidth={2} roughness={1.2}>
                <Button
                  onClick={connect}
                  variant="default"
                  size="sm"
                  className="rounded-full"
                  data-testid="button-connect-wallet"
                >
                  <Wallet className="h-4 w-4 mr-2" />
                  Connect Wallet
                </Button>
              </RoughBorder>
            )}
            
            {/* Network Indicator - Cosmic Theme */}
            <RoughBorder className="rounded-full" strokeWidth={2} roughness={1.2}>
              <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-full" data-testid="network-indicator">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                <span className="text-sm text-primary" data-testid="text-network">Sepolia</span>
              </div>
            </RoughBorder>
          </div>
        </div>
      </div>
    </RoughBorder>
  );
}
