
// src/actions/walletActions.ts
'use server';

import type { Wallet, Transaction, User, CurrencyCode, AdjustBalanceServerActionData, AdjustPandLServerActionData } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { sendEmail } from '@/services/emailService';
import { getExchangeRate } from '@/services/exchangeRateService'; 
import { getClient, query } from '@/lib/db'; // Use getClient for transactions
import { findUserById } from './userActions'; // To get user details

async function findWalletByUserId(userId: string): Promise<Wallet | null> {
  try {
    const result = await query('SELECT * FROM wallets WHERE user_id = $1', [userId]);
    if (result.rows.length === 0) {
      return null;
    }
    const dbWallet = result.rows[0];
    return {
      id: dbWallet.id,
      user_id: dbWallet.user_id,
      currency: dbWallet.currency as 'USDT', // Schema enforces USDT
      balance: parseFloat(dbWallet.balance),
      profit_loss_balance: parseFloat(dbWallet.profit_loss_balance),
      is_active: dbWallet.is_active,
      created_at: new Date(dbWallet.created_at).toISOString(),
      updated_at: new Date(dbWallet.updated_at).toISOString(),
    };
  } catch (error) {
    console.error('Error finding wallet by user ID:', error);
    return null;
  }
}


// Schema for main balance adjustment (external asset)
const AdjustBalanceServerSchema = z.object({
  userId: z.string().uuid(),
  originalAssetCode: z.custom<CurrencyCode>((val) => typeof val === 'string' && ['USD', 'BTC', 'ETH', 'USDT', 'SOL', 'TRX'].includes(val), "Invalid original asset code"),
  originalAssetAmount: z.coerce.number().positive("Original asset amount must be positive."),
  adminNotes: z.string().min(5, "Admin notes must be at least 5 characters long."),
  adminId: z.string().optional().default("SYSTEM_ADMIN"), 
});

