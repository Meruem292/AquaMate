import * as z from 'zod';

export const loginSchema = z.object({
  email: z.string().email({
    message: 'Please enter a valid email address.',
  }),
  password: z.string().min(1, {
    message: 'Password is required.',
  }),
});

export const signupSchema = z
  .object({
    fullName: z.string().min(2, {
      message: 'Full name must be at least 2 characters.',
    }),
    email: z.string().email({
      message: 'Please enter a valid email address.',
    }),
    phone: z.string().min(10, {
      message: 'Please enter a valid phone number.',
    }).regex(/^\+?[0-9\s-()]+$/, {
      message: 'Please enter a valid phone number.'
    }),
    password: z.string().min(8, {
      message: 'Password must be at least 8 characters.',
    }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match.",
    path: ['confirmPassword'], // Set error on confirmPassword field
  });

export type LoginValues = z.infer<typeof loginSchema>;
export type SignupValues = z.infer<typeof signupSchema>;
