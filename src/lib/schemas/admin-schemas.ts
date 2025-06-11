
import { z } from 'zod';

// Base schema for admin creation, including password strength rules
const BaseCreateAdminSchemaContents = {
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
};

const BaseCreateAdminObjectSchema = z.object(BaseCreateAdminSchemaContents);

export const CreateAdminSchema = BaseCreateAdminObjectSchema.refine(data => data.password === data.confirmPassword, {
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

// Schema for the data structure of an admin profile
export const AdminProfileSchema = z.object({
  adminName: z.string(),
  adminId: z.string(),
  email: z.string().email(),
  is2FAEnabled: z.boolean().default(false),
});
export type AdminProfile = z.infer<typeof AdminProfileSchema>;

// Schema for updating admin profile
export const UpdateAdminProfileSchema = z.object({
  adminName: z.string().min(1, { message: "Admin name is required." }),
  adminId: z.string().min(1, { message: "Admin ID is required." }),
  email: z.string().email({ message: "Invalid email address." }),
  currentPassword: z.string().optional(),
  newPassword: z.string().optional(),
  confirmNewPassword: z.string().optional(),
}).superRefine((data, ctx) => {
  const { currentPassword, newPassword, confirmNewPassword } = data;
  const tryingToChangePassword = !!newPassword || !!confirmNewPassword || (!!currentPassword && (!!newPassword || !!confirmNewPassword));

  if (tryingToChangePassword) {
    if (!currentPassword) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Current password is required to change your password.", path: ["currentPassword"] });
    }
    if (!newPassword) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "New password is required.", path: ["newPassword"] });
    } else {
      const passwordStrengthValidation = BaseCreateAdminObjectSchema.shape.password.safeParse(newPassword);
      if (!passwordStrengthValidation.success) {
        passwordStrengthValidation.error.issues.forEach(issue => {
          ctx.addIssue({ ...issue, path: ["newPassword"] });
        });
      }
    }
    if (!confirmNewPassword) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Please confirm your new password.", path: ["confirmNewPassword"] });
    }
    if (newPassword && confirmNewPassword && newPassword !== confirmNewPassword) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "New passwords do not match.", path: ["confirmNewPassword"] });
    }
  }
});
export type UpdateAdminProfileInput = z.infer<typeof UpdateAdminProfileSchema>;

// Schema for admin user stored in JSON (internal, includes hashed password and PIN)
export const AdminUserStoredSchema = z.object({
  adminName: z.string(),
  adminId: z.string(),
  email: z.string().email(),
  password: z.string(), // This will store the hashed password
  is2FAEnabled: z.boolean().default(false),
  hashedPin: z.string().optional().nullable(),
});
export type AdminUserStored = z.infer<typeof AdminUserStoredSchema>;


// Schemas for 2FA PIN Management
const pinSchema = z.string().length(6, { message: "PIN must be exactly 6 digits." }).regex(/^\d{6}$/, { message: "PIN must be 6 digits." });
// For 6 to 8 digit PIN, adjust as follows:
// const pinSchema = z.string().min(6, {message: "PIN must be 6 to 8 digits."}).max(8, {message: "PIN must be 6 to 8 digits."}).regex(/^\d{6,8}$/, { message: "PIN must contain only digits." });


export const Enable2FASchema = z.object({
  newPin: pinSchema,
  confirmNewPin: pinSchema,
}).refine(data => data.newPin === data.confirmNewPin, {
  message: "PINs don't match.",
  path: ["confirmNewPin"],
});
export type Enable2FAInput = z.infer<typeof Enable2FASchema>;

export const Change2FAPinSchema = z.object({
  currentPin: pinSchema.optional(), // Or password, handled in action
  newPin: pinSchema,
  confirmNewPin: pinSchema,
}).refine(data => data.newPin === data.confirmNewPin, {
  message: "New PINs don't match.",
  path: ["confirmNewPin"],
});
export type Change2FAPinInput = z.infer<typeof Change2FAPinSchema>;

export const Disable2FASchema = z.object({
  currentPinOrPassword: z.string().min(1, "Current PIN or password is required to disable 2FA."),
});
export type Disable2FAInput = z.infer<typeof Disable2FASchema>;

export const VerifyPinSchema = z.object({
  pin: pinSchema,
});
export type VerifyPinInput = z.infer<typeof VerifyPinSchema>;
