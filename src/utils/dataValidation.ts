
import { z } from 'zod';

// Enhanced validation schemas for comprehensive Nepal license format
export const licenseSchema = z.object({
  licenseNumber: z.string()
    .min(8, 'License number must be at least 8 characters')
    .max(20, 'License number must not exceed 20 characters')
    .regex(/^\d{2}-\d{2,3}-\d{6,8}$|^[A-Z0-9\-]+$/i, 'Invalid license number format'),
  
  holderName: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters')
    .regex(/^[a-zA-Z\s.'-]+$/, 'Name contains invalid characters'),
  
  address: z.string()
    .min(3, 'Address must be at least 3 characters')
    .max(500, 'Address must not exceed 500 characters'),
  
  dateOfBirth: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of birth must be in YYYY-MM-DD format')
    .refine((date) => {
      if (!date) return true; // Optional field
      const d = new Date(date);
      return d instanceof Date && !isNaN(d.getTime()) && d.getFullYear() >= 1950;
    }, 'Invalid date of birth')
    .optional()
    .or(z.literal('')),
  
  fatherOrHusbandName: z.string()
    .max(100, 'Father/Husband name must not exceed 100 characters')
    .regex(/^[a-zA-Z\s.'-]*$/, 'Father/Husband name contains invalid characters')
    .optional()
    .or(z.literal('')),
  
  citizenshipNo: z.string()
    .regex(/^[\d\-]*$/, 'Citizenship number must contain only digits and dashes')
    .optional()
    .or(z.literal('')),
  
  passportNo: z.string()
    .regex(/^[A-Z0-9]*$/, 'Passport number must be alphanumeric')
    .optional()
    .or(z.literal('')),
  
  phoneNo: z.string()
    .regex(/^[\d\-\s]*$/, 'Phone number must contain only digits, dashes, and spaces')
    .optional()
    .or(z.literal('')),
  
  bloodGroup: z.enum(['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'])
    .optional(),
  
  issueDate: z.string()
    .min(1, 'Issue date is required')
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Issue date must be in YYYY-MM-DD format')
    .refine((date) => {
      const d = new Date(date);
      return d instanceof Date && !isNaN(d.getTime()) && d.getFullYear() >= 1950;
    }, 'Invalid issue date'),
  
  expiryDate: z.string()
    .min(1, 'Expiry date is required')
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Expiry date must be in YYYY-MM-DD format')
    .refine((date) => {
      const d = new Date(date);
      return d instanceof Date && !isNaN(d.getTime()) && d.getFullYear() <= 2050;
    }, 'Invalid expiry date'),
  
  category: z.string()
    .max(10, 'Category must not exceed 10 characters')
    .optional()
    .or(z.literal('')),
  
  issuingAuthority: z.string()
    .min(3, 'Issuing authority must be at least 3 characters')
    .max(200, 'Issuing authority must not exceed 200 characters'),
  
  photoUrl: z.string()
    .url('Invalid photo URL')
    .optional()
    .or(z.literal('')),
  
  signatureUrl: z.string()
    .url('Invalid signature URL')
    .optional()
    .or(z.literal(''))
}).refine((data) => {
  if (!data.issueDate || !data.expiryDate) return true;
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
      const errorMessages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
      console.error('Validation errors:', errorMessages);
      throw new Error(errorMessages.join(', '));
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
