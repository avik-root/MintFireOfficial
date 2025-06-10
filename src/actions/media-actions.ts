
'use server';

import fs from 'fs/promises';
import path from 'path';
import { revalidatePath } from 'next/cache';
import { randomUUID } from 'crypto';

const UPLOADS_DIR_NAME = 'uploads';
const MEDIA_LIBRARY_DIR_NAME = 'media-library';
const publicUploadsMediaDir = path.join(process.cwd(), 'public', UPLOADS_DIR_NAME, MEDIA_LIBRARY_DIR_NAME);

export async function getUploadedMediaFiles(): Promise<{ files?: string[]; error?: string }> {
  try {
    await fs.mkdir(publicUploadsMediaDir, { recursive: true });
    const filenames = await fs.readdir(publicUploadsMediaDir);
    const files = filenames
      .filter(name => /\.(jpg|jpeg|png|gif|webp)$/i.test(name)) // Basic filter for common image types
      .map(name => `/${UPLOADS_DIR_NAME}/${MEDIA_LIBRARY_DIR_NAME}/${name}`);
    return { files };
  } catch (error: any) {
    console.error("Error reading media library directory:", error);
    return { error: "Failed to retrieve media files. " + error.message };
  }
}

export async function uploadMediaFile(formData: FormData): Promise<{ success: boolean; filePath?: string; error?: string }> {
  try {
    const imageFile = formData.get('imageFile') as File | null;

    if (!imageFile || imageFile.size === 0) {
      return { success: false, error: "No file provided or file is empty." };
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(imageFile.type)) {
      return { success: false, error: 'Invalid file type. Only JPEG, PNG, GIF, WEBP are allowed.' };
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (imageFile.size > maxSize) {
      return { success: false, error: 'File is too large. Maximum size is 5MB.' };
    }

    await fs.mkdir(publicUploadsMediaDir, { recursive: true });
    const sanitizedOriginalFilename = path.basename(imageFile.name);
    const fileExtension = path.extname(sanitizedOriginalFilename) || `.${imageFile.type.split('/')[1] || 'png'}`;
    const uniqueFilename = `${randomUUID()}${fileExtension}`;
    const serverFilePath = path.join(publicUploadsMediaDir, uniqueFilename);
    
    const buffer = Buffer.from(await imageFile.arrayBuffer());
    await fs.writeFile(serverFilePath, buffer);

    const publicFilePath = `/${UPLOADS_DIR_NAME}/${MEDIA_LIBRARY_DIR_NAME}/${uniqueFilename}`;
    
    revalidatePath('/admin/dashboard/media');
    return { success: true, filePath: publicFilePath };

  } catch (error: any) {
    console.error("Error uploading media file:", error);
    return { success: false, error: "Failed to upload media file. " + error.message };
  }
}

export async function deleteMediaFile(filePath: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (!filePath.startsWith(`/${UPLOADS_DIR_NAME}/${MEDIA_LIBRARY_DIR_NAME}/`)) {
      return { success: false, error: "Invalid file path for deletion." };
    }

    const serverFilePath = path.join(process.cwd(), 'public', filePath);
    
    try {
      await fs.access(serverFilePath); // Check if file exists
    } catch (e) {
      return { success: false, error: "File not found on server."};
    }

    await fs.unlink(serverFilePath);
    revalidatePath('/admin/dashboard/media');
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting media file:", error);
    return { success: false, error: "Failed to delete media file. " + error.message };
  }
}

