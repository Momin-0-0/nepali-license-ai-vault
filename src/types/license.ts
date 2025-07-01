
export interface LicenseData {
  licenseNumber: string;
  holderName: string;
  issueDate: string;
  expiryDate: string;
  issuingAuthority: string;
  address: string;
  // Enhanced Nepal license fields matching the new format
  dateOfBirth?: string;
  fatherOrHusbandName?: string;
  citizenshipNo?: string;
  passportNo?: string;
  phoneNo?: string;
  bloodGroup?: 'A+' | 'A-' | 'B+' | 'B-' | 'O+' | 'O-' | 'AB+' | 'AB-';
  category?: string;
  photoUrl?: string;
  signatureUrl?: string;
}
