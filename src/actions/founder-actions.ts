
'use server';

import fs from 'fs/promises';
import path from 'path';
import { z } from 'zod';
import {
  FounderSchema,
  FormFounderSchema,
  type Founder,
} from '@/lib/schemas/founder-schema';
import { revalidatePath } from 'next/cache';
import { randomUUID } from 'crypto';

const foundersFilePath = path.join(process.cwd(), 'data', 'founders.json');
const UPLOADS_DIR_NAME = 'uploads';
const TEAM_PHOTOS_DIR_NAME = 'team-photos'; 
const publicUploadsDir = path.join(process.cwd(), 'public', UPLOADS_DIR_NAME, TEAM_PHOTOS_DIR_NAME);

async function getFoundersInternal(): Promise<Founder[]> {
  try {
    await fs.mkdir(path.dirname(foundersFilePath), { recursive: true });

    let fileContent: string;
    try {
      fileContent = await fs.readFile(foundersFilePath, 'utf-8');
    } catch (readError: any) {
      if (readError.code === 'ENOENT') {
        await fs.writeFile(foundersFilePath, JSON.stringify([]), 'utf-8');
        return [];
      }
      throw readError;
    }

    if (fileContent.trim() === '') {
      return [];
    }

    const items = JSON.parse(fileContent);

    if (!Array.isArray(items)) {
      console.error(`Data in ${foundersFilePath} is not an array. Found: ${typeof items}. Overwriting with empty array.`);
      await fs.writeFile(foundersFilePath, JSON.stringify([]), 'utf-8');
      return [];
    }
    
    let parsedItems = z.array(FounderSchema).parse(items);
    parsedItems.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    return parsedItems;
  } catch (error: any) {
    console.error(`Error processing founders file (${foundersFilePath}):`, error);
    let errorMessage = `Could not process founder data from ${foundersFilePath}.`;
    if (error instanceof z.ZodError) {
      errorMessage = `Founder data validation failed: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`;
    } else if (error.message) {
      errorMessage = `Error reading founder data: ${error.message}`;
    }
    throw new Error(errorMessage);
  }
}

async function saveFounders(items: Founder[]): Promise<void> {
  try {
    await fs.mkdir(path.dirname(foundersFilePath), { recursive: true });
    await fs.writeFile(foundersFilePath, JSON.stringify(items, null, 2), 'utf-8');
  } catch (error: any) {
    console.error("Error writing founders file:", error);
    throw new Error('Could not save founder data.');
  }
}

async function handleImageUpload(imageFile: File | null): Promise<string | null> {
  if (!imageFile) return null;

  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(imageFile.type)) {
    throw new Error('Invalid file type. Only JPEG, PNG, GIF, WEBP are allowed.');
  }
  const maxSize = 2 * 1024 * 1024; // 2MB
  if (imageFile.size > maxSize) {
    throw new Error('File is too large. Maximum size is 2MB.');
  }

  await fs.mkdir(publicUploadsDir, { recursive: true });
  const sanitizedOriginalFilename = path.basename(imageFile.name);
  const fileExtension = path.extname(sanitizedOriginalFilename) || '.png';
  const uniqueFilename = `${randomUUID()}${fileExtension}`;
  const filePath = path.join(publicUploadsDir, uniqueFilename);
  
  const buffer = Buffer.from(await imageFile.arrayBuffer());
  await fs.writeFile(filePath, buffer);

  return `/${UPLOADS_DIR_NAME}/${TEAM_PHOTOS_DIR_NAME}/${uniqueFilename}`;
}

export async function getFounders(): Promise<{ founders?: Founder[]; error?: string }> {
  try {
    const founders = await getFoundersInternal();
    return { founders };
  } catch (error: any) {
    return { error: error.message || "Failed to fetch founders." };
  }
}

export async function addFounder(formData: FormData): Promise<{ success: boolean; founder?: Founder; error?: string; errors?: z.ZodIssue[] }> {
  try {
    const rawData: Record<string, any> = {};
    formData.forEach((value, key) => {
      if ((key === 'githubUrl' || key === 'linkedinUrl') && value === '') {
        rawData[key] = undefined;
      } else if (key !== 'imageFile') {
        rawData[key] = value;
      }
    });

    const validation = FormFounderSchema.safeParse(rawData);
    if (!validation.success) {
      return { success: false, error: "Invalid data provided.", errors: validation.error.issues };
    }
    
    const validatedData = validation.data;
    const imageFile = formData.get('imageFile') as File | null;
    let imageUrl: string | null = null;

    if (imageFile && imageFile.size > 0) {
      imageUrl = await handleImageUpload(imageFile);
    }

    const founders = await getFoundersInternal();
    const now = new Date().toISOString();
    const newFounder: Founder = {
      id: randomUUID(),
      name: validatedData.name,
      role: validatedData.role,
      description: validatedData.description,
      email: validatedData.email,
      githubUrl: validatedData.githubUrl || "",
      linkedinUrl: validatedData.linkedinUrl || "",
      imageUrl: imageUrl || "",
      createdAt: now,
      updatedAt: now,
    };
    
    founders.push(newFounder);
    await saveFounders(founders);
    revalidatePath('/admin/dashboard/founders');
    revalidatePath('/company'); 
    return { success: true, founder: newFounder };
  } catch (error: any) {
    console.error("Add founder error:", error);
    return { success: false, error: error.message || "Failed to add founder." };
  }
}

