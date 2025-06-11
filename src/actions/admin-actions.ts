
'use server';

import fs from 'fs/promises';
import path from 'path';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import type { CreateAdminInput, LoginAdminInput, UpdateAdminProfileInput, AdminProfile, AdminUserStored, Enable2FAInput, Change2FAPinInput, Disable2FAInput } from '@/lib/schemas/admin-schemas';
import { AdminUserStoredSchema, CreateAdminSchema, UpdateAdminProfileSchema, Enable2FASchema, Change2FAPinSchema, Disable2FASchema } from '@/lib/schemas/admin-schemas';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers'; 
import { randomBytes } from 'crypto';

const adminFilePath = path.join(process.cwd(), 'data', 'admin.json');
const securityHashFilePath = path.join(process.cwd(), 'data', 'securityhash.json');
const SALT_ROUNDS = 10;
const AUTH_COOKIE_NAME = 'admin-auth-token'; 
const SESSION_MAX_AGE = 8 * 60 * 60; // 8 hours in seconds

async function getSuperActionHashInternal(): Promise<string | null> {
  try {
    const fileContent = await fs.readFile(securityHashFilePath, 'utf-8');
    const data = JSON.parse(fileContent);
    if (data && typeof data.superActionHash === 'string') {
      return data.superActionHash;
    }
    console.error("Super Action Hash not found or invalid in securityhash.json");
    return null;
  } catch (error: any) {
    console.error("Error reading or parsing securityhash.json:", error.message);
    if (error.code === 'ENOENT') {
        console.warn("securityhash.json not found. Super Action will not work.");
    }
    return null;
  }
}


async function getAdminsInternal(): Promise<AdminUserStored[]> {
  try {
    await fs.mkdir(path.dirname(adminFilePath), { recursive: true });
    let fileContent: string;
    try {
      fileContent = await fs.readFile(adminFilePath, 'utf-8');
    } catch (readError: any) {
      if (readError.code === 'ENOENT') {
        await fs.writeFile(adminFilePath, JSON.stringify([]), 'utf-8');
        return [];
      }
      throw readError;
    }
    if (fileContent.trim() === '') return [];
    const items = JSON.parse(fileContent);
    if (!Array.isArray(items)) {
      console.error(`Data in ${adminFilePath} is not an array. Overwriting with empty array.`);
      await fs.writeFile(adminFilePath, JSON.stringify([]), 'utf-8');
      return [];
    }
    return z.array(AdminUserStoredSchema).parse(items);
  } catch (error: any) {
    console.error(`Error processing admin file (${adminFilePath}):`, error);
    let errorMessage = `Could not process admin data.`;
    if (error instanceof z.ZodError) {
      errorMessage = `Admin data validation failed: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`;
    } else if (error.message) {
      errorMessage = `Error reading admin data: ${error.message}`;
    }
    throw new Error(errorMessage);
  }
}

async function saveAdmins(admins: AdminUserStored[]): Promise<void> {
  try {
    await fs.mkdir(path.dirname(adminFilePath), { recursive: true });
    await fs.writeFile(adminFilePath, JSON.stringify(admins, null, 2), 'utf-8');
  } catch (error: any) {
    console.error("Error writing admin file:", error);
    throw new Error('Could not save admin data.');
  }
}

export async function checkAdminExists(): Promise<{ exists: boolean; adminId?: string; is2FAEnabled?: boolean; error?: string }> {
  try {
    const admins = await getAdminsInternal();
    if (admins.length > 0) {
      const admin = admins[0]; 
      return { exists: true, adminId: admin.adminId, is2FAEnabled: admin.is2FAEnabled };
    }
    return { exists: false };
  } catch (error: any) {
    return { exists: false, error: error.message || "Failed to check admin status." };
  }
}

