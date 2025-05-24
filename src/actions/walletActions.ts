
// src/actions/walletActions.ts
'use server';

import type { Wallet, Transaction, User, CurrencyCode } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { sendEmail } from '@/services/emailService';
import { getExchangeRate } from '@/services/exchangeRateService'; // Import the new service

// Mock database state management
let mockWalletsDB = (await import('@/lib/mock-data')).mockWallets;
let mockTransactionsDB = (await import('@/lib/mock-data')).mockTransactions; 
const mockUsersDB = (await import('@/lib/mock-data')).mockUsers;


// Schema for data received by the server action
// It no longer includes adjustmentAmountForWallet as it will be calculated
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
    return { success: false, message: 'User wallet not found. This should not happen.' };
  }

  let adjustmentAmountForWallet: number;
  try {
    const exchangeRate = await getExchangeRate(originalAssetCode);
    adjustmentAmountForWallet = originalAssetAmount * exchangeRate;
    // For withdrawals/debits, admin should input a negative originalAssetAmount if that's the UI choice,
    // or the UI should explicitly ask for transaction type (deposit/withdrawal).
    // For now, we assume originalAssetAmount is always positive, and the admin's intent (deposit/credit vs withdrawal/debit)
    // determines if adjustmentAmountForWallet should be positive or negative.
    // The current simplified form implies deposits. For debits, the UI would need to capture that.
    // Let's assume for now originalAssetAmount can be positive for deposit, negative for withdrawal.
    // If originalAssetAmount is always positive, then the UI/form needs a "type" (credit/debit)
    // or the admin notes must clarify.
    // For simplicity, we'll assume if the form allows only positive originalAssetAmount, it's a credit.
    // To make it more flexible: if the intent is to *increase* user balance, it's positive.
    // If the intent is to *decrease*, the dialog should capture that.
    // The current form for `originalAssetAmount` being positive implies a credit.
    // If a debit is needed, the system would need to handle negative `originalAssetAmount`
    // or a separate field indicating transaction direction (credit/debit).
    // *Correction*: The dialog will be simplified to take asset and amount. If it's a deposit it's positive.
    // If it's a withdrawal, the admin should enter a negative `originalAssetAmount` if the intention is to debit
    // based on an external withdrawal, or the UI should make this distinction clear.
    // Given the user story "user deposits into admin's crypto wallet", we assume positive flow.
    // The prompt "Enter positive for deposits/credits, negative for withdrawals/debits" was for the old field.
    // Now, `adjustmentAmountForWallet` will be derived. If `originalAssetAmount` can be negative (representing user withdrawing from admin),
    // then `adjustmentAmountForWallet` would become negative.
    // For this implementation: we'll assume `originalAssetAmount` from the form is always positive for a deposit.
    // If it represents a user withdrawal admin is debiting, the amount entered would be negative.
    // The form schema enforces positive. So this is for crediting user balance.
    // To support debit: schema for originalAssetAmount should allow negative, or add a type field.
    // For now: assume positive originalAssetAmount means credit.

  } catch (error) {
    return { success: false, message: (error as Error).message || "Could not fetch exchange rate." };
  }

  const originalWallet = { ...mockWalletsDB[walletIndex] }; // Clone for accurate old balance
  const oldBalance = originalWallet.balance;
  const newBalance = oldBalance + adjustmentAmountForWallet; // adjustmentAmountForWallet is the CHANGE in USDT

  if (newBalance < 0) {
    // This check is important: an admin action should not make a balance negative without explicit override.
    return { success: false, message: "Adjustment would result in a negative balance. Operation cancelled." };
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
    amount_usd_equivalent: adjustmentAmountForWallet, // This is the change in the main (USDT) wallet balance
    status: 'COMPLETED', 
    notes: `Admin Adjustment: ${adminNotes}`,
    admin_processed_by: adminId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    processed_at: new Date().toISOString(),
  };
  mockTransactionsDB.push(adjustmentTransaction);

  console.log(`Admin action: Adjusted balance for user ${userId}. Wallet ${originalWallet.id}. Old Balance: ${oldBalance} ${originalWallet.currency}, New Balance: ${newBalance} ${originalWallet.currency}. Adjustment Value (USDT): ${adjustmentAmountForWallet.toFixed(2)}. Original tx: ${originalAssetAmount.toFixed(originalAssetCode === 'USD' || originalAssetCode === 'USDT' ? 2 : 8)} ${originalAssetCode}. Reason: ${adminNotes}.`);
  
  if (user.email) {
    await sendEmail({
      to: user.email,
      subject: `Your Account Balance Has Been Updated by Admin`,
      body: `Dear ${user.username || 'User'},\n\nAn administrator has updated your account balance.\n\nDetails of external transaction: ${originalAssetAmount.toFixed(originalAssetCode === 'USD' || originalAssetCode === 'USDT' ? 2 : 8)} ${originalAssetCode}\nEquivalent change to your account balance: ${adjustmentAmountForWallet > 0 ? '+' : ''}${adjustmentAmountForWallet.toFixed(2)} ${finalUpdatedWallet.currency}\nNew Account Balance: ${newBalance.toFixed(2)} ${finalUpdatedWallet.currency}\nReason: ${adminNotes}\n\nIf you have any questions, please contact support.\n\nThank you,\nFPX Markets Team`,
    });
  }

  revalidatePath(`/users/${userId}`);
  revalidatePath(`/transactions`); 
  
  return { success: true, message: 'User wallet balance updated successfully and adjustment logged.', wallet: finalUpdatedWallet };
}

