
'use server';

import fs from 'fs/promises';
import path from 'path';
import { z } from 'zod';
import { HallOfFameEntrySchema, type HallOfFameEntry, ManageHallOfFameEntrySchema, type ManageHallOfFameEntryInput } from '@/lib/schemas/hall-of-fame-schemas';
import { revalidatePath } from 'next/cache';

const hallOfFameFilePath = path.join(process.cwd(), 'data', 'hall-of-fame.json');

async function getHallOfFameEntriesInternal(): Promise<HallOfFameEntry[]> {
  try {
    await fs.mkdir(path.dirname(hallOfFameFilePath), { recursive: true });
    let fileContent: string;
    try {
      fileContent = await fs.readFile(hallOfFameFilePath, 'utf-8');
    } catch (readError: any) {
      if (readError.code === 'ENOENT') {
        await fs.writeFile(hallOfFameFilePath, JSON.stringify([]), 'utf-8');
        return [];
      }
      throw readError;
    }
    if (fileContent.trim() === '') return [];
    const items = JSON.parse(fileContent);
    return z.array(HallOfFameEntrySchema).parse(items);
  } catch (error: any) {
    console.error(`Error processing Hall of Fame file (${hallOfFameFilePath}):`, error);
    let errorMessage = `Could not process Hall of Fame data.`;
    if (error instanceof z.ZodError) {
      errorMessage = `Hall of Fame data validation failed: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`;
    } else if (error.message) {
      errorMessage = `Error reading Hall of Fame data: ${error.message}`;
    }
    throw new Error(errorMessage);
  }
}

async function saveHallOfFameEntries(items: HallOfFameEntry[]): Promise<void> {
  try {
    await fs.mkdir(path.dirname(hallOfFameFilePath), { recursive: true });
    await fs.writeFile(hallOfFameFilePath, JSON.stringify(items, null, 2), 'utf-8');
  } catch (error: any) {
    console.error("Error writing Hall of Fame file:", error);
    throw new Error('Could not save Hall of Fame data.');
  }
}

export async function getHallOfFameEntries(): Promise<{ entries?: HallOfFameEntry[]; error?: string }> {
  try {
    let entries = await getHallOfFameEntriesInternal();
    // Sort by totalPoints descending, then by displayName ascending
    entries.sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) {
        return b.totalPoints - a.totalPoints;
      }
      return a.displayName.localeCompare(b.displayName);
    });
    // Assign rank
    entries = entries.map((entry, index) => ({ ...entry, rank: index + 1 }));
    return { entries };
  } catch (error: any) {
    return { error: error.message || "Failed to fetch Hall of Fame entries." };
  }
}

export async function manageHallOfFameEntry(data: ManageHallOfFameEntryInput): Promise<{ success: boolean; entry?: HallOfFameEntry; error?: string; errors?: z.ZodIssue[] }> {
  const validation = ManageHallOfFameEntrySchema.safeParse(data);
  if (!validation.success) {
    return { success: false, error: "Invalid data provided.", errors: validation.error.issues };
  }
  const { userId, displayName, pointsToAdd, newAchievement, profileUrl, avatarUrl } = validation.data;

  try {
    let entries = await getHallOfFameEntriesInternal();
    let entry = entries.find(e => e.userId.toLowerCase() === userId.toLowerCase());

    if (entry) {
      // Update existing entry
      entry.displayName = displayName; // Allow display name update
      entry.totalPoints += pointsToAdd;
      if (newAchievement && !entry.achievements.includes(newAchievement)) {
        entry.achievements.push(newAchievement);
      }
      entry.profileUrl = profileUrl || entry.profileUrl;
      entry.avatarUrl = avatarUrl || entry.avatarUrl;
      if (pointsToAdd > 0 || newAchievement) {
        entry.lastRewardedAt = new Date().toISOString();
      }
    } else {
      // Create new entry
      entry = {
        id: crypto.randomUUID(),
        userId,
        displayName,
        totalPoints: pointsToAdd,
        achievements: newAchievement ? [newAchievement] : [],
        lastRewardedAt: (pointsToAdd > 0 || newAchievement) ? new Date().toISOString() : null,
        profileUrl: profileUrl || null,
        avatarUrl: avatarUrl || null,
      };
      entries.push(entry);
    }
    
    await saveHallOfFameEntries(entries);
    revalidatePath('/hall-of-fame');
    revalidatePath('/admin/dashboard/hall-of-fame-management');
    return { success: true, entry };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to manage Hall of Fame entry." };
  }
}

export async function deleteHallOfFameEntry(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    let entries = await getHallOfFameEntriesInternal();
    const filteredEntries = entries.filter(e => e.id !== id);

    if (entries.length === filteredEntries.length) {
      return { success: false, error: "Entry not found for deletion." };
    }

    await saveHallOfFameEntries(filteredEntries);
    revalidatePath('/hall-of-fame');
    revalidatePath('/admin/dashboard/hall-of-fame-management');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete Hall of Fame entry." };
  }
}
