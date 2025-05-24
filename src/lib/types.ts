
export type CurrencyCode = 'USD' | 'BTC' | 'ETH' | 'USDT' | 'SOL' | 'TRX';
// TransactionType 'ADJUSTMENT' is the primary type created by admin portal now.
export type TransactionType = 'DEPOSIT' | 'WITHDRAWAL' | 'FEE' | 'ADJUSTMENT' | 'TRADE_SETTLEMENT';
// TransactionStatus 'COMPLETED' will be used for 'ADJUSTMENT'.
export type TransactionStatus = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

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
  currency: 'USDT'; // Single wallet currency, e.g., USDT
  balance: number;
  // pending_deposit_balance and pending_withdrawal_balance removed
  is_active: boolean; // Kept for consistency, though likely always true for single wallet
  wallet_address?: string | null; // Potentially for the platform's master USDT deposit address if needed
  memo_or_tag?: string | null;
  created_at: string; // TIMESTAMPTZ
  updated_at: string; // TIMESTAMPTZ
}

export interface Transaction {
  id: string; // UUID
  user_id: string; // UUID
  wallet_id: string; // UUID (references the user's single wallet)
  transaction_type: TransactionType; // Will be 'ADJUSTMENT' for admin actions
  asset_code: CurrencyCode; // The original asset of the external transaction (e.g., BTC, USD)
  amount_asset: number; // The amount of the original asset
  amount_usd_equivalent: number; // The value by which the USDT wallet balance changed
  status: TransactionStatus; // Will be 'COMPLETED' for adjustments
  external_transaction_id?: string | null; // Admin can add this if relevant
  notes?: string | null; // Admin notes for the adjustment
  admin_processed_by?: string | null;
  created_at: string;
  updated_at: string;
  processed_at?: string | null; // Timestamp of when adjustment was made
  user_email?: string; // For display in transaction list
  username?: string;  // For display in transaction list
}

export interface Metric {
  title: string;
  value: string | number;
  change?: string;
  icon?: React.ElementType;
}

// Helper type for the balance adjustment form
export type BalanceAdjustmentFormData = {
  originalAssetCode: CurrencyCode;
  originalAssetAmount: number;
  adjustmentAmountForWallet: number; // This is the +/- value for the main USDT wallet
  adminNotes: string;
};