export async function getFounderById(id: string): Promise<{ founder?: Founder; error?: string }> {
  try {
    const founders = await getFoundersInternal();
    const founder = founders.find(p => p.id === id);
    if (!founder) {
      return { error: "Founder not found." };
    }
    return { founder };
  } catch (error: any) {
    return { error: error.message || "Failed to fetch founder." };
  }
}

export async function updateFounder(id: string, formData: FormData): Promise<{ success: boolean; founder?: Founder; error?: string, errors?: z.ZodIssue[] }> {
  try {
    const rawData: Record<string, any> = {};
     formData.forEach((value, key) => {
      if ((key === 'githubUrl' || key === 'linkedinUrl') && value === '') {
        rawData[key] = undefined; 
      } else if (key !== 'imageFile' && key !== 'existingImageUrl') {
        rawData[key] = value;
      }
    });

    const validation = FormFounderSchema.partial().safeParse(rawData); 
    if (!validation.success) {
      return { success: false, error: "Invalid data provided for update.", errors: validation.error.issues };
    }
    
    const validatedData = validation.data;
    let founders = await getFoundersInternal();
    const founderIndex = founders.findIndex(p => p.id === id);

    if (founderIndex === -1) {
      return { success: false, error: "Founder not found." };
    }
    
    const originalFounder = founders[founderIndex];
    let imageUrlToSave = originalFounder.imageUrl; 
    const imageFile = formData.get('imageFile') as File | null;
    const existingImageUrlFromForm = formData.get('existingImageUrl') as string | null;

    if (imageFile && imageFile.size > 0) {
      // Delete old image if it exists and a new one is uploaded
      if (originalFounder.imageUrl && originalFounder.imageUrl.startsWith(`/${UPLOADS_DIR_NAME}/${TEAM_PHOTOS_DIR_NAME}/`)) {
        try {
          const oldImagePath = path.join(process.cwd(), 'public', originalFounder.imageUrl);
          await fs.unlink(oldImagePath).catch(e => console.warn(`Non-critical: Failed to delete old image ${oldImagePath}: ${e.message}`));
        } catch (imgDelError: any) {
          console.warn(`Failed to delete old image ${originalFounder.imageUrl}: ${imgDelError.message}`);
        }
      }
      imageUrlToSave = await handleImageUpload(imageFile); 
    } else if (existingImageUrlFromForm !== null && existingImageUrlFromForm === "" && originalFounder.imageUrl) {
      // User wants to remove the existing image
       if (originalFounder.imageUrl.startsWith(`/${UPLOADS_DIR_NAME}/${TEAM_PHOTOS_DIR_NAME}/`)) {
          try {
            const oldImagePath = path.join(process.cwd(), 'public', originalFounder.imageUrl);
            await fs.unlink(oldImagePath).catch(e => console.warn(`Non-critical: Failed to delete old image ${oldImagePath}: ${e.message}`));
          } catch (imgDelError: any) {
            console.warn(`Failed to delete old image ${originalFounder.imageUrl}: ${imgDelError.message}`);
          }
        }
      imageUrlToSave = ""; // Set to empty string
    } else if (existingImageUrlFromForm !== null) {
      imageUrlToSave = existingImageUrlFromForm; // Keep existing if no new file and not explicitly removed
    }


    const updatedFounderData: Founder = {
      ...originalFounder,
      name: validatedData.name ?? originalFounder.name,
      role: validatedData.role ?? originalFounder.role,
      description: validatedData.description ?? originalFounder.description,
      email: validatedData.email ?? originalFounder.email,
      githubUrl: validatedData.githubUrl !== undefined ? validatedData.githubUrl : originalFounder.githubUrl,
      linkedinUrl: validatedData.linkedinUrl !== undefined ? validatedData.linkedinUrl : originalFounder.linkedinUrl,
      imageUrl: imageUrlToSave || "",
      updatedAt: new Date().toISOString(), 
    };
    
    founders[founderIndex] = updatedFounderData;
    await saveFounders(founders);
    revalidatePath('/admin/dashboard/founders');
    revalidatePath(`/admin/dashboard/founders/edit/${id}`);
    revalidatePath('/company');
    return { success: true, founder: updatedFounderData };
  } catch (error: any) {
    console.error("Update founder error:", error);
    return { success: false, error: error.message || "Failed to update founder." };
  }
}

export async function deleteFounder(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    let founders = await getFoundersInternal();
    const founderToDelete = founders.find(p => p.id === id);
    if (!founderToDelete) {
      return { success: false, error: "Founder not found for deletion." };
    }

    if (founderToDelete.imageUrl && founderToDelete.imageUrl.startsWith(`/${UPLOADS_DIR_NAME}/${TEAM_PHOTOS_DIR_NAME}/`)) {
      try {
        const imagePath = path.join(process.cwd(), 'public', founderToDelete.imageUrl);
        await fs.unlink(imagePath).catch(e => console.warn(`Non-critical: Failed to delete image ${imagePath}: ${e.message}`));
      } catch (imgDelError: any) {
        console.warn(`Failed to delete image ${founderToDelete.imageUrl}: ${imgDelError.message}`);
      }
    }

    const filteredFounders = founders.filter(p => p.id !== id);
    await saveFounders(filteredFounders);

    revalidatePath('/admin/dashboard/founders');
    revalidatePath('/company'); 
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete founder." };
  }
}

