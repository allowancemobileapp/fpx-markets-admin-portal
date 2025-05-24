'use server';

import type { User, KycStatus } from '@/lib/types';
import { revalidatePath } from 'next/cache';

// Mock database update
let mockUsersDB = (await import('@/lib/mock-data')).mockUsers;

export async function updateUserKycStatus(userId: string, kycStatus: KycStatus, adminNotes?: string): Promise<{ success: boolean; message: string }> {
  console.log(`Admin action: Updating KYC status for user ${userId} to ${kycStatus}. Notes: ${adminNotes || 'N/A'}`);
  
  const userIndex = mockUsersDB.findIndex(u => u.id === userId);
  if (userIndex === -1) {
    return { success: false, message: 'User not found.' };
  }
  mockUsersDB[userIndex].kyc_status = kycStatus;
  mockUsersDB[userIndex].updated_at = new Date().toISOString();

  revalidatePath('/users');
  revalidatePath(`/users/${userId}`);
  return { success: true, message: `User KYC status updated to ${kycStatus}.` };
}

export async function updateUserTradingPlan(userId: string, tradingPlanId: number): Promise<{ success: boolean; message: string }> {
  console.log(`Admin action: Updating trading plan for user ${userId} to plan ID ${tradingPlanId}.`);

  const userIndex = mockUsersDB.findIndex(u => u.id === userId);
  if (userIndex === -1) {
    return { success: false, message: 'User not found.' };
  }
  // Ensure trading plan exists (in a real app, check against trading_plans table)
  const tradingPlans = (await import('@/lib/mock-data')).mockTradingPlans;
  if (!tradingPlans.find(tp => tp.id === tradingPlanId)) {
      return { success: false, message: 'Trading plan not found.' };
  }

  mockUsersDB[userIndex].trading_plan_id = tradingPlanId;
  mockUsersDB[userIndex].updated_at = new Date().toISOString();
  
  revalidatePath('/users');
  revalidatePath(`/users/${userId}`);
  return { success: true, message: `User trading plan updated to ID ${tradingPlanId}.` };
}

export async function toggleUserActiveStatus(userId: string, isActive: boolean): Promise<{ success: boolean; message: string }> {
  console.log(`Admin action: Setting user ${userId} active status to ${isActive}.`);
  
  const userIndex = mockUsersDB.findIndex(u => u.id === userId);
  if (userIndex === -1) {
    return { success: false, message: 'User not found.' };
  }
  mockUsersDB[userIndex].is_active = isActive;
  mockUsersDB[userIndex].updated_at = new Date().toISOString();

  revalidatePath('/users');
  revalidatePath(`/users/${userId}`);
  return { success: true, message: `User active status updated.` };
}

export async function findUserById(userId: string): Promise<User | null> {
  // In a real app, this would query the database
  const user = mockUsersDB.find(u => u.id === userId);
  return user || null;
}
