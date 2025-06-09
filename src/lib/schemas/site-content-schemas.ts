
import { z } from 'zod';

export const SiteContentItemSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['banner', 'news', 'announcement'], {
    required_error: "Content type is required.",
  }),
  title: z.string().min(1, "Title is required."),
  content: z.string().min(1, "Content is required."),
  imageUrl: z.string().url("Invalid URL for image. Must be a valid URL (e.g., https://example.com/image.png).").optional().or(z.literal('')).nullable(),
  linkUrl: z.string().url("Invalid URL for link. Must be a valid URL (e.g., https://example.com/page).").optional().or(z.literal('')).nullable(),
  isActive: z.boolean().default(true),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type SiteContentItem = z.infer<typeof SiteContentItemSchema>;

export const CreateSiteContentItemSchema = SiteContentItemSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type CreateSiteContentItemInput = z.infer<typeof CreateSiteContentItemSchema>;

export const UpdateSiteContentItemSchema = CreateSiteContentItemSchema.partial();
export type UpdateSiteContentItemInput = z.infer<typeof UpdateSiteContentItemSchema>;

