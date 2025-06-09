
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

// Used for post-trial billing interval for Free Trials
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
  productUrl: z.string().url("Invalid product URL.").optional().or(z.literal('')),
  developer: z.string().min(1, "Developer name is required (e.g., MintFire R&D)."),
  
  pricingType: ProductPricingTypeSchema.default('Free'),
  pricingTerm: ProductPricingTermSchema.default('Lifetime'), 

  // For "Paid" + "Lifetime"
  priceAmount: z.number().positive("Price must be a positive number for Lifetime.").optional().nullable(),

  // For "Paid" + "Subscription"
  monthlyPrice: z.number().positive("Monthly price must be a positive number.").optional().nullable(),
  sixMonthPrice: z.number().positive("6-Month price must be a positive number.").optional().nullable(),
  annualPrice: z.number().positive("Annual price must be a positive number.").optional().nullable(),

  // For "Free" + "Subscription" (Free Trial)
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

  // String inputs from form, to be parsed and validated
  priceAmountString: z.string().optional().nullable(), // For Paid Lifetime
  monthlyPriceString: z.string().optional().nullable(),
  sixMonthPriceString: z.string().optional().nullable(),
  annualPriceString: z.string().optional().nullable(),

  trialDuration: z.string().optional().nullable(),
  postTrialPriceAmountString: z.string().optional().nullable(),
  postTrialBillingInterval: BillingIntervalSchema.optional().nullable(),

  tagsString: z.string().optional(), 
  isFeatured: z.boolean().default(false),
  
  couponDetails: z.string().optional().nullable(),
  activationDetails: z.string().optional().nullable(),
}).superRefine((data, ctx) => {
    const parseAndValidateAmount = (value: string | null | undefined, path: (string | number)[], fieldName: string, isRequired: boolean) => {
        if (isRequired && (!value || value.trim() === '')) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: `${fieldName} is required.`, path });
            return false; // Indicate failure
        }
        if (value && value.trim() !== '') {
            const num = parseFloat(value);
            if (isNaN(num) || num <= 0) {
                ctx.addIssue({ code: z.ZodIssueCode.custom, message: `${fieldName} must be a positive number.`, path });
                return false; // Indicate failure
            }
        }
        return true; // Indicate success or not applicable
    };

    if (data.pricingType === 'Paid') {
        if (data.pricingTerm === 'Subscription') {
            const mpValid = parseAndValidateAmount(data.monthlyPriceString, ["monthlyPriceString"], "Monthly price", true);
            const smpValid = parseAndValidateAmount(data.sixMonthPriceString, ["sixMonthPriceString"], "6-Month price", true);
            const apValid = parseAndValidateAmount(data.annualPriceString, ["annualPriceString"], "Annual price", true);
            if (!mpValid || !smpValid || !apValid) return z.NEVER; // Stop further validation if any price is invalid
        } else if (data.pricingTerm === 'Lifetime') {
            if(!parseAndValidateAmount(data.priceAmountString, ["priceAmountString"], "Price amount", true)) return z.NEVER;
        }
    } else if (data.pricingType === 'Free') {
        if (data.pricingTerm === 'Subscription') { // Free Trial
            if (!data.trialDuration || data.trialDuration.trim() === '') {
                ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Trial duration is required for free trials.", path: ["trialDuration"] });
            }
            // If post-trial price is set, interval is required and price must be valid.
            const hasPostTrialPrice = data.postTrialPriceAmountString && data.postTrialPriceAmountString.trim() !== '';
            if (hasPostTrialPrice) {
                if(!parseAndValidateAmount(data.postTrialPriceAmountString, ["postTrialPriceAmountString"], "Post-trial price", true)) return z.NEVER;
                if (!data.postTrialBillingInterval) {
                    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Post-trial billing interval is required if post-trial price is set.", path: ["postTrialBillingInterval"] });
                }
            } else if (data.postTrialBillingInterval) { // If interval is set, price must be set
                 ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Post-trial price is required if post-trial billing interval is set.", path: ["postTrialPriceAmountString"] });
            }
        }
    }
});
export type FormProductInput = z.infer<typeof FormProductSchema>;
