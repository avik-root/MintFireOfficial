
'use server';

import fs from 'fs/promises';
import path from 'path';
import { z } from 'zod';
// In a real application, use a library like bcrypt for password hashing
// import bcrypt from 'bcryptjs'; 

const adminFilePath = path.join(process.cwd(), 'data', 'admin.json');

// Schema for admin user stored in JSON
const AdminUserStoredSchema = z.object({
  email: z.string().email(),
  // In a real app, this would be a password hash
  // For prototype simplicity, storing password directly.
  // IMPORTANT: This is not secure for production.
  password: z.string(), 
});
type AdminUserStored = z.infer<typeof AdminUserStoredSchema>;

async function getAdmins(): Promise<AdminUserStored[]> {
  try {
    // Ensure 'data' directory exists
    await fs.mkdir(path.dirname(adminFilePath), { recursive: true }); 
    const data = await fs.readFile(adminFilePath, 'utf-8');
    return JSON.parse(data) as AdminUserStored[];
  } catch (error: any) {
    // If file doesn't exist, create it with an empty array
    if (error.code === 'ENOENT') {
      await fs.writeFile(adminFilePath, JSON.stringify([]), 'utf-8');
      return [];
    }
    console.error("Error reading admin file:", error);
    // For other errors, rethrow or handle as appropriate
    throw new Error('Could not read admin data. Please ensure the data directory is writable.');
  }
}

async function saveAdmins(admins: AdminUserStored[]): Promise<void> {
  try {
    // Ensure 'data' directory exists
    await fs.mkdir(path.dirname(adminFilePath), { recursive: true });
    await fs.writeFile(adminFilePath, JSON.stringify(admins, null, 2), 'utf-8');
  } catch (error) {
    console.error("Error writing admin file:", error);
    throw new Error('Could not save admin data. Please ensure the data directory is writable.');
  }
}

export async function checkAdminExists(): Promise<{ exists: boolean; error?: string }> {
  try {
    const admins = await getAdmins();
    return { exists: admins.length > 0 };
  } catch (error: any) {
    return { exists: false, error: error.message || "Failed to check admin status." };
  }
}

export const CreateAdminSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(8, { message: "Password must be at least 8 characters." }),
  confirmPassword: z.string(),
}).refine(async (data) => data.password === data.confirmPassword, {
  message: "Passwords don't match.",
  path: ["confirmPassword"],
});
export type CreateAdminInput = z.infer<typeof CreateAdminSchema>;

export async function createAdminAccount(data: CreateAdminInput): Promise<{ success: boolean; message: string }> {
  try {
    const admins = await getAdmins();
    if (admins.length > 0) {
      return { success: false, message: "An admin account already exists. Cannot create another." };
    }
    // In a real app, hash the password before saving
    // const hashedPassword = await bcrypt.hash(data.password, 10);
    const newAdmin: AdminUserStored = { 
      email: data.email, 
      password: data.password // Store plain password (NOT FOR PRODUCTION)
      // password: hashedPassword 
    };
    await saveAdmins([newAdmin]);
    return { success: true, message: "Admin account created successfully. You can now log in." };
  } catch (error: any) {
    return { success: false, message: error.message || "Failed to create admin account." };
  }
}

export const LoginAdminSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
});
export type LoginAdminInput = z.infer<typeof LoginAdminSchema>;

export async function loginAdmin(data: LoginAdminInput): Promise<{ success: boolean; message: string }> {
  try {
    const admins = await getAdmins();
    const admin = admins.find(a => a.email === data.email);
    if (!admin) {
      return { success: false, message: "Invalid email or password." };
    }
    // In a real app, compare with the hashed password
    // const passwordMatch = await bcrypt.compare(data.password, admin.password);
    // if (!passwordMatch) {
    //   return { success: false, message: "Invalid email or password." };
    // }
    if (admin.password !== data.password) { // Plain text comparison (NOT FOR PRODUCTION)
        return { success: false, message: "Invalid email or password." };
    }
    return { success: true, message: "Login successful! Redirecting..." };
  } catch (error: any) {
    return { success: false, message: error.message || "Failed to log in." };
  }
}
