
import { createWorker, PSM } from 'tesseract.js';
import { LicenseData } from '@/types/license';

export const extractLicenseInfo = (text: string): Partial<LicenseData> => {
  console.log('Raw OCR text:', text);
  
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  const extracted: Partial<LicenseData> = {};

  console.log('Processed lines:', lines);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const upperLine = line.toUpperCase();
    
    // Enhanced license number patterns for Nepal
    // Look for patterns like "4203055074", "NP-12-345-678", etc.
    const licensePatterns = [
      /\b\d{10}\b/, // 10 digits
      /\b[A-Z]{2}[-\s]?\d{2}[-\s]?\d{3}[-\s]?\d{3}\b/, // NP-12-345-678
      /\bLIC\s*NO[\s:]*([A-Z0-9\-\s]+)/i,
      /\bLICEN[CS]E\s*NO[\s:]*([A-Z0-9\-\s]+)/i
    ];

    for (const pattern of licensePatterns) {
      const match = line.match(pattern);
      if (match) {
        const potential = match[1] || match[0];
        if (potential.replace(/\D/g, '').length >= 8) {
          extracted.licenseNumber = potential.trim().toUpperCase();
          console.log('Found license number:', extracted.licenseNumber);
          break;
        }
      }
    }

    // Enhanced name extraction - look for full name patterns
    if (upperLine.includes('NAME') || upperLine.includes('NM')) {
      const nameMatch = line.match(/(?:NAME|NM)[\s:]*(.+)/i);
      if (nameMatch) {
        extracted.holderName = nameMatch[1].trim();
        console.log('Found name from label:', extracted.holderName);
      }
    }

    // Look for capitalized names (common in licenses)
    if (line.match(/^[A-Z][a-z]+ [A-Z][a-z]+/) && 
        !upperLine.includes('NEPAL') && 
        !upperLine.includes('GOVERNMENT') &&
        !upperLine.includes('LICENSE') &&
        !upperLine.includes('CATEGORY')) {
      if (!extracted.holderName || line.length > (extracted.holderName?.length || 0)) {
        extracted.holderName = line.trim();
        console.log('Found capitalized name:', extracted.holderName);
      }
    }

    // Enhanced date extraction
    const datePatterns = [
      /\b(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})\b/, // YYYY-MM-DD or YYYY/MM/DD
      /\b(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})\b/, // DD-MM-YYYY or MM/DD/YYYY
      /\bD\.O\.I[\s:]*(\d{4}[-\/]\d{1,2}[-\/]\d{1,2})/i, // D.O.I: date
      /\bD\.O\.E[\s:]*(\d{4}[-\/]\d{1,2}[-\/]\d{1,2})/i, // D.O.E: date
    ];

    for (const pattern of datePatterns) {
      const dateMatch = line.match(pattern);
      if (dateMatch) {
        let year, month, day;
        
        if (dateMatch[1].length === 4) {
          // YYYY-MM-DD format
          [, year, month, day] = dateMatch;
        } else {
          // DD-MM-YYYY or MM-DD-YYYY format
          if (parseInt(dateMatch[1]) > 12) {
            // DD-MM-YYYY
            [, day, month, year] = dateMatch;
          } else {
            // MM-DD-YYYY
            [, month, day, year] = dateMatch;
          }
        }
        
        const formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        
        if (upperLine.includes('ISSUE') || upperLine.includes('D.O.I') || 
            (i > 0 && lines[i-1].toUpperCase().includes('ISSUE'))) {
          extracted.issueDate = formattedDate;
          console.log('Found issue date:', extracted.issueDate);
        } else if (upperLine.includes('EXPIR') || upperLine.includes('D.O.E') || 
                   (i > 0 && lines[i-1].toUpperCase().includes('EXPIR'))) {
          extracted.expiryDate = formattedDate;
          console.log('Found expiry date:', extracted.expiryDate);
        }
      }
    }

    // Address extraction - look for common address indicators
    if (upperLine.includes('ADDRESS') || upperLine.includes('ADD:')) {
      const addressMatch = line.match(/(?:ADDRESS|ADD:)[\s:]*(.+)/i);
      if (addressMatch) {
        extracted.address = addressMatch[1].trim();
        console.log('Found address from label:', extracted.address);
      }
    }

    // Look for district/location names (common in Nepal addresses)
    if (line.includes('-') && line.length > 15 && line.includes(',')) {
      if (!extracted.address || line.length > (extracted.address?.length || 0)) {
        extracted.address = line.trim();
        console.log('Found potential address:', extracted.address);
      }
    }
  }

  // Fallback: try to extract 10-digit number if no license found
  if (!extracted.licenseNumber) {
    const allNumbers = text.match(/\b\d{10}\b/g);
    if (allNumbers && allNumbers.length > 0) {
      extracted.licenseNumber = allNumbers[0];
      console.log('Found fallback license number:', extracted.licenseNumber);
    }
  }

  console.log('Final extracted data:', extracted);
  return extracted;
};

export const processImageWithOCR = async (
  file: File,
  onProgress: (step: string) => void
): Promise<Partial<LicenseData>> => {
  onProgress('Initializing OCR...');

  const worker = await createWorker(['eng', 'nep'], 1, {
    logger: m => {
      if (m.status === 'recognizing text') {
        onProgress(`Processing... ${Math.round(m.progress * 100)}%`);
      }
    }
  });
  
  onProgress('Analyzing license image...');
  
  // Configure Tesseract for better accuracy - use PSM.SINGLE_BLOCK directly
  await worker.setParameters({
    tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-.,: /',
    tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
  });

  const { data: { text } } = await worker.recognize(file);
  
  onProgress('Extracting license information...');
  const extractedData = extractLicenseInfo(text);
  
  await worker.terminate();
  
  return extractedData;
};
