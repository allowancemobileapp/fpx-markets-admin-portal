
export type CurrencyCode = 'USD' | 'BTC' | 'ETH' | 'USDT' | 'SOL' | 'TRX';
// TransactionType 'DEPOSIT', 'WITHDRAWAL', 'FEE', 'TRADE_SETTLEMENT' are less relevant if only ADJUSTMENT is created by admin portal.
// Kept for now as 'ADJUSTMENT' is a TransactionType.
export type TransactionType = 'DEPOSIT' | 'WITHDRAWAL' | 'FEE' | 'ADJUSTMENT' | 'TRADE_SETTLEMENT';
// TransactionStatus 'PENDING', 'CONFIRMED', 'PROCESSING', 'FAILED', 'CANCELLED' are less relevant if not processed by admin.
// Kept for now as 'ADJUSTMENT' transactions are 'COMPLETED'.
export type TransactionStatus = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

// RiskScore, CopyStatus, TradeDirection, TradeOrderType, TradeStatus are not used in the simplified version.
// They can be removed if no other part of a larger (hypothetical) system uses them.
// For now, keeping them doesn't break anything.
export type RiskScore = 'LOW' | 'MEDIUM' | 'HIGH';
export type CopyStatus = 'ACTIVE' | 'PAUSED' | 'STOPPED' | 'PENDING_ACTIVATION';
export type TradeDirection = 'BUY' | 'SELL';
export type TradeOrderType = 'MARKET' | 'LIMIT' | 'STOP' | 'STOP_LIMIT';
export type TradeStatus = 'OPEN' | 'CLOSED' | 'CANCELLED' | 'PENDING_OPEN';


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

// Simplified Transaction type might be possible, but for now, keeping fields
// as ADJUSTMENT transactions still use many of them.
export interface Transaction {
  id: string; // UUID
  user_id: string; // UUID
  wallet_id: string; // UUID
  transaction_type: TransactionType;
  asset_code: CurrencyCode;
  amount_asset: number;
  amount_usd_equivalent: number;
  status: TransactionStatus;
  external_transaction_id?: string | null;
  deposit_address?: string | null;
  withdrawal_address?: string | null;
  network_fee_asset?: number | null;
  processing_fee_asset?: number | null;
  notes?: string | null;
  user_remarks?: string | null;
  admin_processed_by?: string | null;
  created_at: string;
  updated_at: string;
  processed_at?: string | null;
  expires_at?: string | null;
  user_email?: string; 
  username?: string; 
}

// Instrument type removed as the section is deleted.

export interface Metric {
  title: string;
  value: string | number;
  change?: string;
  icon?: React.ElementType;
}
