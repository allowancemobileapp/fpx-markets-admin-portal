
// src/actions/walletActions.ts
'use server';

import type { Wallet, Transaction, User, CurrencyCode, AdjustPandLServerActionData } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { sendEmail } from '@/services/emailService';
import { getExchangeRate } from '@/services/exchangeRateService'; 

// Mock database state management
let mockWalletsDB = (await import('@/lib/mock-data')).mockWallets;
let mockTransactionsDB = (await import('@/lib/mock-data')).mockTransactions; 
const mockUsersDB = (await import('@/lib/mock-data')).mockUsers;


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

  const user = mockUsersDB.find(u => u.id === userId);
  if (!user) {
    return { success: false, message: 'User not found.' };
  }

  const walletIndex = mockWalletsDB.findIndex(w => w.user_id === userId);
  if (walletIndex === -1) {
    // This should ideally not happen with the single wallet model
    // If it does, we might need to create a wallet for the user.
    // For now, assume wallet always exists if user exists.
     mockWalletsDB.push({
        id: crypto.randomUUID(),
        user_id: userId,
        currency: 'USDT',
        balance: 0,
        profit_loss_balance: 0,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    });
    const newWalletIndex = mockWalletsDB.findIndex(w => w.user_id === userId);
    if (newWalletIndex === -1) return { success: false, message: 'User wallet could not be created.' };
     // Re-assign walletIndex to the newly created wallet
    // This scenario is unlikely if data integrity is maintained but handles a potential edge case.
    // A more robust solution would involve checking for wallet existence when user is loaded.
    // For this simplified version, this ensures a wallet is present.
    // The above push should ideally be in user creation logic, not here.
    // Reverting to previous logic: Wallet should always exist.
    return { success: false, message: 'User wallet not found. This indicates a data integrity issue.' };
  }


  let adjustmentAmountForWallet: number;
  try {
    const exchangeRate = await getExchangeRate(originalAssetCode);
    adjustmentAmountForWallet = originalAssetAmount * exchangeRate;
  } catch (error) {
    return { success: false, message: (error as Error).message || "Could not fetch exchange rate." };
  }

  const originalWallet = { ...mockWalletsDB[walletIndex] };
  const oldBalance = originalWallet.balance;
  const newBalance = oldBalance + adjustmentAmountForWallet; 

  if (newBalance < 0 && adjustmentAmountForWallet < 0) { // Only restrict if adjustment makes it negative due to withdrawal
     return { success: false, message: "Adjustment would result in a negative main balance. Operation cancelled." };
  }
  
  mockWalletsDB[walletIndex] = {
    ...originalWallet,
    balance: newBalance,
    updated_at: new Date().toISOString(),
  };
  const finalUpdatedWallet = mockWalletsDB[walletIndex];

  const adjustmentTransaction: Transaction = {
    id: crypto.randomUUID(),
    user_id: userId,
    username: user.username,
    user_email: user.email,
    wallet_id: originalWallet.id,
    transaction_type: 'ADJUSTMENT',
    asset_code: originalAssetCode, 
    amount_asset: originalAssetAmount, 
    amount_usd_equivalent: adjustmentAmountForWallet, 
    status: 'COMPLETED', 
    notes: `Main Balance Adjustment: ${adminNotes}`, // Clarify note
    admin_processed_by: adminId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    processed_at: new Date().toISOString(),
  };
  mockTransactionsDB.push(adjustmentTransaction);

  console.log(`Admin action: Adjusted MAIN balance for user ${userId}. Wallet ${originalWallet.id}. Old Balance: ${oldBalance} ${originalWallet.currency}, New Balance: ${newBalance} ${newBalance} ${originalWallet.currency}. Original tx: ${originalAssetAmount.toFixed(originalAssetCode === 'USD' || originalAssetCode === 'USDT' ? 2 : 8)} ${originalAssetCode} (Value: ${adjustmentAmountForWallet.toFixed(2)} USDT). Reason: ${adminNotes}.`);
  
  if (user.email) {
    await sendEmail({
      to: user.email,
      subject: `Your Account Balance Has Been Updated by Admin`,
      body: `Dear ${user.username || 'User'},\n\nAn administrator has updated your account's main balance.\n\nDetails of external transaction: ${originalAssetAmount.toFixed(originalAssetCode === 'USD' || originalAssetCode === 'USDT' ? 2 : 8)} ${originalAssetCode}\nEquivalent change to your account balance: ${adjustmentAmountForWallet > 0 ? '+' : ''}${adjustmentAmountForWallet.toFixed(2)} ${finalUpdatedWallet.currency}\nNew Account Balance: ${newBalance.toFixed(2)} ${finalUpdatedWallet.currency}\nReason: ${adminNotes}\n\nIf you have any questions, please contact support.\n\nThank you,\nFPX Markets Team`,
    });
  }

  revalidatePath(`/users/${userId}`);
  revalidatePath(`/transactions`); 
  
  return { success: true, message: 'User main wallet balance updated successfully and adjustment logged.', wallet: finalUpdatedWallet };
}


