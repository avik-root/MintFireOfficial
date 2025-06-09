
'use server';

import fs from 'fs/promises';
import path from 'path';
import { z } from 'zod';
import type { CreateAdminInput, LoginAdminInput, UpdateAdminProfileInput, AdminProfile, AdminUserStored } from '@/lib/schemas/admin-schemas';
import { AdminUserStoredSchema, CreateAdminSchema, UpdateAdminProfileSchema, BaseCreateAdminSchemaContents } from '@/lib/schemas/admin-schemas';
import { revalidatePath } from 'next/cache';

const adminFilePath = path.join(process.cwd(), 'data', 'admin.json');

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

    if (fileContent.trim() === '') {
      return [];
    }

    const items = JSON.parse(fileContent);

    if (!Array.isArray(items)) {
      console.error(`Data in ${adminFilePath} is not an array. Found: ${typeof items}. Overwriting with empty array.`);
      await fs.writeFile(adminFilePath, JSON.stringify([]), 'utf-8');
      return [];
    }
    
    return z.array(AdminUserStoredSchema).parse(items);
  } catch (error: any) {
    console.error(`Error processing admin file (${adminFilePath}):`, error);
    let errorMessage = `Could not process admin data from ${adminFilePath}.`;
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
    throw new Error('Could not save admin data. Please ensure the data directory is writable.');
  }
}

export async function checkAdminExists(): Promise<{ exists: boolean; error?: string }> {
  try {
    const admins = await getAdminsInternal();
    return { exists: admins.length > 0 };
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
      return { success: false, message: "An admin account already exists. Cannot create another." };
    }
    const newAdmin: AdminUserStored = { 
      adminName: validation.data.adminName,
      adminId: validation.data.adminId,
      email: validation.data.email, 
      password: validation.data.password // Store password directly as per current design
    };
    await saveAdmins([newAdmin]);
    return { success: true, message: "Admin account created successfully. You can now log in." };
  } catch (error: any) {
    return { success: false, message: error.message || "Failed to create admin account." };
  }
}

export async function loginAdmin(data: LoginAdminInput): Promise<{ success: boolean; message: string }> {
  try {
    const admins = await getAdminsInternal();
    const admin = admins.find(a => 
      a.email === data.email &&
      a.adminName === data.adminName &&
      a.adminId === data.adminId
    );

    if (!admin) {
      return { success: false, message: "Invalid credentials." };
    }
    if (admin.password !== data.password) { // Direct password comparison
        return { success: false, message: "Invalid credentials." };
    }
    return { success: true, message: "Login successful! Redirecting..." };
  } catch (error: any) {
    return { success: false, message: error.message || "Failed to log in." };
  }
}

export async function getAdminProfile(): Promise<{ admin?: AdminProfile; error?: string }> {
  try {
    const admins = await getAdminsInternal();
    if (admins.length === 0) {
      return { error: "Admin account not found." };
    }
    const currentAdmin = admins[0]; // Assuming single admin system
    return { 
      admin: {
        adminName: currentAdmin.adminName,
        adminId: currentAdmin.adminId,
        email: currentAdmin.email,
      } 
    };
  } catch (error: any) {
    return { error: error.message || "Failed to fetch admin profile." };
  }
}

export async function updateAdminProfile(data: UpdateAdminProfileInput): Promise<{ success: boolean; message: string; errors?: z.ZodIssue[] }> {
  const validation = UpdateAdminProfileSchema.safeParse(data);
  if (!validation.success) {
      return { success: false, message: "Invalid data provided for update.", errors: validation.error.issues };
  }
  const validatedData = validation.data;

  try {
    const admins = await getAdminsInternal();
    if (admins.length === 0) {
      return { success: false, message: "Admin account not found. Cannot update." };
    }
    
    let currentAdmin = admins[0]; 

    if (validatedData.newPassword) {
      if (!validatedData.currentPassword) {
        return { success: false, message: "Current password is required to set a new password." };
      }
      if (validatedData.currentPassword !== currentAdmin.password) {
        return { success: false, message: "Incorrect current password." };
      }
      currentAdmin.password = validatedData.newPassword;
    }

    currentAdmin.adminName = validatedData.adminName;
    currentAdmin.adminId = validatedData.adminId;
    currentAdmin.email = validatedData.email;

    await saveAdmins([currentAdmin, ...admins.slice(1)]);
    
    revalidatePath('/admin/dashboard/settings'); 
    
    return { success: true, message: "Admin profile updated successfully." };

  } catch (error: any) {
    console.error("Error updating admin profile:", error);
    return { success: false, message: error.message || "Failed to update admin profile." };
  }
}
