// src/actions/transactionActions.ts
'use server';

import type { Transaction, TransactionStatus } from '@/lib/types';
import { revalidatePath } from 'next/cache';

// Mock database update
let mockTransactionsDB = (await import('@/lib/mock-data')).mockTransactions;
let mockWalletsDB = (await import('@/lib/mock-data')).mockWallets;

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
  if (['COMPLETED', 'FAILED', 'CANCELLED'].includes(originalStatus)) {
    return { success: false, message: `Transaction is already in a final state: ${originalStatus}.` };
  }
  
  // Update transaction
  transaction.status = newStatus;
  transaction.notes = adminNotes ? `${transaction.notes || ''}\nAdmin (${new Date().toISOString()}): ${adminNotes}` : transaction.notes;
  transaction.processed_at = new Date().toISOString();
  transaction.updated_at = new Date().toISOString();
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
      if (originalStatus === 'PENDING' && newStatus === 'COMPLETED') { // Assuming direct to COMPLETED
        wallet.pending_withdrawal_balance -= transaction.amount_asset;
        if (wallet.pending_withdrawal_balance < 0) wallet.pending_withdrawal_balance = 0;
        // Note: Actual fund transfer happens here or before.
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
  
  mockTransactionsDB[transactionIndex].notes = `${mockTransactionsDB[transactionIndex].notes || ''}\nAdmin (${new Date().toISOString()}): ${note}`;
  mockTransactionsDB[transactionIndex].updated_at = new Date().toISOString();

  revalidatePath('/transactions');
  return { success: true, message: `Note added to transaction ${transactionId}.` };
}
