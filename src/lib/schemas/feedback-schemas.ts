
import { z } from 'zod';

export const FeedbackSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, "Name is required."),
  email: z.string().email("Invalid email address."),
  rating: z.number().min(1, "Rating is required.").max(5, "Rating cannot exceed 5."),
  message: z.string().min(10, "Message must be at least 10 characters long."),
  createdAt: z.string().datetime(),
});
export type Feedback = z.infer<typeof FeedbackSchema>;

export const CreateFeedbackInputSchema = FeedbackSchema.omit({
  id: true,
  createdAt: true,
});
export type CreateFeedbackInput = z.infer<typeof CreateFeedbackInputSchema>;
