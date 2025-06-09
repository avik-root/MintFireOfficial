
import { z } from 'zod';

export const ProductStatusSchema = z.enum([
  'Stable',
  'Beta',
  'Alpha',
  'Upcoming',
  'Deprecated',
]);
export type ProductStatus = z.infer<typeof ProductStatusSchema>;

export const ProductPricingTypeSchema = z.enum([
  'Free',
  'Paid',
]);
export type ProductPricingType = z.infer<typeof ProductPricingTypeSchema>;

export const ProductPricingTermSchema = z.enum([
  'Subscription',
  'Lifetime',
  // 'One-Time' could be an alias for Lifetime if Paid
]);
export type ProductPricingTerm = z.infer<typeof ProductPricingTermSchema>;

export const ProductSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, "Product name is required."),
  version: z.string().optional().nullable(), // e.g., "1.0.0", "2.1 Beta"
  status: ProductStatusSchema.default('Upcoming'),
  releaseDate: z.string().datetime({ message: "Invalid date format for release date." }).optional().nullable(),
  description: z.string().min(1, "Description is required."),
  longDescription: z.string().optional().nullable(), // For more detailed product page
  imageUrl: z.string().optional().or(z.literal('')), // Path to uploaded image (e.g., /uploads/product-images/image.png) or an external URL.
  productUrl: z.string().url("Invalid product URL.").optional().or(z.literal('')),
  developer: z.string().min(1, "Developer name is required (e.g., MintFire R&D)."),
  
  pricingType: ProductPricingTypeSchema.default('Free'),
  pricingTerm: ProductPricingTermSchema.default('Lifetime'), // Default to Free Lifetime if Free

  tags: z.array(z.string()).optional().default([]),
  isFeatured: z.boolean().default(false), // To feature on homepage or specific sections
  
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Product = z.infer<typeof ProductSchema>;

// Schema for react-hook-form in the client component
export const FormProductSchema = z.object({
  name: z.string().min(1, "Product name is required."),
  version: z.string().optional().nullable(),
  status: ProductStatusSchema,
  releaseDate: z.string().datetime({ message: "Please select a valid release date."}).optional().nullable(),
  description: z.string().min(1, "Short description is required."),
  longDescription: z.string().optional().nullable(),
  productUrl: z.string().url("Please enter a valid URL (e.g., https://example.com) or leave blank.").optional().or(z.literal('')),
  developer: z.string().min(1, "Developer name is required."),
  
  pricingType: ProductPricingTypeSchema,
  pricingTerm: ProductPricingTermSchema,

  tagsString: z.string().optional(), // For form input
  isFeatured: z.boolean().default(false),
  
  // This imageUrl field in the form holds the *string path* of an existing image if editing,
  // or is used to manage the preview. The actual image *file* (if a new one is selected)
  // is handled separately by the 'imageFile' input in the form component and processed from FormData in server actions.
  imageUrl: z.string().optional(), 
});
export type FormProductInput = z.infer<typeof FormProductSchema>;

