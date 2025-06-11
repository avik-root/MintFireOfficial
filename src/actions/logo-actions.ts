
'use server';

import fs from 'fs/promises';
import path from 'path';
import { revalidatePath } from 'next/cache';
import { randomUUID } from 'crypto'; // Not strictly needed if overwriting, but good for general util

const UPLOADS_DIR_NAME = 'uploads';
const LOGO_DIR_NAME = 'logo';
const publicUploadsLogoDir = path.join(process.cwd(), 'public', UPLOADS_DIR_NAME, LOGO_DIR_NAME);

const ALLOWED_EXTENSIONS = ['.png', '.jpg', '.jpeg'];
const MAX_FILE_SIZE_MB = 1; // 1 MB

async function ensureLogoDirectoryExists(): Promise<void> {
  try {
    await fs.mkdir(publicUploadsLogoDir, { recursive: true });
  } catch (error: any) {
    console.error("Failed to create logo directory:", error);
    throw new Error("Could not create logo directory on the server.");
  }
}

async function clearLogoDirectory(): Promise<void> {
  try {
    await ensureLogoDirectoryExists();
    const files = await fs.readdir(publicUploadsLogoDir);
    for (const file of files) {
      if (file.startsWith('logo.')) { // Only delete files named logo.png or logo.jpg etc.
        await fs.unlink(path.join(publicUploadsLogoDir, file));
      }
    }
  } catch (error: any) {
    console.error("Failed to clear logo directory:", error);
    // Non-fatal, but log it. The new upload will try to overwrite.
  }
}

export async function uploadLogoAction(formData: FormData): Promise<{ success: boolean; filePath?: string; error?: string }> {
  try {
    await ensureLogoDirectoryExists();

    const logoFile = formData.get('logoFile') as File | null;

    if (!logoFile || logoFile.size === 0) {
      return { success: false, error: "No file provided or file is empty." };
    }

    const fileExtension = path.extname(logoFile.name).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(fileExtension)) {
      return { success: false, error: `Invalid file type. Only ${ALLOWED_EXTENSIONS.join(', ')} are allowed.` };
    }

    if (logoFile.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      return { success: false, error: `File is too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.` };
    }

    await clearLogoDirectory(); // Remove old logo.ext

    const newFilename = `logo${fileExtension}`; // e.g., logo.png or logo.jpg
    const serverFilePath = path.join(publicUploadsLogoDir, newFilename);
    
    const buffer = Buffer.from(await logoFile.arrayBuffer());
    await fs.writeFile(serverFilePath, buffer);

    const publicFilePath = `/${UPLOADS_DIR_NAME}/${LOGO_DIR_NAME}/${newFilename}`;
    
    // Revalidate paths where the logo is displayed
    revalidatePath('/');
    revalidatePath('/admin', 'layout'); // Revalidate admin layout if logo is there
    // Add other paths as needed

    return { success: true, filePath: publicFilePath };

  } catch (error: any) {
    console.error("Error uploading logo file:", error);
    return { success: false, error: "Failed to upload logo file. " + error.message };
  }
}

export async function getCurrentLogoPath(): Promise<string | null> {
  try {
    await ensureLogoDirectoryExists();
    const files = await fs.readdir(publicUploadsLogoDir);
    const pngLogo = files.find(file => file.toLowerCase() === 'logo.png');
    if (pngLogo) return `/${UPLOADS_DIR_NAME}/${LOGO_DIR_NAME}/${pngLogo}`;
    
    const jpgLogo = files.find(file => file.toLowerCase() === 'logo.jpg');
    if (jpgLogo) return `/${UPLOADS_DIR_NAME}/${LOGO_DIR_NAME}/${jpgLogo}`;

    const jpegLogo = files.find(file => file.toLowerCase() === 'logo.jpeg');
    if (jpegLogo) return `/${UPLOADS_DIR_NAME}/${LOGO_DIR_NAME}/${jpegLogo}`;

    return null;
  } catch (error) {
    // If directory doesn't exist or other read error, assume no logo
    console.warn("Could not read logo directory, assuming no custom logo:", error);
    return null;
  }
}
