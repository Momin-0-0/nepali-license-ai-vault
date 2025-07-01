import { LicenseData } from '@/types/license';
import { NEPAL_LICENSE_PATTERNS } from './patterns';
import { WordData, LineData } from './types';

export const extractFromNepalLicenseLines = (lines: string[]): Partial<LicenseData> => {
  const data: Partial<LicenseData> = {};
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const nextLine = lines[i + 1] || '';
    
    // License number detection - format: 03-066-0146052
    if (/D\.?L\.?\s*No/i.test(line)) {
      const numberMatch = line.match(/(\d{2}-\d{3}-\d{7})/);
      if (numberMatch) {
        data.licenseNumber = numberMatch[1];
      }
    }
    
    // Name detection
    if (/^Name[:\s]/i.test(line)) {
      const nameMatch = line.match(/Name[:\s]*([A-Z][a-zA-Z\s]{2,})/i);
      if (nameMatch) {
        data.holderName = nameMatch[1].trim();
      }
    }
    
    // Address detection - format: Rahadé-1, Gulmi, Lumbini, Nepal
    if (/^Address[:\s]/i.test(line)) {
      let address = line.replace(/^Address[:\s]*/i, '').trim();
      if (nextLine && !nextLine.match(/^(D\.O\.B|DOB|Phone|Category|Citizenship)/i)) {
        address += ', ' + nextLine.trim();
      }
      if (address.length > 5) {
        data.address = address;
      }
    }
    
    // Date of birth - format: 2004-04-25
    if (/D\.?O\.?B\.?[:\s]/.test(line)) {
      const dobMatch = line.match(/(\d{4}-\d{2}-\d{2})/);
      if (dobMatch) {
        data.dateOfBirth = dobMatch[1];
      }
    }
    
    // Date of issue - format: 2023-02-22
    if (/D\.?O\.?I\.?[:\s]/.test(line)) {
      const doiMatch = line.match(/(\d{4}-\d{2}-\d{2})/);
      if (doiMatch) {
        data.issueDate = doiMatch[1];
      }
    }
    
    // Date of expiry - format: 2028-02-21
    if (/D\.?O\.?E\.?[:\s]/.test(line)) {
      const doeMatch = line.match(/(\d{4}-\d{2}-\d{2})/);
      if (doeMatch) {
        data.expiryDate = doeMatch[1];
      }
    }
    
    // Phone number - format: 9821097622
    if (/Phone[:\s]*No/i.test(line)) {
      const phoneMatch = line.match(/(\d{10})/);
      if (phoneMatch) {
        data.phoneNo = phoneMatch[1];
      }
    }
    
    // Category - format: K
    if (/Category[:\s]/i.test(line)) {
      const categoryMatch = line.match(/Category[:\s]*([A-Z]+)/i);
      if (categoryMatch) {
        data.category = categoryMatch[1];
      }
    }
    
    // Citizenship number - format: 41017901915
    if (/Citizenship[:\s]*No/i.test(line)) {
      const citizenshipMatch = line.match(/(\d{11})/);
      if (citizenshipMatch) {
        data.citizenshipNo = citizenshipMatch[1];
      }
    }
    
    // Blood group - format: O+
    if (/B\.?G\.?[:\s]/i.test(line) || /Blood\s*Group/i.test(line)) {
      const bloodMatch = line.match(/([ABO]{1,2}[+-])/);
      if (bloodMatch) {
        data.bloodGroup = bloodMatch[1];
      }
    }
  }
  
  return data;
};

export const extractFromWordPositions = (words: WordData[]): Partial<LicenseData> => {
  const data: Partial<LicenseData> = {};
  
  for (let i = 0; i < words.length - 1; i++) {
    const word = words[i];
    const nextWord = words[i + 1];
    const nextNextWord = words[i + 2];
    
    if (!word || !nextWord) continue;
    
    const wordText = word.text?.trim() || '';
    const nextWordText = nextWord.text?.trim() || '';
    const nextNextWordText = nextNextWord?.text?.trim() || '';
    
    // Look for "Name:" followed by actual name
    if (/Name/i.test(wordText) && nextWordText.length > 2) {
      const possibleName = nextNextWordText ? 
        `${nextWordText} ${nextNextWordText}` : nextWordText;
      if (/^[A-Z][a-zA-Z\s]{2,}$/.test(possibleName)) {
        data.holderName = possibleName;
      }
    }
    
    // Look for license number patterns
    if (/D\.?L\.?No/i.test(wordText) && /\d{2}-\d{3}-\d{7}/.test(nextWordText)) {
      data.licenseNumber = nextWordText;
    }
    
    // Category detection
    if (/Category/i.test(wordText) && /^[A-Z]+$/.test(nextWordText)) {
      data.category = nextWordText;
    }
  }
  
  return data;
};

