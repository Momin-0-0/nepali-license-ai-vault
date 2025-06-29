export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export const validateNepalLicenseNumber = (licenseNumber: string): ValidationResult => {
  const errors: string[] = [];
  
  if (!licenseNumber || licenseNumber.trim().length === 0) {
    errors.push('License number is required');
    return { isValid: false, errors };
  }

  // Nepal license number patterns
  const nepalPatterns = [
    /^\d{2}-\d{2}-\d{9}$/i, // XX-XX-XXXXXXXXX (standard Nepal format)
    /^\d{2}-\d{2}-\d{8}$/i, // XX-XX-XXXXXXXX (alternative format)
    /^\d{2}-\d{2}-\d{7}$/i, // XX-XX-XXXXXXX (older format)
    /^\d{11,13}$/, // Numeric only (11-13 digits)
  ];

  const cleanedNumber = licenseNumber.trim().replace(/\s+/g, '');
  const isValidFormat = nepalPatterns.some(pattern => pattern.test(cleanedNumber));
  
  if (!isValidFormat) {
    errors.push('Invalid Nepal license number format. Expected formats: XX-XX-XXXXXXXXX or 11-13 digit number');
  }

  // Additional validation for Nepal context
  if (cleanedNumber.length < 9) {
    errors.push('Nepal license number must be at least 9 characters');
  }

  if (cleanedNumber.length > 15) {
    errors.push('Nepal license number must not exceed 15 characters');
  }

  return { isValid: errors.length === 0, errors };
};

export const validateDate = (date: string, fieldName: string): ValidationResult => {
  const errors: string[] = [];
  
  if (!date) {
    errors.push(`${fieldName} is required`);
    return { isValid: false, errors };
  }

  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) {
    errors.push(`${fieldName} must be a valid date`);
    return { isValid: false, errors };
  }

  const currentYear = new Date().getFullYear();
  const dateYear = parsedDate.getFullYear();
  
  if (dateYear < 1950 || dateYear > currentYear + 50) {
    errors.push(`${fieldName} year must be between 1950 and ${currentYear + 50}`);
  }

  return { isValid: errors.length === 0, errors };
};

export const validateExpiryDate = (issueDate: string, expiryDate: string): ValidationResult => {
  const errors: string[] = [];
  
  if (!issueDate || !expiryDate) {
    return { isValid: true, errors }; // Let individual date validation handle this
  }

  const issue = new Date(issueDate);
  const expiry = new Date(expiryDate);
  
  if (expiry <= issue) {
    errors.push('Expiry date must be after issue date');
  }

  const yearsDiff = (expiry.getTime() - issue.getTime()) / (1000 * 60 * 60 * 24 * 365);
  if (yearsDiff > 50) {
    errors.push('License validity period seems too long (over 50 years)');
  }

  // Nepal licenses typically valid for 5-10 years
  if (yearsDiff > 15) {
    errors.push('Nepal licenses are typically valid for 5-10 years. Please verify the dates.');
  }

  return { isValid: errors.length === 0, errors };
};

export const validateNepalName = (name: string): ValidationResult => {
  const errors: string[] = [];
  
  if (!name || name.trim().length === 0) {
    return { isValid: true, errors }; // Name is optional
  }

  const trimmedName = name.trim();
  
  if (trimmedName.length < 2) {
    errors.push('Name must be at least 2 characters');
  }

  if (trimmedName.length > 100) {
    errors.push('Name must not exceed 100 characters');
  }

  // Allow Nepal-specific characters and patterns
  if (!/^[a-zA-Z\s.'-]+$/.test(trimmedName)) {
    errors.push('Name can only contain letters, spaces, dots, hyphens, and apostrophes');
  }

  // Check for common Nepal name patterns
  const words = trimmedName.split(' ').filter(word => word.length > 0);
  if (words.length < 2) {
    errors.push('Please provide both first and last name');
  }

  return { isValid: errors.length === 0, errors };
};

export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>\"'&]/g, '') // Remove potentially dangerous characters
    .replace(/\s+/g, ' '); // Normalize whitespace
};

export const validateImageFile = (file: File): ValidationResult => {
  const errors: string[] = [];
  
  // Check file size (10MB limit)
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    errors.push('Image file must be smaller than 10MB');
  }

  // Check file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    errors.push('Only JPEG, PNG, and WebP images are allowed');
  }

  // Check minimum file size (to avoid empty files)
  if (file.size < 1024) {
    errors.push('Image file seems too small. Please select a valid image.');
  }

  return { isValid: errors.length === 0, errors };
};

export const formatNepalLicenseNumber = (licenseNumber: string): string => {
  const cleaned = licenseNumber.replace(/[-\s]/g, '');
  
  // Format as Nepal standard if it's a long number
  if (cleaned.length >= 11 && /^\d+$/.test(cleaned)) {
    return `${cleaned.substring(0, 2)}-${cleaned.substring(2, 4)}-${cleaned.substring(4)}`;
  }
  
  return licenseNumber;
};

// Legacy function for backward compatibility
export const validateLicenseNumber = validateNepalLicenseNumber;