export async function createAdminAccount(data: CreateAdminInput): Promise<{ success: boolean; message: string, errors?: z.ZodIssue[] }> {
  const validation = CreateAdminSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, message: "Invalid data provided.", errors: validation.error.issues };
  }
  try {
    const admins = await getAdminsInternal();
    if (admins.length > 0) {
      return { success: false, message: "An admin account already exists." };
    }
    const hashedPassword = await bcrypt.hash(validation.data.password, SALT_ROUNDS);
    const newAdmin: AdminUserStored = {
      adminName: validation.data.adminName,
      adminId: validation.data.adminId,
      email: validation.data.email,
      password: hashedPassword,
      is2FAEnabled: false,
      hashedPin: null,
    };
    await saveAdmins([newAdmin]);
    console.log("Server: createAdminAccount - Success:", { success: true, message: "Admin account created successfully. You can now log in." });
    return { success: true, message: "Admin account created successfully. You can now log in." };
  } catch (error: any) {
    console.error("Server: createAdminAccount - Error:", error);
    return { success: false, message: error.message || "Failed to create admin account." };
  }
}

export async function loginAdmin(data: LoginAdminInput): Promise<{ success: boolean; message: string; requiresPin?: boolean; adminId?: string }> {
  try {
    const admins = await getAdminsInternal();
    const admin = admins.find(a =>
      a.email.toLowerCase() === data.email.toLowerCase() &&
      a.adminName === data.adminName &&
      a.adminId === data.adminId
    );

    if (!admin) {
      console.log("Server: loginAdmin - Admin not found or details mismatch.");
      return { success: false, message: "Invalid admin credentials." };
    }

    const passwordMatch = await bcrypt.compare(data.password, admin.password);
    if (!passwordMatch) {
      console.log("Server: loginAdmin - Password mismatch for admin:", admin.adminId);
      return { success: false, message: "Invalid admin credentials." };
    }

    if (admin.is2FAEnabled) {
      console.log("Server: loginAdmin - 2FA required for admin:", admin.adminId);
      return { success: true, message: "Login credentials valid. 2FA PIN required.", requiresPin: true, adminId: admin.adminId };
    }

    const token = randomBytes(32).toString('hex');
    const cookieStore = await cookies();
    cookieStore.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_MAX_AGE,
      path: '/',
    });
    console.log("Server: loginAdmin - Login successful (no 2FA) for admin:", admin.adminId, "Token:", token);
    return { success: true, message: "Login successful!" };

  } catch (error: any) {
    console.error("Server: loginAdmin - Error:", error);
    return { success: false, message: error.message || "Failed to process login request." };
  }
}

export async function getAdminProfile(): Promise<{ admin?: AdminProfile; error?: string }> {
  try {
    const cookieStore = await cookies();
    const currentAdminToken = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    if (!currentAdminToken) {
        return { error: "Not authenticated." };
    }
    
    const admins = await getAdminsInternal();
    if (admins.length === 0) {
      return { error: "Admin account not found." };
    }
    const currentAdmin = admins[0]; 
    return {
      admin: {
        adminName: currentAdmin.adminName,
        adminId: currentAdmin.adminId,
        email: currentAdmin.email,
        is2FAEnabled: currentAdmin.is2FAEnabled,
      }
    };
  } catch (error: any) {
    return { error: error.message || "Failed to fetch admin profile." };
  }
}

export async function updateAdminProfile(data: UpdateAdminProfileInput): Promise<{ success: boolean; message: string; errors?: z.ZodIssue[] }> {
  const validation = UpdateAdminProfileSchema.safeParse(data);
  if (!validation.success) {
      return { success: false, message: "Invalid data for update.", errors: validation.error.issues };
  }
  const validatedData = validation.data;

  try {
    const admins = await getAdminsInternal();
    if (admins.length === 0) {
      return { success: false, message: "Admin account not found." };
    }
    let currentAdmin = admins[0];

    if (validatedData.newPassword) {
      if (!validatedData.currentPassword) {
        return { success: false, message: "Current password required to set new password." };
      }
      const currentPasswordMatch = await bcrypt.compare(validatedData.currentPassword, currentAdmin.password);
      if (!currentPasswordMatch) {
        return { success: false, message: "Incorrect current password." };
      }
      currentAdmin.password = await bcrypt.hash(validatedData.newPassword, SALT_ROUNDS);
    }

    currentAdmin.adminName = validatedData.adminName;
    currentAdmin.email = validatedData.email;

    await saveAdmins([currentAdmin, ...admins.slice(1)]);
    revalidatePath('/admin/dashboard/settings');
    console.log("Server: updateAdminProfile - Success");
    return { success: true, message: "Admin profile updated successfully." };
  } catch (error: any)
{
    console.error("Server: updateAdminProfile - Error:", error);
    return { success: false, message: error.message || "Failed to update admin profile." };
  }
}

