/**
 * Telegram Mini App Wallet Compatibility Fix
 * 
 * This fixes WalletConnect in Telegram's in-app browser by converting
 * deep links (metamask://, wc://) to HTTPS links that Telegram can handle.
 */

export const initTelegramWalletFix = () => {
  if (typeof window === 'undefined') return;

  // Check if running in Telegram environment
  const isTelegram = 
    (window as any).Telegram?.WebApp !== undefined ||
    'TelegramWebviewProxy' in window;

  if (!isTelegram) {
    console.log('[Telegram] Not in Telegram environment, skipping wallet fix');
    return;
  }

  console.log('[Telegram] Detected Telegram environment');

  // Helper function to open links using Telegram's method
  const openTelegramLink = (url: string) => {
    const telegram = (window as any).Telegram?.WebApp;
    if (telegram?.openLink) {
      console.log(`[Telegram] Opening via Telegram.WebApp.openLink: ${url}`);
      telegram.openLink(url);
    } else {
      console.log(`[Telegram] Fallback to window.location: ${url}`);
      window.location.href = url;
    }
  };

  // Override window.open to handle wallet deep links
  const originalOpen = window.open;
  
  window.open = function(url: any, target?: string, features?: string): Window | null {
    if (!url) {
      console.log('[Telegram] window.open called with no URL, using original');
      return originalOpen.call(window, url, target, features);
    }

    // Convert URL to string
    let urlString = typeof url === 'string' ? url : url.toString();
    
    console.log(`[Telegram] Intercepted window.open: ${urlString}`);

    // Convert MetaMask deep link to universal link
    if (urlString.startsWith('metamask://')) {
      urlString = urlString.replace('metamask://', 'https://metamask.app.link/');
      console.log(`[Telegram] Converted MetaMask link to: ${urlString}`);
      openTelegramLink(urlString);
      return null;
    }

    // Handle WalletConnect deep links
    if (urlString.startsWith('wc://')) {
      // Extract the URI part after wc://
      const wcUri = urlString.substring(5);
      urlString = `https://metamask.app.link/wc?uri=${encodeURIComponent('wc://' + wcUri)}`;
      console.log(`[Telegram] Converted WalletConnect link to: ${urlString}`);
      openTelegramLink(urlString);
      return null;
    }

    // Handle other wallet deep links (trust://, rainbow://, etc.)
    if (urlString.includes('://') && !urlString.startsWith('http')) {
      console.log(`[Telegram] Opening wallet deep link via Telegram: ${urlString}`);
      openTelegramLink(urlString);
      return null;
    }

    // Use Telegram's openLink for HTTP(S) URLs if available
    if (urlString.startsWith('http')) {
      console.log(`[Telegram] Opening HTTP(S) link via Telegram: ${urlString}`);
      openTelegramLink(urlString);
      return null;
    }

    // Fallback to original window.open for other cases
    console.log(`[Telegram] Using original window.open for: ${urlString}`);
    return originalOpen.call(window, url, target, features);
  };

  console.log('[Telegram] ✅ Wallet compatibility fix initialized successfully');
};