export const validateNepalLicenseNumber = (licenseNumber: string): boolean => {
  const patterns = [
    /^\d{2}-\d{3}-\d{7}$/,  // New format: 03-066-0146052
    /^\d{2}-\d{2}-\d{8}$/,  // Old format: 03-02-12345678
    /^\d{11,12}$/           // Without dashes
  ];
  
  return patterns.some(pattern => pattern.test(licenseNumber));
};

export const formatNepalLicenseNumber = (licenseNumber: string): string => {
  const cleaned = licenseNumber.replace(/[-\s]/g, '');
  
  if (cleaned.length === 12) {
    // New format: XX-XXX-XXXXXXX
    return `${cleaned.substring(0, 2)}-${cleaned.substring(2, 5)}-${cleaned.substring(5)}`;
  } else if (cleaned.length === 11) {
    // Old format: XX-XX-XXXXXXXX
    return `${cleaned.substring(0, 2)}-${cleaned.substring(2, 4)}-${cleaned.substring(4)}`;
  }
  
  return licenseNumber;
};

export const convertNepalDateToISO = (dateString: string): string => {
  // Handle various Nepal date formats
  const isoMatch = dateString.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return dateString; // Already in ISO format
  }
  
  const ddmmMatch = dateString.match(/(\d{2})-(\d{2})-(\d{4})/);
  if (ddmmMatch) {
    const [, day, month, year] = ddmmMatch;
    return `${year}-${month}-${day}`;
  }
  
  return dateString;
};

export const validateAndCleanupNepalData = (data: Partial<LicenseData>): Partial<LicenseData> => {
  const cleaned: Partial<LicenseData> = {};
  
  // Validate and clean license number
  if (data.licenseNumber && validateNepalLicenseNumber(data.licenseNumber)) {
    cleaned.licenseNumber = formatNepalLicenseNumber(data.licenseNumber);
  }
  
  // Validate and clean name
  if (data.holderName) {
    const cleanName = data.holderName.replace(/[^\w\s]/g, '').trim();
    if (cleanName.length >= 2 && /^[A-Za-z\s]+$/.test(cleanName)) {
      cleaned.holderName = cleanName;
    }
  }
  
  // Validate address
  if (data.address && data.address.length >= 5) {
    cleaned.address = data.address.trim();
  }
  
  // Validate dates (already in ISO format)
  if (data.dateOfBirth && /^\d{4}-\d{2}-\d{2}$/.test(data.dateOfBirth)) {
    cleaned.dateOfBirth = data.dateOfBirth;
  }
  
  if (data.issueDate && /^\d{4}-\d{2}-\d{2}$/.test(data.issueDate)) {
    cleaned.issueDate = data.issueDate;
  }
  
  if (data.expiryDate && /^\d{4}-\d{2}-\d{2}$/.test(data.expiryDate)) {
    cleaned.expiryDate = data.expiryDate;
  }
  
  // Validate citizenship number (11 digits)
  if (data.citizenshipNo && /^\d{11}$/.test(data.citizenshipNo)) {
    cleaned.citizenshipNo = data.citizenshipNo;
  }
  
  // Validate phone number (10 digits)
  if (data.phoneNo && /^\d{10}$/.test(data.phoneNo)) {
    cleaned.phoneNo = data.phoneNo;
  }
  
  // Keep other validated fields
  ['category', 'bloodGroup', 'issuingAuthority'].forEach(field => {
    if (data[field as keyof LicenseData]) {
      (cleaned as any)[field] = data[field as keyof LicenseData];
    }
  });
  
  return cleaned;
};
