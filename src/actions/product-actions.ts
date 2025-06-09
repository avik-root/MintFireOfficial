
'use server';

import fs from 'fs/promises';
import path from 'path';
import { z } from 'zod';
import {
  ProductSchema,
  FormProductSchema, 
  type Product,
  type ProductStatus,
  type BillingInterval,
} from '@/lib/schemas/product-schemas';
import { revalidatePath } from 'next/cache';
import { randomUUID } from 'crypto';

const productsFilePath = path.join(process.cwd(), 'data', 'products.json');
const UPLOADS_DIR_NAME = 'uploads';
const PRODUCT_IMAGES_DIR_NAME = 'product-images'; 
const publicUploadsDir = path.join(process.cwd(), UPLOADS_DIR_NAME, PRODUCT_IMAGES_DIR_NAME);

async function getProductsInternal(params?: { isFeatured?: boolean; limit?: number; status?: ProductStatus; tag?: string }): Promise<Product[]> {
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
      await fs.writeFile(productsFilePath, JSON.stringify([]), 'utf-8'); // Ensure it's an empty array if file is just whitespace
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
    if (params?.tag) {
      const lowerCaseTag = params.tag.toLowerCase();
      parsedItems = parsedItems.filter(product => 
        product.tags.some(t => t.toLowerCase() === lowerCaseTag)
      );
    }

    parsedItems.sort((a, b) => {
      const dateA = a.releaseDate ? new Date(a.releaseDate).getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
      const dateB = b.releaseDate ? new Date(b.releaseDate).getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
      if (dateB !== dateA) return dateB - dateA;

      const createdAtA = new Date(a.createdAt).getTime();
      const createdAtB = new Date(b.createdAt).getTime();
      return createdAtB - createdAtA;
    });

    if (params?.limit && params.limit > 0) {
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

function transformTags(tagsString?: string): string[] {
  if (!tagsString || tagsString.trim() === "") return [];
  return tagsString.split(',').map(tag => tag.trim().toLowerCase()).filter(tag => tag.length > 0);
}

function parseOptionalFloat(value: string | null | undefined): number | null {
  if (value === null || value === undefined || value.trim() === '') return null;
  const num = parseFloat(value);
  return isNaN(num) ? null : num; 
}

export async function getProducts(params?: { isFeatured?: boolean; limit?: number; status?: ProductStatus; tag?: string }): Promise<{ products?: Product[]; error?: string }> {
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
      } else if (['releaseDate', 'version', 'longDescription', 'couponDetails', 'activationDetails', 
                  'priceAmountString', 'monthlyPriceString', 'sixMonthPriceString', 'annualPriceString',
                  'trialDuration', 'postTrialPriceAmountString', 'postTrialBillingInterval'].includes(key)) {
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

    const validation = FormProductSchema.safeParse(rawData);

    if (!validation.success) {
      return { success: false, error: "Invalid data provided.", errors: validation.error.issues };
    }

    const validatedData = validation.data;
    const products = await getProductsInternal(); 
    const now = new Date().toISOString();

    let priceAmount = null;
    let monthlyPrice = null;
    let sixMonthPrice = null;
    let annualPrice = null;
    let trialDuration = null;
    let postTrialPriceAmount = null;
    let postTrialBillingInterval = null;

    if (validatedData.pricingType === 'Paid') {
        if (validatedData.pricingTerm === 'Lifetime') {
            priceAmount = parseOptionalFloat(validatedData.priceAmountString);
        } else if (validatedData.pricingTerm === 'Subscription') {
            monthlyPrice = parseOptionalFloat(validatedData.monthlyPriceString);
            sixMonthPrice = parseOptionalFloat(validatedData.sixMonthPriceString);
            annualPrice = parseOptionalFloat(validatedData.annualPriceString);
        }
    } else if (validatedData.pricingType === 'Free' && validatedData.pricingTerm === 'Subscription') { 
        trialDuration = validatedData.trialDuration ?? null;
        const parsedPostTrialPrice = parseOptionalFloat(validatedData.postTrialPriceAmountString);
        if (parsedPostTrialPrice && validatedData.postTrialBillingInterval) {
            postTrialPriceAmount = parsedPostTrialPrice;
            postTrialBillingInterval = validatedData.postTrialBillingInterval;
        }
    }

    const newProduct: Product = {
      id: randomUUID(),
      name: validatedData.name,
      version: validatedData.version,
      status: validatedData.status,
      releaseDate: validatedData.releaseDate,
      description: validatedData.description,
      longDescription: validatedData.longDescription,
      productUrl: validatedData.productUrl || "", 
      developer: validatedData.developer,
      pricingType: validatedData.pricingType,
      pricingTerm: validatedData.pricingTerm,
      
      priceAmount,
      monthlyPrice,
      sixMonthPrice,
      annualPrice,
      trialDuration,
      postTrialPriceAmount,
      postTrialBillingInterval,

      tags: transformTags(validatedData.tagsString),
      isFeatured: validatedData.isFeatured, 
      couponDetails: validatedData.couponDetails,
      activationDetails: validatedData.activationDetails,
      createdAt: now,
      updatedAt: now,
    };

    products.push(newProduct);
    await saveProducts(products);
    revalidatePath('/admin/dashboard/products');
    revalidatePath('/');
    revalidatePath('/services', 'layout'); 
    return { success: true, product: newProduct };
  } catch (error: any) {
    console.error("ADD_PRODUCT_ACTION_ERROR:", error);
    let errorMessage = "An unexpected error occurred while adding the product.";
    if (error instanceof Error) {
      errorMessage = error.message;
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
      } else if (['releaseDate', 'version', 'longDescription', 'couponDetails', 'activationDetails',
                  'priceAmountString', 'monthlyPriceString', 'sixMonthPriceString', 'annualPriceString',
                  'trialDuration', 'postTrialPriceAmountString', 'postTrialBillingInterval'].includes(key)) {
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

    const validation = FormProductSchema.safeParse(rawData);

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
    
    let priceAmount = originalProduct.priceAmount;
    let monthlyPrice = originalProduct.monthlyPrice;
    let sixMonthPrice = originalProduct.sixMonthPrice;
    let annualPrice = originalProduct.annualPrice;
    let trialDuration = originalProduct.trialDuration;
    let postTrialPriceAmount = originalProduct.postTrialPriceAmount;
    let postTrialBillingInterval = originalProduct.postTrialBillingInterval;

    const currentPricingType = validatedData.pricingType ?? originalProduct.pricingType;
    const currentPricingTerm = validatedData.pricingTerm ?? originalProduct.pricingTerm;

    // Reset all pricing fields before setting new ones based on type/term
    priceAmount = null;
    monthlyPrice = null;
    sixMonthPrice = null;
    annualPrice = null;
    trialDuration = null;
    postTrialPriceAmount = null;
    postTrialBillingInterval = null;

    if (currentPricingType === 'Paid') {
        if (currentPricingTerm === 'Lifetime') {
            priceAmount = parseOptionalFloat(validatedData.priceAmountString ?? originalProduct.priceAmount?.toString());
        } else if (currentPricingTerm === 'Subscription') {
            monthlyPrice = parseOptionalFloat(validatedData.monthlyPriceString ?? originalProduct.monthlyPrice?.toString());
            sixMonthPrice = parseOptionalFloat(validatedData.sixMonthPriceString ?? originalProduct.sixMonthPrice?.toString());
            annualPrice = parseOptionalFloat(validatedData.annualPriceString ?? originalProduct.annualPrice?.toString());
        }
    } else if (currentPricingType === 'Free' && currentPricingTerm === 'Subscription') { 
        trialDuration = validatedData.trialDuration ?? originalProduct.trialDuration;
        const parsedPostTrialPrice = parseOptionalFloat(validatedData.postTrialPriceAmountString ?? originalProduct.postTrialPriceAmount?.toString());
        const newPostTrialInterval = validatedData.postTrialBillingInterval ?? originalProduct.postTrialBillingInterval;
        if (parsedPostTrialPrice && newPostTrialInterval) {
            postTrialPriceAmount = parsedPostTrialPrice;
            postTrialBillingInterval = newPostTrialInterval;
        }
    }
   
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
      
      pricingType: currentPricingType,
      pricingTerm: currentPricingTerm,
      priceAmount,
      monthlyPrice,
      sixMonthPrice,
      annualPrice,
      trialDuration,
      postTrialPriceAmount,
      postTrialBillingInterval,
      
      tags: validatedData.tagsString !== undefined ? transformTags(validatedData.tagsString) : originalProduct.tags,
      isFeatured: validatedData.isFeatured !== undefined ? validatedData.isFeatured : originalProduct.isFeatured,
      couponDetails: validatedData.couponDetails !== undefined ? validatedData.couponDetails : originalProduct.couponDetails,
      activationDetails: validatedData.activationDetails !== undefined ? validatedData.activationDetails : originalProduct.activationDetails,
      updatedAt: new Date().toISOString(),
    };

    products[productIndex] = updatedProductData;
    await saveProducts(products);
    revalidatePath('/admin/dashboard/products');
    revalidatePath(`/admin/dashboard/products/edit/${id}`);
    revalidatePath('/');
    revalidatePath('/services', 'layout'); 
    return { success: true, product: updatedProductData };
  } catch (error: any) {
    console.error("UPDATE_PRODUCT_ACTION_ERROR:", error);
    let errorMessage = "An unexpected error occurred while updating the product.";
    if (error instanceof Error) {
      errorMessage = error.message;
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

    const filteredProducts = products.filter(p => p.id !== id);
    await saveProducts(filteredProducts);

    revalidatePath('/admin/dashboard/products');
    revalidatePath('/');
    revalidatePath('/services', 'layout'); 
    return { success: true };
  } catch (error: any) {
    console.error("DELETE_PRODUCT_ACTION_ERROR:", error);
    let errorMessage = "Failed to delete product.";
     if (error instanceof Error) {
      errorMessage = error.message;
    }
    return { success: false, error: errorMessage };
  }
}
