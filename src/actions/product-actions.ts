
'use server';

import fs from 'fs/promises';
import path from 'path';
import { z } from 'zod';
import {
  ProductSchema,
  FormProductSchema, // For validating text fields from FormData
  type Product,
} from '@/lib/schemas/product-schemas';
import { revalidatePath } from 'next/cache';
import { randomUUID } from 'crypto';

const productsFilePath = path.join(process.cwd(), 'data', 'products.json');
const UPLOADS_DIR_NAME = 'uploads';
const PRODUCT_IMAGES_DIR_NAME = 'product-images';
const publicUploadsDir = path.join(process.cwd(), 'public', UPLOADS_DIR_NAME, PRODUCT_IMAGES_DIR_NAME);

async function getProductsInternal(params?: { isFeatured?: boolean; limit?: number }): Promise<Product[]> {
  try {
    await fs.mkdir(path.dirname(productsFilePath), { recursive: true });
    const data = await fs.readFile(productsFilePath, 'utf-8');
    let items = JSON.parse(data) as unknown[];
    let parsedItems = z.array(ProductSchema).parse(items);

    if (params?.isFeatured) {
      parsedItems = parsedItems.filter(product => product.isFeatured);
    }

    // Sort by release date descending (newest first), then by creation date
    parsedItems.sort((a, b) => {
      const dateA = a.releaseDate ? new Date(a.releaseDate).getTime() : new Date(a.createdAt).getTime();
      const dateB = b.releaseDate ? new Date(b.releaseDate).getTime() : new Date(b.createdAt).getTime();
      return dateB - dateA; 
    });

    if (params?.limit) {
      parsedItems = parsedItems.slice(0, params.limit);
    }

    return parsedItems;
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      await fs.writeFile(productsFilePath, JSON.stringify([]), 'utf-8');
      return [];
    }
    console.error("Error reading products file:", error);
    throw new Error('Could not read product data.');
  }
}

async function saveProducts(items: Product[]): Promise<void> {
  try {
    await fs.mkdir(path.dirname(productsFilePath), { recursive: true });
    await fs.writeFile(productsFilePath, JSON.stringify(items, null, 2), 'utf-8');
  } catch (error) {
    console.error("Error writing products file:", error);
    throw new Error('Could not save product data.');
  }
}

async function handleImageUpload(imageFile: File | null): Promise<string | null> {
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
  const fileExtension = path.extname(imageFile.name) || '.png';
  const uniqueFilename = `${randomUUID()}${fileExtension}`;
  const filePath = path.join(publicUploadsDir, uniqueFilename);
  
  const buffer = Buffer.from(await imageFile.arrayBuffer());
  await fs.writeFile(filePath, buffer);

  return `/${UPLOADS_DIR_NAME}/${PRODUCT_IMAGES_DIR_NAME}/${uniqueFilename}`;
}

function transformTags(tagsString?: string): string[] {
  if (!tagsString || tagsString.trim() === "") return [];
  return tagsString.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
}


export async function getProducts(params?: { isFeatured?: boolean; limit?: number }): Promise<{ products?: Product[]; error?: string }> {
  try {
    const products = await getProductsInternal(params);
    return { products };
  } catch (error: any) {
    return { error: error.message || "Failed to fetch products." };
  }
}

export async function addProduct(formData: FormData): Promise<{ success: boolean; product?: Product; error?: string; errors?: z.ZodIssue[] }> {
  try {
    const rawData: Record<string, any> = {};
    formData.forEach((value, key) => {
      if (key === 'isFeatured') {
        rawData[key] = value === 'on' || value === 'true';
      } else if (key !== 'imageFile') {
         // Handle optional empty strings for URLs and version
        if ((key === 'productUrl' || key === 'version' || key === 'longDescription' || key === 'releaseDate') && value === '') {
          rawData[key] = null; // Store as null if empty for optional fields
        } else {
          rawData[key] = value;
        }
      }
    });
    
    // Use a modified schema for parsing form data that aligns with FormProductInput
    const FormProductParseSchema = FormProductSchema.omit({ imageUrl: true }); // imageUrl (path) not directly from form text fields
    const validation = FormProductParseSchema.safeParse(rawData);

    if (!validation.success) {
      console.error("Validation errors:", validation.error.issues);
      return { success: false, error: "Invalid data provided.", errors: validation.error.issues };
    }
    
    const validatedData = validation.data;
    const imageFile = formData.get('imageFile') as File | null;
    let imageUrl: string | null = null;

    if (imageFile && imageFile.size > 0) {
      imageUrl = await handleImageUpload(imageFile);
    }

    const products = await getProductsInternal();
    const now = new Date().toISOString();

    const newProduct: Product = {
      id: randomUUID(),
      name: validatedData.name,
      version: validatedData.version || null,
      status: validatedData.status,
      releaseDate: validatedData.releaseDate ? new Date(validatedData.releaseDate).toISOString() : null,
      description: validatedData.description,
      longDescription: validatedData.longDescription || null,
      imageUrl: imageUrl || "",
      productUrl: validatedData.productUrl || "",
      developer: validatedData.developer,
      pricingType: validatedData.pricingType,
      pricingTerm: validatedData.pricingTerm,
      tags: transformTags(validatedData.tagsString),
      isFeatured: validatedData.isFeatured,
      createdAt: now,
      updatedAt: now,
    };
    
    products.push(newProduct);
    await saveProducts(products);
    revalidatePath('/admin/dashboard/products');
    revalidatePath('/'); // Revalidate homepage
    // Revalidate specific product page if it exists (e.g. /products/[id])
    return { success: true, product: newProduct };
  } catch (error: any) {
    console.error("Add product error:", error);
    return { success: false, error: error.message || "Failed to add product." };
  }
}

