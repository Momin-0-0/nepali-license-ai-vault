
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, AlertCircle, Loader2 } from "lucide-react";
import { LicenseData } from '@/types/license';
import { validateNepalLicenseNumber, validateDate, validateExpiryDate, sanitizeInput } from '@/utils/validation';
import LicenseFormField from './forms/LicenseFormField';
import AutoFillStatus from './forms/AutoFillStatus';
import VerificationHelper from './forms/VerificationHelper';

interface LicenseFormProps {
  licenseData: LicenseData;
  onDataChange: (data: LicenseData) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  isProcessing?: boolean;
  disabled?: boolean;
}

const LicenseForm = ({ 
  licenseData, 
  onDataChange, 
  onSubmit, 
  onCancel,
  isProcessing = false,
  disabled = false
}: LicenseFormProps) => {
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [autoFilledFields, setAutoFilledFields] = useState<Record<string, boolean>>({});
  const [verificationStatus, setVerificationStatus] = useState<Record<string, 'pending' | 'verified' | 'corrected'>>({});
  const [showVerificationHelper, setShowVerificationHelper] = useState(true);

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
        newVerificationStatus[field] = 'pending';
        console.log(`Auto-filled field detected: ${field} = ${value}`);
      }
    });
    
    setAutoFilledFields(autoFilled);
    setVerificationStatus(newVerificationStatus);
    
    const autoFilledCount = Object.keys(autoFilled).length;
    console.log(`Total auto-filled fields: ${autoFilledCount}`);
  }, [licenseData]);

  const updateField = (field: keyof LicenseData, value: string | undefined) => {
    const sanitizedValue = value ? sanitizeInput(value) : '';
    onDataChange({
      ...licenseData,
      [field]: field === 'bloodGroup' ? (value as LicenseData['bloodGroup']) : sanitizedValue
    });
    
    // Mark as corrected if it was auto-filled
    if (autoFilledFields[field]) {
      setVerificationStatus(prev => ({ ...prev, [field]: 'corrected' }));
    }
    
    // Clear errors when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: [] }));
    }
  };

  const verifyField = (field: keyof LicenseData) => {
    setVerificationStatus(prev => ({ ...prev, [field]: 'verified' }));
    setTouched(prev => ({ ...prev, [field]: true }));
  };

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    const requiredFields: (keyof LicenseData)[] = ['licenseNumber', 'holderName', 'address', 'issueDate', 'expiryDate'];
    let hasErrors = false;
    
    requiredFields.forEach(field => {
      const value = getFieldValue(field);
      const isValid = validateField(field, value);
      if (!isValid) hasErrors = true;
      setTouched(prev => ({ ...prev, [field]: true }));
    });

    if (hasErrors) {
      return;
    }

    onSubmit(e);
  };

  const autoFilledCount = Object.keys(autoFilledFields).length;

  return (
    <Card className={disabled ? 'opacity-60' : ''}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Nepal License Details (XX-XXX-XXXXXX) {autoFilledCount > 0 ? `- ${autoFilledCount} Fields Auto-Filled` : ''}
        </CardTitle>
        <CardDescription>
          {autoFilledCount > 0 
            ? `OCR has automatically extracted ${autoFilledCount} field(s) from your Nepal driving license. Please verify each field is correct.`
            : 'Please enter your Nepal driving license details manually in XX-XXX-XXXXXX format.'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AutoFillStatus 
          autoFilledCount={autoFilledCount} 
          verificationStatus={verificationStatus} 
        />

        <VerificationHelper 
          show={showVerificationHelper && autoFilledCount > 0}
          onClose={() => setShowVerificationHelper(false)}
        />

        <form onSubmit={handleSubmit} className="space-y-4">
          <LicenseFormField
            field="licenseNumber"
            label="License Number (Nepal Format: XX-XXX-XXXXXX)"
            placeholder="e.g., 03-066-041605"
            required
            value={getFieldValue('licenseNumber')}
            onChange={(value) => updateField('licenseNumber', value)}
            onBlur={() => handleBlur('licenseNumber')}
            onVerify={() => verifyField('licenseNumber')}
            disabled={disabled}
            isAutoFilled={autoFilledFields['licenseNumber']}
            verificationStatus={verificationStatus['licenseNumber']}
            errors={errors['licenseNumber']}
            touched={touched['licenseNumber']}
          />

          <LicenseFormField
            field="holderName"
            label="Name (As on License)"
            placeholder="Full name as printed on Nepal license"
            required
            value={getFieldValue('holderName')}
            onChange={(value) => updateField('holderName', value)}
            onBlur={() => handleBlur('holderName')}
            onVerify={() => verifyField('holderName')}
            disabled={disabled}
            isAutoFilled={autoFilledFields['holderName']}
            verificationStatus={verificationStatus['holderName']}
            errors={errors['holderName']}
            touched={touched['holderName']}
          />

          <div className="grid grid-cols-2 gap-4">
            <LicenseFormField
              field="dateOfBirth"
              label="Date of Birth"
              placeholder="YYYY-MM-DD"
              type="date"
              value={getFieldValue('dateOfBirth')}
              onChange={(value) => updateField('dateOfBirth', value)}
              onBlur={() => handleBlur('dateOfBirth')}
              onVerify={() => verifyField('dateOfBirth')}
              disabled={disabled}
              isAutoFilled={autoFilledFields['dateOfBirth']}
              verificationStatus={verificationStatus['dateOfBirth']}
              errors={errors['dateOfBirth']}
              touched={touched['dateOfBirth']}
            />
            <LicenseFormField
              field="fatherOrHusbandName"
              label="Father/Husband Name"
              placeholder="As printed on license"
              value={getFieldValue('fatherOrHusbandName')}
              onChange={(value) => updateField('fatherOrHusbandName', value)}
              onBlur={() => handleBlur('fatherOrHusbandName')}
              onVerify={() => verifyField('fatherOrHusbandName')}
              disabled={disabled}
              isAutoFilled={autoFilledFields['fatherOrHusbandName']}
              verificationStatus={verificationStatus['fatherOrHusbandName']}
              errors={errors['fatherOrHusbandName']}
              touched={touched['fatherOrHusbandName']}
            />
          </div>

          <LicenseFormField
            field="address"
            label="Address (As on License)"
            placeholder="Address as printed on Nepal license"
            required
            isTextarea
            value={getFieldValue('address')}
            onChange={(value) => updateField('address', value)}
            onBlur={() => handleBlur('address')}
            onVerify={() => verifyField('address')}
            disabled={disabled}
            isAutoFilled={autoFilledFields['address']}
            verificationStatus={verificationStatus['address']}
            errors={errors['address']}
            touched={touched['address']}
          />

          <div className="grid grid-cols-2 gap-4">
            <LicenseFormField
              field="citizenshipNo"
              label="Citizenship Number"
              placeholder="Nepal citizenship number"
              value={getFieldValue('citizenshipNo')}
              onChange={(value) => updateField('citizenshipNo', value)}
              onBlur={() => handleBlur('citizenshipNo')}
              onVerify={() => verifyField('citizenshipNo')}
              disabled={disabled}
              isAutoFilled={autoFilledFields['citizenshipNo']}
              verificationStatus={verificationStatus['citizenshipNo']}
              errors={errors['citizenshipNo']}
              touched={touched['citizenshipNo']}
            />
            <LicenseFormField
              field="passportNo"
              label="Passport Number"
              placeholder="Passport number (if any)"
              value={getFieldValue('passportNo')}
              onChange={(value) => updateField('passportNo', value)}
              onBlur={() => handleBlur('passportNo')}
              onVerify={() => verifyField('passportNo')}
              disabled={disabled}
              isAutoFilled={autoFilledFields['passportNo']}
              verificationStatus={verificationStatus['passportNo']}
              errors={errors['passportNo']}
              touched={touched['passportNo']}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <LicenseFormField
              field="phoneNo"
              label="Phone Number"
              placeholder="10-digit phone number"
              value={getFieldValue('phoneNo')}
              onChange={(value) => updateField('phoneNo', value)}
              onBlur={() => handleBlur('phoneNo')}
              onVerify={() => verifyField('phoneNo')}
              disabled={disabled}
              isAutoFilled={autoFilledFields['phoneNo']}
              verificationStatus={verificationStatus['phoneNo']}
              errors={errors['phoneNo']}
              touched={touched['phoneNo']}
            />
            <LicenseFormField
              field="bloodGroup"
              label="Blood Group"
              placeholder="Select blood group"
              isSelect
              selectOptions={['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']}
              value={getFieldValue('bloodGroup')}
              onChange={(value) => updateField('bloodGroup', value)}
              onBlur={() => handleBlur('bloodGroup')}
              onVerify={() => verifyField('bloodGroup')}
              disabled={disabled}
              isAutoFilled={autoFilledFields['bloodGroup']}
              verificationStatus={verificationStatus['bloodGroup']}
              errors={errors['bloodGroup']}
              touched={touched['bloodGroup']}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <LicenseFormField
              field="issueDate"
              label="Date of Issue"
              placeholder="YYYY-MM-DD"
              required
              type="date"
              value={getFieldValue('issueDate')}
              onChange={(value) => updateField('issueDate', value)}
              onBlur={() => handleBlur('issueDate')}
              onVerify={() => verifyField('issueDate')}
              disabled={disabled}
              isAutoFilled={autoFilledFields['issueDate']}
              verificationStatus={verificationStatus['issueDate']}
              errors={errors['issueDate']}
              touched={touched['issueDate']}
            />
            <LicenseFormField
              field="expiryDate"
              label="Date of Expiry"
              placeholder="YYYY-MM-DD"
              required
              type="date"
              value={getFieldValue('expiryDate')}
              onChange={(value) => updateField('expiryDate', value)}
              onBlur={() => handleBlur('expiryDate')}
              onVerify={() => verifyField('expiryDate')}
              disabled={disabled}
              isAutoFilled={autoFilledFields['expiryDate']}
              verificationStatus={verificationStatus['expiryDate']}
              errors={errors['expiryDate']}
              touched={touched['expiryDate']}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <LicenseFormField
              field="category"
              label="License Category"
              placeholder="e.g., A, B, C"
              value={getFieldValue('category')}
              onChange={(value) => updateField('category', value)}
              onBlur={() => handleBlur('category')}
              onVerify={() => verifyField('category')}
              disabled={disabled}
              isAutoFilled={autoFilledFields['category']}
              verificationStatus={verificationStatus['category']}
              errors={errors['category']}
              touched={touched['category']}
            />
            <LicenseFormField
              field="issuingAuthority"
              label="Issued By"
              placeholder="Department of Transport Management, Government of Nepal"
              value={getFieldValue('issuingAuthority')}
              onChange={(value) => updateField('issuingAuthority', value)}
              onBlur={() => handleBlur('issuingAuthority')}
              onVerify={() => verifyField('issuingAuthority')}
              disabled={disabled}
              isAutoFilled={autoFilledFields['issuingAuthority']}
              verificationStatus={verificationStatus['issuingAuthority']}
              errors={errors['issuingAuthority']}
              touched={touched['issuingAuthority']}
            />
          </div>

          {autoFilledCount === 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div className="text-sm text-yellow-700">
                  <p className="font-medium">No auto-fill data detected</p>
                  <p>Please enter your Nepal license details manually in XX-XXX-XXXXXX format. Make sure to upload a clear image for better OCR results.</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-4 pt-4">
            <Button type="button" variant="outline" onClick={onCancel} disabled={disabled || isProcessing}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1 bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700" 
              disabled={disabled || isProcessing}
            >
              {isProcessing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isProcessing ? 'Saving Nepal License...' : 'Save Nepal License (XX-XXX-XXXXXX)'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default LicenseForm;
