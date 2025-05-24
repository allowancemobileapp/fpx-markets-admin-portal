
// src/actions/transactionActions.ts
'use server';

import type { Transaction, TransactionStatus, User } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import { sendEmail } from '@/services/emailService';

// Mock database update
let mockTransactionsDB = (await import('@/lib/mock-data')).mockTransactions;
let mockWalletsDB = (await import('@/lib/mock-data')).mockWallets;
const mockUsersDB = (await import('@/lib/mock-data')).mockUsers;


export async function processTransaction(
  transactionId: string, 
  newStatus: TransactionStatus, 
  adminNotes?: string
): Promise<{ success: boolean; message: string }> {
  console.log(`Admin action: Processing transaction ${transactionId} to status ${newStatus}. Notes: ${adminNotes || 'N/A'}`);
  
  const transactionIndex = mockTransactionsDB.findIndex(t => t.id === transactionId);
  if (transactionIndex === -1) {
    return { success: false, message: 'Transaction not found.' };
  }

  const transaction = mockTransactionsDB[transactionIndex];
  const originalStatus = transaction.status;

  // Basic validation: Cannot process an already completed/failed/cancelled transaction
  if (['COMPLETED', 'FAILED', 'CANCELLED'].includes(originalStatus) && originalStatus !== 'PENDING') { // Allow re-processing PENDING for edge cases if needed, but generally final states are final.
     if (originalStatus === newStatus) {
        // No actual change, but allow adding notes
     } else {
        return { success: false, message: `Transaction is already in a final state: ${originalStatus}. Cannot change to ${newStatus}.` };
     }
  }
  
  // Update transaction
  transaction.status = newStatus;
  const noteTimestamp = new Date().toISOString();
  const newAdminNote = adminNotes ? `Admin (${noteTimestamp}): ${adminNotes}` : '';
  transaction.notes = transaction.notes ? `${transaction.notes}\n${newAdminNote}` : newAdminNote;
  
  if (originalStatus !== newStatus && ['COMPLETED', 'FAILED', 'CANCELLED'].includes(newStatus)) {
    transaction.processed_at = noteTimestamp;
  }
  transaction.updated_at = noteTimestamp;
  // In a real app, set admin_processed_by with the current admin's ID

  // Wallet balance updates (simplified logic)
  const walletIndex = mockWalletsDB.findIndex(w => w.id === transaction.wallet_id);
  if (walletIndex !== -1) {
    const wallet = mockWalletsDB[walletIndex];
    if (transaction.transaction_type === 'DEPOSIT') {
      if (originalStatus === 'PENDING' && newStatus === 'COMPLETED') {
        wallet.balance += transaction.amount_asset;
        wallet.pending_deposit_balance -= transaction.amount_asset;
        if (wallet.pending_deposit_balance < 0) wallet.pending_deposit_balance = 0;
      } else if (originalStatus === 'PENDING' && (newStatus === 'FAILED' || newStatus === 'CANCELLED')) {
        wallet.pending_deposit_balance -= transaction.amount_asset;
        if (wallet.pending_deposit_balance < 0) wallet.pending_deposit_balance = 0;
      }
    } else if (transaction.transaction_type === 'WITHDRAWAL') {
       // Assumption: For withdrawals, balance is reduced when PENDING, held in pending_withdrawal_balance.
      if (originalStatus === 'PENDING' && newStatus === 'COMPLETED') { 
        wallet.pending_withdrawal_balance -= transaction.amount_asset;
        if (wallet.pending_withdrawal_balance < 0) wallet.pending_withdrawal_balance = 0;
        // Actual fund transfer would have happened.
      } else if (originalStatus === 'PENDING' && (newStatus === 'FAILED' || newStatus === 'CANCELLED')) {
        wallet.balance += transaction.amount_asset; // Return funds to main balance
        wallet.pending_withdrawal_balance -= transaction.amount_asset;
        if (wallet.pending_withdrawal_balance < 0) wallet.pending_withdrawal_balance = 0;
      }
    }
    wallet.updated_at = new Date().toISOString();
  } else {
    console.warn(`Wallet not found for transaction ${transactionId}`);
  }

  // Send email notification if status changed to a final state
  if (originalStatus !== newStatus && ['COMPLETED', 'FAILED', 'CANCELLED'].includes(newStatus)) {
    const user = mockUsersDB.find(u => u.id === transaction.user_id);
    if (user && user.email) {
      await sendEmail({
        to: user.email,
        subject: `Update on your ${transaction.transaction_type}`,
        body: `Dear ${user.username || 'User'},\n\nYour ${transaction.transaction_type.toLowerCase()} of ${transaction.amount_asset} ${transaction.asset_code} (ID: ${transaction.id}) has been updated to status: ${newStatus}.\n\n${adminNotes ? `Admin Notes: ${adminNotes}\n\n` : ''}If you have any questions, please contact support.\n\nThank you,\nFPX Markets Team`,
      });
    }
  }

  revalidatePath('/transactions');
  if (transaction.user_id) {
    revalidatePath(`/users/${transaction.user_id}`);
  }
  return { success: true, message: `Transaction ${transactionId} status updated to ${newStatus}.` };
}

export async function addTransactionNote(transactionId: string, note: string): Promise<{ success: boolean; message: string }> {
  console.log(`Admin action: Adding note to transaction ${transactionId}. Note: ${note}`);

  const transactionIndex = mockTransactionsDB.findIndex(t => t.id === transactionId);
  if (transactionIndex === -1) {
    return { success: false, message: 'Transaction not found.' };
  }
  
  const noteTimestamp = new Date().toISOString();
  const newAdminNote = `Admin (${noteTimestamp}): ${note}`;
  mockTransactionsDB[transactionIndex].notes = mockTransactionsDB[transactionIndex].notes 
    ? `${mockTransactionsDB[transactionIndex].notes}\n${newAdminNote}` 
    : newAdminNote;
  mockTransactionsDB[transactionIndex].updated_at = noteTimestamp;

  // Optionally, send an email if adding a note implies important info for user
  // For now, only processTransaction sends emails for status changes.

  revalidatePath('/transactions');
  if (mockTransactionsDB[transactionIndex].user_id) {
    revalidatePath(`/users/${mockTransactionsDB[transactionIndex].user_id}`);
  }
  return { success: true, message: `Note added to transaction ${transactionId}.` };
}
