import { useState, useEffect } from 'react';

interface PriceData {
  usdcPrice: number;
  usdtPrice: number;
  ethPrice: number;
  btcPrice: number;
  loading: boolean;
  error: string | null;
  lastUpdated: number | null;
}

/**
 * Hook to fetch real-time token prices using Redstone Oracle
 * Fetches USDC, USDT, ETH, and BTC prices from Redstone's public API
 * Refreshes every 5 seconds by default
 */
export function useOraclePrices(autoRefresh = true, refreshInterval = 5000) {
  const [priceData, setPriceData] = useState<PriceData>({
    usdcPrice: 1.00,
    usdtPrice: 1.00,
    ethPrice: 3000.00,
    btcPrice: 65000.00,
    loading: false,
    error: null,
    lastUpdated: null,
  });

  const fetchPrices = async () => {
    try {
      setPriceData(prev => ({ ...prev, loading: true, error: null }));

      // Use our server-side API proxy to avoid CORS issues
      const response = await fetch('/api/oracle-prices', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch prices from oracle`);
      }

      const data = await response.json();

      // Parse the response - Redstone returns an object with symbols as keys
      // Format: { ETH: { symbol, value, timestamp }, BTC: { ... }, ... }
      const usdcPrice = data.USDC?.value ? parseFloat(data.USDC.value) : 1.00;
      const usdtPrice = data.USDT?.value ? parseFloat(data.USDT.value) : 1.00;
      const ethPrice = data.ETH?.value ? parseFloat(data.ETH.value) : 3000.00;
      const btcPrice = data.BTC?.value ? parseFloat(data.BTC.value) : 65000.00;

      setPriceData({
        usdcPrice,
        usdtPrice,
        ethPrice,
        btcPrice,
        loading: false,
        error: null,
        lastUpdated: Date.now(),
      });
    } catch (error: any) {
      console.error('Error fetching oracle prices:', error);
      setPriceData(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to fetch prices',
        // Keep previous prices on error
      }));
    }
  };

  useEffect(() => {
    // Fetch immediately on mount
    fetchPrices();

    if (autoRefresh) {
      // Set up interval for auto-refresh
      const interval = setInterval(fetchPrices, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  return {
    ...priceData,
    refetch: fetchPrices,
  };
}
