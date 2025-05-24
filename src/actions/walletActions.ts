
// src/actions/walletActions.ts
'use server';

import type { Wallet, Transaction, User, CurrencyCode } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { sendEmail } from '@/services/emailService';

// Mock database state management
let mockWalletsDB = (await import('@/lib/mock-data')).mockWallets;
let mockTransactionsDB = (await import('@/lib/mock-data')).mockTransactions; 
const mockUsersDB = (await import('@/lib/mock-data')).mockUsers;

const AdjustBalanceSchema = z.object({
  userId: z.string().uuid(),
  originalAssetCode: z.custom<CurrencyCode>((val) => typeof val === 'string' && ['USD', 'BTC', 'ETH', 'USDT', 'SOL', 'TRX'].includes(val), "Invalid asset code"),
  originalAssetAmount: z.coerce.number().positive("Original asset amount must be positive."),
  adjustmentAmountForWallet: z.coerce.number().refine(val => val !== 0, "Adjustment amount cannot be zero."), // Amount to change the main (USDT) wallet by
  adminNotes: z.string().min(1, "Admin notes are required for balance adjustments."),
  adminId: z.string().optional().default("SYSTEM_ADMIN"), 
});

export async function adjustUserWalletBalance(
  data: z.infer<typeof AdjustBalanceSchema>
): Promise<{ success: boolean; message: string; wallet?: Wallet }> {
  const validatedFields = AdjustBalanceSchema.safeParse(data);
  if (!validatedFields.success) {
    const errorMessages = validatedFields.error.flatten().fieldErrors;
    const fullMessage = Object.entries(errorMessages).map(([field, errors]) => `${field}: ${errors?.join(', ')}`).join('; ');
    return { success: false, message: "Validation failed: " + fullMessage };
  }

  const { userId, originalAssetCode, originalAssetAmount, adjustmentAmountForWallet, adminNotes, adminId } = validatedFields.data;

  const user = mockUsersDB.find(u => u.id === userId);
  if (!user) {
    return { success: false, message: 'User not found.' };
  }

  const walletIndex = mockWalletsDB.findIndex(w => w.user_id === userId);
  if (walletIndex === -1) {
    // This case should ideally not happen if every user has one wallet.
    // We could create one here if necessary, or error out.
    // For now, let's assume a wallet always exists as per the new model.
    return { success: false, message: 'User wallet not found. This should not happen.' };
  }

  const originalWallet = { ...mockWalletsDB[walletIndex] }; // Clone for accurate old balance
  const oldBalance = originalWallet.balance;
  const newBalance = oldBalance + adjustmentAmountForWallet;

  if (newBalance < 0) {
    return { success: false, message: "Adjustment would result in a negative balance, which is not allowed." };
  }
  
  mockWalletsDB[walletIndex] = {
    ...originalWallet,
    balance: newBalance,
    updated_at: new Date().toISOString(),
  };
  const finalUpdatedWallet = mockWalletsDB[walletIndex];

  // Create an ADJUSTMENT transaction for auditing
  const adjustmentTransaction: Transaction = {
    id: crypto.randomUUID(),
    user_id: userId,
    username: user.username,
    user_email: user.email,
    wallet_id: originalWallet.id,
    transaction_type: 'ADJUSTMENT',
    asset_code: originalAssetCode, // Log the original asset
    amount_asset: originalAssetAmount, // Log the original asset amount
    amount_usd_equivalent: adjustmentAmountForWallet, // This is the change in the main (USDT) wallet balance
    status: 'COMPLETED', 
    notes: `Admin Adjustment: ${adminNotes}`,
    admin_processed_by: adminId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    processed_at: new Date().toISOString(),
  };
  mockTransactionsDB.push(adjustmentTransaction);

  console.log(`Admin action: Adjusted balance for user ${userId}. Wallet ${originalWallet.id}. Old Balance: ${oldBalance} ${originalWallet.currency}, New Balance: ${newBalance} ${originalWallet.currency}. Adjustment: ${adjustmentAmountForWallet} ${originalWallet.currency}. Original tx: ${originalAssetAmount} ${originalAssetCode}. Reason: ${adminNotes}.`);
  
  if (user.email) {
    await sendEmail({
      to: user.email,
      subject: `Your Account Balance Has Been Updated by Admin`,
      body: `Dear ${user.username || 'User'},\n\nAn administrator has updated your account balance.\n\nDetails of original transaction: ${originalAssetAmount.toFixed(originalAssetCode === 'USD' || originalAssetCode === 'USDT' ? 2 : 8)} ${originalAssetCode}\nChange to your main account balance: ${adjustmentAmountForWallet > 0 ? '+' : ''}${adjustmentAmountForWallet.toFixed(2)} ${finalUpdatedWallet.currency}\nNew Account Balance: ${newBalance.toFixed(2)} ${finalUpdatedWallet.currency}\nReason: ${adminNotes}\n\nIf you have any questions, please contact support.\n\nThank you,\nFPX Markets Team`,
    });
  }

  revalidatePath(`/users/${userId}`);
  // Revalidate transactions page if it exists and shows adjustments
  // For now, we assume it does.
  revalidatePath(`/transactions`); 
  
  return { success: true, message: 'User wallet balance updated successfully and adjustment logged.', wallet: finalUpdatedWallet };
}
