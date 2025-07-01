
import { NepalLicenseRegions } from './types';

// Enhanced Nepal License Field Patterns based on real license format
export const NEPAL_LICENSE_PATTERNS = {
  licenseNumber: [
    /D\.?L\.?\s*No\.?\s*[:\-]?\s*(\d{2}-\d{3}-\d{7})/gi,
    /License\s*No\.?\s*[:\-]?\s*(\d{2}-\d{3}-\d{7})/gi,
    /(\d{2}-\d{3}-\d{7})/gi,
    /D\.?L\.?\s*No\.?\s*[:\-]?\s*(\d{11})/gi
  ],
  bloodGroup: [
    /B\.?G\.?\s*[:\-]?\s*([ABO]{1,2}[+-])/gi,
    /Blood\s*Group\s*[:\-]?\s*([ABO]{1,2}[+-])/gi,
    /([ABO]{1,2}[+-])/gi
  ],
  holderName: [
    /Name\s*[:\-]?\s*([A-Z][a-zA-Z\s]{2,50})/gi,
    /नाम\s*[:\-]?\s*([A-Z][a-zA-Z\s]{2,50})/gi,
    /([A-Z][a-zA-Z]+\s+[A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)/gi
  ],
  address: [
    /Address\s*[:\-]?\s*([A-Za-z0-9,\s\-]{5,100})/gi,
    /ठेगाना\s*[:\-]?\s*([A-Za-z0-9,\s\-]{5,100})/gi,
    /([A-Za-z\-]+\-\d+,\s*[A-Za-z\-]+,\s*[A-Za-z\-]+,\s*Nepal)/gi
  ],
  dateOfBirth: [
    /D\.?O\.?B\.?\s*[:\-]?\s*(\d{4}-\d{2}-\d{2})/gi,
    /Date\s*of\s*Birth\s*[:\-]?\s*(\d{4}-\d{2}-\d{2})/gi,
    /जन्म\s*मिति\s*[:\-]?\s*(\d{4}-\d{2}-\d{2})/gi,
    /(\d{4}-\d{2}-\d{2})/gi
  ],
  citizenshipNo: [
    /Citizenship\s*No\.?\s*[:\-]?\s*(\d{11})/gi,
    /नागरिकता\s*नं\s*[:\-]?\s*(\d{11})/gi,
    /(\d{11})/gi
  ],
  phoneNo: [
    /Phone\s*No\.?\s*[:\-]?\s*(\d{10})/gi,
    /Mobile\s*[:\-]?\s*(\d{10})/gi,
    /फोन\s*नं\s*[:\-]?\s*(\d{10})/gi,
    /(98\d{8})/gi
  ],
  issueDate: [
    /D\.?O\.?I\.?\s*[:\-]?\s*(\d{4}-\d{2}-\d{2})/gi,
    /Date\s*of\s*Issue\s*[:\-]?\s*(\d{4}-\d{2}-\d{2})/gi,
    /Issue\s*Date\s*[:\-]?\s*(\d{4}-\d{2}-\d{2})/gi,
    /जारी\s*मिति\s*[:\-]?\s*(\d{4}-\d{2}-\d{2})/gi
  ],
  expiryDate: [
    /D\.?O\.?E\.?\s*[:\-]?\s*(\d{4}-\d{2}-\d{2})/gi,
    /Date\s*of\s*Expiry\s*[:\-]?\s*(\d{4}-\d{2}-\d{2})/gi,
    /Expiry\s*Date\s*[:\-]?\s*(\d{4}-\d{2}-\d{2})/gi,
    /समाप्ति\s*मिति\s*[:\-]?\s*(\d{4}-\d{2}-\d{2})/gi
  ],
  category: [
    /Category\s*[:\-]?\s*([A-Z]+)/gi,
    /श्रेणी\s*[:\-]?\s*([A-Z]+)/gi,
    /Class\s*[:\-]?\s*([A-Z]+)/gi,
    /([A-Z])\s*(?:Category|Class|श्रेणी)/gi
  ],
  fatherName: [
    /F\/H\s*Name\s*[:\-]?\s*([A-Z][a-zA-Z\s]{2,50})/gi,
    /Father\s*Name\s*[:\-]?\s*([A-Z][a-zA-Z\s]{2,50})/gi,
    /बुबाको\s*नाम\s*[:\-]?\s*([A-Z][a-zA-Z\s]{2,50})/gi
  ],
  passportNo: [
    /Passport\s*No\.?\s*[:\-]?\s*([A-Z0-9]{8,15})/gi,
    /राहदानी\s*नं\s*[:\-]?\s*([A-Z0-9]{8,15})/gi
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
