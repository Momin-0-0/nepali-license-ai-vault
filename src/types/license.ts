
export interface LicenseData {
  id?: string;
  // Standard fields with original names for backward compatibility
  licenseNumber: string;
  holderName: string;
  dateOfBirth: string;
  address: string;
  issueDate: string;
  expiryDate: string;
  category: string;
  imageUrl?: string;
  qrCode?: string;
  bloodGroup?: string;
  phoneNumber?: string;
  citizenshipNumber?: string;
  fatherHusbandName?: string;
  passportNumber?: string;
  province?: string;
  issuingAuthority?: string;
  createdAt?: string;
  updatedAt?: string;
  confidence?: number;
  extractionStatus?: 'success' | 'partial' | 'failed';
  validationStatus?: 'verified' | 'pending' | 'invalid';
  
  // JSON format fields (mapped for output)
  DL_No?: string;
  Blood_Group?: string;
  Name?: string;
  Address?: string;
  Province?: string;
  Date_of_Birth?: string;
  Father_Husband_Name?: string;
  Citizenship_No?: string;
  Passport_No?: string;
  Phone_No?: string;
  DOI?: string;
  DOE?: string;
  Category?: string;
  
  // Legacy fields for backward compatibility
  fatherOrHusbandName?: string;
  citizenshipNo?: string;
  passportNo?: string;
  phoneNo?: string;
  photoUrl?: string;
  signatureUrl?: string;
}
