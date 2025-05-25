
// src/actions/walletActions.ts
'use server';

import type { Wallet, Transaction, User, CurrencyCode, TradingPlan } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { sendEmail } from '@/services/emailService';
import { getExchangeRate } from '@/services/exchangeRateService';
import { getClient, query } from '@/lib/db'; // Use getClient for transactions
import { findUserById, getAllTradingPlans } from './userActions'; // To get user details and trading plan

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

  const user = await findUserById(userId);
  if (!user) {
    return { success: false, message: 'User not found.' };
  }
  
  const tradingPlans = await getAllTradingPlans(); // Fetch all trading plans
  const currentTradingPlan = tradingPlans.find(tp => tp.id === user.trading_plan_id);


  const client = await getClient();

  try {
    await client.query('BEGIN');

    const walletRes = await client.query('SELECT * FROM wallets WHERE user_id = $1 FOR UPDATE', [userId]);
    if (walletRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return { success: false, message: 'User wallet not found. This indicates a data integrity issue.' };
    }
    const originalWalletData = walletRes.rows[0];
    const oldBalance = parseFloat(originalWalletData.balance);

    let adjustmentAmountForWallet: number;
    try {
      const exchangeRate = await getExchangeRate(originalAssetCode);
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
      [newBalance.toFixed(8), userId]
    );
    const finalUpdatedWalletData = updateWalletRes.rows[0];

    const adjustmentTransactionData = {
      user_id: userId,
      username: user.username,
      user_email: user.email,
      wallet_id: finalUpdatedWalletData.id,
      transaction_type: 'ADJUSTMENT' as const,
      asset_code: originalAssetCode,
      amount_asset: originalAssetAmount,
      amount_usd_equivalent: adjustmentAmountForWallet,
      balance_after_transaction: parseFloat(finalUpdatedWalletData.balance),
      status: 'COMPLETED' as const,
      notes: `Main Balance Adjustment: ${adminNotes}`,
      admin_processed_by: adminId,
      processed_at: new Date().toISOString(),
      trading_plan_id: user.trading_plan_id,
      trading_plan_name: currentTradingPlan?.name || 'N/A',
    };

    await client.query(
      `INSERT INTO transactions (user_id, wallet_id, transaction_type, asset_code, amount_asset, amount_usd_equivalent, balance_after_transaction, status, notes, admin_processed_by, processed_at, user_email, username, trading_plan_id, trading_plan_name)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
      [
        adjustmentTransactionData.user_id, adjustmentTransactionData.wallet_id, adjustmentTransactionData.transaction_type,
        adjustmentTransactionData.asset_code, adjustmentTransactionData.amount_asset, adjustmentTransactionData.amount_usd_equivalent,
        adjustmentTransactionData.balance_after_transaction, adjustmentTransactionData.status, adjustmentTransactionData.notes,
        adjustmentTransactionData.admin_processed_by, adjustmentTransactionData.processed_at,
        adjustmentTransactionData.user_email, adjustmentTransactionData.username,
        adjustmentTransactionData.trading_plan_id, adjustmentTransactionData.trading_plan_name,
      ]
    );

    await client.query('COMMIT');

    console.log(`Admin action: Adjusted MAIN balance for user ${userId}. Wallet ${finalUpdatedWalletData.id}. Old Balance: ${oldBalance.toFixed(2)} ${finalUpdatedWalletData.currency}, New Balance: ${newBalance.toFixed(2)} ${finalUpdatedWalletData.currency}. Original tx: ${originalAssetAmount.toFixed(originalAssetCode === 'USD' || originalAssetCode === 'USDT' ? 2 : 8)} ${originalAssetCode} (Value: ${adjustmentAmountForWallet.toFixed(2)} USDT). Final Main Balance: ${parseFloat(finalUpdatedWalletData.balance).toFixed(2)} USDT. Reason: ${adminNotes}. Plan: ${currentTradingPlan?.name}`);

    const finalWalletTyped: Wallet = {
      id: finalUpdatedWalletData.id,
      user_id: finalUpdatedWalletData.user_id,
      currency: finalUpdatedWalletData.currency as 'USDT',
      balance: parseFloat(finalUpdatedWalletData.balance),
      profit_loss_balance: parseFloat(finalUpdatedWalletData.profit_loss_balance),
      is_active: finalUpdatedWalletData.is_active,
      created_at: new Date(finalUpdatedWalletData.created_at).toISOString(),
      updated_at: new Date(finalUpdatedWalletData.updated_at).toISOString(),
    };

    if (user.email) {
        const emailSubject = "Your FPX Markets Account Balance Has Been Updated";
        const emailBody = `
<p>Dear ${user.username || 'Valued User'},</p>
<p>An administrator has updated your main account balance on FPX Markets.</p>
<p><strong>Transaction Details:</strong></p>
<ul>
    <li><strong>Original Transaction Asset:</strong> ${originalAssetCode}</li>
    <li><strong>Original Transaction Amount:</strong> ${originalAssetAmount.toFixed(originalAssetCode === 'USD' || originalAssetCode === 'USDT' ? 2 : (originalAssetCode === 'BTC' || originalAssetCode === 'ETH' ? 8 : 6) )} ${originalAssetCode}</li>
    <li><strong>Equivalent Change to Your Account Balance:</strong> ${adjustmentAmountForWallet > 0 ? '+' : ''}${adjustmentAmountForWallet.toFixed(2)} ${finalWalletTyped.currency}</li>
    <li><strong>New Account Balance:</strong> ${newBalance.toFixed(2)} ${finalWalletTyped.currency}</li>
</ul>
<p><strong>Reason/Notes from Admin:</strong></p>
<p>${adminNotes}</p>
<p>If you have any questions or believe this adjustment was made in error, please contact our support team immediately.</p>
<p>Thank you,<br>The FPX Markets Team</p>
`;
      await sendEmail({
        to: user.email,
        subject: emailSubject,
        body: emailBody,
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

  const tradingPlans = await getAllTradingPlans(); // Fetch all trading plans
  const currentTradingPlan = tradingPlans.find(tp => tp.id === user.trading_plan_id);

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

    const pAndLTransactionData = {
      user_id: userId,
      username: user.username,
      user_email: user.email,
      wallet_id: finalUpdatedWalletData.id,
      transaction_type: 'ADJUSTMENT' as const,
      asset_code: 'USDT' as CurrencyCode, // P&L Adjustments are in USDT
      amount_asset: adjustmentAmount,
      amount_usd_equivalent: adjustmentAmount,
      balance_after_transaction: parseFloat(finalUpdatedWalletData.balance), // Main balance after this P&L op
      status: 'COMPLETED' as const,
      notes: `P&L Adjustment: ${adminNotes}`,
      admin_processed_by: adminId,
      processed_at: new Date().toISOString(),
      trading_plan_id: user.trading_plan_id,
      trading_plan_name: currentTradingPlan?.name || 'N/A',
    };

    await client.query(
      `INSERT INTO transactions (user_id, wallet_id, transaction_type, asset_code, amount_asset, amount_usd_equivalent, balance_after_transaction, status, notes, admin_processed_by, processed_at, user_email, username, trading_plan_id, trading_plan_name)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
      [
        pAndLTransactionData.user_id, pAndLTransactionData.wallet_id, pAndLTransactionData.transaction_type,
        pAndLTransactionData.asset_code, pAndLTransactionData.amount_asset, pAndLTransactionData.amount_usd_equivalent,
        pAndLTransactionData.balance_after_transaction, pAndLTransactionData.status, pAndLTransactionData.notes,
        pAndLTransactionData.admin_processed_by, pAndLTransactionData.processed_at,
        pAndLTransactionData.user_email, pAndLTransactionData.username,
        pAndLTransactionData.trading_plan_id, pAndLTransactionData.trading_plan_name,
      ]
    );

    await client.query('COMMIT');

    console.log(`Admin action: Adjusted P&L balance for user ${userId}. Wallet ${finalUpdatedWalletData.id}. Old P&L Balance: ${oldPandLBalance.toFixed(2)} USDT, New P&L Balance: ${newPandLBalance.toFixed(2)} USDT. Adjustment: ${adjustmentAmount > 0 ? '+' : ''}${adjustmentAmount.toFixed(2)} USDT. Final Main Balance after this P&L op: ${parseFloat(finalUpdatedWalletData.balance).toFixed(2)} USDT. Reason: ${adminNotes}. Plan: ${currentTradingPlan?.name}`);

    const finalWalletTyped: Wallet = {
      id: finalUpdatedWalletData.id,
      user_id: finalUpdatedWalletData.user_id,
      currency: finalUpdatedWalletData.currency as 'USDT',
      balance: parseFloat(finalUpdatedWalletData.balance),
      profit_loss_balance: parseFloat(finalUpdatedWalletData.profit_loss_balance),
      is_active: finalUpdatedWalletData.is_active,
      created_at: new Date(finalUpdatedWalletData.created_at).toISOString(),
      updated_at: new Date(finalUpdatedWalletData.updated_at).toISOString(),
    };

    if (user.email) {
        const emailSubject = "Your FPX Markets P&L Balance Has Been Updated";
        const emailBody = `
<p>Dear ${user.username || 'Valued User'},</p>
<p>An administrator has updated your Profit & Loss (P&L) balance on FPX Markets.</p>
<p><strong>Adjustment Details:</strong></p>
<ul>
    <li><strong>Adjustment Amount:</strong> ${adjustmentAmount > 0 ? '+' : ''}${adjustmentAmount.toFixed(2)} ${finalWalletTyped.currency}</li>
    <li><strong>New P&L Balance:</strong> ${newPandLBalance.toFixed(2)} ${finalWalletTyped.currency}</li>
</ul>
<p><strong>Reason/Notes from Admin:</strong></p>
<p>${adminNotes}</p>
<p>This P&L adjustment may also affect your total account equity.</p>
<p>If you have any questions or believe this adjustment was made in error, please contact our support team immediately.</p>
<p>Thank you,<br>The FPX Markets Team</p>
`;
      await sendEmail({
        to: user.email,
        subject: emailSubject,
        body: emailBody,
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

  // Basic search filter (can be expanded)
  if (filters?.searchTerm) {
    const searchTermLike = `%${filters.searchTerm.toLowerCase()}%`;
    conditions.push(
      `(LOWER(user_email) LIKE $${paramIndex++} OR LOWER(username) LIKE $${paramIndex++} OR LOWER(notes) LIKE $${paramIndex++} OR id::text LIKE $${paramIndex++})`
    );
    queryParams.push(searchTermLike, searchTermLike, searchTermLike, searchTermLike);
  }
  if (filters?.statusFilter && filters.statusFilter !== 'all') {
    conditions.push(`status = $${paramIndex++}`);
    queryParams.push(filters.statusFilter);
  }
  if (filters?.typeFilter && filters.typeFilter !== 'all') {
    conditions.push(`transaction_type = $${paramIndex++}`);
    queryParams.push(filters.typeFilter);
  }
  if (filters?.assetFilter && filters.assetFilter !== 'all') {
    conditions.push(`asset_code = $${paramIndex++}`);
    queryParams.push(filters.assetFilter);
  }

  if (conditions.length > 0) {
    queryText += ' WHERE ' + conditions.join(' AND ');
  }

  queryText += ' ORDER BY created_at DESC';

  if (filters?.limit) {
    queryText += ` LIMIT $${paramIndex++}`;
    queryParams.push(filters.limit);
  }
  if (filters?.offset) {
    queryText += ` OFFSET $${paramIndex++}`;
    queryParams.push(filters.offset);
  }

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
      trading_plan_id: tx.trading_plan_id ? parseInt(tx.trading_plan_id, 10) : null,
      trading_plan_name: tx.trading_plan_name,
    }));
  } catch (error) {
    console.error('Error fetching transactions log:', error);
    return [];
  }
}

export async function getWalletByUserId(userId: string): Promise<Wallet | null> {
  return findWalletByUserId(userId);
}

