
import { z } from 'zod';

export const ApplicantStatusSchema = z.enum([
  'Pending', 
  'Reviewed', 
  'Shortlisted', 
  'Interviewing',
  'Offer Extended',
  'Hired', 
  'Rejected',
  'On Hold'
]);
export type ApplicantStatus = z.infer<typeof ApplicantStatusSchema>;

export const ApplicantSchema = z.object({
  id: z.string().uuid(),
  fullName: z.string().min(1, "Full name is required."),
  email: z.string().email("Invalid email address."),
  phone: z.string().min(1, "Phone number is required."),
  positionAppliedFor: z.string().min(1, "Position applied for is required."),
  coverLetter: z.string().min(1, "Cover letter or message is required."),
  resumeLink: z.string().url("Please provide a valid URL for your resume/CV."),
  portfolioUrl: z.string().url("Invalid portfolio URL.").optional().or(z.literal('')),
  githubUrl: z.string().url("GitHub profile URL is required and must be a valid URL."),
  linkedinUrl: z.string().url("LinkedIn profile URL is required and must be a valid URL."),
  status: ApplicantStatusSchema.default('Pending'),
  appliedAt: z.string().datetime(),
  notes: z.string().optional().nullable(), // Admin notes
});
export type Applicant = z.infer<typeof ApplicantSchema>;

export const CreateApplicantInputSchema = ApplicantSchema.omit({
  id: true,
  status: true,
  appliedAt: true,
  notes: true,
});
export type CreateApplicantInput = z.infer<typeof CreateApplicantInputSchema>;

export const UpdateApplicantStatusInputSchema = z.object({
  status: ApplicantStatusSchema,
  notes: z.string().optional().nullable(),
});
export type UpdateApplicantStatusInput = z.infer<typeof UpdateApplicantStatusInputSchema>;

