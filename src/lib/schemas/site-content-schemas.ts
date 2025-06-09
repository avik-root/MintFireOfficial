
import { z } from 'zod';

export const SiteContentItemSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['banner', 'news', 'announcement']),
  title: z.string().min(1, "Title is required."),
  content: z.string().min(1, "Content is required."),
  imageUrl: z.string().url("Invalid URL for image.").optional().nullable(),
  linkUrl: z.string().url("Invalid URL for link.").optional().nullable(),
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

export const UpdateSiteContentItemSchema = SiteContentItemSchema.partial().omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});
export type UpdateSiteContentItemInput = z.infer<typeof UpdateSiteContentItemSchema>;
