
import { z } from 'zod';

export const WaitlistEntrySchema = z.object({
  id: z.string().uuid(),
  productId: z.string().uuid(),
  productName: z.string(),
  name: z.string().min(1, "Name is required."),
  email: z.string().email("Invalid email address."),
  contactNumber: z.string().min(1, "Contact number is required."),
  submittedAt: z.string().datetime(),
});
export type WaitlistEntry = z.infer<typeof WaitlistEntrySchema>;

export const CreateWaitlistEntryInputSchema = WaitlistEntrySchema.omit({
  id: true,
  submittedAt: true,
  // productId and productName will be passed programmatically, not from user form directly
});
export type CreateWaitlistEntryInput = z.infer<typeof CreateWaitlistEntryInputSchema>;

// Schema for the form itself, productId and productName are not part of user input here
export const WaitlistFormSchema = z.object({
  name: z.string().min(1, "Name is required."),
  email: z.string().email("Invalid email address."),
  contactNumber: z.string().min(1, "Contact number is required."),
});
export type WaitlistFormData = z.infer<typeof WaitlistFormSchema>;
