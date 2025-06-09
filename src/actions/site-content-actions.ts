
'use server';

import fs from 'fs/promises';
import path from 'path';
import { z } from 'zod';
import {
  SiteContentItemSchema,
  CreateSiteContentItemSchema, // Added schema import
  type SiteContentItem,
  type CreateSiteContentItemInput,
  type UpdateSiteContentItemInput
} from '@/lib/schemas/site-content-schemas';
import { revalidatePath } from 'next/cache';

const siteContentFilePath = path.join(process.cwd(), 'data', 'site_content.json');

async function getSiteContentItemsInternal(): Promise<SiteContentItem[]> {
  try {
    await fs.mkdir(path.dirname(siteContentFilePath), { recursive: true });
    const data = await fs.readFile(siteContentFilePath, 'utf-8');
    const items = JSON.parse(data) as unknown[];
    return z.array(SiteContentItemSchema).parse(items);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      await fs.writeFile(siteContentFilePath, JSON.stringify([]), 'utf-8');
      return [];
    }
    console.error("Error reading site content file:", error);
    throw new Error('Could not read site content data.');
  }
}

async function saveSiteContentItems(items: SiteContentItem[]): Promise<void> {
  try {
    await fs.mkdir(path.dirname(siteContentFilePath), { recursive: true });
    await fs.writeFile(siteContentFilePath, JSON.stringify(items, null, 2), 'utf-8');
  } catch (error) {
    console.error("Error writing site content file:", error);
    throw new Error('Could not save site content data.');
  }
}

export async function getSiteContentItems(): Promise<{ items?: SiteContentItem[]; error?: string }> {
  try {
    const items = await getSiteContentItemsInternal();
    // Sort by newest first
    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return { items };
  } catch (error: any) {
    return { error: error.message || "Failed to fetch site content items." };
  }
}

export async function addSiteContentItem(data: CreateSiteContentItemInput): Promise<{ success: boolean; item?: SiteContentItem; error?: string; errors?: z.ZodIssue[] }> {
  const validation = CreateSiteContentItemSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, error: "Invalid data provided.", errors: validation.error.issues };
  }
  
  try {
    const items = await getSiteContentItemsInternal();
    const newItem: SiteContentItem = {
      ...validation.data,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    items.push(newItem);
    await saveSiteContentItems(items);
    revalidatePath('/admin/dashboard/site-content');
    revalidatePath('/'); // Revalidate home page
    return { success: true, item: newItem };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to add site content item." };
  }
}

export async function getSiteContentItemById(id: string): Promise<{ item?: SiteContentItem; error?: string }> {
  try {
    const items = await getSiteContentItemsInternal();
    const item = items.find(p => p.id === id);
    if (!item) {
      return { error: "Site content item not found." };
    }
    return { item };
  } catch (error: any) {
    return { error: error.message || "Failed to fetch site content item." };
  }
}

export async function updateSiteContentItem(id: string, data: UpdateSiteContentItemInput): Promise<{ success: boolean; item?: SiteContentItem; error?: string, errors?: z.ZodIssue[] }> {
  const validation = CreateSiteContentItemSchema.safeParse(data); // Uses the schema object
   if (!validation.success) {
    return { success: false, error: "Invalid data provided.", errors: validation.error.issues };
  }

  try {
    let items = await getSiteContentItemsInternal();
    const itemIndex = items.findIndex(p => p.id === id);

    if (itemIndex === -1) {
      return { success: false, error: "Site content item not found." };
    }

    const updatedItemData: SiteContentItem = {
      ...items[itemIndex], 
      ...validation.data, 
      updatedAt: new Date().toISOString(), 
    };
    
    items[itemIndex] = updatedItemData;
    await saveSiteContentItems(items);
    revalidatePath('/admin/dashboard/site-content');
    revalidatePath(`/admin/dashboard/site-content/edit/${id}`);
    revalidatePath('/'); // Revalidate home page
    return { success: true, item: updatedItemData };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update site content item." };
  }
}

export async function deleteSiteContentItem(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    let items = await getSiteContentItemsInternal();
    const filteredItems = items.filter(p => p.id !== id);

    if (items.length === filteredItems.length) {
      return { success: false, error: "Site content item not found for deletion." };
    }

    await saveSiteContentItems(filteredItems);
    revalidatePath('/admin/dashboard/site-content');
    revalidatePath('/'); // Revalidate home page
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete site content item." };
  }
}
