
import { z } from 'zod';

export const HallOfFameEntrySchema = z.object({
  id: z.string().uuid(), // Internal ID for the entry
  userId: z.string().min(1, "User identifier is required (e.g., GitHub username, email)."),
  displayName: z.string().min(1, "Display name is required."),
  totalPoints: z.number().int().min(0).default(0),
  achievements: z.array(z.string()).optional().default([]), // e.g., "Bug Hunter Q1 2025", "Top Contributor"
  lastRewardedAt: z.string().datetime().optional().nullable(),
  profileUrl: z.string().url().optional().nullable(), // Optional link to user's profile (e.g., GitHub, LinkedIn)
  avatarUrl: z.string().url().optional().nullable(), // Optional avatar
  rank: z.number().int().min(1).optional().nullable(), // To be calculated on fetch
});
export type HallOfFameEntry = z.infer<typeof HallOfFameEntrySchema>;

// For admin forms to add/update entries (simplified for now)
export const ManageHallOfFameEntrySchema = z.object({
  userId: z.string().min(1, "User Identifier (e.g. GitHub username) is required."),
  displayName: z.string().min(1, "Display Name is required."),
  pointsToAdd: z.number().int().min(0, "Points must be non-negative.").default(0),
  newAchievement: z.string().optional(),
  profileUrl: z.string().url("Must be a valid URL").optional().or(z.literal('')),
  avatarUrl: z.string().url("Must be a valid URL").optional().or(z.literal('')),
});
export type ManageHallOfFameEntryInput = z.infer<typeof ManageHallOfFameEntrySchema>;
