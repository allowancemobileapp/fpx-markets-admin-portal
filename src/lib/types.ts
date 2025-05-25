
export type CurrencyCode = 'USD' | 'BTC' | 'ETH' | 'USDT' | 'SOL' | 'TRX';
export type TransactionType = 'DEPOSIT' | 'WITHDRAWAL' | 'FEE' | 'ADJUSTMENT' | 'TRADE_SETTLEMENT';
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

// Input type for creating a new user via admin
export type CreateUserInput = {
  firebase_auth_uid: string;
  username: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  phone_number?: string | null;
  country_code?: string | null;
  trading_plan_id: number;
  // is_active will default to true in the DB if not provided by action
  // is_email_verified will default to false in the DB if not provided by action
};


export interface Wallet {
  id: string; // UUID
  user_id: string; // UUID
  currency: 'USDT';
  balance: number;
  profit_loss_balance: number;
  is_active: boolean;
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
  amount_usd_equivalent: number;
  balance_after_transaction?: number;
  status: TransactionStatus;
  external_transaction_id?: string | null;
  notes?: string | null;
  admin_processed_by?: string | null;
  created_at: string;
  updated_at: string;
  processed_at?: string | null;
  user_email?: string;
  username?: string;
}

export type BalanceAdjustmentFormData = {
  originalAssetCode: CurrencyCode;
  originalAssetAmount: number;
  adminNotes: string;
};

export interface AdjustBalanceServerActionData extends Omit<BalanceAdjustmentFormData, 'adjustmentAmountForWallet'> {
  userId: string;
}

export type PandLAdjustmentFormData = {
  adjustmentAmount: number;
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
