import Tesseract from 'tesseract.js';
import { LicenseData } from '@/types/license';
import { 
  NEPAL_LICENSE_PATTERNS, 
  NEPAL_DATE_PATTERNS, 
  validateNepalLicenseNumber, 
  parseNepalDate,
  isValidNepalName,
  extractNepalAddress,
  ISSUING_AUTHORITIES
} from './nepalLicensePatterns';

interface OCRProgress {
  status: string;
  progress: number;
}

export const processImageWithOCR = async (
  imageFile: File,
  onProgress?: (progressText: string) => void
): Promise<Partial<LicenseData>> => {
  return new Promise(async (resolve, reject) => {
    try {
      onProgress?.('Initializing OCR engine...');
      
      // Create worker with Nepal-specific configuration
      const worker = await Tesseract.createWorker('eng', 1, {
        logger: (m: OCRProgress) => {
          if (m.status === 'recognizing text') {
            const percentage = Math.round(m.progress * 100);
            onProgress?.(`Processing image... ${percentage}%`);
          } else {
            onProgress?.(m.status);
          }
        }
      });

      // Configure for better license recognition
      await worker.setParameters({
        tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz -.,/',
        tessedit_pageseg_mode: Tesseract.PSM.AUTO,
        preserve_interword_spaces: '1'
      });

      onProgress?.('Analyzing license image...');

      // Process the image
      const { data: { text } } = await worker.recognize(imageFile);
      
      onProgress?.('Extracting license information...');

      // Extract license data using Nepal-specific patterns
      const extractedData = extractLicenseData(text);
      
      onProgress?.('Validating extracted data...');

      // Validate and clean the extracted data
      const validatedData = validateAndCleanData(extractedData);

      await worker.terminate();
      
      onProgress?.('OCR processing complete!');
      
      resolve(validatedData);
    } catch (error) {
      console.error('OCR processing failed:', error);
      onProgress?.('OCR processing failed');
      reject(new Error('Failed to process license image. Please try again or enter details manually.'));
    }
  });
};

const extractLicenseData = (text: string): Partial<LicenseData> => {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  const fullText = text.replace(/\n/g, ' ');
  
  console.log('OCR Text:', text);
  console.log('Lines:', lines);

  const extractedData: Partial<LicenseData> = {};

  // Extract license number using Nepal patterns
  extractedData.licenseNumber = extractLicenseNumber(fullText, lines);
  
  // Extract holder name
  extractedData.holderName = extractHolderName(fullText, lines);
  
  // Extract dates
  const dates = extractDates(fullText, lines);
  extractedData.issueDate = dates.issueDate;
  extractedData.expiryDate = dates.expiryDate;
  
  // Extract issuing authority
  extractedData.issuingAuthority = extractIssuingAuthority(fullText, lines);
  
  // Extract address
  extractedData.address = extractAddress(fullText, lines);

  return extractedData;
};

const extractLicenseNumber = (fullText: string, lines: string[]): string => {
  // Try different patterns for Nepal license numbers
  const patterns = [
    /(\d{2}[-\s]?\d{2}[-\s]?\d{9})/g,
    /(\d{2}[-\s]?\d{2}[-\s]?\d{8})/g,
    /(\d{2}[-\s]?\d{2}[-\s]?\d{7})/g,
    /(\d{11,13})/g
  ];

  for (const pattern of patterns) {
    const matches = fullText.match(pattern);
    if (matches) {
      for (const match of matches) {
        const cleaned = match.replace(/[-\s]/g, '');
        if (cleaned.length >= 9 && cleaned.length <= 13) {
          // Format as Nepal standard
          if (cleaned.length >= 11) {
            return `${cleaned.substring(0, 2)}-${cleaned.substring(2, 4)}-${cleaned.substring(4)}`;
          }
          return match;
        }
      }
    }
  }

  // Look for license number near keywords
  const keywords = ['License', 'Licence', 'No', 'Number', 'DL'];
  for (const line of lines) {
    for (const keyword of keywords) {
      if (line.toLowerCase().includes(keyword.toLowerCase())) {
        const numbers = line.match(/\d{9,}/);
        if (numbers) {
          const num = numbers[0];
          if (num.length >= 11) {
            return `${num.substring(0, 2)}-${num.substring(2, 4)}-${num.substring(4)}`;
          }
          return num;
        }
      }
    }
  }

  return '';
};