export async function adjustUserWalletBalance(
  data: z.infer<typeof AdjustBalanceServerSchema>
): Promise<{ success: boolean; message: string; wallet?: Wallet }> {
  const validatedFields = AdjustBalanceServerSchema.safeParse(data);
  if (!validatedFields.success) {
    const errorMessages = validatedFields.error.flatten().fieldErrors;
    const fullMessage = Object.entries(errorMessages).map(([field, errors]) => `${field}: ${errors?.join(', ')}`).join('; ');
    return { success: false, message: "Validation failed: " + fullMessage };
  }

  const { userId, originalAssetCode, originalAssetAmount, adminNotes, adminId } = validatedFields.data;

  const user = await findUserById(userId); // Fetch user details from DB
  if (!user) {
    return { success: false, message: 'User not found.' };
  }

  const client = await getClient(); // Get a client for transaction

  try {
    await client.query('BEGIN');

    // Lock the wallet row for update
    const walletRes = await client.query('SELECT * FROM wallets WHERE user_id = $1 FOR UPDATE', [userId]);
    if (walletRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return { success: false, message: 'User wallet not found. This indicates a data integrity issue.' };
    }
    const originalWalletData = walletRes.rows[0];
    const oldBalance = parseFloat(originalWalletData.balance);

    let adjustmentAmountForWallet: number;
    try {
      const exchangeRate = await getExchangeRate(originalAssetCode); // This is a mock service
      adjustmentAmountForWallet = originalAssetAmount * exchangeRate;
    } catch (error) {
      await client.query('ROLLBACK');
      return { success: false, message: (error as Error).message || "Could not fetch exchange rate." };
    }
    
    const newBalance = oldBalance + adjustmentAmountForWallet; 

    if (newBalance < 0 && adjustmentAmountForWallet < 0) { 
       await client.query('ROLLBACK');
       return { success: false, message: "Adjustment would result in a negative main balance. Operation cancelled." };
    }
  
    const updateWalletRes = await client.query(
      'UPDATE wallets SET balance = $1, updated_at = NOW() WHERE user_id = $2 RETURNING *',
      [newBalance.toFixed(8), userId] // Ensure correct precision for DB
    );
    const finalUpdatedWalletData = updateWalletRes.rows[0];

    const adjustmentTransaction: Omit<Transaction, 'id' | 'created_at' | 'updated_at'> = {
      user_id: userId,
      username: user.username,
      user_email: user.email,
      wallet_id: finalUpdatedWalletData.id,
      transaction_type: 'ADJUSTMENT',
      asset_code: originalAssetCode, 
      amount_asset: originalAssetAmount, 
      amount_usd_equivalent: adjustmentAmountForWallet, 
      balance_after_transaction: parseFloat(finalUpdatedWalletData.balance),
      status: 'COMPLETED', 
      notes: `Main Balance Adjustment: ${adminNotes}`,
      admin_processed_by: adminId,
      processed_at: new Date().toISOString(),
    };
    
    await client.query(
      `INSERT INTO transactions (user_id, wallet_id, transaction_type, asset_code, amount_asset, amount_usd_equivalent, balance_after_transaction, status, notes, admin_processed_by, processed_at, user_email, username)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [
        adjustmentTransaction.user_id, adjustmentTransaction.wallet_id, adjustmentTransaction.transaction_type,
        adjustmentTransaction.asset_code, adjustmentTransaction.amount_asset, adjustmentTransaction.amount_usd_equivalent,
        adjustmentTransaction.balance_after_transaction, adjustmentTransaction.status, adjustmentTransaction.notes,
        adjustmentTransaction.admin_processed_by, adjustmentTransaction.processed_at,
        adjustmentTransaction.user_email, adjustmentTransaction.username
      ]
    );

    await client.query('COMMIT');

    console.log(`Admin action: Adjusted MAIN balance for user ${userId}. Wallet ${finalUpdatedWalletData.id}. Old Balance: ${oldBalance.toFixed(2)} ${finalUpdatedWalletData.currency}, New Balance: ${newBalance.toFixed(2)} ${finalUpdatedWalletData.currency}. Original tx: ${originalAssetAmount.toFixed(originalAssetCode === 'USD' || originalAssetCode === 'USDT' ? 2 : 8)} ${originalAssetCode} (Value: ${adjustmentAmountForWallet.toFixed(2)} USDT). Final Main Balance: ${parseFloat(finalUpdatedWalletData.balance).toFixed(2)} USDT. Reason: ${adminNotes}.`);
    
    const finalWalletTyped: Wallet = {
      ...finalUpdatedWalletData,
      balance: parseFloat(finalUpdatedWalletData.balance),
      profit_loss_balance: parseFloat(finalUpdatedWalletData.profit_loss_balance),
      created_at: new Date(finalUpdatedWalletData.created_at).toISOString(),
      updated_at: new Date(finalUpdatedWalletData.updated_at).toISOString(),
    };

    if (user.email) {
      await sendEmail({
        to: user.email,
        subject: `Your Account Balance Has Been Updated by Admin`,
        body: `Dear ${user.username || 'User'},\n\nAn administrator has updated your account's main balance.\n\nDetails of external transaction: ${originalAssetAmount.toFixed(originalAssetCode === 'USD' || originalAssetCode === 'USDT' ? 2 : 8)} ${originalAssetCode}\nEquivalent change to your account balance: ${adjustmentAmountForWallet > 0 ? '+' : ''}${adjustmentAmountForWallet.toFixed(2)} ${finalWalletTyped.currency}\nNew Account Balance: ${newBalance.toFixed(2)} ${finalWalletTyped.currency}\nReason: ${adminNotes}\n\nIf you have any questions, please contact support.\n\nThank you,\nFPX Markets Team`,
      });
    }

    revalidatePath(`/users/${userId}`);
    revalidatePath(`/transactions`); 
    
    return { success: true, message: 'User main wallet balance updated successfully and adjustment logged.', wallet: finalWalletTyped };

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error adjusting user wallet balance:', error);
    return { success: false, message: 'Database error occurred during balance adjustment.' };
  } finally {
    client.release();
  }
}


