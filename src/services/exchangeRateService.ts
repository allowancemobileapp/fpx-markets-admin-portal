
// src/services/exchangeRateService.ts
'use server';

import type { CurrencyCode } from '@/lib/types';

// MOCK EXCHANGE RATES to USDT. Used as a fallback.
const mockRates: Record<Exclude<CurrencyCode, 'USDT'>, number> = {
  USD: 1.00,
  BTC: 60000.00, 
  ETH: 3500.00,
  SOL: 150.00,   // Mock rate for SOL, verify API coverage
  TRX: 0.12,     // Mock rate for TRX, verify API coverage
};

/**
 * Gets the exchange rate of a given asset to USDT.
 * Attempts to use ExchangeRate-API if API key is provided, otherwise falls back to mock rates.
 * @param assetCode The currency code of the asset (e.g., BTC, ETH, USD).
 * @returns The exchange rate to USDT.
 * @throws Error if the asset code is not supported by the API (and not in mocks) or if API request fails badly.
 */
export async function getExchangeRate(assetCode: CurrencyCode): Promise<number> {
  console.log(`ExchangeRateService: Requesting rate for ${assetCode} to USDT.`);
  
  if (assetCode === 'USDT') {
    console.log(`ExchangeRateService: Rate for USDT to USDT is 1.00.`);
    return 1.00;
  }

  const apiKey = process.env.EXCHANGE_RATE_API_KEY;

  if (apiKey) {
    try {
      const apiUrl = `https://v6.exchangerate-api.com/v6/${apiKey}/pair/${assetCode}/USDT`;
      console.log(`ExchangeRateService: Attempting to fetch live rate from: ${apiUrl.replace(apiKey, 'YOUR_API_KEY')}`); // Log URL without exposing key directly
      
      const response = await fetch(apiUrl, { cache: 'no-store' }); // Add cache: 'no-store' for dynamic rates

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`ExchangeRateService: API error - Status ${response.status}: ${response.statusText}. Body: ${errorBody}`);
        // Check for specific API error messages if needed, e.g., "unsupported-code"
        if (response.status === 404 || errorBody.includes("unsupported-code") || errorBody.includes("invalid-key")) {
             console.warn(`ExchangeRateService: API reported ${assetCode} as unsupported or key invalid. Falling back to MOCK rate for ${assetCode}.`);
             return getMockRate(assetCode);
        }
        throw new Error(`API error fetching rate for ${assetCode}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.result === 'success' && data.conversion_rate) {
        const rate = parseFloat(data.conversion_rate);
        console.log(`ExchangeRateService: Live rate for ${assetCode} to USDT is ${rate}.`);
        return rate;
      } else {
        console.error(`ExchangeRateService: API call successful but rate not found in response for ${assetCode}. Response:`, data);
        console.warn(`ExchangeRateService: Falling back to MOCK rate for ${assetCode}.`);
        return getMockRate(assetCode);
      }
    } catch (apiError: any) {
      console.error(`ExchangeRateService: Error fetching live rate for ${assetCode}: ${apiError.message}. Falling back to MOCK rate.`);
      return getMockRate(assetCode);
    }
  } else {
    console.warn("ExchangeRateService: EXCHANGE_RATE_API_KEY not set. Using MOCK rates.");
    return getMockRate(assetCode);
  }
}

function getMockRate(assetCode: CurrencyCode): number {
  if (assetCode === 'USDT') return 1.00; // Should be handled before calling this
  const rate = mockRates[assetCode as Exclude<CurrencyCode, 'USDT'>];
  if (rate === undefined) {
    console.error(`ExchangeRateService: Mock rate for ${assetCode} not found.`);
    throw new Error(`Exchange rate for ${assetCode} to USDT is not available (mock or API).`);
  }
  console.log(`ExchangeRateService: Using mock rate for ${assetCode} to USDT: ${rate}.`);
  return rate;
}