export async function enable2FA(adminId: string, pinData: Enable2FAInput): Promise<{ success: boolean; message: string; errors?: z.ZodIssue[] }> {
  const validation = Enable2FASchema.safeParse(pinData);
  if(!validation.success) {
    return { success: false, message: "Invalid PIN data.", errors: validation.error.issues };
  }
  try {
    const admins = await getAdminsInternal();
    const adminIndex = admins.findIndex(a => a.adminId === adminId);
    if (adminIndex === -1) return { success: false, message: "Admin not found." };

    admins[adminIndex].hashedPin = await bcrypt.hash(validation.data.newPin, SALT_ROUNDS);
    admins[adminIndex].is2FAEnabled = true;
    await saveAdmins(admins);
    revalidatePath('/admin/dashboard/settings');
    console.log("Server: enable2FA - Success for admin:", adminId);
    return { success: true, message: "2FA enabled successfully." };
  } catch (error: any) {
    console.error("Server: enable2FA - Error:", error);
    return { success: false, message: error.message || "Failed to enable 2FA." };
  }
}

export async function change2FAPin(adminId: string, pinData: Change2FAPinInput): Promise<{ success: boolean; message: string; errors?: z.ZodIssue[] }> {
  const validation = Change2FAPinSchema.safeParse(pinData);
   if(!validation.success) {
    return { success: false, message: "Invalid PIN data.", errors: validation.error.issues };
  }
  try {
    const admins = await getAdminsInternal();
    const adminIndex = admins.findIndex(a => a.adminId === adminId);
    if (adminIndex === -1) return { success: false, message: "Admin not found." };
    const admin = admins[adminIndex];
    if (!admin.is2FAEnabled || !admin.hashedPin) return { success: false, message: "2FA is not enabled for this account."};

    if (!validation.data.currentPin) {
       return { success: false, message: "Current PIN is required to change PIN.", errors: [{path: ["currentPin"], message: "Current PIN is required.", code: z.ZodIssueCode.custom}] };
    }
    const currentPinMatch = await bcrypt.compare(validation.data.currentPin, admin.hashedPin);
    if (!currentPinMatch) return { success: false, message: "Incorrect current PIN." };

    admins[adminIndex].hashedPin = await bcrypt.hash(validation.data.newPin, SALT_ROUNDS);
    await saveAdmins(admins);
    revalidatePath('/admin/dashboard/settings');
    console.log("Server: change2FAPin - Success for admin:", adminId);
    return { success: true, message: "2FA PIN changed successfully." };
  } catch (error: any) {
    console.error("Server: change2FAPin - Error:", error);
    return { success: false, message: error.message || "Failed to change 2FA PIN." };
  }
}

export async function disable2FA(adminId: string, verificationData: Disable2FAInput): Promise<{ success: boolean; message: string; errors?: z.ZodIssue[] }> {
  const validation = Disable2FASchema.safeParse(verificationData);
  if(!validation.success){
      return {success: false, message: "Invalid input", errors: validation.error.issues};
  }
  try {
    const admins = await getAdminsInternal();
    const adminIndex = admins.findIndex(a => a.adminId === adminId);
    if (adminIndex === -1) return { success: false, message: "Admin not found." };
    const admin = admins[adminIndex];
    if (!admin.is2FAEnabled) return { success: false, message: "2FA is already disabled."};
    
    if (admin.is2FAEnabled && !admin.hashedPin) {
        console.warn(`Admin ${admin.adminId} has 2FA enabled but no hashedPin stored. Proceeding to disable based on password.`);
    }

    let verified = false;
    if (admin.hashedPin) {
      verified = await bcrypt.compare(validation.data.currentPinOrPassword, admin.hashedPin);
    }
    if (!verified) {
      verified = await bcrypt.compare(validation.data.currentPinOrPassword, admin.password);
    }
    if (!verified) return { success: false, message: "Incorrect current PIN or password." };

    admins[adminIndex].is2FAEnabled = false;
    admins[adminIndex].hashedPin = null;
    await saveAdmins(admins);
    revalidatePath('/admin/dashboard/settings');
    revalidatePath('/admin/login');
    console.log("Server: disable2FA - Success for admin:", adminId);
    return { success: true, message: "2FA disabled successfully." };
  } catch (error: any) {
    console.error("Server: disable2FA - Error:", error);
    return { success: false, message: error.message || "Failed to disable 2FA." };
  }
}

