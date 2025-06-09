
import { z } from 'zod';

export const TeamMemberSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, "Name is required."),
  role: z.string().min(1, "Role is required."),
  description: z.string().min(1, "Description is required."),
  imageUrl: z.string().optional().or(z.literal('')), // Path to image, e.g., /uploads/team-photos/image.png
  email: z.string().email("Invalid email address."),
  githubUrl: z.string().url("Invalid GitHub URL.").optional().or(z.literal('')),
  linkedinUrl: z.string().url("Invalid LinkedIn URL.").optional().or(z.literal('')),
  joiningDate: z.string().datetime({ message: "Invalid date format for joining date." }).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type TeamMember = z.infer<typeof TeamMemberSchema>;

// Schema for react-hook-form in the client component
export const FormTeamMemberSchema = z.object({
  name: z.string().min(1, "Name is required."),
  role: z.string().min(1, "Role is required."),
  description: z.string().min(1, "Description is required."),
  email: z.string().email("Invalid email address."),
  githubUrl: z.string().url("Invalid GitHub URL.").optional().or(z.literal('')),
  linkedinUrl: z.string().url("Invalid LinkedIn URL.").optional().or(z.literal('')),
  joiningDate: z.string().datetime({ message: "Invalid date format for joining date."}).optional(),
  // imageFile will be handled via FormData, not part of this schema for RHF's `data` object.
  // `imageUrl` below is for displaying the current image path if editing.
  imageUrl: z.string().optional(), 
});
export type FormTeamMemberInput = z.infer<typeof FormTeamMemberSchema>;


// Types for server action inputs (will be derived from FormData in actions)
// These are more for conceptual clarity; actions will parse FormData directly.
export type CreateTeamMemberServerInput = Omit<TeamMember, 'id' | 'createdAt' | 'updatedAt'> & { imageFile?: File };
export type UpdateTeamMemberServerInput = Partial<Omit<TeamMember, 'id' | 'createdAt' | 'updatedAt'>> & { imageFile?: File; existingImageUrl?: string };

