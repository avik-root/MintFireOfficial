
import { z } from 'zod';

export const BlogPostSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1, "Title is required."),
  slug: z.string().min(1, "Slug is required.").regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be URL-friendly (e.g., 'my-blog-post')."),
  content: z.string().min(1, "Content is required."),
  author: z.string().min(1, "Author is required."),
  tags: z.array(z.string()).optional().default([]), // Storing tags as an array of strings
  imageUrl: z.string().url("Invalid URL for image.").optional().or(z.literal('')).nullable(),
  isPublished: z.boolean().default(false),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type BlogPost = z.infer<typeof BlogPostSchema>;

export const CreateBlogPostInputSchema = BlogPostSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
}).extend({
  // For form input, tags can be a comma-separated string
  tagsString: z.string().optional().describe("Comma-separated tags, e.g., tech, AI, news"),
});
export type CreateBlogPostInput = z.infer<typeof CreateBlogPostInputSchema>;

export const UpdateBlogPostInputSchema = CreateBlogPostInputSchema.partial();
export type UpdateBlogPostInput = z.infer<typeof UpdateBlogPostInputSchema>;
