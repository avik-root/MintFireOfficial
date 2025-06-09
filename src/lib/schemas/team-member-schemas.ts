
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
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type TeamMember = z.infer<typeof TeamMemberSchema>;

export const CreateTeamMemberInputSchema = TeamMemberSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type CreateTeamMemberInput = z.infer<typeof CreateTeamMemberInputSchema>;

export const UpdateTeamMemberInputSchema = CreateTeamMemberInputSchema.partial();
export type UpdateTeamMemberInput = z.infer<typeof UpdateTeamMemberInputSchema>;
