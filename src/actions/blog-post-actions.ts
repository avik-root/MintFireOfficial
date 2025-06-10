
'use server';

import fs from 'fs/promises';
import path from 'path';
import { z } from 'zod';
import {
  BlogPostSchema,
  CreateBlogPostInputSchema, // Using the redefined schema
  type BlogPost,
  // type CreateBlogPostInput is now specifically for the form data
} from '@/lib/schemas/blog-post-schemas';
import { revalidatePath } from 'next/cache';
import { randomUUID } from 'crypto';

const blogPostsFilePath = path.join(process.cwd(), 'data', 'blog_posts.json');
const UPLOADS_DIR_NAME = 'uploads';
const BLOG_IMAGES_DIR_NAME = 'blog-post-images';
const publicUploadsDir = path.join(process.cwd(), 'public', UPLOADS_DIR_NAME, BLOG_IMAGES_DIR_NAME);


async function getBlogPostsInternal(): Promise<BlogPost[]> {
  try {
    await fs.mkdir(path.dirname(blogPostsFilePath), { recursive: true });

    let fileContent: string;
    try {
      fileContent = await fs.readFile(blogPostsFilePath, 'utf-8');
    } catch (readError: any) {
      if (readError.code === 'ENOENT') {
        await fs.writeFile(blogPostsFilePath, JSON.stringify([]), 'utf-8');
        return [];
      }
      throw readError;
    }

    if (fileContent.trim() === '') {
      return [];
    }

    const items = JSON.parse(fileContent);

    if (!Array.isArray(items)) {
      console.error(`Data in ${blogPostsFilePath} is not an array. Found: ${typeof items}. Overwriting with empty array.`);
      await fs.writeFile(blogPostsFilePath, JSON.stringify([]), 'utf-8');
      return [];
    }
    
    return z.array(BlogPostSchema).parse(items);
  } catch (error: any) {
    console.error(`Error processing blog posts file (${blogPostsFilePath}):`, error);
    let errorMessage = `Could not process blog post data from ${blogPostsFilePath}.`;
    if (error instanceof z.ZodError) {
      errorMessage = `Blog post data validation failed: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`;
    } else if (error.message) {
      errorMessage = `Error reading blog post data: ${error.message}`;
    }
    throw new Error(errorMessage);
  }
}

async function saveBlogPosts(items: BlogPost[]): Promise<void> {
  try {
    await fs.mkdir(path.dirname(blogPostsFilePath), { recursive: true });
    await fs.writeFile(blogPostsFilePath, JSON.stringify(items, null, 2), 'utf-8');
  } catch (error: any) {
    console.error("Error writing blog posts file:", error);
    throw new Error('Could not save blog post data.');
  }
}

async function handleImageUploadServer(imageFile: File | null): Promise<string | null> {
  if (!imageFile || imageFile.size === 0) return null;

  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(imageFile.type)) {
    throw new Error('Invalid file type. Only JPEG, PNG, GIF, WEBP are allowed.');
  }
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (imageFile.size > maxSize) {
    throw new Error('File is too large. Maximum size is 5MB.');
  }

  await fs.mkdir(publicUploadsDir, { recursive: true });
  const sanitizedOriginalFilename = path.basename(imageFile.name);
  const fileExtension = path.extname(sanitizedOriginalFilename) || `.${imageFile.type.split('/')[1] || 'png'}`;
  const uniqueFilename = `${randomUUID()}${fileExtension}`;
  const filePath = path.join(publicUploadsDir, uniqueFilename);
  
  const buffer = Buffer.from(await imageFile.arrayBuffer());
  await fs.writeFile(filePath, buffer);

  return `/${UPLOADS_DIR_NAME}/${BLOG_IMAGES_DIR_NAME}/${uniqueFilename}`;
}

async function deleteOldImage(imageUrl: string | null | undefined) {
  if (imageUrl && imageUrl.startsWith(`/${UPLOADS_DIR_NAME}/${BLOG_IMAGES_DIR_NAME}/`)) {
    try {
      const oldImagePath = path.join(process.cwd(), 'public', imageUrl);
      await fs.unlink(oldImagePath).catch(e => console.warn(`Non-critical: Failed to delete old blog image ${oldImagePath}: ${e.message}`));
    } catch (imgDelError: any) {
      console.warn(`Failed to delete old blog image ${imageUrl}: ${imgDelError.message}`);
    }
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
    posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return { posts };
  } catch (error: any) {
    return { error: error.message || "Failed to fetch blog posts." };
  }
}

