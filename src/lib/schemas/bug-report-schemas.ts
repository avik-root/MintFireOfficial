
import { z } from 'zod';

export const BugReportStatusSchema = z.enum([
  'Pending',
  'Investigating',
  'Verified',
  'Invalid',
  'Duplicate',
  'Fixed',
  'WontFix',
  'Rewarded', // If integrating with Hall of Fame later
]);
export type BugReportStatus = z.infer<typeof BugReportStatusSchema>;

export const BugReportSchema = z.object({
  id: z.string().uuid(),
  fullName: z.string().min(1, "Full name is required."),
  email: z.string().email("Invalid email address."),
  phone: z.string().min(1, "Phone number is required."),
  description: z.string().min(20, "Please provide a detailed description of the bug (min 20 characters)."),
  pocGdriveLink: z.string().url("Proof of Concept Google Drive link must be a valid URL.").min(1, "PoC Google Drive link is required."),
  githubUrl: z.string().url("Invalid GitHub URL.").optional().or(z.literal('')),
  linkedinUrl: z.string().url("Invalid LinkedIn URL.").optional().or(z.literal('')),
  status: BugReportStatusSchema.default('Pending'),
  reportedAt: z.string().datetime(),
  adminNotes: z.string().optional().nullable(),
});
export type BugReport = z.infer<typeof BugReportSchema>;

export const CreateBugReportInputSchema = BugReportSchema.omit({
  id: true,
  status: true,
  reportedAt: true,
  adminNotes: true,
});
export type CreateBugReportInput = z.infer<typeof CreateBugReportInputSchema>;

export const UpdateBugReportStatusInputSchema = z.object({
  status: BugReportStatusSchema,
  adminNotes: z.string().optional().nullable(),
});
export type UpdateBugReportStatusInput = z.infer<typeof UpdateBugReportStatusInputSchema>;
