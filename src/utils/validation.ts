export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export const validateLicenseNumber = (licenseNumber: string): ValidationResult => {
  const errors: string[] = [];
  
  if (!licenseNumber || licenseNumber.trim().length === 0) {
    errors.push('License number is required');
    return { isValid: false, errors };
  }

  // Nepal license number patterns
  const nepalPatterns = [
    /^NP-\d{2}-\d{3}-\d{3}$/i, // NP-12-345-678
    /^\d{10,15}$/, // Numeric only
    /^[A-Z]{2}-\d{2}-\d{4}-\d{7}$/i // State-based format
  ];

  const isValidFormat = nepalPatterns.some(pattern => pattern.test(licenseNumber.trim()));
  
  if (!isValidFormat) {
    errors.push('Invalid license number format. Expected formats: NP-12-345-678 or 10-15 digit number');
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

  return { isValid: errors.length === 0, errors };
};