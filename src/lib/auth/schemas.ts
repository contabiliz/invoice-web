import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('validation.email_invalid'),
  password: z.string().min(1, 'validation.password_required'),
});

export const signupSchema = z
  .object({
    email: z.string().email('validation.email_invalid'),
    password: z.string().min(8, 'validation.password_too_short'),
    confirmPassword: z.string().min(1, 'validation.confirm_required'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'validation.passwords_mismatch',
    path: ['confirmPassword'],
  });

export type LoginFormValues = z.infer<typeof loginSchema>;
export type SignupFormValues = z.infer<typeof signupSchema>;
