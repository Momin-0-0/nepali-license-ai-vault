import { useState, useEffect } from 'react';
import { LicenseData } from '@/types/license';
import { validateNepalLicenseNumber, validateDate, validateExpiryDate, sanitizeInput } from '@/utils/validation';

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

  // Helper function to safely get field value as string
  const getFieldValue = (field: keyof LicenseData): string => {
    const value = licenseData[field];
    if (value === undefined || value === null) return '';
    return String(value);
  };

  // Track auto-filled fields when licenseData changes
  useEffect(() => {
    console.log('LicenseForm: License data updated:', licenseData);
    const autoFilled: Record<string, boolean> = {};
    const newVerificationStatus: Record<string, 'pending' | 'verified' | 'corrected'> = {};
    
    Object.keys(licenseData).forEach(field => {
      const value = licenseData[field as keyof LicenseData];
      if (value && value.toString().trim() !== '') {
        autoFilled[field] = true;
        // Keep existing verification status if field was already verified
        if (verificationStatus[field] !== 'verified') {
          newVerificationStatus[field] = 'pending';
        } else {
          newVerificationStatus[field] = 'verified';
        }
        console.log(`Auto-filled field detected: ${field} = ${value}`);
      }
    });
    
    setAutoFilledFields(autoFilled);
    setVerificationStatus(prev => ({ ...prev, ...newVerificationStatus }));
    
    const autoFilledCount = Object.keys(autoFilled).length;
    console.log(`Total auto-filled fields: ${autoFilledCount}`);
  }, [licenseData]);

  const validateField = (field: keyof LicenseData, value: string | undefined) => {
    let fieldErrors: string[] = [];

    switch (field) {
      case 'licenseNumber':
        if (value) {
          const licenseValidation = validateNepalLicenseNumber(value);
          if (!licenseValidation.isValid) {
            fieldErrors = licenseValidation.errors;
          }
        }
        break;
      
      case 'issueDate':
        if (value) {
          const issueDateValidation = validateDate(value, 'Issue date');
          if (!issueDateValidation.isValid) {
            fieldErrors = issueDateValidation.errors;
          }
        }
        break;
      
      case 'expiryDate':
        if (value) {
          const expiryDateValidation = validateDate(value, 'Expiry date');
          if (!expiryDateValidation.isValid) {
            fieldErrors = expiryDateValidation.errors;
          } else if (licenseData.issueDate) {
            const dateRangeValidation = validateExpiryDate(licenseData.issueDate, value);
            if (!dateRangeValidation.isValid) {
              fieldErrors = [...fieldErrors, ...dateRangeValidation.errors];
            }
          }
        }
        break;
      
      case 'holderName':
        if (value && value.length < 2) {
          fieldErrors.push('Name must be at least 2 characters');
        }
        if (value && !/^[a-zA-Z\s.'-]+$/.test(value)) {
          fieldErrors.push('Name can only contain letters, spaces, dots, hyphens, and apostrophes');
        }
        break;
      
      case 'phoneNo':
        if (value && !/^\d{10}$/.test(value)) {
          fieldErrors.push('Phone number must be exactly 10 digits');
        }
        break;
      
      case 'citizenshipNo':
        if (value && value.length < 10) {
          fieldErrors.push('Citizenship number must be at least 10 digits');
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
    
    // Validate the field when verifying
    const value = getFieldValue(field);
    validateField(field, value);
  };

  const verifyAllFields = () => {
    console.log('Verifying all auto-filled fields');
    const newVerificationStatus = { ...verificationStatus };
    
    Object.keys(autoFilledFields).forEach(field => {
      if (autoFilledFields[field]) {
        newVerificationStatus[field] = 'verified';
        setTouched(prev => ({ ...prev, [field]: true }));
        
        // Validate each field
        const value = getFieldValue(field as keyof LicenseData);
        validateField(field as keyof LicenseData, value);
      }
    });
    
    setVerificationStatus(newVerificationStatus);
  };

  const updateVerificationAfterEdit = (field: keyof LicenseData) => {
    // Mark as corrected if it was auto-filled and user modified it
    if (autoFilledFields[field] && verificationStatus[field] === 'verified') {
      setVerificationStatus(prev => ({ ...prev, [field]: 'corrected' }));
    }
    
    // Clear errors when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: [] }));
    }
  };

  const validateRequiredFields = (): boolean => {
    const requiredFields: (keyof LicenseData)[] = ['licenseNumber', 'holderName', 'address', 'issueDate', 'expiryDate'];
    let hasErrors = false;
    
    requiredFields.forEach(field => {
      const value = getFieldValue(field);
      const isValid = validateField(field, value);
      if (!isValid) hasErrors = true;
      setTouched(prev => ({ ...prev, [field]: true }));
    });

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
