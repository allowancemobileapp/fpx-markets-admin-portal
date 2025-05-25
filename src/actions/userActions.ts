
'use server';

import type { User, TradingPlan } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import { sendEmail } from '@/services/emailService';
import { query } from '@/lib/db';

export async function findUserById(userId: string): Promise<User | null> {
  try {
    const result = await query('SELECT * FROM users WHERE id = $1', [userId]);
    if (result.rows.length === 0) {
      return null;
    }
    // Manually map to ensure type consistency, especially for date fields
    const dbUser = result.rows[0];
    return {
      id: dbUser.id,
      firebase_auth_uid: dbUser.firebase_auth_uid,
      username: dbUser.username,
      email: dbUser.email,
      first_name: dbUser.first_name,
      last_name: dbUser.last_name,
      phone_number: dbUser.phone_number,
      country_code: dbUser.country_code,
      trading_plan_id: parseInt(dbUser.trading_plan_id, 10),
      profile_completed_at: dbUser.profile_completed_at ? new Date(dbUser.profile_completed_at).toISOString() : null,
      pin_setup_completed_at: dbUser.pin_setup_completed_at ? new Date(dbUser.pin_setup_completed_at).toISOString() : null,
      is_active: dbUser.is_active,
      is_email_verified: dbUser.is_email_verified,
      created_at: new Date(dbUser.created_at).toISOString(),
      updated_at: new Date(dbUser.updated_at).toISOString(),
    };
  } catch (error) {
    console.error('Error finding user by ID:', error);
    return null;
  }
}

export async function getAllUsers(): Promise<User[]> {
  try {
    const result = await query('SELECT * FROM users ORDER BY created_at DESC');
    return result.rows.map(dbUser => ({
      id: dbUser.id,
      firebase_auth_uid: dbUser.firebase_auth_uid,
      username: dbUser.username,
      email: dbUser.email,
      first_name: dbUser.first_name,
      last_name: dbUser.last_name,
      phone_number: dbUser.phone_number,
      country_code: dbUser.country_code,
      trading_plan_id: parseInt(dbUser.trading_plan_id, 10),
      profile_completed_at: dbUser.profile_completed_at ? new Date(dbUser.profile_completed_at).toISOString() : null,
      pin_setup_completed_at: dbUser.pin_setup_completed_at ? new Date(dbUser.pin_setup_completed_at).toISOString() : null,
      is_active: dbUser.is_active,
      is_email_verified: dbUser.is_email_verified,
      created_at: new Date(dbUser.created_at).toISOString(),
      updated_at: new Date(dbUser.updated_at).toISOString(),
    }));
  } catch (error) {
    console.error('Error getting all users:', error);
    return [];
  }
}

export async function getAllTradingPlans(): Promise<TradingPlan[]> {
  try {
    const result = await query('SELECT * FROM trading_plans ORDER BY id ASC');
    return result.rows.map(plan => ({
      id: parseInt(plan.id, 10),
      name: plan.name,
      minimum_deposit_usd: parseFloat(plan.minimum_deposit_usd),
      description: plan.description,
      commission_details: plan.commission_details,
      leverage_info: plan.leverage_info,
      max_open_trades: plan.max_open_trades ? parseInt(plan.max_open_trades, 10) : null,
      allow_copy_trading: plan.allow_copy_trading,
      created_at: new Date(plan.created_at).toISOString(),
      updated_at: new Date(plan.updated_at).toISOString(),
    }));
  } catch (error) {
    console.error('Error fetching trading plans:', error);
    return [];
  }
}


export async function updateUserTradingPlan(userId: string, tradingPlanId: number): Promise<{ success: boolean; message: string }> {
  console.log(`Admin action: Updating trading plan for user ${userId} to plan ID ${tradingPlanId}.`);

  const user = await findUserById(userId);
  if (!user) {
    return { success: false, message: 'User not found.' };
  }
  
  const tradingPlans = await getAllTradingPlans();
  const newPlan = tradingPlans.find(tp => tp.id === tradingPlanId);
  if (!newPlan) {
      return { success: false, message: 'Trading plan not found.' };
  }

  const oldPlanId = user.trading_plan_id;

  try {
    await query('UPDATE users SET trading_plan_id = $1, updated_at = NOW() WHERE id = $2', [tradingPlanId, userId]);
    
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
  } catch (error) {
    console.error('Error updating user trading plan:', error);
    return { success: false, message: 'Database error occurred while updating trading plan.' };
  }
}

export async function toggleUserActiveStatus(userId: string, isActive: boolean): Promise<{ success: boolean; message: string }> {
  console.log(`Admin action: Setting user ${userId} active status to ${isActive}.`);
  
  const user = await findUserById(userId);
  if (!user) {
    return { success: false, message: 'User not found.' };
  }
  
  const oldIsActive = user.is_active;

  try {
    await query('UPDATE users SET is_active = $1, updated_at = NOW() WHERE id = $2', [isActive, userId]);

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
  } catch (error) {
    console.error('Error toggling user active status:', error);
    return { success: false, message: 'Database error occurred while updating user status.' };
  }
}
