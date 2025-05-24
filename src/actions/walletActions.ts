
// src/actions/walletActions.ts
'use server';

import type { Wallet, Transaction, User } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { sendEmail } from '@/services/emailService';

// Mock database state management
let mockWalletsDB = (await import('@/lib/mock-data')).mockWallets;
let mockTransactionsDB = (await import('@/lib/mock-data')).mockTransactions;
const mockUsersDB = (await import('@/lib/mock-data')).mockUsers; // To get user email

const SetBalanceSchema = z.object({
  walletId: z.string().uuid(),
  newBalance: z.coerce.number().min(0, "Balance cannot be negative."), // Assuming balance cannot be negative
  adminNotes: z.string().min(1, "Admin notes are required for balance adjustments."),
  adminId: z.string().optional().default("SYSTEM_ADMIN"), // Placeholder for actual admin ID
});

export async function setWalletBalance(
  data: z.infer<typeof SetBalanceSchema>
): Promise<{ success: boolean; message: string; wallet?: Wallet }> {
  const validatedFields = SetBalanceSchema.safeParse(data);
  if (!validatedFields.success) {
    return { success: false, message: "Validation failed: " + validatedFields.error.flatten().fieldErrors };
  }

  const { walletId, newBalance, adminNotes, adminId } = validatedFields.data;

  const walletIndex = mockWalletsDB.findIndex(w => w.id === walletId);
  if (walletIndex === -1) {
    return { success: false, message: 'Wallet not found.' };
  }

  const originalWallet = mockWalletsDB[walletIndex];
  const adjustmentAmount = newBalance - originalWallet.balance;

  // Update wallet balance
  mockWalletsDB[walletIndex] = {
    ...originalWallet,
    balance: newBalance,
    updated_at: new Date().toISOString(),
  };
  const updatedWallet = mockWalletsDB[walletIndex];

  // Create an ADJUSTMENT transaction for auditing
  const adjustmentTransaction: Transaction = {
    id: crypto.randomUUID(),
    user_id: originalWallet.user_id,
    wallet_id: originalWallet.id,
    transaction_type: 'ADJUSTMENT',
    asset_code: originalWallet.currency,
    amount_asset: adjustmentAmount,
    // For simplicity, USD equivalent is same as asset amount if currency is USD, otherwise needs conversion.
    // Here, we'll use adjustmentAmount directly assuming it's in the wallet's currency.
    // A more robust solution would convert to a common currency like USD if asset_code !== 'USD'.
    amount_usd_equivalent: adjustmentAmount, // Simplified: This might need actual currency conversion logic
    status: 'COMPLETED',
    notes: `Admin Adjustment: ${adminNotes}`,
    admin_processed_by: adminId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    processed_at: new Date().toISOString(),
  };
  mockTransactionsDB.push(adjustmentTransaction);

  console.log(`Admin action: Adjusted balance for wallet ${walletId}. New balance: ${newBalance}. Reason: ${adminNotes}`);

  // Send email notification
  const user = mockUsersDB.find(u => u.id === originalWallet.user_id);
  if (user && user.email) {
    await sendEmail({
      to: user.email,
      subject: `Your ${originalWallet.currency} Wallet Balance Updated`,
      body: `Dear ${user.username || 'User'},\n\nAn administrator has updated your ${originalWallet.currency} wallet balance.\n\nOld Balance: ${originalWallet.balance.toFixed(originalWallet.currency === 'USD' ? 2 : 8)}\nNew Balance: ${newBalance.toFixed(originalWallet.currency === 'USD' ? 2 : 8)}\nAdjustment Amount: ${adjustmentAmount.toFixed(originalWallet.currency === 'USD' ? 2 : 8)}\nReason: ${adminNotes}\n\nIf you have any questions, please contact support.\n\nThank you,\nFPX Markets Team`,
    });
  }

  revalidatePath(`/users/${originalWallet.user_id}`);
  revalidatePath('/transactions'); // Also revalidate transactions due to the new adjustment transaction
  
  return { success: true, message: 'Wallet balance updated successfully and adjustment logged.', wallet: updatedWallet };
}
