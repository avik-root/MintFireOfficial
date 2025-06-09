
'use server';

import fs from 'fs/promises';
import path from 'path';
import { z } from 'zod';
import {
  ProductSchema,
  FormProductSchema, 
  type Product,
  type ProductStatus,
} from '@/lib/schemas/product-schemas';
import { revalidatePath } from 'next/cache';
import { randomUUID } from 'crypto';

const productsFilePath = path.join(process.cwd(), 'data', 'products.json');
const UPLOADS_DIR_NAME = 'uploads';
const PRODUCT_IMAGES_DIR_NAME = 'product-images';
const publicUploadsDir = path.join(process.cwd(), 'public', UPLOADS_DIR_NAME, PRODUCT_IMAGES_DIR_NAME);

async function getProductsInternal(params?: { isFeatured?: boolean; limit?: number; status?: ProductStatus }): Promise<Product[]> {
  try {
    await fs.mkdir(path.dirname(productsFilePath), { recursive: true });

    let fileContent: string;
    try {
      fileContent = await fs.readFile(productsFilePath, 'utf-8');
    } catch (readError: any) {
      if (readError.code === 'ENOENT') {
        // If file doesn't exist, create it with an empty array
        await fs.writeFile(productsFilePath, JSON.stringify([]), 'utf-8');
        return [];
      }
      throw readError; // Re-throw other read errors
    }

    if (fileContent.trim() === '') {
      return []; // Treat empty file as empty array
    }

    const items = JSON.parse(fileContent);

    // Ensure the parsed content is an array; if not, log error and treat as empty.
    // This handles cases where the file might have been corrupted to be a non-array JSON.
    if (!Array.isArray(items)) {
      console.error(`Data in ${productsFilePath} is not an array. Found: ${typeof items}. Overwriting with empty array to prevent further errors.`);
      await fs.writeFile(productsFilePath, JSON.stringify([]), 'utf-8'); 
      return [];
    }
    
    let parsedItems = z.array(ProductSchema).parse(items);

    if (params?.isFeatured !== undefined) {
      parsedItems = parsedItems.filter(product => product.isFeatured === params.isFeatured);
    }
    if (params?.status) {
      parsedItems = parsedItems.filter(product => product.status === params.status);
    }

    // Sort primarily by releaseDate (if available, descending), then by createdAt (descending)
    parsedItems.sort((a, b) => {
      const dateA = a.releaseDate ? new Date(a.releaseDate).getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
      const dateB = b.releaseDate ? new Date(b.releaseDate).getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
      if (dateB !== dateA) return dateB - dateA; // Newest release first

      // Fallback to createdAt if release dates are the same or not present
      const createdAtA = new Date(a.createdAt).getTime();
      const createdAtB = new Date(b.createdAt).getTime();
      return createdAtB - createdAtA; // Newest created first
    });

    if (params?.limit) {
      parsedItems = parsedItems.slice(0, params.limit);
    }
    return parsedItems;

  } catch (error: any) {
    console.error(`Error processing products file (${productsFilePath}):`, error);
    let errorMessage = `Could not process product data from ${productsFilePath}.`;
    if (error instanceof z.ZodError) {
      errorMessage = `Product data validation failed: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`;
    } else if (error.message) {
      errorMessage = `Error reading product data: ${error.message}`;
    }
    throw new Error(errorMessage);
  }
}

async function saveProducts(items: Product[]): Promise<void> {
  try {
    await fs.mkdir(path.dirname(productsFilePath), { recursive: true });
    await fs.writeFile(productsFilePath, JSON.stringify(items, null, 2), 'utf-8');
    console.log('Products data successfully saved to:', productsFilePath);
  } catch (error: any) {
    console.error("Error writing products file:", productsFilePath, error); 
    let message = 'Could not save product data. ';
    if (error.code === 'EACCES') {
      message += 'Permission denied. Please check file/folder permissions.';
    } else if (error.code === 'ENOSPC') {
      message += 'No space left on device.';
    } else {
      message += `An unexpected error occurred: ${error.message || 'Unknown error'}`;
    }
    throw new Error(message);
  }
}

