
// src/actions/adminActions.ts
'use server';

import { query, getClient } from '@/lib/db';
import { revalidatePath } from 'next/cache';

// IMPORTANT SECURITY WARNING:
// THIS IMPLEMENTATION STORES THE ADMIN PIN IN PLAIN TEXT.
// THIS IS NOT SECURE AND SHOULD NEVER BE USED IN A PRODUCTION ENVIRONMENT.
// In a production system, PINs MUST be hashed using a strong algorithm (e.g., bcrypt, Argon2)
// before being stored, and verification should compare hashes.

/**
 * Sets or updates the admin PIN for a given Firebase Auth UID.
 * @param firebaseAuthUid The Firebase Auth UID of the admin.
 * @param pin The new 4-digit PIN.
 */
export async function setAdminPin(firebaseAuthUid: string, pin: string): Promise<{ success: boolean; message: string }> {
  if (!firebaseAuthUid) {
    return { success: false, message: 'Admin user ID is missing.' };
  }
  if (!pin || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
    return { success: false, message: 'PIN must be exactly 4 digits.' };
  }

  try {
    // Check if the user (admin) exists in your 'users' table
    const userCheck = await query('SELECT id FROM users WHERE firebase_auth_uid = $1', [firebaseAuthUid]);
    if (userCheck.rows.length === 0) {
      return { success: false, message: 'Admin user profile not found in the database. Cannot set PIN.' };
    }
    // const userId = userCheck.rows[0].id; // Not strictly needed if updating by firebase_auth_uid

    // Store the PIN (plain text - NOT SECURE FOR PRODUCTION)
    await query('UPDATE users SET admin_pin = $1, updated_at = NOW() WHERE firebase_auth_uid = $2', [pin, firebaseAuthUid]);
    console.log(`Admin action: PIN set/updated for admin UID ${firebaseAuthUid}.`);
    // Revalidate security page or any page displaying PIN status
    revalidatePath('/security');
    return { success: true, message: 'Admin PIN has been set successfully.' };
  } catch (error: any) {
    console.error('Error setting admin PIN:', error);
    return { success: false, message: 'Database error occurred while setting PIN. ' + error.message };
  }
}

/**
 * Verifies the provided PIN against the stored PIN for the admin.
 * @param firebaseAuthUid The Firebase Auth UID of the admin.
 * @param pinToVerify The PIN to verify.
 */
export async function verifyAdminPin(firebaseAuthUid: string, pinToVerify: string): Promise<{ success: boolean; message?: string }> {
  if (!firebaseAuthUid) {
    return { success: false, message: 'Admin user ID is missing.' };
  }
  if (!pinToVerify || pinToVerify.length !== 4 || !/^\d{4}$/.test(pinToVerify)) {
    return { success: false, message: 'Invalid PIN format for verification.' };
  }

  try {
    const result = await query('SELECT admin_pin FROM users WHERE firebase_auth_uid = $1', [firebaseAuthUid]);
    if (result.rows.length === 0) {
      return { success: false, message: 'Admin user not found or PIN not set up.' };
    }
    const storedPin = result.rows[0].admin_pin;
    if (storedPin === null) {
      return { success: false, message: 'Admin PIN is not yet set up.' };
    }
    if (storedPin === pinToVerify) {
      return { success: true };
    } else {
      return { success: false, message: 'Invalid PIN.' };
    }
  } catch (error: any) {
    console.error('Error verifying admin PIN:', error);
    return { success: false, message: 'Database error during PIN verification.' };
  }
}

/**
 * Checks if an admin PIN is set for the given Firebase Auth UID.
 * @param firebaseAuthUid The Firebase Auth UID of the admin.
 */
export async function getAdminPinStatus(firebaseAuthUid: string): Promise<{ isPinSet: boolean; error?: string }> {
  if (!firebaseAuthUid) {
    return { isPinSet: false, error: 'Admin user ID is missing.' };
  }
  try {
    const result = await query('SELECT admin_pin FROM users WHERE firebase_auth_uid = $1', [firebaseAuthUid]);
    if (result.rows.length > 0 && result.rows[0].admin_pin !== null) {
      return { isPinSet: true };
    }
    return { isPinSet: false };
  } catch (error: any) {
    console.error('Error fetching admin PIN status:', error);
    return { isPinSet: false, error: 'Database error fetching PIN status.' };
  }
}
