
'use server';

import fs from 'fs/promises';
import path from 'path';
import { z } from 'zod';
import {
  BlogPostSchema,
  CreateBlogPostInputSchema,
  type BlogPost,
  type CreateBlogPostInput,
  type UpdateBlogPostInput
} from '@/lib/schemas/blog-post-schemas';
import { revalidatePath } from 'next/cache';

const blogPostsFilePath = path.join(process.cwd(), 'data', 'blog_posts.json');

async function getBlogPostsInternal(): Promise<BlogPost[]> {
  try {
    await fs.mkdir(path.dirname(blogPostsFilePath), { recursive: true });
    const data = await fs.readFile(blogPostsFilePath, 'utf-8');
    const items = JSON.parse(data) as unknown[];
    return z.array(BlogPostSchema).parse(items);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      await fs.writeFile(blogPostsFilePath, JSON.stringify([]), 'utf-8');
      return [];
    }
    console.error("Error reading blog posts file:", error);
    throw new Error('Could not read blog post data.');
  }
}

async function saveBlogPosts(items: BlogPost[]): Promise<void> {
  try {
    await fs.mkdir(path.dirname(blogPostsFilePath), { recursive: true });
    await fs.writeFile(blogPostsFilePath, JSON.stringify(items, null, 2), 'utf-8');
  } catch (error) {
    console.error("Error writing blog posts file:", error);
    throw new Error('Could not save blog post data.');
  }
}

function transformTags(tagsString?: string): string[] {
  if (!tagsString || tagsString.trim() === "") return [];
  return tagsString.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
}

export async function getBlogPosts(params?: { publishedOnly?: boolean }): Promise<{ posts?: BlogPost[]; error?: string }> {
  try {
    let posts = await getBlogPostsInternal();
    if (params?.publishedOnly) {
      posts = posts.filter(post => post.isPublished);
    }
    // Sort by newest first
    posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return { posts };
  } catch (error: any) {
    return { error: error.message || "Failed to fetch blog posts." };
  }
}

export async function addBlogPost(data: CreateBlogPostInput): Promise<{ success: boolean; post?: BlogPost; error?: string; errors?: z.ZodIssue[] }> {
  const validation = CreateBlogPostInputSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, error: "Invalid data provided.", errors: validation.error.issues };
  }
  
  try {
    const posts = await getBlogPostsInternal();
    const slugExists = posts.some(p => p.slug === validation.data.slug);
    if (slugExists) {
      return { success: false, error: "A blog post with this slug already exists.", errors: [{ path: ['slug'], message: 'Slug already in use.'}] };
    }

    const newPost: BlogPost = {
      ...validation.data,
      id: crypto.randomUUID(),
      tags: transformTags(validation.data.tagsString), // Transform string to array
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    posts.push(newPost);
    await saveBlogPosts(posts);
    revalidatePath('/admin/dashboard/blogs');
    revalidatePath('/blog');
    revalidatePath(`/blog/${newPost.slug}`);
    return { success: true, post: newPost };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to add blog post." };
  }
}

export async function getBlogPostById(id: string): Promise<{ post?: BlogPost; error?: string }> {
  try {
    const posts = await getBlogPostsInternal();
    const post = posts.find(p => p.id === id);
    if (!post) {
      return { error: "Blog post not found." };
    }
    return { post };
  } catch (error: any) {
    return { error: error.message || "Failed to fetch blog post." };
  }
}

export async function getBlogPostBySlug(slug: string): Promise<{ post?: BlogPost; error?: string }> {
  try {
    const posts = await getBlogPostsInternal();
    const post = posts.find(p => p.slug === slug && p.isPublished);
    if (!post) {
      return { error: "Blog post not found or not published." };
    }
    return { post };
  } catch (error: any) {
    return { error: error.message || "Failed to fetch blog post." };
  }
}

export async function updateBlogPost(id: string, data: UpdateBlogPostInput): Promise<{ success: boolean; post?: BlogPost; error?: string, errors?: z.ZodIssue[] }> {
  const validation = CreateBlogPostInputSchema.safeParse(data); // Use Create schema for full validation on update too
   if (!validation.success) {
    return { success: false, error: "Invalid data provided.", errors: validation.error.issues };
  }

  try {
    let posts = await getBlogPostsInternal();
    const postIndex = posts.findIndex(p => p.id === id);

    if (postIndex === -1) {
      return { success: false, error: "Blog post not found." };
    }

    const slugExists = posts.some(p => p.slug === validation.data.slug && p.id !== id);
    if (slugExists) {
      return { success: false, error: "A blog post with this slug already exists.", errors: [{ path: ['slug'], message: 'Slug already in use.'}] };
    }
    
    const originalPost = posts[postIndex];
    const updatedPostData: BlogPost = {
      ...originalPost, 
      ...validation.data, 
      tags: transformTags(validation.data.tagsString),
      updatedAt: new Date().toISOString(), 
    };
    
    posts[postIndex] = updatedPostData;
    await saveBlogPosts(posts);
    revalidatePath('/admin/dashboard/blogs');
    revalidatePath(`/admin/dashboard/blogs/edit/${id}`);
    revalidatePath('/blog');
    revalidatePath(`/blog/${updatedPostData.slug}`);
    if (originalPost.slug !== updatedPostData.slug) {
      revalidatePath(`/blog/${originalPost.slug}`); // Revalidate old slug path if changed
    }
    return { success: true, post: updatedPostData };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update blog post." };
  }
}

export async function deleteBlogPost(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    let posts = await getBlogPostsInternal();
    const postToDelete = posts.find(p => p.id === id);
    if (!postToDelete) {
      return { success: false, error: "Blog post not found for deletion." };
    }

    const filteredPosts = posts.filter(p => p.id !== id);
    await saveBlogPosts(filteredPosts);

    revalidatePath('/admin/dashboard/blogs');
    revalidatePath('/blog');
    revalidatePath(`/blog/${postToDelete.slug}`); 
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete blog post." };
  }
}