// handleImageUpload saves an uploaded file to public/uploads/product-images/
// and returns its web-accessible path (e.g., /uploads/product-images/filename.png).
// This path is then stored in products.json.
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
  const fileExtension = path.extname(imageFile.name) || '.png'; // Default to .png if no extension
  const uniqueFilename = `${randomUUID()}${fileExtension}`;
  const filePath = path.join(publicUploadsDir, uniqueFilename);

  // Convert ArrayBuffer from File to Buffer for fs.writeFile
  const buffer = Buffer.from(await imageFile.arrayBuffer());
  await fs.writeFile(filePath, buffer);

  // Return the web-accessible path
  return `/${UPLOADS_DIR_NAME}/${PRODUCT_IMAGES_DIR_NAME}/${uniqueFilename}`;
}

function transformTags(tagsString?: string): string[] {
  if (!tagsString || tagsString.trim() === "") return [];
  return tagsString.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
}


export async function getProducts(params?: { isFeatured?: boolean; limit?: number; status?: ProductStatus }): Promise<{ products?: Product[]; error?: string }> {
  try {
    const products = await getProductsInternal(params);
    return { products };
  } catch (error: any) {
    return { error: error.message || "Failed to fetch products due to an unknown error." };
  }
}

export async function addProduct(formData: FormData): Promise<{ success: boolean; product?: Product; error?: string; errors?: z.ZodIssue[] }> {
  try {
    const rawData: Record<string, any> = {};
    formData.forEach((value, key) => {
      // Skip file inputs and specific image URL handling fields from FormData for rawData
      if (key === 'imageFile' || key === 'existingImageUrl') return;

      const strValue = String(value).trim();
      if (key === 'isFeatured') {
        rawData[key] = strValue === 'on' || strValue === 'true';
      } else if (key === 'releaseDate' || key === 'version' || key === 'longDescription') {
        // Convert "undefined", "null", or empty string for these optional/nullable fields to actual null
        if (strValue === '' || strValue.toLowerCase() === 'null' || strValue.toLowerCase() === 'undefined') {
          rawData[key] = null;
        } else {
          rawData[key] = strValue;
        }
      } else if (key === 'productUrl') {
        // productUrl can be an empty string or a valid URL. It cannot be null if key is present.
        if (strValue.toLowerCase() === 'null' || strValue.toLowerCase() === 'undefined' || strValue === '') {
          rawData[key] = ""; 
        } else {
          rawData[key] = strValue;
        }
      } else {
        rawData[key] = strValue;
      }
    });

    // The FormProductSchema is used for client-side validation in the form component.
    // Here, we can adapt it slightly or use parts of it for server-side processing of rawData.
    // We omit 'imageUrl' from this parse because 'imageUrl' will be determined by handleImageUpload.
    const FormProductParseSchema = FormProductSchema.omit({ imageUrl: true });
    const validation = FormProductParseSchema.safeParse(rawData);

    if (!validation.success) {
      return { success: false, error: "Invalid data provided.", errors: validation.error.issues };
    }

    const validatedData = validation.data;
    const imageFile = formData.get('imageFile') as File | null;
    let imageUrlFromServer: string | null = null;

    if (imageFile && imageFile.size > 0) {
      imageUrlFromServer = await handleImageUpload(imageFile);
    }

    const products = await getProductsInternal(); 
    const now = new Date().toISOString();

    const newProduct: Product = {
      id: randomUUID(),
      name: validatedData.name,
      version: validatedData.version, // Already null if empty/invalid from form
      status: validatedData.status,
      releaseDate: validatedData.releaseDate, // Already null if empty/invalid from form
      description: validatedData.description,
      longDescription: validatedData.longDescription, // Already null if empty/invalid from form
      imageUrl: imageUrlFromServer || "", // Use uploaded image path or empty if none
      productUrl: validatedData.productUrl || "", // Already "" if empty/invalid from form
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
    return { success: true, product: newProduct };
  } catch (error: any) {
    console.error("ADD_PRODUCT_ACTION_ERROR:", error);
    let errorMessage = "An unexpected error occurred while adding the product.";
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else if (error && typeof error.toString === 'function') {
      errorMessage = error.toString();
    }
    return { success: false, error: errorMessage };
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
      // Skip file inputs and specific image URL handling fields from FormData for rawData
      if (key === 'imageFile' || key === 'existingImageUrl') return;

      const strValue = String(value).trim();
      if (key === 'isFeatured') {
        rawData[key] = strValue === 'on' || strValue === 'true';
      } else if (key === 'releaseDate' || key === 'version' || key === 'longDescription') {
        // Convert "undefined", "null", or empty string for these optional/nullable fields to actual null
        if (strValue === '' || strValue.toLowerCase() === 'null' || strValue.toLowerCase() === 'undefined') {
          rawData[key] = null;
        } else {
          rawData[key] = strValue;
        }
      } else if (key === 'productUrl') {
           // productUrl can be an empty string or a valid URL. It cannot be null if key is present.
           if (strValue.toLowerCase() === 'null' || strValue.toLowerCase() === 'undefined' || strValue === '') {
            rawData[key] = "";
          } else {
            rawData[key] = strValue;
          }
        } else {
        rawData[key] = strValue;
      }
    });

    // We omit 'imageUrl' from this parse because 'imageUrl' will be determined by handleImageUpload or existingImageUrl.
    const FormProductParseSchema = FormProductSchema.omit({ imageUrl: true }).partial();
    const validation = FormProductParseSchema.safeParse(rawData);

    if (!validation.success) {
      return { success: false, error: "Invalid data provided for update.", errors: validation.error.issues };
    }

    const validatedData = validation.data;
    let products = await getProductsInternal();
    const productIndex = products.findIndex(p => p.id === id);

    if (productIndex === -1) {
      return { success: false, error: "Product not found." };
    }

    const originalProduct = products[productIndex];
    let imageUrlToSave = originalProduct.imageUrl; // Default to keeping the original image URL/path

    const imageFile = formData.get('imageFile') as File | null;
    // 'existingImageUrl' from form indicates client's intent regarding current image.
    // It could be the current path (if kept), or "" (if removed), or not present (if a new file is uploaded).
    const existingImageUrlFromForm = formData.get('existingImageUrl') as string | null; 

    if (imageFile && imageFile.size > 0) { // New image uploaded
      // Delete old local image if it exists and is different from the new one
      if (originalProduct.imageUrl && originalProduct.imageUrl.startsWith(`/${UPLOADS_DIR_NAME}/${PRODUCT_IMAGES_DIR_NAME}/`)) {
        try {
          const oldImagePath = path.join(process.cwd(), 'public', originalProduct.imageUrl);
          await fs.unlink(oldImagePath).catch(e => console.warn(`Non-critical: Failed to delete old image ${oldImagePath}: ${e.message}`));
        } catch (imgDelError: any) {
          console.warn(`Failed to delete old product image ${originalProduct.imageUrl}: ${imgDelError.message}`);
        }
      }
      imageUrlToSave = await handleImageUpload(imageFile); // Save new, get its path
    } else if (existingImageUrlFromForm !== null && existingImageUrlFromForm === "") { 
      // User explicitly wants to remove the image (sent "" for existingImageUrl)
      if (originalProduct.imageUrl && originalProduct.imageUrl.startsWith(`/${UPLOADS_DIR_NAME}/${PRODUCT_IMAGES_DIR_NAME}/`)) {
         try {
          const oldImagePath = path.join(process.cwd(), 'public', originalProduct.imageUrl);
          await fs.unlink(oldImagePath).catch(e => console.warn(`Non-critical: Failed to delete old image ${oldImagePath}: ${e.message}`));
        } catch (imgDelError: any) {
          console.warn(`Failed to delete old product image ${originalProduct.imageUrl}: ${imgDelError.message}`);
        }
      }
      imageUrlToSave = ""; // Set to empty string
    } else if (existingImageUrlFromForm !== null) {
      // User wants to keep the existing image (sent the current imageUrl as existingImageUrl)
      // or the form didn't change the image part.
      imageUrlToSave = existingImageUrlFromForm;
    }
    // If existingImageUrlFromForm is null (and no new imageFile), imageUrlToSave remains originalProduct.imageUrl.
   
    const updatedProductData: Product = {
      ...originalProduct,
      name: validatedData.name ?? originalProduct.name,
      version: validatedData.version !== undefined ? validatedData.version : originalProduct.version, 
      status: validatedData.status ?? originalProduct.status,
      releaseDate: validatedData.releaseDate !== undefined ? validatedData.releaseDate : originalProduct.releaseDate, 
      description: validatedData.description ?? originalProduct.description,
      longDescription: validatedData.longDescription !== undefined ? validatedData.longDescription : originalProduct.longDescription, 
      productUrl: validatedData.productUrl !== undefined ? (validatedData.productUrl ?? "") : originalProduct.productUrl, 
      developer: validatedData.developer ?? originalProduct.developer,
      pricingType: validatedData.pricingType ?? originalProduct.pricingType,
      pricingTerm: validatedData.pricingTerm ?? originalProduct.pricingTerm,
      tags: validatedData.tagsString !== undefined ? transformTags(validatedData.tagsString) : originalProduct.tags,
      isFeatured: validatedData.isFeatured !== undefined ? validatedData.isFeatured : originalProduct.isFeatured,
      imageUrl: imageUrlToSave || "", 
      updatedAt: new Date().toISOString(),
    };

    products[productIndex] = updatedProductData;
    await saveProducts(products);
    revalidatePath('/admin/dashboard/products');
    revalidatePath(`/admin/dashboard/products/edit/${id}`);
    revalidatePath('/'); // Revalidate homepage
    return { success: true, product: updatedProductData };
  } catch (error: any) {
    console.error("UPDATE_PRODUCT_ACTION_ERROR:", error);
    let errorMessage = "An unexpected error occurred while updating the product.";
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else if (error && typeof error.toString === 'function') {
      errorMessage = error.toString();
    }
    return { success: false, error: errorMessage };
  }
}

