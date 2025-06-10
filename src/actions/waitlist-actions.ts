
'use server';

import fs from 'fs/promises';
import path from 'path';
import { z } from 'zod';
import {
  WaitlistEntrySchema,
  type WaitlistEntry,
  type CreateWaitlistEntryInput,
} from '@/lib/schemas/waitlist-schemas';
import { revalidatePath } from 'next/cache';

const waitlistFilePath = path.join(process.cwd(), 'data', 'waitlist.json');

async function getWaitlistEntriesInternal(): Promise<WaitlistEntry[]> {
  try {
    await fs.mkdir(path.dirname(waitlistFilePath), { recursive: true });
    let fileContent: string;
    try {
      fileContent = await fs.readFile(waitlistFilePath, 'utf-8');
    } catch (readError: any) {
      if (readError.code === 'ENOENT') {
        await fs.writeFile(waitlistFilePath, JSON.stringify([]), 'utf-8');
        return [];
      }
      throw readError;
    }
    if (fileContent.trim() === '') return [];
    const items = JSON.parse(fileContent);
    return z.array(WaitlistEntrySchema).parse(items);
  } catch (error: any) {
    console.error(`Error processing waitlist file (${waitlistFilePath}):`, error);
    let errorMessage = 'Could not process waitlist data.';
    if (error instanceof z.ZodError) {
      errorMessage = `Waitlist data validation failed: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`;
    } else if (error.message) {
      errorMessage = `Error reading waitlist data: ${error.message}`;
    }
    throw new Error(errorMessage);
  }
}

async function saveWaitlistEntries(items: WaitlistEntry[]): Promise<void> {
  try {
    await fs.mkdir(path.dirname(waitlistFilePath), { recursive: true });
    await fs.writeFile(waitlistFilePath, JSON.stringify(items, null, 2), 'utf-8');
  } catch (error: any) {
    console.error('Error writing waitlist file:', error);
    throw new Error('Could not save waitlist data.');
  }
}

export async function addToWaitlist(
  data: CreateWaitlistEntryInput
): Promise<{ success: boolean; entry?: WaitlistEntry; error?: string; errors?: z.ZodIssue[] }> {
  // Validate input against the schema that includes productId and productName
  const fullDataValidation = WaitlistEntrySchema.omit({id: true, submittedAt: true}).safeParse(data);
  if (!fullDataValidation.success) {
    return { success: false, error: 'Invalid data provided.', errors: fullDataValidation.error.issues };
  }

  try {
    const entries = await getWaitlistEntriesInternal();
    const newEntry: WaitlistEntry = {
      ...fullDataValidation.data,
      id: crypto.randomUUID(),
      submittedAt: new Date().toISOString(),
    };

    entries.push(newEntry);
    await saveWaitlistEntries(entries);
    revalidatePath('/admin/dashboard/waitlist');
    return { success: true, entry: newEntry };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to add to waitlist.' };
  }
}

export async function getWaitlistEntries(): Promise<{ entries?: WaitlistEntry[]; error?: string }> {
  try {
    const entries = await getWaitlistEntriesInternal();
    entries.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
    return { entries };
  } catch (error: any) {
    return { error: error.message || 'Failed to fetch waitlist entries.' };
  }
}

export async function getWaitlistEntriesByProduct(): Promise<{
  groupedEntries?: Record<string, { productName: string; entries: WaitlistEntry[] }>;
  error?: string;
}> {
  try {
    const entries = await getWaitlistEntriesInternal();
    const groupedEntries = entries.reduce((acc, entry) => {
      if (!acc[entry.productId]) {
        acc[entry.productId] = { productName: entry.productName, entries: [] };
      }
      acc[entry.productId].entries.push(entry);
      return acc;
    }, {} as Record<string, { productName: string; entries: WaitlistEntry[] }>);

    // Sort entries within each product group by submission date
    for (const productId in groupedEntries) {
      groupedEntries[productId].entries.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
    }

    return { groupedEntries };
  } catch (error: any) {
    return { error: error.message || 'Failed to fetch and group waitlist entries.' };
  }
}