// Schema for P&L balance adjustment
const AdjustPandLServerSchema = z.object({
  userId: z.string().uuid(),
  adjustmentAmount: z.coerce.number().refine(val => val !== 0, "Adjustment amount cannot be zero."), 
  adminNotes: z.string().min(5, "Admin notes must be at least 5 characters long."),
  adminId: z.string().optional().default("SYSTEM_ADMIN"),
});

export async function adjustUserProfitLossBalance(
  data: z.infer<typeof AdjustPandLServerSchema>
): Promise<{ success: boolean; message: string; wallet?: Wallet }> {
  const validatedFields = AdjustPandLServerSchema.safeParse(data);
  if (!validatedFields.success) {
    const errorMessages = validatedFields.error.flatten().fieldErrors;
    const fullMessage = Object.entries(errorMessages).map(([field, errors]) => `${field}: ${errors?.join(', ')}`).join('; ');
    return { success: false, message: "Validation failed for P&L adjustment: " + fullMessage };
  }
  
  const { userId, adjustmentAmount, adminNotes, adminId } = validatedFields.data;

  const user = await findUserById(userId);
  if (!user) {
    return { success: false, message: 'User not found for P&L adjustment.' };
  }

  const client = await getClient();

  try {
    await client.query('BEGIN');

    const walletRes = await client.query('SELECT * FROM wallets WHERE user_id = $1 FOR UPDATE', [userId]);
    if (walletRes.rows.length === 0) {
       await client.query('ROLLBACK');
       return { success: false, message: 'User wallet not found for P&L adjustment. This indicates a data integrity issue.' };
    }
    const originalWalletData = walletRes.rows[0];
    const oldPandLBalance = parseFloat(originalWalletData.profit_loss_balance);
    const newPandLBalance = oldPandLBalance + adjustmentAmount;

    const updateWalletRes = await client.query(
      'UPDATE wallets SET profit_loss_balance = $1, updated_at = NOW() WHERE user_id = $2 RETURNING *',
      [newPandLBalance.toFixed(8), userId]
    );
    const finalUpdatedWalletData = updateWalletRes.rows[0];

    const pAndLTransaction: Omit<Transaction, 'id' | 'created_at' | 'updated_at'> = {
      user_id: userId,
      username: user.username,
      user_email: user.email,
      wallet_id: finalUpdatedWalletData.id,
      transaction_type: 'ADJUSTMENT',
      asset_code: 'USDT', 
      amount_asset: adjustmentAmount, 
      amount_usd_equivalent: adjustmentAmount, 
      balance_after_transaction: parseFloat(finalUpdatedWalletData.balance), // Main balance after this P&L op
      status: 'COMPLETED',
      notes: `P&L Adjustment: ${adminNotes}`, 
      admin_processed_by: adminId,
      processed_at: new Date().toISOString(),
    };
    
    await client.query(
      `INSERT INTO transactions (user_id, wallet_id, transaction_type, asset_code, amount_asset, amount_usd_equivalent, balance_after_transaction, status, notes, admin_processed_by, processed_at, user_email, username)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [
        pAndLTransaction.user_id, pAndLTransaction.wallet_id, pAndLTransaction.transaction_type,
        pAndLTransaction.asset_code, pAndLTransaction.amount_asset, pAndLTransaction.amount_usd_equivalent,
        pAndLTransaction.balance_after_transaction, pAndLTransaction.status, pAndLTransaction.notes,
        pAndLTransaction.admin_processed_by, pAndLTransaction.processed_at,
        pAndLTransaction.user_email, pAndLTransaction.username
      ]
    );
    
    await client.query('COMMIT');
  
    console.log(`Admin action: Adjusted P&L balance for user ${userId}. Wallet ${finalUpdatedWalletData.id}. Old P&L Balance: ${oldPandLBalance.toFixed(2)} USDT, New P&L Balance: ${newPandLBalance.toFixed(2)} USDT. Adjustment: ${adjustmentAmount > 0 ? '+' : ''}${adjustmentAmount.toFixed(2)} USDT. Final Main Balance after this P&L op: ${parseFloat(finalUpdatedWalletData.balance).toFixed(2)} USDT. Reason: ${adminNotes}.`);

    const finalWalletTyped: Wallet = {
      ...finalUpdatedWalletData,
      balance: parseFloat(finalUpdatedWalletData.balance),
      profit_loss_balance: parseFloat(finalUpdatedWalletData.profit_loss_balance),
      created_at: new Date(finalUpdatedWalletData.created_at).toISOString(),
      updated_at: new Date(finalUpdatedWalletData.updated_at).toISOString(),
    };

    if (user.email) {
      await sendEmail({
        to: user.email,
        subject: `Your Profit & Loss Balance Has Been Updated by Admin`,
        body: `Dear ${user.username || 'User'},\n\nAn administrator has updated your Profit & Loss (P&L) balance.\n\nAdjustment Amount: ${adjustmentAmount > 0 ? '+' : ''}${adjustmentAmount.toFixed(2)} ${finalWalletTyped.currency}\nNew P&L Balance: ${newPandLBalance.toFixed(2)} ${finalWalletTyped.currency}\nReason: ${adminNotes}\n\nThis P&L adjustment may also affect your total account equity.\n\nIf you have any questions, please contact support.\n\nThank you,\nFPX Markets Team`,
      });
    }

    revalidatePath(`/users/${userId}`);
    revalidatePath(`/transactions`);

    return { success: true, message: 'User P&L balance updated successfully and adjustment logged.', wallet: finalWalletTyped };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error adjusting P&L balance:', error);
    return { success: false, message: 'Database error occurred during P&L adjustment.' };
  } finally {
    client.release();
  }
}

// New function to get transactions for the log page
export async function getTransactionsLog(filters?: {
  searchTerm?: string;
  statusFilter?: string;
  typeFilter?: string;
  assetFilter?: string;
  limit?: number;
  offset?: number;
}): Promise<Transaction[]> {
  let queryText = 'SELECT * FROM transactions';
  const queryParams: any[] = [];
  const conditions: string[] = [];
  let paramIndex = 1;

  // Note: Filters would need to be implemented if desired
  // For now, fetching all, ordered by most recent
  
  queryText += ' ORDER BY created_at DESC';
  // if (filters?.limit) {
  //   queryText += ` LIMIT $${paramIndex++}`;
  //   queryParams.push(filters.limit);
  // }
  // if (filters?.offset) {
  //   queryText += ` OFFSET $${paramIndex++}`;
  //   queryParams.push(filters.offset);
  // }

  try {
    const result = await query(queryText, queryParams);
    return result.rows.map(tx => ({
      id: tx.id,
      user_id: tx.user_id,
      wallet_id: tx.wallet_id,
      transaction_type: tx.transaction_type as Transaction['transaction_type'],
      asset_code: tx.asset_code as CurrencyCode,
      amount_asset: parseFloat(tx.amount_asset),
      amount_usd_equivalent: parseFloat(tx.amount_usd_equivalent),
      balance_after_transaction: tx.balance_after_transaction ? parseFloat(tx.balance_after_transaction) : undefined,
      status: tx.status as Transaction['status'],
      external_transaction_id: tx.external_transaction_id,
      notes: tx.notes,
      admin_processed_by: tx.admin_processed_by,
      processed_at: tx.processed_at ? new Date(tx.processed_at).toISOString() : null,
      created_at: new Date(tx.created_at).toISOString(),
      updated_at: new Date(tx.updated_at).toISOString(),
      user_email: tx.user_email,
      username: tx.username,
    }));
  } catch (error) {
    console.error('Error fetching transactions log:', error);
    return [];
  }
}

// New function to fetch wallet for a user, to be used in user profile page
export async function getWalletByUserId(userId: string): Promise<Wallet | null> {
  return findWalletByUserId(userId);
}