export async function deleteProduct(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    let products = await getProductsInternal();
    const productToDelete = products.find(p => p.id === id);
    
    if (!productToDelete) {
      return { success: false, error: "Product not found for deletion." };
    }

    // Delete associated image file if it's a local upload
    if (productToDelete.imageUrl && productToDelete.imageUrl.startsWith(`/${UPLOADS_DIR_NAME}/${PRODUCT_IMAGES_DIR_NAME}/`)) {
      try {
        const imagePath = path.join(process.cwd(), 'public', productToDelete.imageUrl);
        await fs.unlink(imagePath).catch(e => console.warn(`Non-critical: Failed to delete image ${imagePath}: ${e.message}`));
      }
      catch (imgDelError: any)
      {
        // Log deletion error but proceed with deleting product data
        console.warn(`Failed to delete product image ${productToDelete.imageUrl}: ${imgDelError.message}`);
      }
    }

    const filteredProducts = products.filter(p => p.id !== id);
    await saveProducts(filteredProducts);

    revalidatePath('/admin/dashboard/products');
    revalidatePath('/'); // Revalidate homepage
    return { success: true };
  } catch (error: any)
   {
    console.error("DELETE_PRODUCT_ACTION_ERROR:", error);
    let errorMessage = "Failed to delete product.";
     if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else if (error && typeof error.toString === 'function') {
      errorMessage = error.toString();
    }
    return { success: false, error: errorMessage };
  }
}
    
