import { LicenseData } from '@/types/license';
import { WordData, LineData } from './types';
import { validateLicenseData } from '@/utils/dataValidation';

export const extractWithAdvancedPatterns = (text: string): Partial<LicenseData> => {
  const data: Partial<LicenseData> = {};
  const cleanText = text.replace(/\s+/g, ' ').trim();
  
  console.log('🔍 Advanced pattern extraction on text:', cleanText.substring(0, 200));
  
  // Enhanced license number extraction for new format (XX-XX-XXXXXXXX)
  const licensePatterns = [
    // New Nepal format (03-06-01416052)
    /(?:License\s*Number|D\.?L\.?\s*No\.?|License\s*No\.?)\s*[:\-]?\s*(\d{2}[-\s]?\d{2}[-\s]?\d{8})/gi,
    /(\d{2}[-\s]\d{2}[-\s]\d{8})(?=\s|\n|$)/g,
    // Standard Nepal format variations (fallback)
    /(?:D\.?L\.?\s*No\.?|License\s*No\.?|LIC\s*NO)\s*[:\-]?\s*(\d{2}[-\s]?\d{2,3}[-\s]?\d{6,9})/gi,
    /(\d{2}[-\s]\d{2,3}[-\s]\d{6,9})(?=\s|\n|$)/g,
    // Numeric only patterns
    /(?:D\.?L\.?\s*No\.?|License\s*No\.?)\s*[:\-]?\s*(\d{11,13})/gi,
    /^(\d{11,13})$/gm
  ];
  
  for (const pattern of licensePatterns) {
    pattern.lastIndex = 0;
    const matches = [...cleanText.matchAll(pattern)];
    for (const match of matches) {
      const licenseNum = match[1].replace(/\s/g, '');
      if (validateNepalLicenseNumber(licenseNum)) {
        data.licenseNumber = formatNepalLicenseNumber(licenseNum);
        console.log('✅ License number found:', data.licenseNumber);
        break;
      }
    }
    if (data.licenseNumber) break;
  }
  
  // Enhanced name extraction with better context
  const namePatterns = [
    /(?:Name|नाम)\s*[:\-]?\s*([A-Z][a-zA-Z\s]{3,40})(?=\s*(?:Address|ठेगाना|Father|F\/H|DOB|D\.O\.B))/gi,
    /^([A-Z][a-zA-Z]+\s+[A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)(?=\s*\n|\s*Address|\s*Father)/gm,
    /(?:Holder|Bearer)\s*[:\-]?\s*([A-Z][a-zA-Z\s]{3,40})/gi
  ];
  
  for (const pattern of namePatterns) {
    pattern.lastIndex = 0;
    const match = pattern.exec(cleanText);
    if (match && match[1]) {
      const name = match[1].trim().replace(/\s+/g, ' ');
      if (isValidNepalName(name)) {
        data.holderName = name;
        console.log('✅ Holder name found:', data.holderName);
        break;
      }
    }
  }
  
  // Enhanced date extraction with better context awareness
  const dateExtractions = [
    { field: 'issueDate', patterns: [
      /(?:D\.?O\.?I\.?|Issue\s*Date|जारी\s*मिति)\s*[:\-]?\s*(\d{1,2}[-\/]\d{1,2}[-\/]\d{4})/gi,
      /(\d{1,2}[-\/]\d{1,2}[-\/]\d{4})(?=.*(?:D\.?O\.?E|Expiry|समाप्ति))/gi,
      /Issue[d]?\s*[:\-]?\s*(\d{1,2}[-\/]\d{1,2}[-\/]\d{4})/gi
    ]},
    { field: 'expiryDate', patterns: [
      /(?:D\.?O\.?E\.?|Expiry\s*Date|Valid\s*Till|समाप्ति\s*मिति)\s*[:\-]?\s*(\d{1,2}[-\/]\d{1,2}[-\/]\d{4})/gi,
      /(?:Expires?|Valid)\s*[:\-]?\s*(\d{1,2}[-\/]\d{1,2}[-\/]\d{4})/gi,
      /(\d{1,2}[-\/]\d{1,2}[-\/]\d{4})(?=\s*(?:Category|Phone|Blood))/gi
    ]},
    { field: 'dateOfBirth', patterns: [
      /(?:D\.?O\.?B\.?|Birth\s*Date|जन्म\s*मिति)\s*[:\-]?\s*(\d{1,2}[-\/]\d{1,2}[-\/]\d{4})/gi,
      /Born\s*[:\-]?\s*(\d{1,2}[-\/]\d{1,2}[-\/]\d{4})/gi
    ]}
  ];
  
  for (const { field, patterns } of dateExtractions) {
    for (const pattern of patterns) {
      pattern.lastIndex = 0;
      const match = pattern.exec(cleanText);
      if (match && match[1]) {
        const formattedDate = convertNepalDateToISO(match[1]);
        if (formattedDate && /^\d{2}-\d{2}-\d{4}$/.test(formattedDate)) {
          (data as any)[field] = formattedDate;
          console.log(`✅ ${field} found:`, formattedDate);
          break;
        }
      }
    }
    if ((data as any)[field]) break;
  }
  
  // Enhanced address extraction (multi-line aware)
  const addressPatterns = [
    /(?:Address|ठेगाना)\s*[:\-]?\s*([\s\S]{8,120}?)(?=\s*(?:D\.\s*O\.\s*B|DOB|Birth|F\/?H|Father|Husband|Citizenship|Passport|Phone|Category|D\.\s*O\.\s*I|D\.\s*O\.\s*E|Expiry|$))/gi,
    /(?:Address|ठेगाना)\s*[:\-]?\s*([A-Za-z0-9\-,\s]{8,120})\s*$/gmi
  ];
  
  for (const pattern of addressPatterns) {
    pattern.lastIndex = 0;
    const match = pattern.exec(text); // use raw text to preserve newlines
    if (match && match[1]) {
      const address = match[1]
        .replace(/\s*\n\s*/g, ', ')
        .replace(/\s{2,}/g, ' ')
        .replace(/,\s*,/g, ',')
        .trim();
      if (address.length >= 8) {
        data.address = address;
        console.log('✅ Address found:', data.address);
        break;
      }
    }
  }
  
  // Enhanced father/husband name extraction
  const fatherHusbandPatterns = [
    /(?:F\/H\s*Name|Father.*Name|Husband.*Name|बुबा.*नाम)\s*[:\-]?\s*([A-Z][a-zA-Z\s]{3,40})(?=\s*(?:Citizenship|Address|Phone))/gi,
    /(?:Father|Husband)\s*[:\-]?\s*([A-Z][a-zA-Z\s]{3,40})/gi
  ];
  
  for (const pattern of fatherHusbandPatterns) {
    pattern.lastIndex = 0;
    const match = pattern.exec(cleanText);
    if (match && match[1]) {
      const name = match[1].trim().replace(/\s+/g, ' ');
      if (isValidNepalName(name)) {
        data.fatherOrHusbandName = name;
        console.log('✅ Father/Husband name found:', data.fatherOrHusbandName);
        break;
      }
    }
  }
  
  // Enhanced phone number extraction
  const phonePatterns = [
    /(?:Phone|Mobile|Tel)\s*[:\-]?\s*(98\d{8})/gi,
    /(?:Phone|Mobile|Tel)\s*[:\-]?\s*(\d{10})/gi,
    /(98\d{8})(?=\s|\n|$)/g,
    /(\d{10})(?=\s*(?:Blood|Category|$))/g
  ];
  
  for (const pattern of phonePatterns) {
    pattern.lastIndex = 0;
    const match = pattern.exec(cleanText);
    if (match && match[1] && /^\d{10}$/.test(match[1])) {
      data.phoneNo = match[1];
      console.log('✅ Phone number found:', data.phoneNo);
      break;
    }
  }
  
  // Enhanced blood group extraction
  const bloodPatterns = [
    /(?:B\.?G\.?|Blood\s*Group|रक्त\s*समूह)\s*[:\-]?\s*([ABO]{1,2}[+-])/gi,
    /([ABO]{1,2}[+-])(?=\s*(?:Category|Phone|$))/gi
  ];
  
  for (const pattern of bloodPatterns) {
    pattern.lastIndex = 0;
    const match = pattern.exec(cleanText);
    if (match && match[1]) {
      const bloodGroup = match[1].toUpperCase();
      if (['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].includes(bloodGroup)) {
        data.bloodGroup = bloodGroup as any;
        console.log('✅ Blood group found:', data.bloodGroup);
        break;
      }
    }
  }
  
  // Enhanced citizenship number extraction for new format (11 digits)
  const citizenshipPatterns = [
    /(?:Citizenship\s*Number|नागरिकता\s*नं)\s*[:\-]?\s*(\d{11})/gi,
    /(?:Citizenship|नागरिकता)\s*[:\-]?\s*(\d{11})/gi,
    /(\d{11})(?=\s|\n|$)/g,
    // Fallback patterns
    /(?:Citizenship|नागरिकता)\s*[:\-]?\s*(\d{2}[-\s]?\d{2}[-\s]?\d{2}[-\s]?\d{5})/gi,
    /(\d{2}[-\s]\d{2}[-\s]\d{2}[-\s]\d{5})/g
  ];
  
  for (const pattern of citizenshipPatterns) {
    pattern.lastIndex = 0;
    const match = pattern.exec(cleanText);
    if (match && match[1]) {
      const citizenship = match[1].replace(/\s/g, '');
      if (/^\d{10,15}$/.test(citizenship)) {
        data.citizenshipNo = citizenship;
        console.log('✅ Citizenship number found:', data.citizenshipNo);
        break;
      }
    }
  }
  
  // Enhanced category extraction
  const categoryPatterns = [
    /(?:Category|Class|श्रेणी)\s*[:\-]?\s*([A-Z]{1,3})/gi,
    /Vehicle\s*Class\s*[:\-]?\s*([A-Z]{1,3})/gi,
    /([A-Z])\s*(?:Category|Class)/gi
  ];
  
  for (const pattern of categoryPatterns) {
    pattern.lastIndex = 0;
    const match = pattern.exec(cleanText);
    if (match && match[1] && /^[A-Z]{1,3}$/.test(match[1])) {
      data.category = match[1];
      console.log('✅ Category found:', data.category);
      break;
    }
  }
  
  return data;
};

export const extractWithContextualAnalysis = (text: string): Partial<LicenseData> => {
  const data: Partial<LicenseData> = {};
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  console.log('🔍 Contextual analysis on', lines.length, 'lines');
  
  // Analyze line by line with context
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const prevLine = i > 0 ? lines[i - 1] : '';
    const nextLine = i < lines.length - 1 ? lines[i + 1] : '';
    const context = `${prevLine} ${line} ${nextLine}`.toLowerCase();
    
    // License number detection with context
    if (!data.licenseNumber && /license|dl|driving/.test(context)) {
      const licenseMatch = line.match(/(\d{2}[-\s]?\d{2,3}[-\s]?\d{6,9})/);
      if (licenseMatch && validateNepalLicenseNumber(licenseMatch[1])) {
        data.licenseNumber = formatNepalLicenseNumber(licenseMatch[1]);
        console.log('✅ Contextual license number:', data.licenseNumber);
      }
    }
    
    // Name detection with context
    if (!data.holderName && /name|holder|bearer/.test(context)) {
      const nameMatch = line.match(/([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+){1,3})/);
      if (nameMatch && isValidNepalName(nameMatch[1])) {
        data.holderName = nameMatch[1];
        console.log('✅ Contextual holder name:', data.holderName);
      }
    }
    
    // Date detection with context
    const dateMatch = line.match(/(\d{1,2}[-\/]\d{1,2}[-\/]\d{4})/);
    if (dateMatch) {
      const formattedDate = convertNepalDateToISO(dateMatch[1]);
      if (formattedDate && /^\d{2}-\d{2}-\d{4}$/.test(formattedDate)) {
        if (!data.issueDate && (/issue|doi|जारी/.test(context) || i < lines.length / 2)) {
          data.issueDate = formattedDate;
          console.log('✅ Contextual issue date:', data.issueDate);
        } else if (!data.expiryDate && (/expiry|doe|valid|समाप्ति/.test(context) || i > lines.length / 2)) {
          data.expiryDate = formattedDate;
          console.log('✅ Contextual expiry date:', data.expiryDate);
        } else if (!data.dateOfBirth && /birth|dob|जन्म/.test(context)) {
          data.dateOfBirth = formattedDate;
          console.log('✅ Contextual birth date:', data.dateOfBirth);
        }
      }
    }
    
    // Address detection with context
    if (!data.address && /address|ठेगाना/.test(context)) {
      const addressMatch = line.match(/([A-Za-z0-9\-,\s]{8,80})/);
      if (addressMatch && addressMatch[1].length >= 8) {
        data.address = addressMatch[1].trim();
        console.log('✅ Contextual address:', data.address);
      }
    }
  }
  
  return data;
};

export const extractFromNepalLicenseLines = (lines: string[]): Partial<LicenseData> => {
  const data: Partial<LicenseData> = {};
  const fullText = lines.join(' ').replace(/\s+/g, ' ');
  
  console.log('Analyzing lines for extraction:', lines);
  
  // Enhanced license number detection with more specific patterns
  const licensePatterns = [
    /D\.?L\.?\s*No\.?\s*[:\-]?\s*(\d{2}-\d{2,3}-\d{6,8})/i,
    /License\s*No\.?\s*[:\-]?\s*(\d{2}-\d{2,3}-\d{6,8})/i,
    /(\d{2}-\d{2,3}-\d{6,8})(?!\d)/g,
    /(\d{11,13})(?!\d)/g
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
  
  // Enhanced name extraction
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
  
  // Enhanced date extraction
  const datePatterns = [
    { field: 'issueDate', patterns: [
      /D\.?O\.?I\.?\s*[:\-]?\s*(\d{1,2}[-\/]\d{1,2}[-\/]\d{4})/i,
      /Issue.*Date\s*[:\-]?\s*(\d{1,2}[-\/]\d{1,2}[-\/]\d{4})/i,
      /(\d{1,2}[-\/]\d{1,2}[-\/]\d{4})\s*(?:D\.?O\.?E|Expiry)/i,
    ]},
    { field: 'expiryDate', patterns: [
      /D\.?O\.?E\.?\s*[:\-]?\s*(\d{1,2}[-\/]\d{1,2}[-\/]\d{4})/i,
      /Expiry.*Date\s*[:\-]?\s*(\d{1,2}[-\/]\d{1,2}[-\/]\d{4})/i,
      /Valid.*Till\s*[:\-]?\s*(\d{1,2}[-\/]\d{1,2}[-\/]\d{4})/i,
      /(\d{1,2}[-\/]\d{1,2}[-\/]\d{4})\s*(?:Phone|Category|$)/i,
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
        if (isoDate && isoDate !== dateStr) {
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

export const formatNepalLicenseNumber = (licenseNumber: string): string => {
  const cleaned = licenseNumber.replace(/[-\s]/g, '');
  
  if (cleaned.length === 12) {
    return `${cleaned.substring(0, 2)}-${cleaned.substring(2, 4)}-${cleaned.substring(4)}`;
  } else if (cleaned.length === 11) {
    return `${cleaned.substring(0, 2)}-${cleaned.substring(2, 5)}-${cleaned.substring(5)}`;
  }
  
  return licenseNumber;
};

export const validateNepalLicenseNumber = (licenseNumber: string): boolean => {
  const patterns = [
    /^\d{2}-\d{3}-\d{6}$/,
    /^\d{2}-\d{2}-\d{8}$/,
    /^\d{2}-\d{3}-\d{7}$/,
    /^\d{11,12}$/
  ];
  
  return patterns.some(pattern => pattern.test(licenseNumber));
};

export const convertNepalDateToISO = (dateString: string): string => {
  console.log('Converting date:', dateString);
  
  // Check if already in DD-MM-YYYY format (target format)
  const ddmmMatch = dateString.match(/(\d{1,2})-(\d{1,2})-(\d{4})/);
  if (ddmmMatch) {
    const [, day, month, year] = ddmmMatch;
    const formattedDate = `${day.padStart(2, '0')}-${month.padStart(2, '0')}-${year}`;
    console.log('Formatted to DD-MM-YYYY:', formattedDate);
    return formattedDate;
  }
  
  // Convert from slash format to DD-MM-YYYY
  const slashMatch = dateString.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (slashMatch) {
    const [, day, month, year] = slashMatch;
    const formattedDate = `${day.padStart(2, '0')}-${month.padStart(2, '0')}-${year}`;
    console.log('Converted DD/MM/YYYY to DD-MM-YYYY:', formattedDate);
    return formattedDate;
  }
  
  // Convert from ISO format to DD-MM-YYYY
  const isoMatch = dateString.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    const formattedDate = `${day}-${month}-${year}`;
    console.log('Converted ISO to DD-MM-YYYY:', formattedDate);
    return formattedDate;
  }
  
  console.log('Could not convert date format:', dateString);
  return dateString;
};

const isValidNepalName = (name: string): boolean => {
  return /^[A-Za-z\s\.]+$/.test(name) && 
         name.length >= 3 && 
         name.length <= 50 &&
         name.split(' ').length >= 2;
};

export const validateAndCleanupNepalData = (data: Partial<LicenseData>): Partial<LicenseData> => {
  const cleaned: Partial<LicenseData> = {};
  
  if (data.licenseNumber && validateNepalLicenseNumber(data.licenseNumber)) {
    cleaned.licenseNumber = formatNepalLicenseNumber(data.licenseNumber);
  }
  
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
  
  if (data.address && data.address.length >= 5) {
    cleaned.address = data.address.trim();
  }
  
  ['dateOfBirth', 'issueDate', 'expiryDate'].forEach(dateField => {
    const dateValue = data[dateField as keyof LicenseData];
    if (dateValue && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
      (cleaned as any)[dateField] = dateValue;
    }
  });
  
  if (data.citizenshipNo && /^\d{10,15}$/.test(data.citizenshipNo)) {
    cleaned.citizenshipNo = data.citizenshipNo;
  }
  
  if (data.passportNo && /^[A-Z0-9]{8,15}$/.test(data.passportNo)) {
    cleaned.passportNo = data.passportNo;
  }
  
  if (data.phoneNo && /^\d{10}$/.test(data.phoneNo)) {
    cleaned.phoneNo = data.phoneNo;
  }
  
  if (data.bloodGroup && ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].includes(data.bloodGroup)) {
    cleaned.bloodGroup = data.bloodGroup;
  }
  
  ['category', 'issuingAuthority', 'photoUrl', 'signatureUrl'].forEach(field => {
    if (data[field as keyof LicenseData]) {
      (cleaned as any)[field] = data[field as keyof LicenseData];
    }
  });
  
  return cleaned;
};

// Format data to match exact JSON structure
export const formatExtractedData = (data: Partial<LicenseData>) => {
  const formatted: any = {};
  
  if (data.licenseNumber) formatted["License Number"] = data.licenseNumber;
  if (data.holderName) formatted["Name"] = data.holderName;
  if (data.address) formatted["Address"] = data.address;
  if (data.dateOfBirth) formatted["Date of Birth"] = data.dateOfBirth;
  if (data.citizenshipNo) formatted["Citizenship Number"] = data.citizenshipNo;
  if (data.phoneNo) formatted["Phone Number"] = data.phoneNo;
  if (data.bloodGroup) formatted["Blood Group"] = data.bloodGroup;
  if (data.issueDate) formatted["Issue Date"] = data.issueDate;
  if (data.expiryDate) formatted["Expiry Date"] = data.expiryDate;
  if (data.category) formatted["Category"] = data.category;
  
  return formatted;
};
