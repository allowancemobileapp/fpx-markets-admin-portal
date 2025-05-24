
// src/services/exchangeRateService.ts
'use server';

import type { CurrencyCode } from '@/lib/types';

// Mock exchange rates to USDT
const mockRates: Record<Exclude<CurrencyCode, 'USDT'>, number> = {
  USD: 1.00,    // Assuming USD is 1:1 with USDT for simplicity in this context
  BTC: 60000.00,
  ETH: 3500.00,
  SOL: 150.00,
  TRX: 0.12,
};

/**
 * Mock function to get the exchange rate of a given asset to USDT.
 * In a real application, this would call an external exchange rate API.
 * @param assetCode The currency code of the asset (e.g., BTC, ETH).
 * @returns The exchange rate to USDT.
 * @throws Error if the asset code is USDT (as it's the target) or if the rate is not found.
 */
export async function getExchangeRate(assetCode: CurrencyCode): Promise<number> {
  if (assetCode === 'USDT') {
    // If the original asset is USDT, the rate is 1 (it's the same currency)
    return 1.00;
  }
  const rate = mockRates[assetCode as Exclude<CurrencyCode, 'USDT'>];
  if (rate === undefined) {
    console.error(`ExchangeRateService: Mock rate for ${assetCode} not found.`);
    throw new Error(`Exchange rate for ${assetCode} to USDT is not available.`);
  }
  console.log(`ExchangeRateService: Mock rate for ${assetCode} to USDT is ${rate}`);
  return rate;
}
