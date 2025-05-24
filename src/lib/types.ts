
export type CurrencyCode = 'USD' | 'BTC' | 'ETH' | 'USDT' | 'SOL' | 'TRX';
export type TransactionType = 'DEPOSIT' | 'WITHDRAWAL' | 'FEE' | 'ADJUSTMENT' | 'TRADE_SETTLEMENT';
export type TransactionStatus = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
export type RiskScore = 'LOW' | 'MEDIUM' | 'HIGH';
export type CopyStatus = 'ACTIVE' | 'PAUSED' | 'STOPPED' | 'PENDING_ACTIVATION';
export type TradeDirection = 'BUY' | 'SELL';
export type TradeOrderType = 'MARKET' | 'LIMIT' | 'STOP' | 'STOP_LIMIT';
export type TradeStatus = 'OPEN' | 'CLOSED' | 'CANCELLED' | 'PENDING_OPEN';
// KYCStatus removed


export interface TradingPlan {
  id: number;
  name: string;
  minimum_deposit_usd: number;
  description?: string | null;
  commission_details?: any | null; // JSONB
  leverage_info?: any | null; // JSONB
  max_open_trades?: number | null;
  allow_copy_trading: boolean;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string; // UUID
  firebase_auth_uid: string;
  username: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  phone_number?: string | null;
  country_code?: string | null; // CHAR(2)
  trading_plan_id: number;
  trading_pin_hash?: string | null;
  profile_completed_at?: string | null; // TIMESTAMPTZ
  pin_setup_completed_at?: string | null; // TIMESTAMPTZ
  // kyc_status: KycStatus; // Removed
  is_active: boolean;
  is_email_verified: boolean;
  created_at: string; // TIMESTAMPTZ
  updated_at: string; // TIMESTAMPTZ
}

export interface Wallet {
  id: string; // UUID
  user_id: string; // UUID
  currency: CurrencyCode;
  balance: number;
  pending_deposit_balance: number;
  pending_withdrawal_balance: number;
  is_active: boolean;
  wallet_address?: string | null;
  memo_or_tag?: string | null;
  created_at: string; // TIMESTAMPTZ
  updated_at: string; // TIMESTAMPTZ
}

export interface Transaction {
  id: string; // UUID
  user_id: string; // UUID
  wallet_id: string; // UUID
  transaction_type: TransactionType;
  asset_code: CurrencyCode;
  amount_asset: number;
  amount_usd_equivalent: number; // For ADJUSTMENT, this will be the same as amount_asset if currency is USD.
  status: TransactionStatus;
  external_transaction_id?: string | null;
  deposit_address?: string | null;
  withdrawal_address?: string | null;
  network_fee_asset?: number | null;
  processing_fee_asset?: number | null;
  notes?: string | null; // Admin notes or system notes
  user_remarks?: string | null;
  admin_processed_by?: string | null; // UUID of admin or system identifier
  created_at: string; // TIMESTAMPTZ
  updated_at: string; // TIMESTAMPTZ
  processed_at?: string | null; // TIMESTAMPTZ
  expires_at?: string | null; // TIMESTAMPTZ
  user_email?: string; // For display purposes and notifications
  username?: string; // For display purposes
}

export interface Instrument {
  id: string; // UUID
  symbol: string;
  description?: string | null;
  asset_class: string;
  base_currency?: CurrencyCode | null;
  quote_currency?: CurrencyCode | null;
  tick_size: number;
  lot_size: number;
  min_order_quantity: number;
  max_order_quantity: number;
  is_tradable: boolean;
  market_hours?: any | null; // JSONB
  created_at: string; // TIMESTAMPTZ
  updated_at: string; // TIMESTAMPTZ
}

// Add other types as needed: StrategyProvider, CopyTradingSubscription, Trade, etc.
// For now, these cover the main requested features.

export interface Metric {
  title: string;
  value: string | number;
  change?: string;
  icon?: React.ElementType;
}
