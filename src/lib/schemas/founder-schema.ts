
'use server';

import { z } from 'zod';

export const FounderSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, "Name is required."),
  role: z.string().min(1, "Role is required (e.g., Founder & CEO, Co-Founder)."),
  description: z.string().min(1, "Description is required."),
  imageUrl: z.string().optional().or(z.literal('')), 
  email: z.string().email("Invalid email address."),
  githubUrl: z.string().url("Invalid GitHub URL.").optional().or(z.literal('')),
  linkedinUrl: z.string().url("Invalid LinkedIn URL.").optional().or(z.literal('')),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Founder = z.infer<typeof FounderSchema>;

// Schema for react-hook-form in the client component
export const FormFounderSchema = z.object({
  name: z.string().min(1, "Name is required."),
  role: z.string().min(1, "Role is required."),
  description: z.string().min(1, "Description is required."),
  email: z.string().email("Invalid email address."),
  githubUrl: z.string().url("Invalid GitHub URL.").optional().or(z.literal('')),
  linkedinUrl: z.string().url("Invalid LinkedIn URL.").optional().or(z.literal('')),
  imageUrl: z.string().optional(), 
});
export type FormFounderInput = z.infer<typeof FormFounderSchema>;
