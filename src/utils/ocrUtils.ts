
import { createWorker, PSM } from 'tesseract.js';
import { LicenseData } from '@/types/license';

export const extractLicenseInfo = (text: string): Partial<LicenseData> => {
  console.log('Raw OCR text:', text);
  
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  const extracted: Partial<LicenseData> = {};
  const allText = text.replace(/\n/g, ' ').toUpperCase();

  console.log('Processed lines:', lines);

  // Enhanced license number patterns
  const licensePatterns = [
    /\b([A-Z]{2}[-\s]?\d{2}[-\s]?\d{4}[-\s]?\d{7})\b/g, // MH-03-2012-0123456
    /\b([A-Z]{2}[-\s]?\d{2}[-\s]?\d{3}[-\s]?\d{3})\b/g, // NP-12-345-678
    /\bDL\s*NO[\s:]*([A-Z0-9\-\s]{8,})/gi,
    /\bLICEN[CS]E\s*NO[\s:]*([A-Z0-9\-\s]{8,})/gi,
    /\b(\d{10,15})\b/g // Long numeric sequences
  ];

  // Extract license number
  for (const pattern of licensePatterns) {
    const matches = [...text.matchAll(pattern)];
    for (const match of matches) {
      const potential = (match[1] || match[0]).trim().replace(/\s+/g, '').toUpperCase();
      if (potential.length >= 8 && !potential.includes('FORM') && !potential.includes('RULE')) {
        extracted.licenseNumber = potential;
        console.log('Found license number:', extracted.licenseNumber);
        break;
      }
    }
    if (extracted.licenseNumber) break;
  }

  // Enhanced name extraction
  const namePatterns = [
    /\bNAME[\s:]+([A-Z][a-zA-Z\s]+?)(?:\n|S\/D\/W|Add:|PIN:|DOB:|$)/gi,
    /\b([A-Z][a-zA-Z]+\s+[A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)\b/g
  ];

  for (const pattern of namePatterns) {
    const matches = [...text.matchAll(pattern)];
    for (const match of matches) {
      const potential = (match[1] || match[0]).trim();
      if (potential.length > 3 && 
          !potential.includes('MAHARASHTRA') && 
          !potential.includes('INDIA') &&
          !potential.includes('LICENCE') &&
          !potential.includes('MOTOR') &&
          !potential.includes('STATE') &&
          !potential.includes('FORM') &&
          !potential.includes('RULE') &&
          !potential.includes('SURNAME') &&
          potential !== 'NAME SURNAME') {
        extracted.holderName = potential;
        console.log('Found name:', extracted.holderName);
        break;
      }
    }
    if (extracted.holderName) break;
  }

  // Enhanced date extraction with better validation
  const datePatterns = [
    /\bDOI[\s:]*(\d{2}[-\/]\d{2}[-\/]\d{2,4})/gi,
    /\bVALID\s*TILL[\s:]*(\d{2}[-\/]\d{2}[-\/]\d{2,4})/gi,
    /\bDLR[\s:]*(\d{2}[-\/]\d{2}[-\/]\d{2,4})/gi,
    /\b(\d{2}[-\/]\d{2}[-\/]\d{4})\b/g
  ];

  for (const pattern of datePatterns) {
    const matches = [...text.matchAll(pattern)];
    for (const match of matches) {
      const dateStr = match[1];
      const parts = dateStr.split(/[-\/]/);
      
      if (parts.length === 3) {
        let day, month, year;
        
        // Handle DD-MM-YY or DD-MM-YYYY format
        if (parts[2].length === 2) {
          year = '20' + parts[2]; // Assume 20xx for 2-digit years
        } else {
          year = parts[2];
        }
        
        day = parts[0].padStart(2, '0');
        month = parts[1].padStart(2, '0');
        
        const formattedDate = `${year}-${month}-${day}`;
        
        // Determine if it's issue or expiry date based on context
        const context = match.input?.substring(Math.max(0, match.index! - 50), match.index! + 50).toUpperCase();
        
        if (context?.includes('DOI') || context?.includes('DLR')) {
          extracted.issueDate = formattedDate;
          console.log('Found issue date:', extracted.issueDate);
        } else if (context?.includes('VALID') || context?.includes('TILL')) {
          extracted.expiryDate = formattedDate;
          console.log('Found expiry date:', extracted.expiryDate);
        } else if (!extracted.issueDate) {
          extracted.issueDate = formattedDate;
          console.log('Found date (assumed issue):', extracted.issueDate);
        } else if (!extracted.expiryDate) {
          extracted.expiryDate = formattedDate;
          console.log('Found date (assumed expiry):', extracted.expiryDate);
        }
      }
    }
  }

  // Enhanced address extraction
  const addressPatterns = [
    /\bADD[\s:]+([^\n]+?)(?:PIN:|Signature|$)/gi,
    /\bADDRESS[\s:]+([^\n]+?)(?:PIN:|Signature|$)/gi
  ];

  for (const pattern of addressPatterns) {
    const match = text.match(pattern);
    if (match) {
      const address = match[1].trim();
      if (address.length > 5 && address !== 'ADDRESS' && !address.includes('NUMBERS')) {
        extracted.address = address;
        console.log('Found address:', extracted.address);
        break;
      }
    }
  }

  // Set issuing authority based on detected state
  if (allText.includes('MAHARASHTRA')) {
    extracted.issuingAuthority = 'Maharashtra State Transport Department';
  } else if (allText.includes('NEPAL')) {
    extracted.issuingAuthority = 'Department of Transport Management';
  } else {
    extracted.issuingAuthority = 'Regional Transport Office';
  }

  console.log('Final extracted data:', extracted);
  return extracted;
};

export const processImageWithOCR = async (
  file: File,
  onProgress: (step: string) => void
): Promise<Partial<LicenseData>> => {
  onProgress('Initializing OCR engine...');

  const worker = await createWorker(['eng'], 1, {
    logger: m => {
      if (m.status === 'recognizing text') {
        onProgress(`Analyzing image... ${Math.round(m.progress * 100)}%`);
      }
    }
  });
  
  onProgress('Processing license image...');
  
  // Configure Tesseract for better accuracy with license documents
  await worker.setParameters({
    tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-.,: /()[]',
    tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
    preserve_interword_spaces: '1',
  });

  const { data: { text } } = await worker.recognize(file);
  
  onProgress('Extracting license details...');
  const extractedData = extractLicenseInfo(text);
  
  await worker.terminate();
  
  return extractedData;
};
