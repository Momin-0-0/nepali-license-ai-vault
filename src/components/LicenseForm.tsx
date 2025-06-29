import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileText, AlertCircle, Loader2, CheckCircle, XCircle, Info } from "lucide-react";
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

  const updateField = (field: keyof LicenseData, value: string) => {
    const sanitizedValue = sanitizeInput(value);
    onDataChange({
      ...licenseData,
      [field]: sanitizedValue
    });
    
    // Clear errors when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: [] }));
    }
  };

  const validateField = (field: keyof LicenseData, value: string) => {
    let fieldErrors: string[] = [];

    switch (field) {
      case 'licenseNumber':
        const licenseValidation = validateNepalLicenseNumber(value);
        if (!licenseValidation.isValid) {
          fieldErrors = licenseValidation.errors;
        }
        break;
      
      case 'issueDate':
        const issueDateValidation = validateDate(value, 'Issue date');
        if (!issueDateValidation.isValid) {
          fieldErrors = issueDateValidation.errors;
        }
        break;
      
      case 'expiryDate':
        const expiryDateValidation = validateDate(value, 'Expiry date');
        if (!expiryDateValidation.isValid) {
          fieldErrors = expiryDateValidation.errors;
        } else if (licenseData.issueDate) {
          const dateRangeValidation = validateExpiryDate(licenseData.issueDate, value);
          if (!dateRangeValidation.isValid) {
            fieldErrors = [...fieldErrors, ...dateRangeValidation.errors];
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
    validateField(field, licenseData[field]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    const allFields: (keyof LicenseData)[] = ['licenseNumber', 'expiryDate', 'issueDate', 'holderName', 'issuingAuthority', 'address'];
    let hasErrors = false;
    
    allFields.forEach(field => {
      const isValid = validateField(field, licenseData[field]);
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

  return (
    <Card className={disabled ? 'opacity-60' : ''}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Nepal License Details
        </CardTitle>
        <CardDescription>
          Review and edit the extracted information from your Nepal driving license
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Nepal License Format Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-700">
              <p className="font-medium mb-2">Nepal License Format Guide:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li><strong>License Number:</strong> XX-XX-XXXXXXXXX (e.g., 03-06-041605052)</li>
                <li><strong>Date Format:</strong> DD-MM-YYYY (Nepal standard)</li>
                <li><strong>Authority:</strong> Department of Transport Management, Government of Nepal</li>
                <li><strong>Validation:</strong> All fields are validated for Nepal license standards</li>
              </ul>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="licenseNumber" className="flex items-center gap-2">
              License Number * (Nepal Format)
              {renderFieldIcon('licenseNumber')}
            </Label>
            <Input
              id="licenseNumber"
              value={licenseData.licenseNumber}
              onChange={(e) => updateField('licenseNumber', e.target.value.toUpperCase())}
              onBlur={() => handleBlur('licenseNumber')}
              placeholder="e.g., 03-06-041605052 or 03060416050520"
              required
              disabled={disabled}
              className={errors.licenseNumber?.length > 0 ? 'border-red-500' : ''}
            />
            {touched.licenseNumber && errors.licenseNumber?.map((error, index) => (
              <p key={index} className="text-sm text-red-500">{error}</p>
            ))}
            <p className="text-xs text-gray-500">
              Nepal license format: XX-XX-XXXXXXXXX (will be auto-formatted)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="holderName" className="flex items-center gap-2">
              Holder Name (As on License)
              {renderFieldIcon('holderName')}
            </Label>
            <Input
              id="holderName"
              value={licenseData.holderName}
              onChange={(e) => updateField('holderName', e.target.value)}
              onBlur={() => handleBlur('holderName')}
              placeholder="Full name as printed on Nepal license"
              disabled={disabled}
              className={errors.holderName?.length > 0 ? 'border-red-500' : ''}
            />
            {touched.holderName && errors.holderName?.map((error, index) => (
              <p key={index} className="text-sm text-red-500">{error}</p>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="issueDate" className="flex items-center gap-2">
                Issue Date (Nepal Format)
                {renderFieldIcon('issueDate')}
              </Label>
              <Input
                id="issueDate"
                type="date"
                value={licenseData.issueDate}
                onChange={(e) => updateField('issueDate', e.target.value)}
                onBlur={() => handleBlur('issueDate')}
                disabled={disabled}
                className={errors.issueDate?.length > 0 ? 'border-red-500' : ''}
              />
              {touched.issueDate && errors.issueDate?.map((error, index) => (
                <p key={index} className="text-sm text-red-500">{error}</p>
              ))}
              <p className="text-xs text-gray-500">Date when license was issued</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiryDate" className="flex items-center gap-2">
                Expiry Date * (Nepal Format)
                {renderFieldIcon('expiryDate')}
              </Label>
              <Input
                id="expiryDate"
                type="date"
                value={licenseData.expiryDate}
                onChange={(e) => updateField('expiryDate', e.target.value)}
                onBlur={() => handleBlur('expiryDate')}
                required
                disabled={disabled}
                className={errors.expiryDate?.length > 0 ? 'border-red-500' : ''}
              />
              {touched.expiryDate && errors.expiryDate?.map((error, index) => (
                <p key={index} className="text-sm text-red-500">{error}</p>
              ))}
              <p className="text-xs text-gray-500">License expiration date</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="issuingAuthority" className="flex items-center gap-2">
              Issuing Authority (Nepal)
              {renderFieldIcon('issuingAuthority')}
            </Label>
            <Input
              id="issuingAuthority"
              value={licenseData.issuingAuthority}
              onChange={(e) => updateField('issuingAuthority', e.target.value)}
              onBlur={() => handleBlur('issuingAuthority')}
              disabled={disabled}
              className={errors.issuingAuthority?.length > 0 ? 'border-red-500' : ''}
              placeholder="Department of Transport Management, Government of Nepal"
            />
            {touched.issuingAuthority && errors.issuingAuthority?.map((error, index) => (
              <p key={index} className="text-sm text-red-500">{error}</p>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="address" className="flex items-center gap-2">
              Address (As on License)
              {renderFieldIcon('address')}
            </Label>
            <Textarea
              id="address"
              value={licenseData.address}
              onChange={(e) => updateField('address', e.target.value)}
              onBlur={() => handleBlur('address')}
              placeholder="Address as printed on Nepal license"
              rows={3}
              disabled={disabled}
              className={errors.address?.length > 0 ? 'border-red-500' : ''}
            />
            {touched.address && errors.address?.map((error, index) => (
              <p key={index} className="text-sm text-red-500">{error}</p>
            ))}
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div className="text-sm text-yellow-700">
                <p className="font-medium">Please verify the extracted information</p>
                <p>OCR may not be 100% accurate for Nepal licenses. Please review and correct any errors before saving.</p>
                <p className="mt-1 text-xs">✓ License number format validated for Nepal standards</p>
              </div>
            </div>
          </div>

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
              {isProcessing ? 'Saving Nepal License...' : 'Save Nepal License'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default LicenseForm;