const extractHolderName = (fullText: string, lines: string[]): string => {
  // Look for name patterns
  const nameKeywords = ['Name', 'नाम', 'Holder'];
  
  for (const line of lines) {
    for (const keyword of nameKeywords) {
      if (line.toLowerCase().includes(keyword.toLowerCase())) {
        // Extract name after the keyword
        const parts = line.split(new RegExp(keyword, 'i'));
        if (parts.length > 1) {
          const namePart = parts[1].replace(/[:\-\s]+/, ' ').trim();
          if (namePart.length > 2 && /^[A-Za-z\s.'-]+$/.test(namePart)) {
            return namePart;
          }
        }
      }
    }
  }

  // Look for capitalized words that might be names
  for (const line of lines) {
    const words = line.split(' ').filter(word => word.length > 2);
    const capitalizedWords = words.filter(word => 
      /^[A-Z][a-z]+$/.test(word) && 
      !['License', 'Licence', 'Department', 'Transport', 'Management', 'Government', 'Nepal'].includes(word)
    );
    
    if (capitalizedWords.length >= 2) {
      const name = capitalizedWords.slice(0, 4).join(' ');
      if (isValidNepalName(name)) {
        return name;
      }
    }
  }

  return '';
};

const extractDates = (fullText: string, lines: string[]): { issueDate?: string; expiryDate?: string } => {
  const dates: { issueDate?: string; expiryDate?: string } = {};
  
  // Date patterns for Nepal (DD-MM-YYYY, DD/MM/YYYY)
  const datePatterns = [
    /(\d{1,2}[-\/]\d{1,2}[-\/]\d{4})/g,
    /(\d{4}[-\/]\d{1,2}[-\/]\d{1,2})/g
  ];

  const foundDates: string[] = [];
  
  for (const pattern of datePatterns) {
    const matches = fullText.match(pattern);
    if (matches) {
      foundDates.push(...matches);
    }
  }

  // Look for dates near keywords
  const issueKeywords = ['Issue', 'Issued', 'जारी'];
  const expiryKeywords = ['Expiry', 'Expires', 'Valid', 'Until', 'समाप्ति'];

  for (const line of lines) {
    const lineDate = line.match(/\d{1,2}[-\/]\d{1,2}[-\/]\d{4}/);
    if (lineDate) {
      const date = lineDate[0];
      
      // Check if it's near issue keywords
      for (const keyword of issueKeywords) {
        if (line.toLowerCase().includes(keyword.toLowerCase())) {
          dates.issueDate = convertToISODate(date);
          break;
        }
      }
      
      // Check if it's near expiry keywords
      for (const keyword of expiryKeywords) {
        if (line.toLowerCase().includes(keyword.toLowerCase())) {
          dates.expiryDate = convertToISODate(date);
          break;
        }
      }
    }
  }

  // If we have dates but couldn't categorize them, use heuristics
  if (!dates.issueDate && !dates.expiryDate && foundDates.length >= 2) {
    const sortedDates = foundDates
      .map(d => ({ original: d, date: new Date(convertToISODate(d) || d) }))
      .filter(d => !isNaN(d.date.getTime()))
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    if (sortedDates.length >= 2) {
      dates.issueDate = convertToISODate(sortedDates[0].original);
      dates.expiryDate = convertToISODate(sortedDates[sortedDates.length - 1].original);
    }
  }

  return dates;
};

const convertToISODate = (dateString: string): string => {
  // Handle Nepal date formats (DD-MM-YYYY, DD/MM/YYYY)
  const parts = dateString.split(/[-\/]/);
  if (parts.length === 3) {
    const [day, month, year] = parts;
    
    // Check if it's already in ISO format (YYYY-MM-DD)
    if (year.length === 4 && parseInt(year) > 1900) {
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    // Convert from DD-MM-YYYY to YYYY-MM-DD
    if (day.length <= 2 && month.length <= 2 && year.length === 4) {
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
  }
  
  return dateString;
};

const extractIssuingAuthority = (fullText: string, lines: string[]): string => {
  // Look for known Nepal authorities
  for (const authority of ISSUING_AUTHORITIES) {
    if (fullText.toLowerCase().includes(authority.toLowerCase())) {
      return authority;
    }
  }

  // Look for government-related keywords
  const govKeywords = ['Department', 'Transport', 'Management', 'Government', 'Nepal', 'Office'];
  
  for (const line of lines) {
    const hasGovKeywords = govKeywords.some(keyword => 
      line.toLowerCase().includes(keyword.toLowerCase())
    );
    
    if (hasGovKeywords && line.length > 10 && line.length < 100) {
      return line.trim();
    }
  }

  return 'Department of Transport Management';
};

const extractAddress = (fullText: string, lines: string[]): string => {
  // Use the Nepal-specific address extraction
  const address = extractNepalAddress(fullText);
  if (address) {
    return address;
  }

  // Look for address keywords
  const addressKeywords = ['Address', 'ठेगाना', 'Permanent', 'Temporary'];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    for (const keyword of addressKeywords) {
      if (line.toLowerCase().includes(keyword.toLowerCase())) {
        // Get address from this line and potentially next lines
        let address = line.replace(new RegExp(keyword, 'i'), '').replace(/[:\-\s]+/, ' ').trim();
        
        // Include next line if it looks like address continuation
        if (i + 1 < lines.length) {
          const nextLine = lines[i + 1];
          if (nextLine.length > 5 && !nextLine.includes('Phone') && !nextLine.includes('Category')) {
            address += ', ' + nextLine;
          }
        }
        
        if (address.length > 5) {
          return address;
        }
      }
    }
  }

  return '';
};

const validateAndCleanData = (data: Partial<LicenseData>): Partial<LicenseData> => {
  const cleaned: Partial<LicenseData> = {};

  // Validate and clean license number
  if (data.licenseNumber) {
    const validation = validateNepalLicenseNumber(data.licenseNumber);
    if (validation.isValid) {
      cleaned.licenseNumber = data.licenseNumber.trim();
    }
  }

  // Validate and clean name
  if (data.holderName) {
    const name = data.holderName.trim();
    if (name.length >= 2 && name.length <= 100 && /^[A-Za-z\s.'-]+$/.test(name)) {
      cleaned.holderName = name;
    }
  }

  // Validate dates
  if (data.issueDate) {
    const date = new Date(data.issueDate);
    if (!isNaN(date.getTime()) && date.getFullYear() >= 1950) {
      cleaned.issueDate = data.issueDate;
    }
  }

  if (data.expiryDate) {
    const date = new Date(data.expiryDate);
    if (!isNaN(date.getTime()) && date.getFullYear() <= 2050) {
      cleaned.expiryDate = data.expiryDate;
    }
  }

  // Validate issuing authority
  if (data.issuingAuthority) {
    const authority = data.issuingAuthority.trim();
    if (authority.length >= 3 && authority.length <= 200) {
      cleaned.issuingAuthority = authority;
    }
  }

  // Clean address
  if (data.address) {
    const address = data.address.trim();
    if (address.length >= 5 && address.length <= 500) {
      cleaned.address = address;
    }
  }

  return cleaned;
};

// Enhanced OCR preprocessing for better accuracy
export const preprocessImageForOCR = async (imageFile: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }

    img.onload = () => {
      try {
        // Set canvas size
        canvas.width = img.width;
        canvas.height = img.height;

        // Apply image enhancements for better OCR
        ctx.filter = 'contrast(1.2) brightness(1.1)';
        ctx.drawImage(img, 0, 0);

        // Convert back to file
        canvas.toBlob((blob) => {
          if (blob) {
            const enhancedFile = new File([blob], imageFile.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            resolve(enhancedFile);
          } else {
            reject(new Error('Failed to enhance image'));
          }
        }, 'image/jpeg', 0.9);
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(imageFile);
  });
};