export async function addBlogPost(formData: FormData): Promise<{ success: boolean; post?: BlogPost; error?: string; errors?: z.ZodIssue[] }> {
  try {
    const rawData = {
      title: formData.get('title') as string || "",
      slug: formData.get('slug') as string || "",
      content: formData.get('content') as string || "",
      author: formData.get('author') as string || "",
      isPublished: formData.get('isPublished') === 'true',
      tagsString: formData.get('tagsString') as string | undefined,
    };

    const validation = CreateBlogPostInputSchema.safeParse(rawData);
    if (!validation.success) {
      return { success: false, error: "Invalid data provided.", errors: validation.error.issues };
    }
    
    const validatedFormInput = validation.data;
    const imageFile = formData.get('imageFile') as File | null;
    let imageUrlPath: string | null = null;

    if (imageFile && imageFile.size > 0) {
      imageUrlPath = await handleImageUploadServer(imageFile);
    }

    const posts = await getBlogPostsInternal();
    const slugExists = posts.some(p => p.slug === validatedFormInput.slug);
    if (slugExists) {
      return { success: false, error: "A blog post with this slug already exists.", errors: [{ path: ['slug'], message: 'Slug already in use.', code: z.ZodIssueCode.custom }] };
    }

    const newPost: BlogPost = {
      id: crypto.randomUUID(),
      title: validatedFormInput.title,
      slug: validatedFormInput.slug,
      content: validatedFormInput.content,
      author: validatedFormInput.author,
      tags: transformTags(validatedFormInput.tagsString),
      imageUrl: imageUrlPath,
      isPublished: validatedFormInput.isPublished,
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
    console.error("Add blog post error:", error);
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

export async function updateBlogPost(id: string, formData: FormData): Promise<{ success: boolean; post?: BlogPost; error?: string, errors?: z.ZodIssue[] }> {
 try {
    const rawDataToValidate = {
      title: formData.get('title') as string | undefined,
      slug: formData.get('slug') as string | undefined,
      content: formData.get('content') as string | undefined,
      author: formData.get('author') as string | undefined,
      isPublished: formData.get('isPublished') !== null ? formData.get('isPublished') === 'true' : undefined,
      tagsString: formData.get('tagsString') as string | undefined,
    };

    // Filter out undefined values so partial schema validation works as expected
    const definedRawData = Object.fromEntries(Object.entries(rawDataToValidate).filter(([_, v]) => v !== undefined));

    const validation = CreateBlogPostInputSchema.partial().safeParse(definedRawData); 
    if (!validation.success) {
      return { success: false, error: "Invalid data provided.", errors: validation.error.issues };
    }
    const validatedFormInput = validation.data;

    let posts = await getBlogPostsInternal();
    const postIndex = posts.findIndex(p => p.id === id);

    if (postIndex === -1) {
      return { success: false, error: "Blog post not found." };
    }

    const originalPost = posts[postIndex];

    if (validatedFormInput.slug && validatedFormInput.slug !== originalPost.slug) {
        const slugExists = posts.some(p => p.slug === validatedFormInput.slug && p.id !== id);
        if (slugExists) {
          return { success: false, error: "A blog post with this slug already exists.", errors: [{ path: ['slug'], message: 'Slug already in use.', code: z.ZodIssueCode.custom }] };
        }
    }
    
    let imageUrlToSave = originalPost.imageUrl;
    const imageFile = formData.get('imageFile') as File | null;
    const removeImageFlag = formData.get('removeImage') === 'true';
    
    if (removeImageFlag && originalPost.imageUrl) {
        await deleteOldImage(originalPost.imageUrl);
        imageUrlToSave = null;
    } else if (imageFile && imageFile.size > 0) {
        if (originalPost.imageUrl) {
            await deleteOldImage(originalPost.imageUrl);
        }
        imageUrlToSave = await handleImageUploadServer(imageFile);
    }
    // If no new file, and not removing, imageUrlToSave remains originalPost.imageUrl
    // (or the value from `existingImageUrl` if it was sent, but handleImageUploadServer handles replacement).
    
    const updatedPostData: BlogPost = {
      ...originalPost, 
      title: validatedFormInput.title ?? originalPost.title,
      slug: validatedFormInput.slug ?? originalPost.slug,
      content: validatedFormInput.content ?? originalPost.content,
      author: validatedFormInput.author ?? originalPost.author,
      tags: validatedFormInput.tagsString !== undefined ? transformTags(validatedFormInput.tagsString) : originalPost.tags,
      isPublished: validatedFormInput.isPublished !== undefined ? validatedFormInput.isPublished : originalPost.isPublished,
      imageUrl: imageUrlToSave,
      updatedAt: new Date().toISOString(), 
    };
    
    posts[postIndex] = updatedPostData;
    await saveBlogPosts(posts);

    revalidatePath('/admin/dashboard/blogs');
    revalidatePath(`/admin/dashboard/blogs/edit/${id}`);
    revalidatePath('/blog');
    revalidatePath(`/blog/${updatedPostData.slug}`);
    if (originalPost.slug !== updatedPostData.slug) {
      revalidatePath(`/blog/${originalPost.slug}`);
    }
    return { success: true, post: updatedPostData };
  } catch (error: any) {
    console.error("Update blog post error:", error);
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

    if (postToDelete.imageUrl) {
        await deleteOldImage(postToDelete.imageUrl);
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