// Schema for P&L balance adjustment
const AdjustPandLServerSchema = z.object({
  userId: z.string().uuid(),
  adjustmentAmount: z.coerce.number(), // Can be positive or negative
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

  const user = mockUsersDB.find(u => u.id === userId);
  if (!user) {
    return { success: false, message: 'User not found for P&L adjustment.' };
  }

  const walletIndex = mockWalletsDB.findIndex(w => w.user_id === userId);
  if (walletIndex === -1) {
     return { success: false, message: 'User wallet not found for P&L adjustment. This indicates a data integrity issue.' };
  }

  const originalWallet = { ...mockWalletsDB[walletIndex] };
  const oldPandLBalance = originalWallet.profit_loss_balance;
  const newPandLBalance = oldPandLBalance + adjustmentAmount;

  // P&L can go negative, so no check like main balance here unless specified.

  mockWalletsDB[walletIndex] = {
    ...originalWallet,
    profit_loss_balance: newPandLBalance,
    updated_at: new Date().toISOString(), // Also update wallet's main updated_at
  };
  const finalUpdatedWallet = mockWalletsDB[walletIndex];

  const pAndLTransaction: Transaction = {
    id: crypto.randomUUID(),
    user_id: userId,
    username: user.username,
    user_email: user.email,
    wallet_id: originalWallet.id,
    transaction_type: 'ADJUSTMENT',
    asset_code: 'USDT', // P&L adjustments are in USDT
    amount_asset: adjustmentAmount, 
    amount_usd_equivalent: adjustmentAmount, // Same as amount_asset for USDT
    status: 'COMPLETED',
    notes: `P&L Adjustment: ${adminNotes}`, // Clarify note
    admin_processed_by: adminId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    processed_at: new Date().toISOString(),
  };
  mockTransactionsDB.push(pAndLTransaction);
  
  console.log(`Admin action: Adjusted P&L balance for user ${userId}. Wallet ${originalWallet.id}. Old P&L Balance: ${oldPandLBalance.toFixed(2)} USDT, New P&L Balance: ${newPandLBalance.toFixed(2)} USDT. Adjustment: ${adjustmentAmount > 0 ? '+' : ''}${adjustmentAmount.toFixed(2)} USDT. Reason: ${adminNotes}.`);

  if (user.email) {
    await sendEmail({
      to: user.email,
      subject: `Your Profit & Loss Balance Has Been Updated by Admin`,
      body: `Dear ${user.username || 'User'},\n\nAn administrator has updated your Profit & Loss (P&L) balance.\n\nAdjustment Amount: ${adjustmentAmount > 0 ? '+' : ''}${adjustmentAmount.toFixed(2)} ${finalUpdatedWallet.currency}\nNew P&L Balance: ${newPandLBalance.toFixed(2)} ${finalUpdatedWallet.currency}\nReason: ${adminNotes}\n\nThis P&L adjustment may also affect your total account equity.\n\nIf you have any questions, please contact support.\n\nThank you,\nFPX Markets Team`,
    });
  }

  revalidatePath(`/users/${userId}`);
  revalidatePath(`/transactions`);

  return { success: true, message: 'User P&L balance updated successfully and adjustment logged.', wallet: finalUpdatedWallet };
}
