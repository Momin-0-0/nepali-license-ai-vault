
import { NepalLicenseRegions } from './types';

// Enhanced Nepal License Field Patterns based on actual license format
export const NEPAL_LICENSE_PATTERNS = {
  licenseNumber: [
    /D\.L\.No[:\s]*(\d{2}-\d{2}-\d{8})/gi,
    /D\.L\.No[:\s]*(\d{2}-\d{2}-\d{9})/gi,
    /(\d{2}-\d{2}-\d{8,9})/gi,
    /D\.L\.No[:\s]*(\d{11,13})/gi
  ],
  bloodGroup: [
    /B\.G[:\s]*([ABO]{1,2}[+-]?)/gi,
    /BG[:\s]*([ABO]{1,2}[+-]?)/gi,
    /Blood[:\s]*Group[:\s]*([ABO]{1,2}[+-]?)/gi
  ],
  holderName: [
    /Name[:\s]*([A-Z][a-zA-Z\s]{3,50})/gi,
    /नाम[:\s]*([A-Z][a-zA-Z\s]{3,50})/gi,
    /([A-Z][a-zA-Z]+\s+[A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)/gi
  ],
  address: [
    /Address[:\s]*([A-Za-z0-9,\s\-]{5,100})/gi,
    /ठेगाना[:\s]*([A-Za-z0-9,\s\-]{5,100})/gi,
    /([A-Za-z\-]+,\s*[A-Za-z\-]+,\s*Nepal)/gi
  ],
  dateOfBirth: [
    /D\.O\.B[:\s]*(\d{2}-\d{2}-\d{4})/gi,
    /DOB[:\s]*(\d{2}-\d{2}-\d{4})/gi,
    /जन्म[:\s]*मिति[:\s]*(\d{2}-\d{2}-\d{4})/gi,
    /(\d{2}-\d{2}-\d{4})/gi
  ],
  citizenshipNo: [
    /Citizenship[:\s]*No[:\s]*(\d{10,15})/gi,
    /नागरिकता[:\s]*नं[:\s]*(\d{10,15})/gi,
    /(\d{11})/gi
  ],
  phoneNo: [
    /Phone[:\s]*No[:\s]*(\d{10})/gi,
    /फोन[:\s]*नं[:\s]*(\d{10})/gi,
    /Mobile[:\s]*(\d{10})/gi,
    /(98\d{8})/gi
  ],
  issueDate: [
    /D\.O\.I[:\s]*(\d{2}-\d{2}-\d{4})/gi,
    /DOI[:\s]*(\d{2}-\d{2}-\d{4})/gi,
    /Issue[:\s]*Date[:\s]*(\d{2}-\d{2}-\d{4})/gi,
    /जारी[:\s]*मिति[:\s]*(\d{2}-\d{2}-\d{4})/gi
  ],
  expiryDate: [
    /D\.O\.E[:\s]*(\d{2}-\d{2}-\d{4})/gi,
    /DOE[:\s]*(\d{2}-\d{2}-\d{4})/gi,
    /Expiry[:\s]*Date[:\s]*(\d{2}-\d{2}-\d{4})/gi,
    /समाप्ति[:\s]*मिति[:\s]*(\d{2}-\d{2}-\d{4})/gi
  ],
  category: [
    /Category[:\s]*([A-Z]+)/gi,
    /श्रेणी[:\s]*([A-Z]+)/gi,
    /Class[:\s]*([A-Z]+)/gi
  ],
  fatherName: [
    /F\/H[:\s]*Name[:\s]*([A-Z][a-zA-Z\s]{3,50})/gi,
    /Father[:\s]*Name[:\s]*([A-Z][a-zA-Z\s]{3,50})/gi,
    /बुबाको[:\s]*नाम[:\s]*([A-Z][a-zA-Z\s]{3,50})/gi
  ],
  passportNo: [
    /Passport[:\s]*No[:\s]*([A-Z0-9]{8,15})/gi,
    /राहदानी[:\s]*नं[:\s]*([A-Z0-9]{8,15})/gi
  ]
};

// Region-based extraction areas for Nepal license layout
export const NEPAL_LICENSE_REGIONS: NepalLicenseRegions = {
  topLeft: { x: 0, y: 0, width: 0.4, height: 0.4 },
  topRight: { x: 0.6, y: 0, width: 0.4, height: 0.4 },
  centerLeft: { x: 0, y: 0.4, width: 0.5, height: 0.4 },
  centerRight: { x: 0.5, y: 0.4, width: 0.5, height: 0.4 },
  bottom: { x: 0, y: 0.8, width: 1, height: 0.2 }
};
