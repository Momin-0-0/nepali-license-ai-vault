
import Tesseract from 'tesseract.js';
import { LicenseData } from '@/types/license';

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

      await worker.setParameters({
        tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz -.,/:()',
        tessedit_pageseg_mode: Tesseract.PSM.AUTO,
        preserve_interword_spaces: '1'
      });

      onProgress?.('Analyzing license image...');

      const { data: { text } } = await worker.recognize(imageFile);
      
      console.log('Raw OCR text:', text);
      
      onProgress?.('Extracting license information...');

      const extractedData = extractLicenseDataEnhanced(text);
      
      console.log('Enhanced OCR processing started...');
      console.log('Preprocessed text:', text.replace(/\s+/g, ' ').trim());
      
      onProgress?.('Validating extracted data...');

      const validatedData = validateAndCleanData(extractedData);
      
      console.log('Enhanced extraction completed:', validatedData);
      console.log(`✓ Extraction complete: ${Object.keys(validatedData).length} fields automatically filled`);

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

const extractLicenseDataEnhanced = (text: string): Partial<LicenseData> => {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  const cleanText = text.replace(/\s+/g, ' ').trim();
  
  const extractedData: Partial<LicenseData> = {};

  // Extract license number with improved patterns
  extractedData.licenseNumber = extractLicenseNumberEnhanced(cleanText, lines);
  
  // Extract holder name with better logic
  extractedData.holderName = extractHolderNameEnhanced(cleanText, lines);
  
  // Extract dates with enhanced pattern matching
  const dates = extractDatesEnhanced(cleanText, lines);
  extractedData.issueDate = dates.issueDate;
  extractedData.expiryDate = dates.expiryDate;
  
  // Extract issuing authority
  extractedData.issuingAuthority = extractIssuingAuthorityEnhanced(cleanText, lines);
  
  // Extract address
  extractedData.address = extractAddressEnhanced(cleanText, lines);

  return extractedData;
};

const extractLicenseNumberEnhanced = (text: string, lines: string[]): string => {
  // Enhanced patterns for Nepal license numbers
  const patterns = [
    /(\d{2}[\s\-]?\d{2}[\s\-]?\d{9})/g,
    /(\d{2}[\s\-]?\d{2}[\s\-]?\d{8})/g,
    /(\d{11,13})/g,
    /([0-9]{2}[^0-9]*[0-9]{2}[^0-9]*[0-9]{7,9})/g
  ];

  for (const pattern of patterns) {
    const matches = text.match(pattern);
    if (matches) {
      for (const match of matches) {
        const numbers = match.replace(/[^\d]/g, '');
        if (numbers.length >= 9 && numbers.length <= 13) {
          // Format as standard Nepal license
          if (numbers.length >= 11) {
            const formatted = `${numbers.substring(0, 2)}-${numbers.substring(2, 4)}-${numbers.substring(4)}`;
            console.log('✓ License number extracted:', formatted);
            return formatted;
          }
          console.log('✓ License number extracted:', numbers);
          return numbers;
        }
      }
    }
  }

  // Look for sequences of numbers that might be license numbers
  const allNumbers = text.match(/\d+/g);
  if (allNumbers) {
    for (const num of allNumbers) {
      if (num.length >= 9 && num.length <= 13) {
        const formatted = num.length >= 11 ? 
          `${num.substring(0, 2)}-${num.substring(2, 4)}-${num.substring(4)}` : num;
        console.log('✓ License number found in number sequence:', formatted);
        return formatted;
      }
    }
  }

  return '';
};

