import { z } from 'zod';

// Enhanced validation schemas
export const licenseSchema = z.object({
  licenseNumber: z.string()
    .min(8, 'License number must be at least 8 characters')
    .max(20, 'License number must not exceed 20 characters')
    .regex(/^[A-Z0-9\-]+$/i, 'License number contains invalid characters'),
  
  holderName: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters')
    .regex(/^[a-zA-Z\s.'-]+$/, 'Name contains invalid characters')
    .optional(),
  
  issueDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format')
    .refine((date) => {
      const d = new Date(date);
      return d instanceof Date && !isNaN(d.getTime()) && d.getFullYear() >= 1950;
    }, 'Invalid issue date'),
  
  expiryDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format')
    .refine((date) => {
      const d = new Date(date);
      return d instanceof Date && !isNaN(d.getTime()) && d.getFullYear() <= 2050;
    }, 'Invalid expiry date'),
  
  issuingAuthority: z.string()
    .min(3, 'Issuing authority must be at least 3 characters')
    .max(200, 'Issuing authority must not exceed 200 characters'),
  
  address: z.string()
    .max(500, 'Address must not exceed 500 characters')
    .optional()
}).refine((data) => {
  const issueDate = new Date(data.issueDate);
  const expiryDate = new Date(data.expiryDate);
  return expiryDate > issueDate;
}, {
  message: 'Expiry date must be after issue date',
  path: ['expiryDate']
});

export const userSchema = z.object({
  email: z.string().email('Invalid email address'),
  firstName: z.string().min(1, 'First name is required').max(50, 'First name too long'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name too long'),
  phone: z.string().regex(/^\+?[\d\s\-\(\)]{10,}$/, 'Invalid phone number').optional(),
  address: z.object({
    street: z.string().max(200, 'Street address too long'),
    city: z.string().max(100, 'City name too long'),
    state: z.string().max(100, 'State name too long'),
    zipCode: z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code')
  }).optional()
});

export const validateLicenseData = (data: any) => {
  try {
    return licenseSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(error.errors.map(e => e.message).join(', '));
    }
    throw error;
  }
};

export const validateUserData = (data: any) => {
  try {
    return userSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(error.errors.map(e => e.message).join(', '));
    }
    throw error;
  }
};