
'use server';

import fs from 'fs/promises';
import path from 'path';
import { z } from 'zod';
import {
  ApplicantSchema,
  CreateApplicantInputSchema,
  UpdateApplicantStatusInputSchema,
  type Applicant,
  type CreateApplicantInput,
  type UpdateApplicantStatusInput,
} from '@/lib/schemas/applicant-schemas';
import { revalidatePath } from 'next/cache';

const applicantsFilePath = path.join(process.cwd(), 'data', 'applicants.json');

async function getApplicantsInternal(): Promise<Applicant[]> {
  try {
    await fs.mkdir(path.dirname(applicantsFilePath), { recursive: true });

    let fileContent: string;
    try {
      fileContent = await fs.readFile(applicantsFilePath, 'utf-8');
    } catch (readError: any) {
      if (readError.code === 'ENOENT') {
        await fs.writeFile(applicantsFilePath, JSON.stringify([]), 'utf-8');
        return [];
      }
      throw readError;
    }

    if (fileContent.trim() === '') {
      return [];
    }

    const items = JSON.parse(fileContent);

    if (!Array.isArray(items)) {
      console.error(`Data in ${applicantsFilePath} is not an array. Found: ${typeof items}. Overwriting with empty array.`);
      await fs.writeFile(applicantsFilePath, JSON.stringify([]), 'utf-8');
      return [];
    }
    
    return z.array(ApplicantSchema).parse(items);
  } catch (error: any) {
    console.error(`Error processing applicants file (${applicantsFilePath}):`, error);
    let errorMessage = `Could not process applicant data from ${applicantsFilePath}.`;
    if (error instanceof z.ZodError) {
      errorMessage = `Applicant data validation failed: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`;
    } else if (error.message) {
      errorMessage = `Error reading applicant data: ${error.message}`;
    }
    throw new Error(errorMessage);
  }
}

async function saveApplicants(items: Applicant[]): Promise<void> {
  try {
    await fs.mkdir(path.dirname(applicantsFilePath), { recursive: true });
    await fs.writeFile(applicantsFilePath, JSON.stringify(items, null, 2), 'utf-8');
  } catch (error: any) {
    console.error("Error writing applicants file:", error);
    throw new Error('Could not save applicant data.');
  }
}

export async function submitApplication(data: CreateApplicantInput): Promise<{ success: boolean; applicant?: Applicant; error?: string; errors?: z.ZodIssue[] }> {
  const validation = CreateApplicantInputSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, error: "Invalid data provided.", errors: validation.error.issues };
  }
  
  try {
    const applicants = await getApplicantsInternal();
    const newApplicant: Applicant = {
      ...validation.data,
      id: crypto.randomUUID(),
      status: 'Pending',
      appliedAt: new Date().toISOString(),
      notes: null,
    };
    
    applicants.push(newApplicant);
    await saveApplicants(applicants);
    revalidatePath('/admin/dashboard/applicants'); 
    return { success: true, applicant: newApplicant };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to submit application." };
  }
}

export async function getApplicants(): Promise<{ applicants?: Applicant[]; error?: string }> {
  try {
    let applicants = await getApplicantsInternal();
    applicants.sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime());
    return { applicants };
  } catch (error: any) {
    return { error: error.message || "Failed to fetch applicants." };
  }
}

export async function getApplicantById(id: string): Promise<{ applicant?: Applicant; error?: string }> {
  try {
    const applicants = await getApplicantsInternal();
    const applicant = applicants.find(p => p.id === id);
    if (!applicant) {
      return { error: "Applicant not found." };
    }
    return { applicant };
  } catch (error: any) {
    return { error: error.message || "Failed to fetch applicant." };
  }
}

export async function updateApplicantStatus(id: string, data: UpdateApplicantStatusInput): Promise<{ success: boolean; applicant?: Applicant; error?: string, errors?: z.ZodIssue[] }> {
  const validation = UpdateApplicantStatusInputSchema.safeParse(data);
   if (!validation.success) {
    return { success: false, error: "Invalid data provided for status update.", errors: validation.error.issues };
  }

  try {
    let applicants = await getApplicantsInternal();
    const applicantIndex = applicants.findIndex(p => p.id === id);

    if (applicantIndex === -1) {
      return { success: false, error: "Applicant not found." };
    }
    
    const originalApplicant = applicants[applicantIndex];
    const updatedApplicantData: Applicant = {
      ...originalApplicant, 
      status: validation.data.status,
      notes: validation.data.notes !== undefined ? validation.data.notes : originalApplicant.notes, 
    };
    
    applicants[applicantIndex] = updatedApplicantData;
    await saveApplicants(applicants);
    revalidatePath('/admin/dashboard/applicants');
    revalidatePath(`/admin/dashboard/applicants/${id}`);
    return { success: true, applicant: updatedApplicantData };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update applicant status." };
  }
}
