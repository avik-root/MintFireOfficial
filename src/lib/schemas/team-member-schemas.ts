
import { z } from 'zod';

export const TeamMemberSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, "Name is required."),
  role: z.string().min(1, "Role is required."),
  description: z.string().min(1, "Description is required."),
  imageUrl: z.string().url("Image URL must be a valid URL.").or(z.literal('')),
  email: z.string().email("Invalid email address."),
  githubUrl: z.string().url("Invalid GitHub URL.").optional().or(z.literal('')),
  linkedinUrl: z.string().url("Invalid LinkedIn URL.").optional().or(z.literal('')),
  joiningDate: z.string().datetime({ message: "Invalid date format for joining date." }).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type TeamMember = z.infer<typeof TeamMemberSchema>;

export const CreateTeamMemberInputSchema = TeamMemberSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  // Make joiningDate optional on creation, will default in action if not provided
  joiningDate: z.string().datetime({ message: "Invalid date format for joining date."}).optional(),
});
export type CreateTeamMemberInput = z.infer<typeof CreateTeamMemberInputSchema>;

export const UpdateTeamMemberInputSchema = CreateTeamMemberInputSchema.extend({
  // All fields are effectively partial due to how updates are handled, but explicitly define
  name: z.string().min(1, "Name is required.").optional(),
  role: z.string().min(1, "Role is required.").optional(),
  description: z.string().min(1, "Description is required.").optional(),
  imageUrl: z.string().url("Image URL must be a valid URL.").or(z.literal('')).optional(),
  email: z.string().email("Invalid email address.").optional(),
  githubUrl: z.string().url("Invalid GitHub URL.").optional().or(z.literal('')),
  linkedinUrl: z.string().url("Invalid LinkedIn URL.").optional().or(z.literal('')),
  joiningDate: z.string().datetime({ message: "Invalid date format for joining date."}).optional(),
}).partial(); // Using .partial() on the extended schema for update
export type UpdateTeamMemberInput = z.infer<typeof UpdateTeamMemberInputSchema>;

