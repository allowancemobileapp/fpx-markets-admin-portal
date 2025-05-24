import type { User, Transaction, TradingPlan, Wallet, TransactionStatus, CurrencyCode, TransactionType } from './types';

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
    is_active: false,
    is_email_verified: false,
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    country_code: 'GB',
  },
];

// Each user now has a single USDT wallet.
export let mockWallets: Wallet[] = [ 
    { 
      id: 'w1-usd', 
      user_id: mockUsers[0].id, 
      currency: 'USDT', 
      balance: 1500.00, 
      is_active: true, 
      created_at: new Date().toISOString(), 
      updated_at: new Date().toISOString()
    },
    { 
      id: 'w2-usd', 
      user_id: mockUsers[1].id, 
      currency: 'USDT', 
      balance: 5000.00, 
      is_active: true, 
      created_at: new Date().toISOString(), 
      updated_at: new Date().toISOString()
    },
    {
      id: 'w3-usd',
      user_id: mockUsers[2].id,
      currency: 'USDT',
      balance: 200.00,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
];

// mockTransactions will now primarily store 'ADJUSTMENT' transactions created by admins.
export let mockTransactions: Transaction[] = [
  {
    id: 'adj1',
    user_id: mockUsers[0].id,
    username: mockUsers[0].username,
    user_email: mockUsers[0].email,
    wallet_id: 'w1-usd', // references user's single wallet
    transaction_type: 'ADJUSTMENT' as TransactionType,
    asset_code: 'BTC' as CurrencyCode, // Original asset deposited
    amount_asset: 0.05, // Amount of BTC
    amount_usd_equivalent: 2500, // USDT value added to wallet
    status: 'COMPLETED' as TransactionStatus,
    notes: "Admin confirmed BTC deposit ref #xyz123",
    admin_processed_by: "SYSTEM_ADMIN",
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    processed_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export const mockInstruments: any[] = []; // Empty array
