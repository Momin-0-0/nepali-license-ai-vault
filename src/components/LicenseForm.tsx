
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, AlertCircle, Loader2, CheckCircle, XCircle, Info, RefreshCw, Eye } from "lucide-react";
import { LicenseData } from '@/types/license';
import { validateNepalLicenseNumber, validateDate, validateExpiryDate, sanitizeInput } from '@/utils/validation';

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
      const value = licenseData[field];
      const isValid = validateField(field, typeof value === 'string' ? value : value?.toString());
      if (!isValid) hasErrors = true;
      setTouched(prev => ({ ...prev, [field]: true }));
    });

    if (hasErrors) {
      return;
    }

    onSubmit(e);
  };

  const getFieldStatus = (field: keyof LicenseData) => {
    if (!touched[field]) return null;
    return errors[field]?.length > 0 ? 'error' : 'success';
  };

  const renderFieldIcon = (field: keyof LicenseData) => {
    const status = getFieldStatus(field);
    if (status === 'error') {
      return <XCircle className="w-4 h-4 text-red-500" />;
    }
    if (status === 'success' && licenseData[field]) {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
    return null;
  };

  const renderFieldWithVerification = (
    field: keyof LicenseData,
    label: string,
    placeholder: string,
    required: boolean = false,
    type: string = "text",
    isTextarea: boolean = false,
    isSelect: boolean = false,
    selectOptions?: string[]
  ) => {
    const isAutoFilled = autoFilledFields[field];
    const status = verificationStatus[field];
    const fieldError = errors[field];
    const fieldValue = getFieldValue(field);
    
    return (
      <div className="space-y-2">
        <Label htmlFor={field} className="flex items-center gap-2">
          {label} {required && <span className="text-red-500">*</span>}
          {renderFieldIcon(field)}
          {isAutoFilled && (
            <div className="flex items-center gap-1">
              {status === 'pending' && (
                <div className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  Auto-filled - Please verify
                </div>
              )}
              {status === 'verified' && (
                <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Verified
                </div>
              )}
              {status === 'corrected' && (
                <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                  <RefreshCw className="w-3 h-3" />
                  Corrected
                </div>
              )}
            </div>
          )}
        </Label>
        
        <div className="relative">
          {isSelect ? (
            <Select 
              value={fieldValue} 
              onValueChange={(value) => updateField(field, value)}
              disabled={disabled}
            >
              <SelectTrigger className={`${fieldError?.length > 0 ? 'border-red-500' : ''} ${
                isAutoFilled && status === 'pending' ? 'border-yellow-400 bg-yellow-50' : ''
              }`}>
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
              <SelectContent>
                {selectOptions?.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : isTextarea ? (
            <Textarea
              id={field}
              value={fieldValue}
              onChange={(e) => updateField(field, e.target.value)}
              onBlur={() => handleBlur(field)}
              placeholder={placeholder}
              rows={3}
              disabled={disabled}
              className={`${fieldError?.length > 0 ? 'border-red-500' : ''} ${
                isAutoFilled && status === 'pending' ? 'border-yellow-400 bg-yellow-50' : ''
              }`}
            />
          ) : (
            <Input
              id={field}
              type={type}
              value={fieldValue}
              onChange={(e) => updateField(field, field === 'licenseNumber' ? e.target.value.toUpperCase() : e.target.value)}
              onBlur={() => handleBlur(field)}
              placeholder={placeholder}
              required={required}
              disabled={disabled}
              className={`${fieldError?.length > 0 ? 'border-red-500' : ''} ${
                isAutoFilled && status === 'pending' ? 'border-yellow-400 bg-yellow-50' : ''
              }`}
            />
          )}
          
          {isAutoFilled && status === 'pending' && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => verifyField(field)}
              className="absolute right-2 top-2 h-6 px-2 text-xs bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
            >
              ✓ Correct
            </Button>
          )}
        </div>
        
        {touched[field] && fieldError?.map((error, index) => (
          <p key={index} className="text-sm text-red-500">{error}</p>
        ))}
      </div>
    );
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
        {/* Auto-fill Status */}
        {autoFilledCount > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-700">
                <p className="font-medium mb-2">Auto-Fill Status ({autoFilledCount} fields found):</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  {Object.entries(autoFilledFields).map(([field, isAutoFilled]) => (
                    <div key={field} className="flex items-center gap-2">
                      <span className="capitalize">{field.replace(/([A-Z])/g, ' $1').trim()}:</span>
                      {verificationStatus[field] === 'verified' && (
                        <span className="text-green-600 font-medium">✓ Verified</span>
                      )}
                      {verificationStatus[field] === 'corrected' && (
                        <span className="text-blue-600 font-medium">✓ Corrected</span>
                      )}
                      {verificationStatus[field] === 'pending' && (
                        <span className="text-yellow-600 font-medium">⏳ Needs verification</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Verification Helper */}
        {showVerificationHelper && autoFilledCount > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div className="text-sm text-green-700">
                  <p className="font-medium mb-1">Verification Guide:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Yellow highlighted fields were auto-filled by OCR</li>
                    <li>Click "✓ Correct" if the information is accurate</li>
                    <li>Edit the field directly if corrections are needed</li>
                    <li>All fields must be verified before saving</li>
                  </ul>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowVerificationHelper(false)}
                className="h-6 w-6 p-0"
              >
                <XCircle className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {renderFieldWithVerification(
            'licenseNumber',
            'License Number (Nepal Format: XX-XXX-XXXXXX)',
            'e.g., 03-066-041605',
            true
          )}

          {renderFieldWithVerification(
            'holderName',
            'Name (As on License)',
            'Full name as printed on Nepal license',
            true
          )}

          <div className="grid grid-cols-2 gap-4">
            {renderFieldWithVerification(
              'dateOfBirth',
              'Date of Birth',
              'YYYY-MM-DD',
              false,
              'date'
            )}
            {renderFieldWithVerification(
              'fatherOrHusbandName',
              'Father/Husband Name',
              'As printed on license',
              false
            )}
          </div>

          {renderFieldWithVerification(
            'address',
            'Address (As on License)',
            'Address as printed on Nepal license',
            true,
            'text',
            true
          )}

          <div className="grid grid-cols-2 gap-4">
            {renderFieldWithVerification(
              'citizenshipNo',
              'Citizenship Number',
              'Nepal citizenship number',
              false
            )}
            {renderFieldWithVerification(
              'passportNo',
              'Passport Number',
              'Passport number (if any)',
              false
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {renderFieldWithVerification(
              'phoneNo',
              'Phone Number',
              '10-digit phone number',
              false
            )}
            {renderFieldWithVerification(
              'bloodGroup',
              'Blood Group',
              'Select blood group',
              false,
              'text',
              false,
              true,
              ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {renderFieldWithVerification(
              'issueDate',
              'Date of Issue',
              'YYYY-MM-DD',
              true,
              'date'
            )}
            {renderFieldWithVerification(
              'expiryDate',
              'Date of Expiry',
              'YYYY-MM-DD',
              true,
              'date'
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {renderFieldWithVerification(
              'category',
              'License Category',
              'e.g., A, B, C',
              false
            )}
            {renderFieldWithVerification(
              'issuingAuthority',
              'Issued By',
              'Department of Transport Management, Government of Nepal',
              false
            )}
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
