
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Check } from "lucide-react";
import { LicenseData } from '@/types/license';
import FieldVerificationBadge from './FieldVerificationBadge';

interface LicenseFormFieldProps {
  field: keyof LicenseData;
  label: string;
  placeholder: string;
  required?: boolean;
  type?: string;
  isTextarea?: boolean;
  isSelect?: boolean;
  selectOptions?: string[];
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  onVerify?: () => void;
  disabled?: boolean;
  isAutoFilled?: boolean;
  verificationStatus?: 'pending' | 'verified' | 'corrected';
  errors?: string[];
  touched?: boolean;
}

const LicenseFormField = ({
  field,
  label,
  placeholder,
  required = false,
  type = "text",
  isTextarea = false,
  isSelect = false,
  selectOptions,
  value,
  onChange,
  onBlur,
  onVerify,
  disabled = false,
  isAutoFilled = false,
  verificationStatus,
  errors = [],
  touched = false
}: LicenseFormFieldProps) => {
  const getFieldStatus = () => {
    if (!touched) return null;
    return errors.length > 0 ? 'error' : 'success';
  };

  const renderFieldIcon = () => {
    const status = getFieldStatus();
    if (status === 'error') {
      return <XCircle className="w-4 h-4 text-red-500" />;
    }
    if (status === 'success' && value) {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
    return null;
  };

  const getVerificationButtonStyle = () => {
    if (verificationStatus === 'verified') {
      return "bg-green-100 hover:bg-green-200 text-green-800 border-green-300";
    }
    return "bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200";
  };

  const getVerificationButtonText = () => {
    if (verificationStatus === 'verified') {
      return "✓ Verified";
    }
    return "✓ Correct";
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={field} className="flex items-center gap-2">
        {label} {required && <span className="text-red-500">*</span>}
        {renderFieldIcon()}
        {isAutoFilled && verificationStatus && (
          <div className="flex items-center gap-1">
            <FieldVerificationBadge status={verificationStatus} />
          </div>
        )}
      </Label>
      
      <div className="relative">
        {isSelect ? (
          <Select 
            value={value} 
            onValueChange={onChange}
            disabled={disabled}
          >
            <SelectTrigger className={`${errors.length > 0 ? 'border-red-500' : ''} ${
              isAutoFilled && verificationStatus === 'pending' ? 'border-yellow-400 bg-yellow-50' : ''
            } ${verificationStatus === 'verified' ? 'border-green-300 bg-green-50' : ''}`}>
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
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlur}
            placeholder={placeholder}
            rows={3}
            disabled={disabled}
            className={`${errors.length > 0 ? 'border-red-500' : ''} ${
              isAutoFilled && verificationStatus === 'pending' ? 'border-yellow-400 bg-yellow-50' : ''
            } ${verificationStatus === 'verified' ? 'border-green-300 bg-green-50' : ''}`}
          />
        ) : (
          <Input
            id={field}
            type={type}
            value={value}
            onChange={(e) => onChange(field === 'licenseNumber' ? e.target.value.toUpperCase() : e.target.value)}
            onBlur={onBlur}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            className={`${errors.length > 0 ? 'border-red-500' : ''} ${
              isAutoFilled && verificationStatus === 'pending' ? 'border-yellow-400 bg-yellow-50' : ''
            } ${verificationStatus === 'verified' ? 'border-green-300 bg-green-50' : ''}`}
          />
        )}
        
        {isAutoFilled && onVerify && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onVerify}
            className={`absolute right-2 top-2 h-6 px-2 text-xs ${getVerificationButtonStyle()}`}
          >
            {verificationStatus === 'verified' ? (
              <>
                <Check className="w-3 h-3 mr-1" />
                {getVerificationButtonText()}
              </>
            ) : (
              getVerificationButtonText()
            )}
          </Button>
        )}
      </div>
      
      {touched && errors.map((error, index) => (
        <p key={index} className="text-sm text-red-500">{error}</p>
      ))}
    </div>
  );
};

export default LicenseFormField;