const extractHolderNameEnhanced = (text: string, lines: string[]): string => {
  // Look for common name patterns in Nepal licenses
  const namePatterns = [
    /Name[:\s]+([A-Za-z\s.'-]+)/i,
    /([A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/g,
    /([A-Z][A-Z\s]+)/g
  ];

  for (const pattern of namePatterns) {
    const matches = text.match(pattern);
    if (matches) {
      for (const match of matches) {
        const name = match.replace(/Name[:\s]*/i, '').trim();
        if (name.length >= 4 && name.length <= 50 && /^[A-Za-z\s.'-]+$/.test(name)) {
          // Filter out common non-name words
          const nonNameWords = ['GOVERNMENT', 'NEPAL', 'LICENSE', 'DRIVING', 'TRANSPORT', 'DEPARTMENT', 'MANAGEMENT'];
          if (!nonNameWords.some(word => name.toUpperCase().includes(word))) {
            console.log('✓ Holder name extracted:', name);
            return name;
          }
        }
      }
    }
  }

  // Look for capitalized words that could be names
  const words = text.split(/\s+/);
  const capitalizedWords = words.filter(word => 
    /^[A-Z][a-z]+$/.test(word) && 
    word.length > 2 && 
    !['License', 'Nepal', 'Government', 'Department', 'Transport'].includes(word)
  );

  if (capitalizedWords.length >= 2) {
    const name = capitalizedWords.slice(0, 3).join(' ');
    console.log('✓ Name extracted from capitalized words:', name);
    return name;
  }

  return '';
};

const extractDatesEnhanced = (text: string, lines: string[]): { issueDate?: string; expiryDate?: string } => {
  const dates: { issueDate?: string; expiryDate?: string } = {};
  
  // Enhanced date patterns
  const datePatterns = [
    /(\d{1,2}[-\/]\d{1,2}[-\/]\d{4})/g,
    /(\d{4}[-\/]\d{1,2}[-\/]\d{1,2})/g,
    /(\d{1,2}\s+\d{1,2}\s+\d{4})/g
  ];

  const foundDates: string[] = [];
  
  for (const pattern of datePatterns) {
    const matches = text.match(pattern);
    if (matches) {
      foundDates.push(...matches);
    }
  }

  // Convert and validate dates
  const validDates = foundDates
    .map(dateStr => {
      const converted = convertToISODate(dateStr);
      const date = new Date(converted);
      return !isNaN(date.getTime()) && date.getFullYear() > 1990 && date.getFullYear() < 2050 
        ? { original: dateStr, iso: converted, date } 
        : null;
    })
    .filter(Boolean)
    .sort((a, b) => a!.date.getTime() - b!.date.getTime());

  if (validDates.length >= 2) {
    dates.issueDate = validDates[0]!.iso;
    dates.expiryDate = validDates[validDates.length - 1]!.iso;
    console.log('✓ Dates extracted - Issue:', dates.issueDate, 'Expiry:', dates.expiryDate);
  } else if (validDates.length === 1) {
    // Assume single date is expiry date
    dates.expiryDate = validDates[0]!.iso;
    console.log('✓ Single date extracted as expiry:', dates.expiryDate);
  }

  return dates;
};

const convertToISODate = (dateString: string): string => {
  const cleanDate = dateString.replace(/\s+/g, '-');
  const parts = cleanDate.split(/[-\/]/);
  
  if (parts.length === 3) {
    let [first, second, third] = parts;
    
    // Determine if it's DD-MM-YYYY or YYYY-MM-DD
    if (third.length === 4) {
      // DD-MM-YYYY format
      return `${third}-${second.padStart(2, '0')}-${first.padStart(2, '0')}`;
    } else if (first.length === 4) {
      // YYYY-MM-DD format
      return `${first}-${second.padStart(2, '0')}-${third.padStart(2, '0')}`;
    }
  }
  
  return dateString;
};

const extractIssuingAuthorityEnhanced = (text: string, lines: string[]): string => {
  // Default Nepal authority
  const defaultAuthority = 'Department of Transport Management, Government of Nepal';
  
  // Look for government-related text
  const govPatterns = [
    /Department[^.]*Transport[^.]*Management/i,
    /Government[^.]*Nepal/i,
    /Transport[^.]*Department/i
  ];

  for (const pattern of govPatterns) {
    const match = text.match(pattern);
    if (match) {
      console.log('✓ Issuing authority found in text:', match[0]);
      return match[0].trim();
    }
  }

  console.log('✓ Issuing authority set for Nepal');
  return defaultAuthority;
};

const extractAddressEnhanced = (text: string, lines: string[]): string => {
  // Look for address patterns
  const addressPatterns = [
    /Address[:\s]+([^.]+)/i,
    /([A-Za-z\s,\-]+(?:Nepal|Kathmandu|Pokhara|Chitwan)[A-Za-z\s,\-]*)/i
  ];

  for (const pattern of addressPatterns) {
    const match = text.match(pattern);
    if (match) {
      const address = match[1] || match[0];
      if (address.length > 10 && address.length < 200) {
        console.log('✓ Address extracted:', address.trim());
        return address.trim();
      }
    }
  }

  // Look for location names
  const locationWords = ['Kathmandu', 'Pokhara', 'Chitwan', 'Lalitpur', 'Bhaktapur', 'Nepal'];
  for (const line of lines) {
    if (locationWords.some(loc => line.includes(loc)) && line.length > 5) {
      console.log('✓ Address found by location:', line);
      return line;
    }
  }

  return '';
};

const validateAndCleanData = (data: Partial<LicenseData>): Partial<LicenseData> => {
  const cleaned: Partial<LicenseData> = {};

  // Validate license number
  if (data.licenseNumber && data.licenseNumber.length >= 9) {
    cleaned.licenseNumber = data.licenseNumber.trim();
  }

  // Validate name
  if (data.holderName && data.holderName.length >= 2 && /^[A-Za-z\s.'-]+$/.test(data.holderName)) {
    cleaned.holderName = data.holderName.trim();
  }

  // Validate dates
  if (data.issueDate) {
    const date = new Date(data.issueDate);
    if (!isNaN(date.getTime())) {
      cleaned.issueDate = data.issueDate;
    }
  }

  if (data.expiryDate) {
    const date = new Date(data.expiryDate);
    if (!isNaN(date.getTime())) {
      cleaned.expiryDate = data.expiryDate;
    }
  }

  // Always include issuing authority
  if (data.issuingAuthority) {
    cleaned.issuingAuthority = data.issuingAuthority.trim();
  }

  // Validate address
  if (data.address && data.address.length >= 5) {
    cleaned.address = data.address.trim();
  }

  return cleaned;
};

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
        canvas.width = img.width;
        canvas.height = img.height;

        // Apply image enhancements
        ctx.filter = 'contrast(1.3) brightness(1.2) saturate(0.8)';
        ctx.drawImage(img, 0, 0);

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
