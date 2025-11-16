import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Simple in-memory cache
let priceCache: { data: any; timestamp: number } | null = null;
const CACHE_TTL = 30000; // 30 seconds

async function fetchPriceWithRetry(maxRetries = 3): Promise<any> {
  const symbols = ['USDC', 'USDT', 'ETH', 'BTC'].join(',');
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(
        `https://api.redstone.finance/prices?symbols=${symbols}&provider=redstone-primary-prod`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
          signal: AbortSignal.timeout(8000), // 8 second timeout
        }
      );

      if (!response.ok) {
        // Don't retry on 4xx errors
        if (response.status >= 400 && response.status < 500) {
          throw new Error(`HTTP ${response.status}: Client error`);
        }
        throw new Error(`HTTP ${response.status}: Server error`);
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      const isLastAttempt = attempt === maxRetries - 1;
      
      // If it's a timeout or 5xx error and not the last attempt, retry
      if (!isLastAttempt && (error.name === 'TimeoutError' || error.message.includes('Server error'))) {
        const backoffDelay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
        continue;
      }
      
      throw error;
    }
  }
  
  throw new Error('Max retries reached');
}

export async function GET() {
  try {
    // Check cache first
    const now = Date.now();
    if (priceCache && (now - priceCache.timestamp) < CACHE_TTL) {
      return NextResponse.json(priceCache.data, {
        headers: {
          'X-Cache': 'HIT',
          'Cache-Control': 'public, max-age=30',
        },
      });
    }

    // Fetch with retry logic
    const data = await fetchPriceWithRetry(3);

    // Update cache
    priceCache = { data, timestamp: now };

    return NextResponse.json(data, {
      headers: {
        'X-Cache': 'MISS',
        'Cache-Control': 'public, max-age=30',
      },
    });
  } catch (error: any) {
    console.error('Oracle price fetch error:', error.message);
    
    // Return cached data if available, even if stale
    if (priceCache) {
      console.log('Returning stale cached data due to error');
      return NextResponse.json(priceCache.data, {
        headers: {
          'X-Cache': 'STALE',
          'Warning': '110 - "Response is stale"',
        },
      });
    }

    return NextResponse.json(
      { error: error.message || 'Failed to fetch oracle prices' },
      { status: 500 }
    );
  }
}
