
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
  profile_completed_at?: string | null; // TIMESTAMPTZ
  pin_setup_completed_at?: string | null; // TIMESTAMPTZ
  is_active: boolean;
  is_email_verified: boolean;
  created_at: string; // TIMESTAMPTZ
  updated_at: string; // TIMESTAMPTZ
}

// Simplified Wallet: Each user has one main wallet, assumed to be USDT denominated.
// It now also includes a profit_loss_balance.
export interface Wallet {
  id: string; // UUID
  user_id: string; // UUID
  currency: 'USDT'; // Fixed to USDT for the main account balance
  balance: number;
  profit_loss_balance: number; // New field for P&L
  is_active: boolean; // Should always be true for the single main wallet
  created_at: string; // TIMESTAMPTZ
  updated_at: string; // TIMESTAMPTZ
}


export interface Transaction {
  id: string; // UUID
  user_id: string; // UUID
  wallet_id: string; // UUID (references the user's single USDT wallet)
  transaction_type: TransactionType; // Will be 'ADJUSTMENT' for admin actions
  
  // Details of the original external transaction OR the direct adjustment
  asset_code: CurrencyCode;         // The original asset (e.g., BTC, ETH, USD) or USDT for P&L
  amount_asset: number;             // The amount of the original asset or P&L adjustment
  
  // Value of the adjustment in the main wallet's currency (USDT)
  amount_usd_equivalent: number;    // The value by which the USDT wallet balance changed (can be +/-)
  
  balance_after_transaction?: number; // User's main wallet balance after this transaction

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

// For the main balance adjustment (external asset conversion)
export type BalanceAdjustmentFormData = {
  originalAssetCode: CurrencyCode;
  originalAssetAmount: number;
  // adjustmentAmountForWallet: number; // This is now calculated
  adminNotes: string;
};

export interface AdjustBalanceServerActionData extends Omit<BalanceAdjustmentFormData, 'adjustmentAmountForWallet'> {
  userId: string;
  // originalAssetCode, originalAssetAmount, adminNotes are inherited
}

// For Profit & Loss balance adjustment (direct USDT adjustment)
export type PandLAdjustmentFormData = {
  adjustmentAmount: number; // Positive for credit, negative for debit
  adminNotes: string;
};

export interface AdjustPandLServerActionData extends PandLAdjustmentFormData {
  userId: string;
}

export interface Metric {
  title: string;
  value: string | number;
  change?: string;
  icon?: React.ElementType;
}
