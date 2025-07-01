
export interface LicenseData {
  licenseNumber: string;
  holderName: string;
  issueDate: string;
  expiryDate: string;
  issuingAuthority: string;
  address: string;
  // Additional Nepal license fields
  bloodGroup?: string;
  dateOfBirth?: string;
  citizenshipNo?: string;
  phoneNo?: string;
  category?: string;
}