export async function verifyPinForLogin(adminId: string, pin: string): Promise<{ success: boolean; message?: string }> {
    console.log("Server: verifyPinForLogin called for adminId:", adminId);
    try {
        const admins = await getAdminsInternal();
        const admin = admins.find(a => a.adminId === adminId);
        if (!admin) {
            console.log("Server: verifyPinForLogin - Admin not found.");
            return { success: false, message: "Admin not found." };
        }
        if (!admin.is2FAEnabled || !admin.hashedPin) {
            console.log("Server: verifyPinForLogin - 2FA not active for admin:", adminId);
            return { success: false, message: "2FA is not active for this account." };
        }

        const pinMatch = await bcrypt.compare(pin, admin.hashedPin);
        if (pinMatch) {
            const token = randomBytes(32).toString('hex');
            const cookieStore = await cookies();
            cookieStore.set(AUTH_COOKIE_NAME, token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: SESSION_MAX_AGE,
                path: '/',
            });
            console.log("Server: verifyPinForLogin - PIN verified, token set for admin:", adminId, "Token:", token);
            return { success: true, message: "PIN verified. Login successful." };
        } else {
            console.log("Server: verifyPinForLogin - Incorrect PIN for admin:", adminId);
            return { success: false, message: "Incorrect PIN." };
        }
    } catch (error: any) {
        console.error("Server: verifyPinForLogin - Error:", error);
        return { success: false, message: error.message || "PIN verification failed." };
    }
}

export async function disable2FABySuperAction(adminId: string, superActionAttempt: string): Promise<{ success: boolean; message: string }> {
    const SUPER_ACTION_HASH_FROM_FILE = await getSuperActionHashInternal();
    if (!SUPER_ACTION_HASH_FROM_FILE) {
      return { success: false, message: "Super Action feature is not configured correctly." };
    }

    if (superActionAttempt !== SUPER_ACTION_HASH_FROM_FILE) {
        return { success: false, message: "Invalid Super Action." };
    }
    try {
        const admins = await getAdminsInternal();
        const adminIndex = admins.findIndex(a => a.adminId === adminId);
        if (adminIndex === -1) return { success: false, message: "Admin not found for Super Action." };

        admins[adminIndex].is2FAEnabled = false;
        admins[adminIndex].hashedPin = null;
        await saveAdmins(admins);
        const cookieStore = await cookies();
        cookieStore.delete(AUTH_COOKIE_NAME);
        revalidatePath('/admin/dashboard/settings');
        revalidatePath('/admin/login');
        console.log("Server: disable2FABySuperAction - Success for admin:", adminId);
        return { success: true, message: "2FA disabled via Super Action. Please log in again." };
    } catch (error: any) {
        console.error("Server: disable2FABySuperAction - Error:", error);
        return { success: false, message: error.message || "Failed to disable 2FA with Super Action." };
    }
}

export async function logoutAdmin(): Promise<{ success: boolean; message: string }> {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(AUTH_COOKIE_NAME); 
    console.log("Server: logoutAdmin - Success, cookie cleared.");
    return { success: true, message: "Logged out successfully." };
  } catch (error: any) {
    console.error("Server: logoutAdmin - Error:", error);
    return { success: false, message: "Logout failed. " + error.message };
  }
}
    
