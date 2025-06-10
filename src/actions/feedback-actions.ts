
'use server';

import fs from 'fs/promises';
import path from 'path';
import { z } from 'zod';
import {
  FeedbackSchema,
  CreateFeedbackInputSchema,
  type Feedback,
  type CreateFeedbackInput,
} from '@/lib/schemas/feedback-schemas';
import { revalidatePath } from 'next/cache';

const feedbackFilePath = path.join(process.cwd(), 'data', 'feedback.json');

async function getFeedbackInternal(): Promise<Feedback[]> {
  try {
    await fs.mkdir(path.dirname(feedbackFilePath), { recursive: true });

    let fileContent: string;
    try {
      fileContent = await fs.readFile(feedbackFilePath, 'utf-8');
    } catch (readError: any) {
      if (readError.code === 'ENOENT') {
        await fs.writeFile(feedbackFilePath, JSON.stringify([]), 'utf-8');
        return [];
      }
      throw readError;
    }

    if (fileContent.trim() === '') {
      return [];
    }
    const items = JSON.parse(fileContent);
    return z.array(FeedbackSchema).parse(items);
  } catch (error: any) {
    console.error(`Error processing feedback file (${feedbackFilePath}):`, error);
    let errorMessage = `Could not process feedback data.`;
    if (error instanceof z.ZodError) {
      errorMessage = `Feedback data validation failed: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`;
    } else if (error.message) {
      errorMessage = `Error reading feedback data: ${error.message}`;
    }
    throw new Error(errorMessage);
  }
}

async function saveFeedbackItems(items: Feedback[]): Promise<void> {
  try {
    await fs.mkdir(path.dirname(feedbackFilePath), { recursive: true });
    await fs.writeFile(feedbackFilePath, JSON.stringify(items, null, 2), 'utf-8');
  } catch (error: any) {
    console.error("Error writing feedback file:", error);
    throw new Error('Could not save feedback data.');
  }
}

export async function submitFeedback(data: CreateFeedbackInput): Promise<{ success: boolean; feedback?: Feedback; error?: string; errors?: z.ZodIssue[] }> {
  const validation = CreateFeedbackInputSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, error: "Invalid data provided.", errors: validation.error.issues };
  }
  
  try {
    const feedbackItems = await getFeedbackInternal();
    const newFeedback: Feedback = {
      ...validation.data,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    
    feedbackItems.push(newFeedback);
    await saveFeedbackItems(feedbackItems);
    revalidatePath('/admin/dashboard/feedback');
    return { success: true, feedback: newFeedback };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to submit feedback." };
  }
}

export async function getFeedback(): Promise<{ feedbackItems?: Feedback[]; error?: string }> {
  try {
    const feedbackItems = await getFeedbackInternal();
    feedbackItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return { feedbackItems };
  } catch (error: any) {
    return { error: error.message || "Failed to fetch feedback." };
  }
}

export async function deleteFeedback(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    let items = await getFeedbackInternal();
    const filteredItems = items.filter(p => p.id !== id);

    if (items.length === filteredItems.length) {
      return { success: false, error: "Feedback item not found for deletion." };
    }

    await saveFeedbackItems(filteredItems);
    revalidatePath('/admin/dashboard/feedback');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete feedback item." };
  }
}
