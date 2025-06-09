
'use server';

import fs from 'fs/promises';
import path from 'path';
import { z } from 'zod';
import type { CreateAdminInput, LoginAdminInput, UpdateAdminProfileInput, AdminProfile, AdminUserStored } from '@/lib/schemas/admin-schemas';
import { AdminUserStoredSchema, CreateAdminSchema } from '@/lib/schemas/admin-schemas'; // Ensure CreateAdminSchema is imported for password validation reference
import { revalidatePath } from 'next/cache';

const adminFilePath = path.join(process.cwd(), 'data', 'admin.json');

async function getAdminsInternal(): Promise<AdminUserStored[]> {
  try {
    await fs.mkdir(path.dirname(adminFilePath), { recursive: true }); 
    const data = await fs.readFile(adminFilePath, 'utf-8');
    const parsedData = JSON.parse(data);
    return z.array(AdminUserStoredSchema).parse(parsedData);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      await fs.writeFile(adminFilePath, JSON.stringify([]), 'utf-8');
      return [];
    }
    console.error("Error reading admin file:", error);
    throw new Error('Could not read admin data. Please ensure the data directory is writable.');
  }
}

async function saveAdmins(admins: AdminUserStored[]): Promise<void> {
  try {
    await fs.mkdir(path.dirname(adminFilePath), { recursive: true });
    await fs.writeFile(adminFilePath, JSON.stringify(admins, null, 2), 'utf-8');
  } catch (error) {
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

export async function createAdminAccount(data: CreateAdminInput): Promise<{ success: boolean; message: string }> {
  try {
    const admins = await getAdminsInternal();
    if (admins.length > 0) {
      return { success: false, message: "An admin account already exists. Cannot create another." };
    }
    const newAdmin: AdminUserStored = { 
      adminName: data.adminName,
      adminId: data.adminId,
      email: data.email, 
      password: data.password 
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
    if (admin.password !== data.password) {
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
  try {
    const admins = await getAdminsInternal();
    if (admins.length === 0) {
      return { success: false, message: "Admin account not found. Cannot update." };
    }
    
    let currentAdmin = admins[0]; // Assuming single admin

    // Handle password change
    if (data.newPassword) {
      if (!data.currentPassword) {
        return { success: false, message: "Current password is required to set a new password." };
      }
      if (data.currentPassword !== currentAdmin.password) {
        return { success: false, message: "Incorrect current password." };
      }
      // Password strength is validated by the Zod schema (UpdateAdminProfileSchema)
      currentAdmin.password = data.newPassword;
    }

    // Update other details
    currentAdmin.adminName = data.adminName;
    currentAdmin.adminId = data.adminId;
    currentAdmin.email = data.email;

    await saveAdmins([currentAdmin, ...admins.slice(1)]); // Save updated admin (and any others, though it's single admin for now)
    
    revalidatePath('/admin/dashboard/settings'); // Revalidate settings page
    
    return { success: true, message: "Admin profile updated successfully." };

  } catch (error: any) {
    console.error("Error updating admin profile:", error);
    return { success: false, message: error.message || "Failed to update admin profile." };
  }
}
