
import { LicenseData } from '@/types/license';
import { NEPAL_LICENSE_PATTERNS } from './patterns';
import { WordData, LineData } from './types';

export const extractFromNepalLicenseLines = (lines: string[]): Partial<LicenseData> => {
  const data: Partial<LicenseData> = {};
  const fullText = lines.join(' ');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const nextLine = lines[i + 1] || '';
    
    // Enhanced license number detection - multiple formats
    if (/D\.?L\.?\s*No/i.test(line) || /License.*No/i.test(line)) {
      // Try different license number patterns
      const patterns = [
        /(\d{2}-\d{2,3}-\d{6,8})/,  // 03-06-01416052 or 03-066-123456
        /(\d{11,12})/,              // Without dashes
        /D\.?L\.?\s*No\.?\s*(\d{2}-?\d{2,3}-?\d{6,8})/i
      ];
      
      for (const pattern of patterns) {
        const numberMatch = line.match(pattern) || fullText.match(pattern);
        if (numberMatch) {
          data.licenseNumber = formatNepalLicenseNumber(numberMatch[1]);
          console.log('✓ License number extracted:', data.licenseNumber);
          break;
        }
      }
    }
    
    // Enhanced date extraction - look for D.O.I and D.O.E patterns
    if (/D\.?O\.?I\.?[:\s]/.test(line) || /Issue.*Date/i.test(line)) {
      const datePatterns = [
        /(\d{2}-\d{2}-\d{4})/,  // DD-MM-YYYY
        /(\d{4}-\d{2}-\d{2})/,  // YYYY-MM-DD
        /(\d{1,2}\/\d{1,2}\/\d{4})/  // D/M/YYYY or DD/MM/YYYY
      ];
      
      for (const pattern of datePatterns) {
        const dateMatch = line.match(pattern);
        if (dateMatch) {
          data.issueDate = convertNepalDateToISO(dateMatch[1]);
          console.log('✓ Issue date extracted:', data.issueDate);
          break;
        }
      }
    }
    
    // Enhanced expiry date extraction
    if (/D\.?O\.?E\.?[:\s]/.test(line) || /Expiry.*Date/i.test(line) || /Valid.*Till/i.test(line)) {
      const datePatterns = [
        /(\d{2}-\d{2}-\d{4})/,  // DD-MM-YYYY
        /(\d{4}-\d{2}-\d{2})/,  // YYYY-MM-DD
        /(\d{1,2}\/\d{1,2}\/\d{4})/  // D/M/YYYY or DD/MM/YYYY
      ];
      
      for (const pattern of datePatterns) {
        const dateMatch = line.match(pattern);
        if (dateMatch) {
          data.expiryDate = convertNepalDateToISO(dateMatch[1]);
          console.log('✓ Expiry date extracted:', data.expiryDate);
          break;
        }
      }
    }
    
    // Name detection (holder name)
    if (/^Name[:\s]/i.test(line)) {
      const nameMatch = line.match(/Name[:\s]*([A-Z][a-zA-Z\s]{2,})/i);
      if (nameMatch) {
        data.holderName = nameMatch[1].trim();
      }
    }
    
    // Address detection
    if (/^Address[:\s]/i.test(line)) {
      let address = line.replace(/^Address[:\s]*/i, '').trim();
      if (nextLine && !nextLine.match(/^(D\.O\.B|DOB|Phone|Category|Citizenship|Father|Husband)/i)) {
        address += ', ' + nextLine.trim();
      }
      if (address.length > 5) {
        data.address = address;
      }
    }
    
    // Date of birth
    if (/D\.?O\.?B\.?[:\s]/.test(line)) {
      const datePatterns = [
        /(\d{2}-\d{2}-\d{4})/,  // DD-MM-YYYY
        /(\d{4}-\d{2}-\d{2})/,  // YYYY-MM-DD
        /(\d{1,2}\/\d{1,2}\/\d{4})/  // D/M/YYYY or DD/MM/YYYY
      ];
      
      for (const pattern of datePatterns) {
        const dobMatch = line.match(pattern);
        if (dobMatch) {
          data.dateOfBirth = convertNepalDateToISO(dobMatch[1]);
          break;
        }
      }
    }
    
    // Father or Husband name
    if (/F\/H\s*Name/i.test(line) || /Father.*Name/i.test(line) || /Husband.*Name/i.test(line)) {
      const fatherMatch = line.match(/(?:F\/H|Father.*|Husband.*)\s*Name[:\s]*([A-Z][a-zA-Z\s]{2,})/i);
      if (fatherMatch) {
        data.fatherOrHusbandName = fatherMatch[1].trim();
      }
    }
    
    // Citizenship number
    if (/Citizenship[:\s]*No/i.test(line)) {
      const citizenshipMatch = line.match(/(\d{10,15})/);
      if (citizenshipMatch) {
        data.citizenshipNo = citizenshipMatch[1];
      }
    }
    
    // Passport number
    if (/Passport[:\s]*No/i.test(line)) {
      const passportMatch = line.match(/([A-Z0-9]{8,15})/);
      if (passportMatch) {
        data.passportNo = passportMatch[1];
      }
    }
    
    // Phone number
    if (/Phone[:\s]*No/i.test(line) || /Mobile/i.test(line) || /Contact/i.test(line)) {
      const phoneMatch = line.match(/(\d{10})/);
      if (phoneMatch) {
        data.phoneNo = phoneMatch[1];
      }
    }
    
    // Blood group
    if (/B\.?G\.?[:\s]/i.test(line) || /Blood\s*Group/i.test(line)) {
      const bloodMatch = line.match(/([ABO]{1,2}[+-])/);
      if (bloodMatch && ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].includes(bloodMatch[1])) {
        data.bloodGroup = bloodMatch[1] as any;
      }
    }
    
    // Category
    if (/Category[:\s]/i.test(line) || /Class[:\s]/i.test(line)) {
      const categoryMatch = line.match(/(?:Category|Class)[:\s]*([A-Z]+)/i);
      if (categoryMatch) {
        data.category = categoryMatch[1];
      }
    }
    
    // Issued by / Issuing authority
    if (/Issued\s*By/i.test(line) || /Issuing.*Authority/i.test(line)) {
      const issuedByMatch = line.match(/(?:Issued\s*By|Issuing.*Authority)[:\s]*([A-Za-z\s,]{5,})/i);
      if (issuedByMatch) {
        data.issuingAuthority = issuedByMatch[1].trim();
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
    
    // Enhanced name detection
    if (/Name/i.test(wordText) && nextWordText.length > 2) {
      const possibleName = nextNextWordText ? 
        `${nextWordText} ${nextNextWordText}` : nextWordText;
      if (/^[A-Z][a-zA-Z\s]{2,}$/.test(possibleName)) {
        data.holderName = possibleName;
      }
    }
    
    // Enhanced license number detection
    if (/D\.?L\.?No/i.test(wordText) && /\d{2}-\d{3}-\d{6}/.test(nextWordText)) {
      data.licenseNumber = nextWordText;
    }
    
    // Father/Husband name detection
    if (/F\/H|Father|Husband/i.test(wordText) && nextWordText.length > 2) {
      const possibleName = nextNextWordText ? 
        `${nextWordText} ${nextNextWordText}` : nextWordText;
      if (/^[A-Z][a-zA-Z\s]{2,}$/.test(possibleName)) {
        data.fatherOrHusbandName = possibleName;
      }
    }
    
    // Category detection
    if (/Category|Class/i.test(wordText) && /^[A-Z]+$/.test(nextWordText)) {
      data.category = nextWordText;
    }
    
    // Blood group detection
    if (/B\.?G\.?|Blood/i.test(wordText) && /^[ABO]{1,2}[+-]$/.test(nextWordText)) {
      if (['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].includes(nextWordText)) {
        data.bloodGroup = nextWordText as any;
      }
    }
  }
  
  return data;
};

export const validateNepalLicenseNumber = (licenseNumber: string): boolean => {
  const patterns = [
    /^\d{2}-\d{3}-\d{6}$/,  // New enhanced format: 03-066-123456
    /^\d{2}-\d{2}-\d{8}$/,  // Format like: 03-06-01416052
    /^\d{2}-\d{3}-\d{7}$/,  // Alternative format: 03-066-1234567
    /^\d{11,12}$/           // Without dashes
  ];
  
  return patterns.some(pattern => pattern.test(licenseNumber));
};

export const formatNepalLicenseNumber = (licenseNumber: string): string => {
  const cleaned = licenseNumber.replace(/[-\s]/g, '');
  
  if (cleaned.length === 12) {
    // Format like 030601416052 -> 03-06-01416052
    return `${cleaned.substring(0, 2)}-${cleaned.substring(2, 4)}-${cleaned.substring(4)}`;
  } else if (cleaned.length === 11) {
    // New format: XX-XXX-XXXXXX
    return `${cleaned.substring(0, 2)}-${cleaned.substring(2, 5)}-${cleaned.substring(5)}`;
  }
  
  return licenseNumber;
};

export const convertNepalDateToISO = (dateString: string): string => {
  // Handle various Nepal date formats
  const isoMatch = dateString.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return dateString; // Already in ISO format
  }
  
  // Handle DD-MM-YYYY format (common in Nepal licenses)
  const ddmmMatch = dateString.match(/(\d{1,2})-(\d{1,2})-(\d{4})/);
  if (ddmmMatch) {
    const [, day, month, year] = ddmmMatch;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  // Handle DD/MM/YYYY format
  const slashMatch = dateString.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (slashMatch) {
    const [, day, month, year] = slashMatch;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  return dateString;
};

export const validateAndCleanupNepalData = (data: Partial<LicenseData>): Partial<LicenseData> => {
  const cleaned: Partial<LicenseData> = {};
  
  // Validate and clean license number
  if (data.licenseNumber && validateNepalLicenseNumber(data.licenseNumber)) {
    cleaned.licenseNumber = formatNepalLicenseNumber(data.licenseNumber);
  }
  
  // Validate and clean names
  if (data.holderName) {
    const cleanName = data.holderName.replace(/[^\w\s]/g, '').trim();
    if (cleanName.length >= 2 && /^[A-Za-z\s]+$/.test(cleanName)) {
      cleaned.holderName = cleanName;
    }
  }
  
  if (data.fatherOrHusbandName) {
    const cleanName = data.fatherOrHusbandName.replace(/[^\w\s]/g, '').trim();
    if (cleanName.length >= 2 && /^[A-Za-z\s]+$/.test(cleanName)) {
      cleaned.fatherOrHusbandName = cleanName;
    }
  }
  
  // Validate address
  if (data.address && data.address.length >= 5) {
    cleaned.address = data.address.trim();
  }
  
  // Validate dates (ISO format)
  ['dateOfBirth', 'issueDate', 'expiryDate'].forEach(dateField => {
    const dateValue = data[dateField as keyof LicenseData];
    if (dateValue && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
      (cleaned as any)[dateField] = dateValue;
    }
  });
  
  // Validate citizenship number (10-15 digits)
  if (data.citizenshipNo && /^\d{10,15}$/.test(data.citizenshipNo)) {
    cleaned.citizenshipNo = data.citizenshipNo;
  }
  
  // Validate passport number (8-15 alphanumeric)
  if (data.passportNo && /^[A-Z0-9]{8,15}$/.test(data.passportNo)) {
    cleaned.passportNo = data.passportNo;
  }
  
  // Validate phone number (10 digits)
  if (data.phoneNo && /^\d{10}$/.test(data.phoneNo)) {
    cleaned.phoneNo = data.phoneNo;
  }
  
  // Validate blood group
  if (data.bloodGroup && ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].includes(data.bloodGroup)) {
    cleaned.bloodGroup = data.bloodGroup;
  }
  
  // Keep other validated fields
  ['category', 'issuingAuthority', 'photoUrl', 'signatureUrl'].forEach(field => {
    if (data[field as keyof LicenseData]) {
      (cleaned as any)[field] = data[field as keyof LicenseData];
    }
  });
  
  return cleaned;
};
