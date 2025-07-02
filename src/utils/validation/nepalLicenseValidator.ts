
// Enhanced validation for Nepal license with proper error recovery
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

export const validateNepalLicenseNumber = (licenseNumber: string): ValidationResult => {
  const result: ValidationResult = {
    isValid: false,
    errors: [],
    warnings: [],
    suggestions: []
  };
  
  if (!licenseNumber || licenseNumber.trim() === '') {
    result.errors.push('License number is required');
    return result;
  }
  
  const cleaned = licenseNumber.trim().toUpperCase();
  
  // Nepal license format: XX-XXX-XXXXXX
  const nepalPattern = /^(\d{2})-(\d{3})-(\d{6})$/;
  const match = cleaned.match(nepalPattern);
  
  if (!match) {
    result.errors.push('Invalid Nepal license format. Expected: XX-XXX-XXXXXX (e.g., 03-066-041605)');
    
    // Provide suggestions based on common patterns
    if (/^\d{11}$/.test(cleaned.replace(/\D/g, ''))) {
      const digits = cleaned.replace(/\D/g, '');
      const formatted = `${digits.slice(0,2)}-${digits.slice(2,5)}-${digits.slice(5,11)}`;
      result.suggestions.push(`Did you mean: ${formatted}?`);
    }
    
    return result;
  }
  
  const [, district, office, serial] = match;
  
  // Validate district code (01-77 for Nepal districts)
  const districtNum = parseInt(district);
  if (districtNum < 1 || districtNum > 77) {
    result.warnings.push(`District code ${district} may not be valid (expected 01-77)`);
  }
  
  // Validate office code
  const officeNum = parseInt(office);
  if (officeNum < 1 || officeNum > 999) {
    result.warnings.push(`Office code ${office} may not be valid`);
  }
  
  // Validate serial number
  const serialNum = parseInt(serial);
  if (serialNum < 1) {
    result.errors.push('Serial number must be greater than 0');
    return result;
  }
  
  result.isValid = true;
  return result;
};

export const validateNepalDate = (dateStr: string, fieldName: string): ValidationResult => {
  const result: ValidationResult = {
    isValid: false,
    errors: [],
    warnings: [],
    suggestions: []
  };
  
  if (!dateStr) {
    result.errors.push(`${fieldName} is required`);
    return result;
  }
  
  // Support multiple date formats
  const formats = [
    /^(\d{4})-(\d{2})-(\d{2})$/, // YYYY-MM-DD
    /^(\d{2})\/(\d{2})\/(\d{4})$/, // MM/DD/YYYY
    /^(\d{2})-(\d{2})-(\d{4})$/, // DD-MM-YYYY
  ];
  
  let parsedDate: Date | null = null;
  let matchedFormat = -1;
  
  for (let i = 0; i < formats.length; i++) {
    const match = dateStr.match(formats[i]);
    if (match) {
      matchedFormat = i;
      if (i === 0) { // YYYY-MM-DD
        parsedDate = new Date(dateStr);
      } else if (i === 1) { // MM/DD/YYYY
        parsedDate = new Date(`${match[3]}-${match[1]}-${match[2]}`);
      } else if (i === 2) { // DD-MM-YYYY
        parsedDate = new Date(`${match[3]}-${match[2]}-${match[1]}`);
      }
      break;
    }
  }
  
  if (!parsedDate || isNaN(parsedDate.getTime())) {
    result.errors.push(`Invalid date format for ${fieldName}. Expected: YYYY-MM-DD`);
    return result;
  }
  
  // Check for reasonable date ranges
  const currentYear = new Date().getFullYear();
  const year = parsedDate.getFullYear();
  
  if (year < 1950 || year > currentYear + 50) {
    result.warnings.push(`${fieldName} year ${year} seems unusual`);
  }
  
  result.isValid = true;
  return result;
};

export const validateExpiryDate = (issueDate: string, expiryDate: string): ValidationResult => {
  const result: ValidationResult = {
    isValid: false,
    errors: [],
    warnings: [],
    suggestions: []
  };
  
  const issueValidation = validateNepalDate(issueDate, 'Issue date');
  const expiryValidation = validateNepalDate(expiryDate, 'Expiry date');
  
  if (!issueValidation.isValid || !expiryValidation.isValid) {
    result.errors.push('Both issue and expiry dates must be valid');
    return result;
  }
  
  const issue = new Date(issueDate);
  const expiry = new Date(expiryDate);
  
  if (expiry <= issue) {
    result.errors.push('Expiry date must be after issue date');
    return result;
  }
  
  // Check for reasonable validity period (typically 5-10 years for Nepal licenses)
  const yearsDiff = (expiry.getTime() - issue.getTime()) / (1000 * 60 * 60 * 24 * 365);
  
  if (yearsDiff < 1) {
    result.warnings.push('License validity period is very short (less than 1 year)');
  } else if (yearsDiff > 15) {
    result.warnings.push('License validity period is very long (more than 15 years)');
  }
  
  result.isValid = true;
  return result;
};
