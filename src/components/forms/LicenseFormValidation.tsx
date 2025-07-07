
import { useState, useEffect } from 'react';
import { LicenseData } from '@/types/license';
import { validateLicenseData } from '@/utils/dataValidation';
import { z } from 'zod';

export interface ValidationState {
  errors: Record<string, string[]>;
  touched: Record<string, boolean>;
  autoFilledFields: Record<string, boolean>;
  verificationStatus: Record<string, 'pending' | 'verified' | 'corrected'>;
}

export const useLicenseFormValidation = (licenseData: LicenseData) => {
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [autoFilledFields, setAutoFilledFields] = useState<Record<string, boolean>>({});
  const [verificationStatus, setVerificationStatus] = useState<Record<string, 'pending' | 'verified' | 'corrected'>>({});

  const sanitizeInput = (input: string): string => {
    return input
      .trim()
      .replace(/[<>\"'&]/g, '') // Remove potentially dangerous characters
      .replace(/\s+/g, ' '); // Normalize whitespace
  };

  const getFieldValue = (field: keyof LicenseData): string => {
    const value = licenseData[field];
    if (value === undefined || value === null) return '';
    return String(value);
  };

  // Track auto-filled fields with improved detection
  useEffect(() => {
    console.log('LicenseForm: License data updated:', licenseData);
    const autoFilled: Record<string, boolean> = {};
    const newVerificationStatus: Record<string, 'pending' | 'verified' | 'corrected'> = {};
    
    Object.keys(licenseData).forEach(field => {
      const value = licenseData[field as keyof LicenseData];
      // Improved detection: check for meaningful data, not just empty strings
      if (value && typeof value === 'string' && value.trim() !== '' && value.length > 1) {
        autoFilled[field] = true;
        if (verificationStatus[field] !== 'verified') {
          newVerificationStatus[field] = 'pending';
        } else {
          newVerificationStatus[field] = 'verified';
        }
        console.log(`Auto-filled field detected: ${field} = ${value}`);
      } else if (value && typeof value === 'object' && value !== null) {
        // Handle complex objects like bloodGroup
        autoFilled[field] = true;
        newVerificationStatus[field] = verificationStatus[field] || 'pending';
      }
    });
    
    setAutoFilledFields(autoFilled);
    setVerificationStatus(prev => ({ ...prev, ...newVerificationStatus }));
    
    const autoFilledCount = Object.keys(autoFilled).length;
    console.log(`Total auto-filled fields: ${autoFilledCount}`);
  }, [licenseData]);

  const validateField = (field: keyof LicenseData, value: string | undefined): boolean => {
    let fieldErrors: string[] = [];

    switch (field) {
      case 'licenseNumber':
        if (value) {
          try {
            // Validate using zod schema from dataValidation
            const licenseSchema = z.string().regex(
              /^\d{2}-\d{2,3}-\d{6,9}$/,
              'Invalid Nepal license format. Expected: XX-XXX-XXXXXX'
            );
            licenseSchema.parse(value);
          } catch (error) {
            if (error instanceof z.ZodError) {
              fieldErrors = error.errors.map(e => e.message);
            }
          }
        }
        break;
      
      case 'issueDate':
      case 'expiryDate':
      case 'dateOfBirth':
        if (value) {
          try {
            const dateSchema = z.string().regex(
              /^\d{4}-\d{2}-\d{2}$/,
              'Date must be in YYYY-MM-DD format'
            );
            dateSchema.parse(value);
            
            // Additional date validation
            const date = new Date(value);
            if (isNaN(date.getTime())) {
              fieldErrors.push('Invalid date');
            }
          } catch (error) {
            if (error instanceof z.ZodError) {
              fieldErrors = error.errors.map(e => e.message);
            }
          }
          
          // Validate expiry date is after issue date
          if (field === 'expiryDate' && licenseData.issueDate && value) {
            const issueDate = new Date(licenseData.issueDate);
            const expiryDate = new Date(value);
            if (expiryDate <= issueDate) {
              fieldErrors.push('Expiry date must be after issue date');
            }
          }
        }
        break;
      
      case 'holderName':
        if (value) {
          if (value.length < 2) {
            fieldErrors.push('Name must be at least 2 characters');
          }
          if (!/^[a-zA-Z\s.'-]+$/u.test(value)) {
            fieldErrors.push('Name can only contain letters, spaces, dots, hyphens, and apostrophes');
          }
        }
        break;
      
      case 'phoneNo':
        if (value) {
          const cleaned = value.replace(/\D/g, '');
          if (cleaned.length !== 10) {
            fieldErrors.push('Phone number must be exactly 10 digits');
          }
        }
        break;
      
      case 'citizenshipNo':
        if (value) {
          const cleaned = value.replace(/\D/g, '');
          if (cleaned.length < 10) {
            fieldErrors.push('Citizenship number must be at least 10 digits');
          }
          if (cleaned.length > 15) {
            fieldErrors.push('Citizenship number cannot exceed 15 digits');
          }
        }
        break;
      
      case 'address':
        if (value && value.length < 5) {
          fieldErrors.push('Address must be at least 5 characters');
        }
        break;
      
      case 'issuingAuthority':
        if (value && value.length < 3) {
          fieldErrors.push('Issuing authority must be at least 3 characters');
        }
        break;
    }

    setErrors(prev => ({ ...prev, [field]: fieldErrors }));
    return fieldErrors.length === 0;
  };

  const handleBlur = (field: keyof LicenseData) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const value = getFieldValue(field);
    validateField(field, value);
  };

  const verifyField = (field: keyof LicenseData) => {
    console.log(`Verifying field: ${field}`);
    setVerificationStatus(prev => ({ 
      ...prev, 
      [field]: prev[field] === 'verified' ? 'pending' : 'verified' 
    }));
    setTouched(prev => ({ ...prev, [field]: true }));
    
    const value = getFieldValue(field);
    validateField(field, value);
  };

  const verifyAllFields = () => {
    console.log('Verifying all auto-filled fields');
    const newVerificationStatus = { ...verificationStatus };
    const newTouched = { ...touched };
    
    Object.keys(autoFilledFields).forEach(field => {
      if (autoFilledFields[field]) {
        newVerificationStatus[field] = 'verified';
        newTouched[field] = true;
        
        const value = getFieldValue(field as keyof LicenseData);
        validateField(field as keyof LicenseData, value);
      }
    });
    
    setVerificationStatus(newVerificationStatus);
    setTouched(newTouched);
  };

  const updateVerificationAfterEdit = (field: keyof LicenseData) => {
    if (autoFilledFields[field] && verificationStatus[field] === 'verified') {
      setVerificationStatus(prev => ({ ...prev, [field]: 'corrected' }));
    }
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: [] }));
    }
  };

  const validateRequiredFields = (): boolean => {
    const requiredFields: (keyof LicenseData)[] = ['licenseNumber', 'holderName', 'address', 'issueDate', 'expiryDate'];
    let hasErrors = false;
    const newTouched = { ...touched };
    
    requiredFields.forEach(field => {
      const value = getFieldValue(field);
      if (!value || value.trim() === '') {
        setErrors(prev => ({ ...prev, [field]: [`${field} is required`] }));
        hasErrors = true;
      } else {
        const isValid = validateField(field, value);
        if (!isValid) hasErrors = true;
      }
      newTouched[field] = true;
    });

    setTouched(newTouched);
    return !hasErrors;
  };

  return {
    errors,
    touched,
    autoFilledFields,
    verificationStatus,
    getFieldValue,
    validateField,
    handleBlur,
    verifyField,
    verifyAllFields,
    updateVerificationAfterEdit,
    validateRequiredFields
  };
};
