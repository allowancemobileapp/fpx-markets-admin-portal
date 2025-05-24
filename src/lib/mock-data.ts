import type { User, Transaction, Instrument, TradingPlan, Wallet, TransactionStatus, CurrencyCode, TransactionType } from './types';

export const mockTradingPlans: TradingPlan[] = [
  { id: 1, name: 'Beginner', minimum_deposit_usd: 500, description: 'Ideal for new traders.', allow_copy_trading: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), commission_details: {"forex_pip_spread": 1.5, "crypto_percent": 0.1}, leverage_info: {"max_leverage": "1:30"} },
  { id: 2, name: 'Personal', minimum_deposit_usd: 2000, description: 'For experienced individuals.', allow_copy_trading: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), commission_details: {"forex_pip_spread": 1.0, "crypto_percent": 0.07}, leverage_info: {"max_leverage": "1:100"} },
  { id: 3, name: 'Pro', minimum_deposit_usd: 10000, description: 'Advanced features for pros.', allow_copy_trading: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), commission_details: {"forex_pip_spread": 0.5, "crypto_percent": 0.05}, leverage_info: {"max_leverage": "1:200"} },
];

export const mockUsers: User[] = [
  {
    id: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
    firebase_auth_uid: 'firebaseUser1',
    username: 'john.doe',
    email: 'john.doe@example.com',
    first_name: 'John',
    last_name: 'Doe',
    trading_plan_id: 1,
    // kyc_status: 'VERIFIED', // Removed
    is_active: true,
    is_email_verified: true,
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    country_code: 'US',
    phone_number: '123-456-7890',
  },
  {
    id: 'b2c3d4e5-f6a7-8901-2345-678901bcdef0',
    firebase_auth_uid: 'firebaseUser2',
    username: 'jane.smith',
    email: 'jane.smith@example.com',
    first_name: 'Jane',
    last_name: 'Smith',
    trading_plan_id: 2,
    // kyc_status: 'PENDING_REVIEW', // Removed
    is_active: true,
    is_email_verified: true,
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    country_code: 'CA',
  },
  {
    id: 'c3d4e5f6-a7b8-9012-3456-789012cdef01',
    firebase_auth_uid: 'firebaseUser3',
    username: 'alice.wonderland',
    email: 'alice.wonderland@example.com',
    first_name: 'Alice',
    last_name: 'Wonderland',
    trading_plan_id: 3,
    // kyc_status: 'NOT_SUBMITTED', // Removed
    is_active: false,
    is_email_verified: false,
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    country_code: 'GB',
  },
];

export const mockWallets: Wallet[] = [
    { id: 'w1', user_id: mockUsers[0].id, currency: 'USD' as CurrencyCode, balance: 1500.00, pending_deposit_balance: 0, pending_withdrawal_balance: 0, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString()},
    { id: 'w2', user_id: mockUsers[0].id, currency: 'BTC' as CurrencyCode, balance: 0.5, pending_deposit_balance: 0, pending_withdrawal_balance: 0, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString()},
    { id: 'w3', user_id: mockUsers[1].id, currency: 'USD' as CurrencyCode, balance: 5000.00, pending_deposit_balance: 1000, pending_withdrawal_balance: 0, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString()},
];


export const mockTransactions: Transaction[] = [
  {
    id: 't1a2b3c4-d5e6-f789-0123-456789abcdef',
    user_id: mockUsers[0].id,
    username: mockUsers[0].username,
    user_email: mockUsers[0].email,
    wallet_id: 'w1',
    transaction_type: 'DEPOSIT' as TransactionType,
    asset_code: 'USD' as CurrencyCode,
    amount_asset: 1000,
    amount_usd_equivalent: 1000,
    status: 'COMPLETED' as TransactionStatus,
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    processed_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    external_transaction_id: 'ext_deposit_001',
  },
  {
    id: 't2b3c4d5-e6f7-a890-1234-567890bcdef0',
    user_id: mockUsers[1].id,
    username: mockUsers[1].username,
    user_email: mockUsers[1].email,
    wallet_id: 'w3',
    transaction_type: 'DEPOSIT' as TransactionType,
    asset_code: 'USD' as CurrencyCode,
    amount_asset: 500,
    amount_usd_equivalent: 500,
    status: 'PENDING' as TransactionStatus,
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    external_transaction_id: 'ext_deposit_002',
  },
  {
    id: 't3c4d5e6-f7a8-b901-2345-678901cdef01',
    user_id: mockUsers[0].id,
    username: mockUsers[0].username,
    user_email: mockUsers[0].email,
    wallet_id: 'w1',
    transaction_type: 'WITHDRAWAL' as TransactionType,
    asset_code: 'USD' as CurrencyCode,
    amount_asset: 200,
    amount_usd_equivalent: 200,
    status: 'PENDING' as TransactionStatus,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    withdrawal_address: '0x123WithdrawalAddress',
  },
];

export const mockInstruments: Instrument[] = [
  {
    id: 'i1a2b3c4',
    symbol: 'BTC/USD',
    description: 'Bitcoin vs US Dollar',
    asset_class: 'CRYPTO',
    base_currency: 'BTC' as CurrencyCode,
    quote_currency: 'USD' as CurrencyCode,
    tick_size: 0.01,
    lot_size: 0.00001,
    min_order_quantity: 0.0001,
    max_order_quantity: 100,
    is_tradable: true,
    market_hours: JSON.stringify({ "0": "24/7" }),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'i2b3c4d5',
    symbol: 'ETH/USD',
    description: 'Ethereum vs US Dollar',
    asset_class: 'CRYPTO',
    base_currency: 'ETH' as CurrencyCode,
    quote_currency: 'USD' as CurrencyCode,
    tick_size: 0.01,
    lot_size: 0.0001,
    min_order_quantity: 0.001,
    max_order_quantity: 1000,
    is_tradable: true,
    market_hours: JSON.stringify({ "0": "24/7" }),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'i3c4d5e6',
    symbol: 'AAPL',
    description: 'Apple Inc. Stock',
    asset_class: 'STOCK',
    quote_currency: 'USD' as CurrencyCode,
    tick_size: 0.01,
    lot_size: 1,
    min_order_quantity: 1,
    max_order_quantity: 10000,
    is_tradable: true,
    market_hours: JSON.stringify({ "1": "09:30-16:00 ET" }), // Example market hours
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// You can expand this with mock data for other tables if needed.
