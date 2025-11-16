"use client";

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Wallet, Smartphone } from 'lucide-react';
import { RoughBorder } from './RoughBorder';

interface WalletModalProps {
  open: boolean;
  onClose: () => void;
  onSelectWallet: (walletType: 'metamask' | 'walletconnect') => Promise<void>;
}

export function WalletModal({ open, onClose, onSelectWallet }: WalletModalProps) {
  const [connecting, setConnecting] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<'metamask' | 'walletconnect' | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const handleConnect = async (walletType: 'metamask' | 'walletconnect') => {
    try {
      setConnecting(true);
      setSelectedWallet(walletType);
      setConnectionError(null);
      await onSelectWallet(walletType);
      onClose();
    } catch (error) {
      console.error('Failed to connect:', error);
      setConnectionError(error instanceof Error ? error.message : 'Failed to connect wallet');
    } finally {
      setConnecting(false);
      setSelectedWallet(null);
    }
  };

  const isTelegramOrMobile = typeof window !== 'undefined' && (
    /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ||
    (window as any).Telegram?.WebApp !== undefined
  );

  const hasMetaMask = typeof window !== 'undefined' && !!(window as any).ethereum;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-background border-2 border-primary/20">
        <DialogHeader>
          <DialogTitle className="text-2xl font-['Patrick_Hand'] text-primary">
            Connect Wallet
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Choose how you want to connect
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-4">
          {connectionError && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-sm text-destructive">
              {connectionError}
            </div>
          )}

          {hasMetaMask && !isTelegramOrMobile && (
            <RoughBorder className="p-0">
              <Button
                data-testid="button-connect-metamask"
                onClick={() => handleConnect('metamask')}
                disabled={connecting}
                className="w-full h-auto py-4 px-6 bg-card hover:bg-card/80 text-foreground border-0 justify-start gap-4"
                variant="outline"
              >
                <div className="w-12 h-12 rounded-lg bg-orange-500/10 flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-orange-500" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-semibold text-lg font-['Patrick_Hand']">MetaMask</div>
                  <div className="text-sm text-muted-foreground">Browser extension</div>
                </div>
                {connecting && selectedWallet === 'metamask' && (
                  <div className="ml-auto">Connecting...</div>
                )}
              </Button>
            </RoughBorder>
          )}

          <RoughBorder className="p-0">
            <Button
              data-testid="button-connect-walletconnect"
              onClick={() => handleConnect('walletconnect')}
              disabled={connecting}
              className="w-full h-auto py-4 px-6 bg-card hover:bg-card/80 text-foreground border-0 justify-start gap-4"
              variant="outline"
            >
              <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Smartphone className="w-6 h-6 text-blue-500" />
              </div>
              <div className="flex-1 text-left">
                <div className="font-semibold text-lg font-['Patrick_Hand']">WalletConnect</div>
                <div className="text-sm text-muted-foreground">
                  {isTelegramOrMobile ? 'Mobile wallets' : 'Mobile & other wallets'}
                </div>
              </div>
              {connecting && selectedWallet === 'walletconnect' && (
                <div className="ml-auto">Connecting...</div>
              )}
            </Button>
          </RoughBorder>

          {isTelegramOrMobile && (
            <p className="text-xs text-center text-muted-foreground mt-4">
              Recommended for Telegram Mini App
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
