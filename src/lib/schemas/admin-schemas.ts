
import { z } from 'zod';

export const CreateAdminSchema = z.object({
  adminName: z.string().min(1, { message: "Admin name is required." }),
  adminId: z.string().min(1, { message: "Admin ID is required." }),
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string()
    .min(8, { message: "Password must be at least 8 characters." })
    .refine(val => /[A-Z]/.test(val), {
      message: "Password must contain at least one uppercase letter.",
    })
    .refine(val => /[0-9]/.test(val), {
      message: "Password must contain at least one number.",
    })
    .refine(val => (val.match(/[!@#$%^&*(),.?":{}|<>]/g) || []).length >= 2, {
      message: "Password must contain at least two special characters (e.g., !@#$%).",
    }),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match.",
  path: ["confirmPassword"],
});
export type CreateAdminInput = z.infer<typeof CreateAdminSchema>;

export const LoginAdminSchema = z.object({
  adminName: z.string().min(1, { message: "Admin name is required." }),
  adminId: z.string().min(1, { message: "Admin ID is required." }),
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
});
export type LoginAdminInput = z.infer<typeof LoginAdminSchema>;

