
'use server';

import type { User } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import { sendEmail } from '@/services/emailService';
import { mockTradingPlans } from '@/lib/mock-data';

// Mock database update
let mockUsersDB = (await import('@/lib/mock-data')).mockUsers;

// updateUserKycStatus function removed as KYC is no longer managed by admin.

export async function updateUserTradingPlan(userId: string, tradingPlanId: number): Promise<{ success: boolean; message: string }> {
  console.log(`Admin action: Updating trading plan for user ${userId} to plan ID ${tradingPlanId}.`);

  const userIndex = mockUsersDB.findIndex(u => u.id === userId);
  if (userIndex === -1) {
    return { success: false, message: 'User not found.' };
  }
  
  const tradingPlans = mockTradingPlans; // Using imported mockTradingPlans
  const newPlan = tradingPlans.find(tp => tp.id === tradingPlanId);
  if (!newPlan) {
      return { success: false, message: 'Trading plan not found.' };
  }

  const user = mockUsersDB[userIndex];
  const oldPlanId = user.trading_plan_id;
  user.trading_plan_id = tradingPlanId;
  user.updated_at = new Date().toISOString();
  
  if (oldPlanId !== tradingPlanId && user.email) {
    const oldPlan = tradingPlans.find(tp => tp.id === oldPlanId);
    await sendEmail({
      to: user.email,
      subject: 'Your Trading Plan Has Been Updated',
      body: `Dear ${user.username || 'User'},\n\nYour trading plan has been updated by an administrator.\n\nOld Plan: ${oldPlan?.name || 'N/A'}\nNew Plan: ${newPlan.name}\n\nIf you have any questions, please contact support.\n\nThank you,\nFPX Markets Team`,
    });
  }

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
  
  const user = mockUsersDB[userIndex];
  const oldIsActive = user.is_active;
  user.is_active = isActive;
  user.updated_at = new Date().toISOString();

  if (oldIsActive !== isActive && user.email) {
    await sendEmail({
      to: user.email,
      subject: `Your Account Status Has Been Updated`,
      body: `Dear ${user.username || 'User'},\n\nYour account has been ${isActive ? 'activated' : 'deactivated'} by an administrator.\n\nIf you believe this is an error or have any questions, please contact support immediately.\n\nThank you,\nFPX Markets Team`,
    });
  }

  revalidatePath('/users');
  revalidatePath(`/users/${userId}`);
  return { success: true, message: `User active status updated.` };
}

export async function findUserById(userId: string): Promise<User | null> {
  const user = mockUsersDB.find(u => u.id === userId);
  return user || null;
}