export async function getProductById(id: string): Promise<{ product?: Product; error?: string }> {
  try {
    const products = await getProductsInternal();
    const product = products.find(p => p.id === id);
    if (!product) {
      return { error: "Product not found." };
    }
    return { product };
  } catch (error: any) {
    return { error: error.message || "Failed to fetch product." };
  }
}

export async function updateProduct(id: string, formData: FormData): Promise<{ success: boolean; product?: Product; error?: string, errors?: z.ZodIssue[] }> {
  try {
    const rawData: Record<string, any> = {};
     formData.forEach((value, key) => {
      if (key === 'isFeatured') {
        rawData[key] = value === 'on' || value === 'true';
      } else if (key !== 'imageFile' && key !== 'existingImageUrl') {
        if ((key === 'productUrl' || key === 'version' || key === 'longDescription' || key === 'releaseDate') && value === '') {
          rawData[key] = null; 
        } else {
          rawData[key] = value;
        }
      }
    });

    const FormProductParseSchema = FormProductSchema.omit({ imageUrl: true }).partial();
    const validation = FormProductParseSchema.safeParse(rawData); 
    
    if (!validation.success) {
      console.error("Update validation errors:", validation.error.issues);
      return { success: false, error: "Invalid data provided for update.", errors: validation.error.issues };
    }
    
    const validatedData = validation.data;
    let products = await getProductsInternal();
    const productIndex = products.findIndex(p => p.id === id);

    if (productIndex === -1) {
      return { success: false, error: "Product not found." };
    }
    
    const originalProduct = products[productIndex];
    let imageUrlToSave = originalProduct.imageUrl; 
    const imageFile = formData.get('imageFile') as File | null;
    const existingImageUrlFromForm = formData.get('existingImageUrl') as string | null;


    if (imageFile && imageFile.size > 0) {
      // Delete old image if it exists and a new one is uploaded
      if (originalProduct.imageUrl) {
        try {
          const oldImagePath = path.join(process.cwd(), 'public', originalProduct.imageUrl);
          await fs.unlink(oldImagePath);
        } catch (imgDelError: any) {
          console.warn(`Failed to delete old product image ${originalProduct.imageUrl}: ${imgDelError.message}`);
        }
      }
      imageUrlToSave = await handleImageUpload(imageFile); // Returns null if upload fails or no file
    } else if (existingImageUrlFromForm !== null) { // If no new file, keep existing or clear it
       imageUrlToSave = existingImageUrlFromForm; 
    }


    const updatedProductData: Product = {
      ...originalProduct,
      name: validatedData.name ?? originalProduct.name,
      version: validatedData.version !== undefined ? validatedData.version : originalProduct.version,
      status: validatedData.status ?? originalProduct.status,
      releaseDate: validatedData.releaseDate !== undefined ? (validatedData.releaseDate ? new Date(validatedData.releaseDate).toISOString() : null) : originalProduct.releaseDate,
      description: validatedData.description ?? originalProduct.description,
      longDescription: validatedData.longDescription !== undefined ? validatedData.longDescription : originalProduct.longDescription,
      productUrl: validatedData.productUrl !== undefined ? validatedData.productUrl : originalProduct.productUrl,
      developer: validatedData.developer ?? originalProduct.developer,
      pricingType: validatedData.pricingType ?? originalProduct.pricingType,
      pricingTerm: validatedData.pricingTerm ?? originalProduct.pricingTerm,
      tags: validatedData.tagsString !== undefined ? transformTags(validatedData.tagsString) : originalProduct.tags,
      isFeatured: validatedData.isFeatured !== undefined ? validatedData.isFeatured : originalProduct.isFeatured,
      imageUrl: imageUrlToSave || "", // Ensure it's a string, even if empty
      updatedAt: new Date().toISOString(), 
    };
    
    products[productIndex] = updatedProductData;
    await saveProducts(products);
    revalidatePath('/admin/dashboard/products');
    revalidatePath(`/admin/dashboard/products/edit/${id}`);
    revalidatePath('/'); // Revalidate homepage
    return { success: true, product: updatedProductData };
  } catch (error: any) {
    console.error("Update product error:", error);
    return { success: false, error: error.message || "Failed to update product." };
  }
}

export async function deleteProduct(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    let products = await getProductsInternal();
    const productToDelete = products.find(p => p.id === id);
    if (!productToDelete) {
      return { success: false, error: "Product not found for deletion." };
    }

    if (productToDelete.imageUrl) {
      try {
        const imagePath = path.join(process.cwd(), 'public', productToDelete.imageUrl);
        await fs.unlink(imagePath);
      } catch (imgDelError: any)
      {
        console.warn(`Failed to delete product image ${productToDelete.imageUrl}: ${imgDelError.message}`);
      }
    }

    const filteredProducts = products.filter(p => p.id !== id);
    await saveProducts(filteredProducts);

    revalidatePath('/admin/dashboard/products');
    revalidatePath('/'); 
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete product." };
  }
}
