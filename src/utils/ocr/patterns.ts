
import { NepalLicenseRegions } from './types';

// Enhanced Nepal License Field Patterns based on the comprehensive format
export const NEPAL_LICENSE_PATTERNS = {
  licenseNumber: [
    /D\.?L\.?\s*No\.?\s*[:\-]?\s*(\d{2}-\d{3}-\d{6})/gi,
    /License\s*No\.?\s*[:\-]?\s*(\d{2}-\d{3}-\d{6})/gi,
    /(\d{2}-\d{3}-\d{6})/gi,
    /D\.?L\.?\s*No\.?\s*[:\-]?\s*(\d{11})/gi
  ],
  holderName: [
    /Name\s*[:\-]?\s*([A-Z][a-zA-Z\s]{2,50})/gi,
    /नाम\s*[:\-]?\s*([A-Z][a-zA-Z\s]{2,50})/gi,
    /([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+){1,3})/gi
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
    /Birth\s*Date\s*[:\-]?\s*(\d{4}-\d{2}-\d{2})/gi
  ],
  fatherOrHusbandName: [
    /F\/H\s*Name\s*[:\-]?\s*([A-Z][a-zA-Z\s]{2,50})/gi,
    /Father.*Name\s*[:\-]?\s*([A-Z][a-zA-Z\s]{2,50})/gi,
    /Husband.*Name\s*[:\-]?\s*([A-Z][a-zA-Z\s]{2,50})/gi,
    /बुबा.*नाम\s*[:\-]?\s*([A-Z][a-zA-Z\s]{2,50})/gi,
    /श्रीमान.*नाम\s*[:\-]?\s*([A-Z][a-zA-Z\s]{2,50})/gi
  ],
  citizenshipNo: [
    /Citizenship\s*No\.?\s*[:\-]?\s*(\d{10,15})/gi,
    /नागरिकता\s*नं\s*[:\-]?\s*(\d{10,15})/gi,
    /Citizen.*No\s*[:\-]?\s*(\d{10,15})/gi
  ],
  passportNo: [
    /Passport\s*No\.?\s*[:\-]?\s*([A-Z0-9]{8,15})/gi,
    /राहदानी\s*नं\s*[:\-]?\s*([A-Z0-9]{8,15})/gi,
    /Pass.*No\s*[:\-]?\s*([A-Z0-9]{8,15})/gi
  ],
  phoneNo: [
    /Phone\s*No\.?\s*[:\-]?\s*(\d{10})/gi,
    /Mobile\s*[:\-]?\s*(\d{10})/gi,
    /फोन\s*नं\s*[:\-]?\s*(\d{10})/gi,
    /(98\d{8})/gi,
    /Contact\s*[:\-]?\s*(\d{10})/gi
  ],
  bloodGroup: [
    /B\.?G\.?\s*[:\-]?\s*([ABO]{1,2}[+-])/gi,
    /Blood\s*Group\s*[:\-]?\s*([ABO]{1,2}[+-])/gi,
    /रक्त.*समुह\s*[:\-]?\s*([ABO]{1,2}[+-])/gi,
    /([ABO]{1,2}[+-])/gi
  ],
  dateOfIssue: [
    /D\.?O\.?I\.?\s*[:\-]?\s*(\d{4}-\d{2}-\d{2})/gi,
    /Date\s*of\s*Issue\s*[:\-]?\s*(\d{4}-\d{2}-\d{2})/gi,
    /Issue\s*Date\s*[:\-]?\s*(\d{4}-\d{2}-\d{2})/gi,
    /जारी\s*मिति\s*[:\-]?\s*(\d{4}-\d{2}-\d{2})/gi,
    /Issued\s*On\s*[:\-]?\s*(\d{4}-\d{2}-\d{2})/gi
  ],
  dateOfExpiry: [
    /D\.?O\.?E\.?\s*[:\-]?\s*(\d{4}-\d{2}-\d{2})/gi,
    /Date\s*of\s*Expiry\s*[:\-]?\s*(\d{4}-\d{2}-\d{2})/gi,
    /Expiry\s*Date\s*[:\-]?\s*(\d{4}-\d{2}-\d{2})/gi,
    /Valid\s*Till\s*[:\-]?\s*(\d{4}-\d{2}-\d{2})/gi,
    /समाप्ति\s*मिति\s*[:\-]?\s*(\d{4}-\d{2}-\d{2})/gi
  ],
  category: [
    /Category\s*[:\-]?\s*([A-Z]+)/gi,
    /श्रेणी\s*[:\-]?\s*([A-Z]+)/gi,
    /Class\s*[:\-]?\s*([A-Z]+)/gi,
    /Vehicle.*Class\s*[:\-]?\s*([A-Z]+)/gi,
    /([A-Z])\s*(?:Category|Class|श्रेणी)/gi
  ],
  issuedBy: [
    /Issued\s*By\s*[:\-]?\s*([A-Za-z\s,]{5,100})/gi,
    /जारीकर्ता\s*[:\-]?\s*([A-Za-z\s,]{5,100})/gi,
    /Issuing.*Authority\s*[:\-]?\s*([A-Za-z\s,]{5,100})/gi,
    /(Department.*Transport.*Management)/gi,
    /(यातायात.*व्यवस्था.*विभाग)/gi
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
