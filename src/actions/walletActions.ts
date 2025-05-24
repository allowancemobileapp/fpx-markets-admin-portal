
// src/actions/walletActions.ts
'use server';

import type { Wallet, Transaction, User } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { sendEmail } from '@/services/emailService';

// Mock database state management
let mockWalletsDB = (await import('@/lib/mock-data')).mockWallets;
let mockTransactionsDB = (await import('@/lib/mock-data')).mockTransactions; // Still used for logging adjustments
const mockUsersDB = (await import('@/lib/mock-data')).mockUsers; // To get user email

const SetBalanceSchema = z.object({
  walletId: z.string().uuid(),
  newBalance: z.coerce.number().min(0, "Balance cannot be negative."),
  adminNotes: z.string().min(1, "Admin notes are required for balance adjustments."),
  adminId: z.string().optional().default("SYSTEM_ADMIN"), // Placeholder for actual admin ID
});

export async function setWalletBalance(
  data: z.infer<typeof SetBalanceSchema>
): Promise<{ success: boolean; message: string; wallet?: Wallet }> {
  const validatedFields = SetBalanceSchema.safeParse(data);
  if (!validatedFields.success) {
    const errorMessages = validatedFields.error.flatten().fieldErrors;
    const fullMessage = Object.entries(errorMessages).map(([field, errors]) => `${field}: ${errors?.join(', ')}`).join('; ');
    return { success: false, message: "Validation failed: " + fullMessage };
  }

  const { walletId, newBalance, adminNotes, adminId } = validatedFields.data;

  const walletIndex = mockWalletsDB.findIndex(w => w.id === walletId);
  if (walletIndex === -1) {
    return { success: false, message: 'Wallet not found.' };
  }

  const originalWallet = { ...mockWalletsDB[walletIndex] }; // Clone for accurate old balance
  const oldBalance = originalWallet.balance;
  const adjustmentAmount = newBalance - oldBalance;

  const updatedWalletData: Partial<Wallet> = {
    balance: newBalance,
    updated_at: new Date().toISOString(),
  };

  // Adjust pending balances based on the main balance change
  if (newBalance > oldBalance && originalWallet.pending_deposit_balance > 0) {
    // Balance increased, assume it's from pending deposits
    const amountIncreased = newBalance - oldBalance;
    updatedWalletData.pending_deposit_balance = Math.max(0, originalWallet.pending_deposit_balance - amountIncreased);
  } else if (newBalance < oldBalance && originalWallet.pending_withdrawal_balance > 0) {
    // Balance decreased, assume it's fulfilling pending withdrawals
    const amountDecreased = oldBalance - newBalance;
    updatedWalletData.pending_withdrawal_balance = Math.max(0, originalWallet.pending_withdrawal_balance - amountDecreased);
  }


  // Update wallet in mock DB
  mockWalletsDB[walletIndex] = {
    ...originalWallet,
    ...updatedWalletData,
  };
  const finalUpdatedWallet = mockWalletsDB[walletIndex];


  // Create an ADJUSTMENT transaction for auditing
  const adjustmentTransaction: Transaction = {
    id: crypto.randomUUID(),
    user_id: originalWallet.user_id,
    wallet_id: originalWallet.id,
    transaction_type: 'ADJUSTMENT',
    asset_code: originalWallet.currency,
    amount_asset: adjustmentAmount, // This is the change in balance
    amount_usd_equivalent: adjustmentAmount, // Simplified for non-USD, assuming direct value or needs conversion logic if currency != USD
    status: 'COMPLETED', // Adjustments are typically immediate
    notes: `Admin Adjustment: ${adminNotes}`,
    admin_processed_by: adminId, // In a real app, actual admin ID
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    processed_at: new Date().toISOString(),
  };
  mockTransactionsDB.push(adjustmentTransaction);

  console.log(`Admin action: Adjusted balance for wallet ${walletId}. Old: ${oldBalance}, New: ${newBalance}. Reason: ${adminNotes}. Pending Deposits: ${originalWallet.pending_deposit_balance} -> ${finalUpdatedWallet.pending_deposit_balance}, Pending Withdrawals: ${originalWallet.pending_withdrawal_balance} -> ${finalUpdatedWallet.pending_withdrawal_balance}`);
  
  // Send email notification
  const user = mockUsersDB.find(u => u.id === originalWallet.user_id);
  if (user && user.email) {
    await sendEmail({
      to: user.email,
      subject: `Your ${originalWallet.currency} Wallet Balance Updated by Admin`,
      body: `Dear ${user.username || 'User'},\n\nAn administrator has updated your ${originalWallet.currency} wallet balance.\n\nOld Balance: ${oldBalance.toFixed(originalWallet.currency === 'USD' ? 2 : 8)}\nNew Balance: ${newBalance.toFixed(originalWallet.currency === 'USD' ? 2 : 8)}\nAdjustment Amount: ${adjustmentAmount.toFixed(originalWallet.currency === 'USD' ? 2 : 8)}\nReason: ${adminNotes}\n\nIf you have any questions, please contact support.\n\nThank you,\nFPX Markets Team`,
    });
  }

  revalidatePath(`/users/${originalWallet.user_id}`);
  // No longer revalidating '/transactions' page as it's removed.
  // Adjustment transactions are still logged but not viewed through a dedicated page.
  
  return { success: true, message: 'Wallet balance updated successfully and adjustment logged.', wallet: finalUpdatedWallet };
}
