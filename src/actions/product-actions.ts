
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
        // File doesn't exist, create it with an empty array
        await fs.writeFile(productsFilePath, JSON.stringify([]), 'utf-8');
        return [];
      }
      // For other read errors, re-throw
      throw readError;
    }

    // If file is empty or just whitespace, treat as empty array
    if (fileContent.trim() === '') {
      return [];
    }

    const items = JSON.parse(fileContent);

    // Ensure items is an array before parsing with Zod
    if (!Array.isArray(items)) {
      console.error(`Data in ${productsFilePath} is not an array. Found: ${typeof items}. Overwriting with empty array to prevent further errors.`);
      await fs.writeFile(productsFilePath, JSON.stringify([]), 'utf-8'); // Self-heal by resetting
      return [];
    }
    
    let parsedItems = z.array(ProductSchema).parse(items);

    if (params?.isFeatured !== undefined) {
      parsedItems = parsedItems.filter(product => product.isFeatured === params.isFeatured);
    }
    if (params?.status) {
      parsedItems = parsedItems.filter(product => product.status === params.status);
    }

    // Sort by releaseDate (descending), then by createdAt (descending) as fallback
    parsedItems.sort((a, b) => {
      const dateA = a.releaseDate ? new Date(a.releaseDate).getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
      const dateB = b.releaseDate ? new Date(b.releaseDate).getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
      if (dateB !== dateA) return dateB - dateA;
      // Fallback sort by createdAt if releaseDates are same or absent
      const createdAtA = new Date(a.createdAt).getTime();
      const createdAtB = new Date(b.createdAt).getTime();
      return createdAtB - createdAtA;
    });

    if (params?.limit) {
      parsedItems = parsedItems.slice(0, params.limit);
    }
    return parsedItems;

  } catch (error: any) {
    console.error(`Error processing products file (${productsFilePath}):`, error);
    // Construct a more informative error message
    let errorMessage = `Could not process product data from ${productsFilePath}.`;
    if (error instanceof z.ZodError) {
      errorMessage = `Product data validation failed: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`;
    } else if (error.message) {
      // Use the error's message if available
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
    console.error("Error writing products file:", error);
    throw new Error('Could not save product data. Please ensure the data directory is writable and has sufficient space.');
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
  const fileExtension = path.extname(imageFile.name) || '.png'; // Default to .png if no extension
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
      const strValue = String(value).trim();
      if (key === 'isFeatured') {
        rawData[key] = strValue === 'on' || strValue === 'true';
      } else if (key !== 'imageFile') { 
        if (key === 'releaseDate' || key === 'version' || key === 'longDescription') {
          if (strValue === '' || strValue.toLowerCase() === 'null' || strValue.toLowerCase() === 'undefined') {
            rawData[key] = null;
          } else {
            rawData[key] = strValue;
          }
        } else if (key === 'productUrl') {
          if (strValue.toLowerCase() === 'null' || strValue.toLowerCase() === 'undefined') {
            rawData[key] = ""; 
          } else {
            rawData[key] = strValue;
          }
        } else {
          rawData[key] = strValue;
        }
      }
    });

    // Use FormProductSchema directly for parsing rawData intended for new product creation.
    // Omit imageUrl as it's derived from imageFile, not directly from form data fields.
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

    const products = await getProductsInternal(); // Fetch current products to append
    const now = new Date().toISOString();

    const newProduct: Product = {
      id: randomUUID(),
      name: validatedData.name,
      version: validatedData.version, // Will be null if not provided or empty
      status: validatedData.status,
      releaseDate: validatedData.releaseDate, // Will be null if not provided or empty
      description: validatedData.description,
      longDescription: validatedData.longDescription, // Will be null if not provided or empty
      imageUrl: imageUrlFromServer || "", // Use uploaded image or empty string
      productUrl: validatedData.productUrl || "", // Will be "" if not provided or empty
      developer: validatedData.developer,
      pricingType: validatedData.pricingType,
      pricingTerm: validatedData.pricingTerm,
      tags: transformTags(validatedData.tagsString),
      isFeatured: validatedData.isFeatured, // Will default to false if not in formData
      createdAt: now,
      updatedAt: now,
    };

    products.push(newProduct);
    await saveProducts(products);
    revalidatePath('/admin/dashboard/products');
    revalidatePath('/');
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
      const strValue = String(value).trim();
      if (key === 'isFeatured') {
        rawData[key] = strValue === 'on' || strValue === 'true';
      } else if (key !== 'imageFile' && key !== 'existingImageUrl') { // Don't put file or existing path directly into rawData for Zod
        if (key === 'releaseDate' || key === 'version' || key === 'longDescription') {
          if (strValue === '' || strValue.toLowerCase() === 'null' || strValue.toLowerCase() === 'undefined') {
            rawData[key] = null;
          } else {
            rawData[key] = strValue;
          }
        } else if (key === 'productUrl') {
           if (strValue.toLowerCase() === 'null' || strValue.toLowerCase() === 'undefined') {
            rawData[key] = "";
          } else {
            rawData[key] = strValue;
          }
        } else {
          rawData[key] = strValue;
        }
      }
    });

    // For updates, use the partial schema as not all fields might be sent
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
    let imageUrlToSave = originalProduct.imageUrl; // Default to original
    const imageFile = formData.get('imageFile') as File | null;
    const existingImageUrlFromForm = formData.get('existingImageUrl') as string | null; 

    if (imageFile && imageFile.size > 0) { // New image uploaded
      // Delete old image if it exists and seems to be one we manage
      if (originalProduct.imageUrl && originalProduct.imageUrl.startsWith(`/${UPLOADS_DIR_NAME}/${PRODUCT_IMAGES_DIR_NAME}/`)) {
        try {
          const oldImagePath = path.join(process.cwd(), 'public', originalProduct.imageUrl);
          await fs.unlink(oldImagePath).catch(e => console.warn(`Non-critical: Failed to delete old image ${oldImagePath}: ${e.message}`));
        } catch (imgDelError: any) {
          // Log non-critical error, proceed with update
          console.warn(`Failed to delete old product image ${originalProduct.imageUrl}: ${imgDelError.message}`);
        }
      }
      imageUrlToSave = await handleImageUpload(imageFile); 
    } else if (existingImageUrlFromForm !== null && existingImageUrlFromForm === "") { // Image explicitly removed by client (e.g. imagePreview set to null)
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
      // This case implies the user didn't upload a new file, and didn't explicitly remove the image
      // So, we keep the image path that was on the form (which should be originalProduct.imageUrl if unchanged)
      imageUrlToSave = existingImageUrlFromForm;
    }
    // If existingImageUrlFromForm is null, it means the 'existingImageUrl' field wasn't sent,
    // which implies the form didn't have an initial image or the logic sending it changed.
    // In this situation, if no new imageFile, imageUrlToSave remains originalProduct.imageUrl from above.

   
    // Merge validated data with original product data
    const updatedProductData: Product = {
      ...originalProduct,
      name: validatedData.name ?? originalProduct.name,
      version: validatedData.version !== undefined ? validatedData.version : originalProduct.version, // handles null or new string
      status: validatedData.status ?? originalProduct.status,
      releaseDate: validatedData.releaseDate !== undefined ? validatedData.releaseDate : originalProduct.releaseDate, // handles null or new string
      description: validatedData.description ?? originalProduct.description,
      longDescription: validatedData.longDescription !== undefined ? validatedData.longDescription : originalProduct.longDescription, // handles null or new string
      productUrl: validatedData.productUrl !== undefined ? (validatedData.productUrl ?? "") : originalProduct.productUrl, // handles "" or new string
      developer: validatedData.developer ?? originalProduct.developer,
      pricingType: validatedData.pricingType ?? originalProduct.pricingType,
      pricingTerm: validatedData.pricingTerm ?? originalProduct.pricingTerm,
      tags: validatedData.tagsString !== undefined ? transformTags(validatedData.tagsString) : originalProduct.tags,
      isFeatured: validatedData.isFeatured !== undefined ? validatedData.isFeatured : originalProduct.isFeatured,
      imageUrl: imageUrlToSave || "", // Ensure it's a string
      updatedAt: new Date().toISOString(),
    };

    products[productIndex] = updatedProductData;
    await saveProducts(products);
    revalidatePath('/admin/dashboard/products');
    revalidatePath(`/admin/dashboard/products/edit/${id}`);
    revalidatePath('/'); // Revalidate homepage if products are shown there
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

    // Attempt to delete the image file if it exists and is managed by us
    if (productToDelete.imageUrl && productToDelete.imageUrl.startsWith(`/${UPLOADS_DIR_NAME}/${PRODUCT_IMAGES_DIR_NAME}/`)) {
      try {
        const imagePath = path.join(process.cwd(), 'public', productToDelete.imageUrl);
        await fs.unlink(imagePath).catch(e => console.warn(`Non-critical: Failed to delete image ${imagePath}: ${e.message}`));
      }
      catch (imgDelError: any)
      {
        // Log non-critical error, proceed with deleting product entry
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

