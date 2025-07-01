import { LicenseData } from '@/types/license';
import { NEPAL_LICENSE_PATTERNS } from './patterns';
import { WordData, LineData } from './types';

export const extractFromNepalLicenseLines = (lines: string[]): Partial<LicenseData> => {
  const data: Partial<LicenseData> = {};
  const fullText = lines.join(' ').replace(/\s+/g, ' ');
  
  console.log('Analyzing lines for extraction:', lines);
  
  // Enhanced license number detection with more specific patterns
  const licensePatterns = [
    /D\.?L\.?\s*No\.?\s*[:\-]?\s*(\d{2}-\d{2,3}-\d{6,8})/i,
    /License\s*No\.?\s*[:\-]?\s*(\d{2}-\d{2,3}-\d{6,8})/i,
    /(\d{2}-\d{2,3}-\d{6,8})(?!\d)/g, // Standalone license number format
    /(\d{11,13})(?!\d)/g // Numeric only format
  ];
  
  for (const pattern of licensePatterns) {
    const match = fullText.match(pattern);
    if (match) {
      const licenseNum = match[1];
      if (validateNepalLicenseNumber(licenseNum)) {
        data.licenseNumber = formatNepalLicenseNumber(licenseNum);
        console.log('✓ License number extracted:', data.licenseNumber);
        break;
      }
    }
  }
  
  // Enhanced name extraction - look for "Name:" pattern more precisely
  const namePatterns = [
    /Name\s*[:\-]\s*([A-Z][A-Za-z\s]{2,30})(?:\s+Address|$)/i,
    /Name\s*[:\-]\s*([A-Z][A-Za-z\s]{2,30})\s*$/i,
    /^([A-Z][A-Za-z]+\s+[A-Z][A-Za-z]+)(?:\s+Address|$)/m
  ];
  
  for (const pattern of namePatterns) {
    const match = fullText.match(pattern);
    if (match && match[1]) {
      const name = match[1].trim().replace(/\s+/g, ' ');
      if (name.length >= 3 && name.length <= 50 && /^[A-Za-z\s]+$/.test(name)) {
        data.holderName = name;
        console.log('✓ Holder name extracted:', data.holderName);
        break;
      }
    }
  }
  
  // Enhanced date extraction - look for specific date patterns near keywords
  const datePatterns = [
    { field: 'issueDate', patterns: [
      /D\.?O\.?I\.?\s*[:\-]?\s*(\d{1,2}[-\/]\d{1,2}[-\/]\d{4})/i,
      /Issue.*Date\s*[:\-]?\s*(\d{1,2}[-\/]\d{1,2}[-\/]\d{4})/i,
      /(\d{1,2}[-\/]\d{1,2}[-\/]\d{4})\s*(?:D\.?O\.?E|Expiry)/i, // Date before expiry
    ]},
    { field: 'expiryDate', patterns: [
      /D\.?O\.?E\.?\s*[:\-]?\s*(\d{1,2}[-\/]\d{1,2}[-\/]\d{4})/i,
      /Expiry.*Date\s*[:\-]?\s*(\d{1,2}[-\/]\d{1,2}[-\/]\d{4})/i,
      /Valid.*Till\s*[:\-]?\s*(\d{1,2}[-\/]\d{1,2}[-\/]\d{4})/i,
      /(\d{1,2}[-\/]\d{1,2}[-\/]\d{4})\s*(?:Phone|Category|$)/i, // Date before phone/category
    ]},
    { field: 'dateOfBirth', patterns: [
      /D\.?O\.?B\.?\s*[:\-]?\s*(\d{1,2}[-\/]\d{1,2}[-\/]\d{4})/i,
      /Birth.*Date\s*[:\-]?\s*(\d{1,2}[-\/]\d{1,2}[-\/]\d{4})/i,
    ]}
  ];
  
  for (const { field, patterns } of datePatterns) {
    for (const pattern of patterns) {
      const match = fullText.match(pattern);
      if (match && match[1]) {
        const dateStr = match[1];
        const isoDate = convertNepalDateToISO(dateStr);
        if (isoDate && isoDate !== dateStr) { // Valid conversion
          (data as any)[field] = isoDate;
          console.log(`✓ ${field} extracted:`, isoDate);
          break;
        }
      }
    }
    if ((data as any)[field]) break;
  }
  
  // Enhanced Father/Husband name extraction
  const fatherHusbandPatterns = [
    /F\/H\s*Name\s*[:\-]?\s*([A-Z][A-Za-z\s]{2,30})(?:\s+Citizenship|$)/i,
    /Father.*Name\s*[:\-]?\s*([A-Z][A-Za-z\s]{2,30})(?:\s+Citizenship|$)/i,
    /Husband.*Name\s*[:\-]?\s*([A-Z][A-Za-z\s]{2,30})(?:\s+Citizenship|$)/i,
  ];
  
  for (const pattern of fatherHusbandPatterns) {
    const match = fullText.match(pattern);
    if (match && match[1]) {
      const name = match[1].trim().replace(/\s+/g, ' ');
      if (name.length >= 3 && name.length <= 50 && /^[A-Za-z\s]+$/.test(name) && !name.includes('Citizenship')) {
        data.fatherOrHusbandName = name;
        console.log('✓ Father/Husband name extracted:', data.fatherOrHusbandName);
        break;
      }
    }
  }
  
  // Enhanced address extraction
  const addressPatterns = [
    /Address\s*[:\-]?\s*([A-Za-z0-9\-,\s]{5,50})(?:\s+(?:D\.O\.B|DOB|F\/H|Father|Husband))/i,
    /Address\s*[:\-]?\s*([A-Za-z0-9\-,\s]{5,50})\s*$/i,
  ];
  
  for (const pattern of addressPatterns) {
    const match = fullText.match(pattern);
    if (match && match[1]) {
      const address = match[1].trim().replace(/\s+/g, ' ');
      if (address.length >= 5) {
        data.address = address;
        console.log('✓ Address extracted:', data.address);
        break;
      }
    }
  }
  
  // Enhanced citizenship number extraction
  const citizenshipPatterns = [
    /Citizenship\s*No\.?\s*[:\-]?\s*(\d{2}-\d{2}-\d{2}-\d{5})/i,
    /(\d{2}-\d{2}-\d{2}-\d{5})/g,
    /Citizenship\s*No\.?\s*[:\-]?\s*(\d{10,15})/i,
  ];
  
  for (const pattern of citizenshipPatterns) {
    const match = fullText.match(pattern);
    if (match && match[1]) {
      const citizenship = match[1];
      if (/^\d{2}-\d{2}-\d{2}-\d{5}$/.test(citizenship) || /^\d{10,15}$/.test(citizenship)) {
        data.citizenshipNo = citizenship;
        console.log('✓ Citizenship number extracted:', data.citizenshipNo);
        break;
      }
    }
  }
  
  // Enhanced phone number extraction
  const phonePatterns = [
    /Phone\s*No\.?\s*[:\-]?\s*(\d{10})/i,
    /Mobile\s*[:\-]?\s*(\d{10})/i,
    /(98\d{8})/g,
    /(\d{10})(?!\d)/g, // 10 digit standalone
  ];
  
  for (const pattern of phonePatterns) {
    const match = fullText.match(pattern);
    if (match && match[1]) {
      const phone = match[1];
      if (/^\d{10}$/.test(phone)) {
        data.phoneNo = phone;
        console.log('✓ Phone number extracted:', data.phoneNo);
        break;
      }
    }
  }
  
  // Enhanced blood group extraction
  const bloodPatterns = [
    /B\.?G\.?\s*[:\-]?\s*([ABO]{1,2}[+-])/i,
    /Blood\s*Group\s*[:\-]?\s*([ABO]{1,2}[+-])/i,
    /([ABO]{1,2}[+-])(?!\w)/g,
  ];
  
  for (const pattern of bloodPatterns) {
    const match = fullText.match(pattern);
    if (match && match[1]) {
      const bloodGroup = match[1].toUpperCase();
      if (['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].includes(bloodGroup)) {
        data.bloodGroup = bloodGroup as any;
        console.log('✓ Blood group extracted:', data.bloodGroup);
        break;
      }
    }
  }
  
  // Enhanced category extraction
  const categoryPatterns = [
    /Category\s*[:\-]?\s*([A-Z]+)/i,
    /Class\s*[:\-]?\s*([A-Z]+)/i,
    /([A-Z])\s*(?:Category|Class)/i,
  ];
  
  for (const pattern of categoryPatterns) {
    const match = fullText.match(pattern);
    if (match && match[1]) {
      const category = match[1].toUpperCase();
      if (/^[A-Z]{1,3}$/.test(category)) {
        data.category = category;
        console.log('✓ Category extracted:', data.category);
        break;
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
  console.log('Converting date:', dateString);
  
  // Handle various Nepal date formats
  const isoMatch = dateString.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return dateString; // Already in ISO format
  }
  
  // Handle DD-MM-YYYY format (common in Nepal licenses)
  const ddmmMatch = dateString.match(/(\d{1,2})-(\d{1,2})-(\d{4})/);
  if (ddmmMatch) {
    const [, day, month, year] = ddmmMatch;
    const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    console.log('Converted DD-MM-YYYY to ISO:', isoDate);
    return isoDate;
  }
  
  // Handle DD/MM/YYYY format
  const slashMatch = dateString.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (slashMatch) {
    const [, day, month, year] = slashMatch;
    const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    console.log('Converted DD/MM/YYYY to ISO:', isoDate);
    return isoDate;
  }
  
  console.log('Could not convert date format:', dateString);
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
