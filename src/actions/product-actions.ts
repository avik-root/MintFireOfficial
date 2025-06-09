
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
      const strValue = String(value).trim();
      if (key === 'isFeatured') {
        rawData[key] = strValue === 'on' || strValue === 'true';
      } else if (key !== 'imageFile') { // existingImageUrl is not relevant for add
        if (key === 'releaseDate' || key === 'version' || key === 'longDescription') {
          // These fields are .optional().nullable()
          if (strValue === '' || strValue.toLowerCase() === 'null' || strValue.toLowerCase() === 'undefined') {
            rawData[key] = null;
          } else {
            rawData[key] = strValue;
          }
        } else if (key === 'productUrl') {
          // This field is .optional().or(z.literal('')) - allows "" or undefined, not null
          if (strValue === '' || strValue.toLowerCase() === 'null' || strValue.toLowerCase() === 'undefined') {
            rawData[key] = ""; // Map empty/nullish from form to ""
          } else {
            rawData[key] = strValue;
          }
        } else {
          rawData[key] = strValue;
        }
      }
    });

    const FormProductParseSchema = FormProductSchema.omit({ imageUrl: true });
    const validation = FormProductParseSchema.safeParse(rawData);

    if (!validation.success) {
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
      version: validatedData.version,
      status: validatedData.status,
      releaseDate: validatedData.releaseDate,
      description: validatedData.description,
      longDescription: validatedData.longDescription,
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
    revalidatePath('/');
    return { success: true, product: newProduct };
  } catch (error: any) {
    console.error("Add product server error:", error);
    return { success: false, error: error.message || "An unexpected error occurred while adding the product." };
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
      } else if (key !== 'imageFile' && key !== 'existingImageUrl') {
        if (key === 'releaseDate' || key === 'version' || key === 'longDescription') {
          // These fields are .optional().nullable()
          if (strValue === '' || strValue.toLowerCase() === 'null' || strValue.toLowerCase() === 'undefined') {
            rawData[key] = null;
          } else {
            rawData[key] = strValue;
          }
        } else if (key === 'productUrl') {
          // This field is .optional().or(z.literal('')) - allows "" or undefined, not null
          if (strValue === '' || strValue.toLowerCase() === 'null' || strValue.toLowerCase() === 'undefined') {
            rawData[key] = ""; // Map empty/nullish from form to ""
          } else {
            rawData[key] = strValue;
          }
        } else {
          rawData[key] = strValue;
        }
      }
    });

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
    let imageUrlToSave = originalProduct.imageUrl;
    const imageFile = formData.get('imageFile') as File | null;
    const existingImageUrlFromForm = formData.get('existingImageUrl') as string | null; // Sent from form

    if (imageFile && imageFile.size > 0) { // New image uploaded
      if (originalProduct.imageUrl && originalProduct.imageUrl.startsWith(`/${UPLOADS_DIR_NAME}/${PRODUCT_IMAGES_DIR_NAME}/`)) {
        try {
          const oldImagePath = path.join(process.cwd(), 'public', originalProduct.imageUrl);
          await fs.unlink(oldImagePath).catch(e => console.warn(`Non-critical: Failed to delete old image ${oldImagePath}: ${e.message}`));
        } catch (imgDelError: any) {
          console.warn(`Failed to delete old product image ${originalProduct.imageUrl}: ${imgDelError.message}`);
        }
      }
      imageUrlToSave = await handleImageUpload(imageFile); // Returns path or null
    } else if (existingImageUrlFromForm !== null && existingImageUrlFromForm === "") {
      // User explicitly removed the image (existingImageUrl sent as empty string)
      if (originalProduct.imageUrl && originalProduct.imageUrl.startsWith(`/${UPLOADS_DIR_NAME}/${PRODUCT_IMAGES_DIR_NAME}/`)) {
         try {
          const oldImagePath = path.join(process.cwd(), 'public', originalProduct.imageUrl);
          await fs.unlink(oldImagePath).catch(e => console.warn(`Non-critical: Failed to delete old image ${oldImagePath}: ${e.message}`));
        } catch (imgDelError: any) {
          console.warn(`Failed to delete old product image ${originalProduct.imageUrl}: ${imgDelError.message}`);
        }
      }
      imageUrlToSave = ""; // Set to empty string if removed
    } else if (existingImageUrlFromForm !== null) {
      // User kept the existing image, existingImageUrlFromForm contains the path
      imageUrlToSave = existingImageUrlFromForm;
    }
    // If imageFile is null AND existingImageUrlFromForm is null, imageUrlToSave remains originalProduct.imageUrl

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
      imageUrl: imageUrlToSave || "", // Ensure it's always a string
      updatedAt: new Date().toISOString(),
    };

    products[productIndex] = updatedProductData;
    await saveProducts(products);
    revalidatePath('/admin/dashboard/products');
    revalidatePath(`/admin/dashboard/products/edit/${id}`);
    revalidatePath('/');
    return { success: true, product: updatedProductData };
  } catch (error: any) {
    console.error("Update product server error:", error);
    return { success: false, error: error.message || "An unexpected error occurred while updating the product." };
  }
}

export async function deleteProduct(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    let products = await getProductsInternal();
    const productToDelete = products.find(p => p.id === id);
    if (!productToDelete) {
      return { success: false, error: "Product not found for deletion." };
    }

    if (productToDelete.imageUrl && productToDelete.imageUrl.startsWith(`/${UPLOADS_DIR_NAME}/${PRODUCT_IMAGES_DIR_NAME}/`)) {
      try {
        const imagePath = path.join(process.cwd(), 'public', productToDelete.imageUrl);
        await fs.unlink(imagePath).catch(e => console.warn(`Non-critical: Failed to delete image ${imagePath}: ${e.message}`));
      }
      catch (imgDelError: any)
      {
        console.warn(`Failed to delete product image ${productToDelete.imageUrl}: ${imgDelError.message}`);
      }
    }

    const filteredProducts = products.filter(p => p.id !== id);
    await saveProducts(filteredProducts);

    revalidatePath('/admin/dashboard/products');
    revalidatePath('/');
    return { success: true };
  } catch (error: any)
   {
    console.error("Delete product server error:", error);
    return { success: false, error: error.message || "Failed to delete product." };
  }
}
