
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
// Constants for image uploads removed as image functionality is being removed.
// const UPLOADS_DIR_NAME = 'uploads';
// const PRODUCT_IMAGES_DIR_NAME = 'product-images';
// const publicUploadsDir = path.join(process.cwd(), 'public', UPLOADS_DIR_NAME, PRODUCT_IMAGES_DIR_NAME);

async function getProductsInternal(params?: { isFeatured?: boolean; limit?: number; status?: ProductStatus }): Promise<Product[]> {
  try {
    await fs.mkdir(path.dirname(productsFilePath), { recursive: true });

    let fileContent: string;
    try {
      fileContent = await fs.readFile(productsFilePath, 'utf-8');
    } catch (readError: any) {
      if (readError.code === 'ENOENT') {
        await fs.writeFile(productsFilePath, JSON.stringify([]), 'utf-8');
        return [];
      }
      throw readError;
    }

    if (fileContent.trim() === '') {
      return [];
    }

    const items = JSON.parse(fileContent);

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

    parsedItems.sort((a, b) => {
      const dateA = a.releaseDate ? new Date(a.releaseDate).getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
      const dateB = b.releaseDate ? new Date(b.releaseDate).getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
      if (dateB !== dateA) return dateB - dateA;

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

// handleImageUpload function removed as image functionality is removed.

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
      } else if (key === 'releaseDate' || key === 'version' || key === 'longDescription') {
        if (strValue === '' || strValue.toLowerCase() === 'null' || strValue.toLowerCase() === 'undefined') {
          rawData[key] = null;
        } else {
          rawData[key] = strValue;
        }
      } else if (key === 'productUrl') {
        if (strValue.toLowerCase() === 'null' || strValue.toLowerCase() === 'undefined' || strValue === '') {
          rawData[key] = ""; 
        } else {
          rawData[key] = strValue;
        }
      } else {
        rawData[key] = strValue;
      }
    });

    // FormProductSchema no longer contains imageUrl.
    const validation = FormProductSchema.safeParse(rawData);

    if (!validation.success) {
      return { success: false, error: "Invalid data provided.", errors: validation.error.issues };
    }

    const validatedData = validation.data;
    // Image handling logic removed.

    const products = await getProductsInternal(); 
    const now = new Date().toISOString();

    const newProduct: Product = {
      id: randomUUID(),
      name: validatedData.name,
      version: validatedData.version,
      status: validatedData.status,
      releaseDate: validatedData.releaseDate,
      description: validatedData.description,
      longDescription: validatedData.longDescription,
      // imageUrl field removed
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
      } else if (key === 'releaseDate' || key === 'version' || key === 'longDescription') {
        if (strValue === '' || strValue.toLowerCase() === 'null' || strValue.toLowerCase() === 'undefined') {
          rawData[key] = null;
        } else {
          rawData[key] = strValue;
        }
      } else if (key === 'productUrl') {
           if (strValue.toLowerCase() === 'null' || strValue.toLowerCase() === 'undefined' || strValue === '') {
            rawData[key] = "";
          } else {
            rawData[key] = strValue;
          }
        } else {
        rawData[key] = strValue;
      }
    });

    // FormProductSchema no longer contains imageUrl.
    const validation = FormProductSchema.partial().safeParse(rawData);

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
    // Image handling logic removed.
   
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
      // imageUrl field removed
      updatedAt: new Date().toISOString(),
    };

    products[productIndex] = updatedProductData;
    await saveProducts(products);
    revalidatePath('/admin/dashboard/products');
    revalidatePath(`/admin/dashboard/products/edit/${id}`);
    revalidatePath('/');
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

    // Image deletion logic removed.

    const filteredProducts = products.filter(p => p.id !== id);
    await saveProducts(filteredProducts);

    revalidatePath('/admin/dashboard/products');
    revalidatePath('/');
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
