
import { z } from 'zod';

export const ProductViewCountsSchema = z.record(z.string().uuid(), z.number().int().min(0));
export type ProductViewCounts = z.infer<typeof ProductViewCountsSchema>;

export const TeamMemberViewCountsSchema = z.record(z.string().uuid(), z.number().int().min(0));
export type TeamMemberViewCounts = z.infer<typeof TeamMemberViewCountsSchema>;

export const AnalyticsDataSchema = z.object({
  productViews: ProductViewCountsSchema.default({}),
  teamMemberViews: TeamMemberViewCountsSchema.default({}),
  lastUpdatedAt: z.string().datetime().optional(),
});
export type AnalyticsData = z.infer<typeof AnalyticsDataSchema>;

// For displaying summary counts, not stored in analytics.json directly
export const GeneralCountsSchema = z.object({
  totalProducts: z.number().int().min(0),
  totalTeamMembers: z.number().int().min(0),
  totalFounders: z.number().int().min(0),
  totalBlogPosts: z.number().int().min(0),
  totalApplicants: z.number().int().min(0),
});
export type GeneralCounts = z.infer<typeof GeneralCountsSchema>;
