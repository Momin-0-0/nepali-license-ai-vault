
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { LicenseData } from '@/types/license';
import { sanitizeInput } from '@/utils/validation';
import { useLicenseFormValidation } from './forms/LicenseFormValidation';
import LicenseFormHeader from './forms/LicenseFormHeader';
import LicenseFormFields from './forms/LicenseFormFields';

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
  const [showVerificationHelper, setShowVerificationHelper] = useState(true);

  const {
    errors,
    touched,
    autoFilledFields,
    verificationStatus,
    getFieldValue,
    handleBlur,
    verifyField,
    verifyAllFields,
    updateVerificationAfterEdit,
    validateRequiredFields
  } = useLicenseFormValidation(licenseData);

  const updateField = (field: keyof LicenseData, value: string | undefined) => {
    const sanitizedValue = value ? sanitizeInput(value) : '';
    
    // Handle blood group specifically to ensure it's a valid enum value or undefined
    if (field === 'bloodGroup') {
      const validBloodGroups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
      const bloodGroupValue = validBloodGroups.includes(value as string) ? value as LicenseData['bloodGroup'] : undefined;
      
      onDataChange({
        ...licenseData,
        [field]: bloodGroupValue
      });
    } else {
      onDataChange({
        ...licenseData,
        [field]: sanitizedValue
      });
    }
    
    updateVerificationAfterEdit(field);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clean up the license data before validation
    const cleanedData = {
      ...licenseData,
      // Ensure blood group is properly typed
      bloodGroup: licenseData.bloodGroup && typeof licenseData.bloodGroup === 'string' 
        ? licenseData.bloodGroup as LicenseData['bloodGroup']
        : undefined,
      // Clean up any undefined or null values
      licenseNumber: licenseData.licenseNumber || '',
      holderName: licenseData.holderName || '',
      address: licenseData.address || '',
      issueDate: licenseData.issueDate || '',
      expiryDate: licenseData.expiryDate || '',
      issuingAuthority: licenseData.issuingAuthority || 'Department of Transport Management, Government of Nepal'
    };

    // Update the parent with cleaned data
    onDataChange(cleanedData);
    
    const isValid = validateRequiredFields();
    if (!isValid) {
      return;
    }

    onSubmit(e);
  };

  // Check if required fields are filled
  const requiredFields = ['licenseNumber', 'holderName', 'address', 'issueDate', 'expiryDate'];
  const requiredFieldsFilled = requiredFields.every(field => {
    const value = getFieldValue(field as keyof LicenseData);
    return value && value.trim() !== '';
  });

  const requiredFieldsWithErrors = requiredFields.filter(field => {
    return errors[field] && errors[field].length > 0;
  });

  const autoFilledCount = Object.keys(autoFilledFields).length;
  const verifiedCount = Object.values(verificationStatus).filter(status => status === 'verified').length;
  const pendingCount = Object.values(verificationStatus).filter(status => status === 'pending').length;

  return (
    <Card className={disabled ? 'opacity-60' : ''}>
      <LicenseFormHeader
        autoFilledCount={autoFilledCount}
        verificationStatus={verificationStatus}
        verifiedCount={verifiedCount}
        pendingCount={pendingCount}
        showVerificationHelper={showVerificationHelper}
        onCloseVerificationHelper={() => setShowVerificationHelper(false)}
        onVerifyAllFields={verifyAllFields}
      />

      <div className="px-6 pb-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Form Status Indicator */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {requiredFieldsFilled && requiredFieldsWithErrors.length === 0 ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <span className="text-green-800 font-medium">Ready to save</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                    <span className="text-amber-800 font-medium">
                      {!requiredFieldsFilled 
                        ? "Fill required fields to save" 
                        : "Fix errors to save"
                      }
                    </span>
                  </>
                )}
              </div>
              <div className="text-sm text-gray-600">
                {requiredFields.filter(field => {
                  const value = getFieldValue(field as keyof LicenseData);
                  return value && value.trim() !== '';
                }).length}/{requiredFields.length} required fields filled
              </div>
            </div>
            
            {requiredFieldsWithErrors.length > 0 && (
              <div className="mt-2 text-sm text-red-600">
                Fix errors in: {requiredFieldsWithErrors.join(', ')}
              </div>
            )}
          </div>

          <LicenseFormFields
            licenseData={licenseData}
            onDataChange={onDataChange}
            getFieldValue={getFieldValue}
            updateField={updateField}
            handleBlur={handleBlur}
            verifyField={verifyField}
            disabled={disabled}
            autoFilledFields={autoFilledFields}
            verificationStatus={verificationStatus}
            errors={errors}
            touched={touched}
          />

          <div className="flex gap-4 pt-6 border-t border-gray-200">
            <Button type="button" variant="outline" onClick={onCancel} disabled={disabled || isProcessing}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1 bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700" 
              disabled={disabled || isProcessing || !requiredFieldsFilled || requiredFieldsWithErrors.length > 0}
            >
              {isProcessing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isProcessing ? 'Saving Nepal License...' : (
                requiredFieldsFilled && requiredFieldsWithErrors.length === 0 
                  ? 'Save Nepal License' 
                  : 'Complete Required Fields to Save'
              )}
            </Button>
          </div>
        </form>
      </div>
    </Card>
  );
};

export default LicenseForm;
