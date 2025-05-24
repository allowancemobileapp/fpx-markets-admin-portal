

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
  // trading_pin_hash removed as KYC/direct pin management isn't in scope for admin app now
  profile_completed_at?: string | null; // TIMESTAMPTZ
  pin_setup_completed_at?: string | null; // TIMESTAMPTZ - this might be for user's own trading pin
  is_active: boolean;
  is_email_verified: boolean;
  created_at: string; // TIMESTAMPTZ
  updated_at: string; // TIMESTAMPTZ
}

// Simplified Wallet: Each user has one main wallet, assumed to be USDT denominated.
export interface Wallet {
  id: string; // UUID
  user_id: string; // UUID
  currency: 'USDT'; // Fixed to USDT for the main account balance
  balance: number;
  is_active: boolean; // Should always be true for the single main wallet
  created_at: string; // TIMESTAMPTZ
  updated_at: string; // TIMESTAMPTZ
}


export interface Transaction {
  id: string; // UUID
  user_id: string; // UUID
  wallet_id: string; // UUID (references the user's single USDT wallet)
  transaction_type: TransactionType; // Will be 'ADJUSTMENT' for admin actions
  
  // Details of the original external transaction
  asset_code: CurrencyCode;         // The original asset (e.g., BTC, ETH, USD)
  amount_asset: number;             // The amount of the original asset
  
  // Value of the adjustment in the main wallet's currency (USDT)
  amount_usd_equivalent: number;    // The value by which the USDT wallet balance changed (can be +/-)
  
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

// Helper type for the simplified balance adjustment form
export type BalanceAdjustmentFormData = {
  originalAssetCode: CurrencyCode;
  originalAssetAmount: number;
  // adjustmentAmountForWallet is now calculated, so removed from form data
  adminNotes: string;
};

// Type for data passed to the server action
export interface AdjustBalanceServerActionData extends BalanceAdjustmentFormData {
  userId: string;
  // adminPin: string; // We'll handle PIN on client for now, or pass it if server validation is desired later
}

