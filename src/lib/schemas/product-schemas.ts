
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
]);
export type ProductPricingTerm = z.infer<typeof ProductPricingTermSchema>;

export const BillingIntervalSchema = z.enum(['Monthly', 'Annually']);
export type BillingInterval = z.infer<typeof BillingIntervalSchema>;

export const ProductSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, "Product name is required."),
  version: z.string().optional().nullable(),
  status: ProductStatusSchema.default('Upcoming'),
  releaseDate: z.string().datetime({ message: "Invalid date format for release date." }).optional().nullable(),
  description: z.string().min(1, "Description is required."),
  longDescription: z.string().optional().nullable(),
  productUrl: z.string().url("Invalid product URL.").optional().or(z.literal('')), // No image URL here
  developer: z.string().min(1, "Developer name is required (e.g., MintFire R&D)."),
  
  pricingType: ProductPricingTypeSchema.default('Free'),
  pricingTerm: ProductPricingTermSchema.default('Lifetime'), 

  priceAmount: z.number().positive("Price must be a positive number.").optional().nullable(),
  billingInterval: BillingIntervalSchema.optional().nullable(),

  trialDuration: z.string().min(1, "Trial duration must be specified for free trials.").optional().nullable(),
  postTrialPriceAmount: z.number().positive("Post-trial price must be a positive number.").optional().nullable(),
  postTrialBillingInterval: BillingIntervalSchema.optional().nullable(),

  tags: z.array(z.string()).optional().default([]),
  isFeatured: z.boolean().default(false),
  
  couponDetails: z.string().optional().nullable(),
  activationDetails: z.string().optional().nullable(),
  
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Product = z.infer<typeof ProductSchema>;

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

  priceAmountString: z.string().optional().nullable(),
  billingInterval: BillingIntervalSchema.optional().nullable(),

  trialDuration: z.string().optional().nullable(),
  postTrialPriceAmountString: z.string().optional().nullable(),
  postTrialBillingInterval: BillingIntervalSchema.optional().nullable(),

  tagsString: z.string().optional(), 
  isFeatured: z.boolean().default(false),
  
  couponDetails: z.string().optional().nullable(),
  activationDetails: z.string().optional().nullable(),
}).superRefine((data, ctx) => {
    const parseAndValidateAmount = (value: string | null | undefined, path: (string | number)[], fieldName: string) => {
        if (value && value.trim() !== '') {
            const num = parseFloat(value);
            if (isNaN(num) || num <= 0) {
                ctx.addIssue({ code: z.ZodIssueCode.custom, message: `${fieldName} must be a positive number.`, path });
            }
        }
    };

    parseAndValidateAmount(data.priceAmountString, ["priceAmountString"], "Price amount");
    parseAndValidateAmount(data.postTrialPriceAmountString, ["postTrialPriceAmountString"], "Post-trial price amount");

    if (data.pricingType === 'Paid') {
        if (data.pricingTerm === 'Subscription') {
            if (!data.priceAmountString || data.priceAmountString.trim() === '') {
                ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Price amount is required for paid subscriptions.", path: ["priceAmountString"] });
            }
            if (!data.billingInterval) {
                ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Billing interval is required for paid subscriptions.", path: ["billingInterval"] });
            }
        } else if (data.pricingTerm === 'Lifetime') {
            if (!data.priceAmountString || data.priceAmountString.trim() === '') {
                ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Price amount is required for paid lifetime products.", path: ["priceAmountString"] });
            }
        }
    } else if (data.pricingType === 'Free') {
        if (data.pricingTerm === 'Subscription') { // This is the "Free Trial" case
            if (!data.trialDuration || data.trialDuration.trim() === '') {
                ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Trial duration is required for free trials.", path: ["trialDuration"] });
            }
            // If post-trial price is set, interval is required. If interval is set, price is required.
            const hasPostTrialPrice = data.postTrialPriceAmountString && data.postTrialPriceAmountString.trim() !== '';
            const hasPostTrialInterval = !!data.postTrialBillingInterval;

            if (hasPostTrialPrice && !hasPostTrialInterval) {
                ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Post-trial billing interval is required if post-trial price is set.", path: ["postTrialBillingInterval"] });
            }
            if (hasPostTrialInterval && !hasPostTrialPrice) {
                ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Post-trial price is required if post-trial billing interval is set.", path: ["postTrialPriceAmountString"] });
            }
        }
    }
});
export type FormProductInput = z.infer<typeof FormProductSchema>;
