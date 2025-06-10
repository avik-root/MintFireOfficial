
'use server';

import fs from 'fs/promises';
import path from 'path';
import { z } from 'zod';
import {
  BugReportSchema,
  CreateBugReportInputSchema,
  UpdateBugReportStatusInputSchema,
  type BugReport,
  type CreateBugReportInput,
  type UpdateBugReportStatusInput,
} from '@/lib/schemas/bug-report-schemas';
import { revalidatePath } from 'next/cache';

const bugReportsFilePath = path.join(process.cwd(), 'data', 'bug-reports.json');

async function getBugReportsInternal(): Promise<BugReport[]> {
  try {
    await fs.mkdir(path.dirname(bugReportsFilePath), { recursive: true });
    let fileContent: string;
    try {
      fileContent = await fs.readFile(bugReportsFilePath, 'utf-8');
    } catch (readError: any) {
      if (readError.code === 'ENOENT') {
        await fs.writeFile(bugReportsFilePath, JSON.stringify([]), 'utf-8');
        return [];
      }
      throw readError;
    }
    if (fileContent.trim() === '') return [];
    const items = JSON.parse(fileContent);
    return z.array(BugReportSchema).parse(items);
  } catch (error: any) {
    console.error(`Error processing bug reports file (${bugReportsFilePath}):`, error);
    let errorMessage = `Could not process bug report data.`;
    if (error instanceof z.ZodError) {
      errorMessage = `Bug report data validation failed: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`;
    } else if (error.message) {
      errorMessage = `Error reading bug report data: ${error.message}`;
    }
    throw new Error(errorMessage);
  }
}

async function saveBugReports(items: BugReport[]): Promise<void> {
  try {
    await fs.mkdir(path.dirname(bugReportsFilePath), { recursive: true });
    await fs.writeFile(bugReportsFilePath, JSON.stringify(items, null, 2), 'utf-8');
  } catch (error: any) {
    console.error("Error writing bug reports file:", error);
    throw new Error('Could not save bug report data.');
  }
}

export async function submitBugReport(data: CreateBugReportInput): Promise<{ success: boolean; report?: BugReport; error?: string; errors?: z.ZodIssue[] }> {
  const validation = CreateBugReportInputSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, error: "Invalid data provided.", errors: validation.error.issues };
  }
  
  try {
    const reports = await getBugReportsInternal();
    const newReport: BugReport = {
      ...validation.data,
      id: crypto.randomUUID(),
      status: 'Pending',
      reportedAt: new Date().toISOString(),
      adminNotes: null,
    };
    
    reports.push(newReport);
    await saveBugReports(reports);
    revalidatePath('/admin/dashboard/bug-reports'); // For admin view
    return { success: true, report: newReport };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to submit bug report." };
  }
}

export async function getBugReports(): Promise<{ reports?: BugReport[]; error?: string }> {
  try {
    let reports = await getBugReportsInternal();
    reports.sort((a, b) => new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime());
    return { reports };
  } catch (error: any) {
    return { error: error.message || "Failed to fetch bug reports." };
  }
}

export async function getBugReportById(id: string): Promise<{ report?: BugReport; error?: string }> {
  try {
    const reports = await getBugReportsInternal();
    const report = reports.find(r => r.id === id);
    if (!report) {
      return { error: "Bug report not found." };
    }
    return { report };
  } catch (error: any) {
    return { error: error.message || "Failed to fetch bug report." };
  }
}

export async function updateBugReport(id: string, data: UpdateBugReportStatusInput): Promise<{ success: boolean; report?: BugReport; error?: string, errors?: z.ZodIssue[] }> {
  const validation = UpdateBugReportStatusInputSchema.safeParse(data);
   if (!validation.success) {
    return { success: false, error: "Invalid data provided for update.", errors: validation.error.issues };
  }

  try {
    let reports = await getBugReportsInternal();
    const reportIndex = reports.findIndex(r => r.id === id);

    if (reportIndex === -1) {
      return { success: false, error: "Bug report not found." };
    }
    
    const originalReport = reports[reportIndex];
    const updatedReportData: BugReport = {
      ...originalReport, 
      status: validation.data.status,
      adminNotes: validation.data.adminNotes !== undefined ? validation.data.adminNotes : originalReport.adminNotes, 
    };
    
    reports[reportIndex] = updatedReportData;
    await saveBugReports(reports);
    revalidatePath('/admin/dashboard/bug-reports');
    revalidatePath(`/admin/dashboard/bug-reports/${id}`);
    return { success: true, report: updatedReportData };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update bug report." };
  }
}

export async function deleteBugReport(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    let reports = await getBugReportsInternal();
    const filteredReports = reports.filter(r => r.id !== id);

    if (reports.length === filteredReports.length) {
      return { success: false, error: "Bug report not found for deletion." };
    }

    await saveBugReports(filteredReports);
    revalidatePath('/admin/dashboard/bug-reports');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete bug report." };
  }
}
