
import { LicenseData } from '@/types/license';
import LicenseFormField from './LicenseFormField';

interface LicenseFormFieldsProps {
  licenseData: LicenseData;
  onDataChange: (data: LicenseData) => void;
  getFieldValue: (field: keyof LicenseData) => string;
  updateField: (field: keyof LicenseData, value: string | undefined) => void;
  handleBlur: (field: keyof LicenseData) => void;
  verifyField: (field: keyof LicenseData) => void;
  disabled: boolean;
  autoFilledFields: Record<string, boolean>;
  verificationStatus: Record<string, 'pending' | 'verified' | 'corrected'>;
  errors: Record<string, string[]>;
  touched: Record<string, boolean>;
}

const LicenseFormFields = ({
  getFieldValue,
  updateField,
  handleBlur,
  verifyField,
  disabled,
  autoFilledFields,
  verificationStatus,
  errors,
  touched
}: LicenseFormFieldsProps) => {
  return (
    <div className="space-y-4">
      {/* License Number Field */}
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

      {/* Holder Name Field */}
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

      {/* Date Fields */}
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

      {/* Address Field */}
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
    </div>
  );
};

export default LicenseFormFields;
