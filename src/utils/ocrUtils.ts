import { createWorker, PSM } from 'tesseract.js';
import { LicenseData } from '@/types/license';

export const preprocessText = (text: string): string => {
  return text
    .replace(/[|]/g, 'I') // Replace pipes with I
    .replace(/[0O]/g, '0') // Normalize O and 0
    .replace(/[1Il]/g, '1') // Normalize 1, I, l
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
};

export const extractNepalLicenseInfo = (text: string): Partial<LicenseData> => {
  console.log('Raw OCR text:', text);
  
  const preprocessedText = preprocessText(text);
  const lines = preprocessedText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  const extracted: Partial<LicenseData> = {};
  const allText = preprocessedText.replace(/\n/g, ' ').toUpperCase();

  console.log('Preprocessed text:', preprocessedText);
  console.log('Processed lines:', lines);

  // Enhanced license number patterns specifically for Nepal
  const nepalLicensePatterns = [
    // Standard Nepal format: 03-06-041605052
    /\b(\d{2}[-\s]?\d{2}[-\s]?\d{9})\b/g,
    
    // Alternative Nepal formats
    /\b(\d{2}[-\s]?\d{2}[-\s]?\d{8})\b/g,
    /\b(\d{2}[-\s]?\d{2}[-\s]?\d{7})\b/g,
    
    // DL.NO: format
    /(?:DL\.?\s*NO\.?|LICENSE\s*NO\.?|LICENCE\s*NO\.?)[\s:]*(\d{2}[-\s]?\d{2}[-\s]?\d{7,9})/gi,
    
    // Numeric only patterns (11-13 digits)
    /\b(\d{11,13})\b/g,
    
    // With B.G. prefix (Blood Group context)
    /B\.G\.[\s:]*[A-Z+\-]*[\s]*(\d{2}[-\s]?\d{2}[-\s]?\d{7,9})/gi,
  ];

  // Extract license number with Nepal-specific validation
  for (const pattern of nepalLicensePatterns) {
    const matches = [...preprocessedText.matchAll(pattern)];
    for (const match of matches) {
      let potential = (match[1] || match[0]).trim().replace(/\s+/g, '').toUpperCase();
      
      // Clean up common OCR errors
      potential = potential
        .replace(/[|]/g, '1')
        .replace(/[O]/g, '0')
        .replace(/[S]/g, '5')
        .replace(/[Z]/g, '2')
        .replace(/[B]/g, '8');
      
      // Validate Nepal license number format
      if (potential.length >= 9 && 
          potential.length <= 13 &&
          /^\d+$/.test(potential.replace(/[-\s]/g, '')) &&
          !potential.includes('FORM') && 
          !potential.includes('RULE') &&
          !potential.includes('GOVERNMENT') &&
          !potential.includes('NEPAL')) {
        
        // Format as Nepal standard: XX-XX-XXXXXXXXX
        if (potential.length >= 11) {
          const digits = potential.replace(/[-\s]/g, '');
          if (digits.length >= 11) {
            extracted.licenseNumber = `${digits.substring(0, 2)}-${digits.substring(2, 4)}-${digits.substring(4)}`;
            console.log('Found Nepal license number:', extracted.licenseNumber);
            break;
          }
        }
      }
    }
    if (extracted.licenseNumber) break;
  }

  // Enhanced name extraction for Nepal licenses
  const namePatterns = [
    // Name: format
    /(?:Name|नाम)[\s:]+([A-Za-z\s]+?)(?:\n|Address|ठेगाना|D\.O\.B|जन्म|Category|श्रेणी|$)/gi,
    
    // Direct name patterns (common Nepal names)
    /\b([A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/g,
    
    // After "Name:" or similar
    /(?:Name|नाम)[\s:]*([A-Z][a-zA-Z\s]+?)(?:\s*(?:Address|ठेगाना|D\.O\.B|Category))/gi,
  ];

  for (const pattern of namePatterns) {
    const matches = [...preprocessedText.matchAll(pattern)];
    for (const match of matches) {
      const potential = (match[1] || match[0]).trim();
      
      // Validate name for Nepal context
      if (potential.length > 3 && 
          potential.length < 50 &&
          !/\d/.test(potential) && // No numbers
          !potential.includes('GOVERNMENT') && 
          !potential.includes('NEPAL') &&
          !potential.includes('LICENSE') &&
          !potential.includes('DRIVING') &&
          !potential.includes('CATEGORY') &&
          !potential.includes('ADDRESS') &&
          !potential.includes('BLOOD') &&
          !potential.includes('GROUP') &&
          potential !== 'NAME' &&
          /^[A-Za-z\s\.]+$/.test(potential)) {
        extracted.holderName = potential;
        console.log('Found name:', extracted.holderName);
        break;
      }
    }
    if (extracted.holderName) break;
  }

  // Enhanced date extraction for Nepal format (DD-MM-YYYY)
  const datePatterns = [
    // Nepal date format: DD-MM-YYYY
    /\b(\d{1,2}[-\/]\d{1,2}[-\/]\d{4})\b/g,
    /\b(\d{1,2}[-\/]\d{1,2}[-\/]\d{2})\b/g,
    
    // With keywords
    /(?:D\.O\.B|DOB|जन्म|Date\s*of\s*Birth)[\s:]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/gi,
    /(?:DOI|Date\s*of\s*Issue|जारी\s*मिति)[\s:]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/gi,
    /(?:DOE|Date\s*of\s*Expiry|म्याद\s*सकिने)[\s:]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/gi,
    
    // From the license format: 21-02-2028 and 22-02-2023
    /(?:21|22|23|24|25|26|27|28|29|30)[-\/](0[1-9]|1[0-2])[-\/](20\d{2})/g,
  ];

  const foundDates: Array<{date: string, type: 'issue' | 'expiry' | 'birth' | 'unknown', context: string}> = [];

  for (const pattern of datePatterns) {
    const matches = [...preprocessedText.matchAll(pattern)];
    for (const match of matches) {
      const dateStr = match[1] || match[0];
      const context = match.input?.substring(Math.max(0, match.index! - 30), match.index! + 50).toUpperCase() || '';
      
      // Parse and validate date (Nepal format: DD-MM-YYYY)
      const parts = dateStr.split(/[-\/]/);
      if (parts.length === 3) {
        let day, month, year;
        
        // Handle 2-digit years
        if (parts[2].length === 2) {
          const yearNum = parseInt(parts[2]);
          year = yearNum > 50 ? '19' + parts[2] : '20' + parts[2];
        } else {
          year = parts[2];
        }
        
        // Nepal format is DD-MM-YYYY
        day = parts[0].padStart(2, '0');
        month = parts[1].padStart(2, '0');
        
        const formattedDate = `${year}-${month}-${day}`;
        
        // Validate date
        const dateObj = new Date(formattedDate);
        if (!isNaN(dateObj.getTime()) && 
            dateObj.getFullYear() >= 1950 && 
            dateObj.getFullYear() <= 2050) {
          
          let type: 'issue' | 'expiry' | 'birth' | 'unknown' = 'unknown';
          
          if (context.includes('DOB') || context.includes('BIRTH') || context.includes('जन्म')) {
            type = 'birth';
          } else if (context.includes('DOI') || context.includes('ISSUE') || context.includes('जारी')) {
            type = 'issue';
          } else if (context.includes('DOE') || context.includes('EXPIRY') || context.includes('म्याद')) {
            type = 'expiry';
          } else {
            // Guess based on year - recent dates likely issue, future dates likely expiry
            const currentYear = new Date().getFullYear();
            const dateYear = parseInt(year);
            if (dateYear > currentYear) {
              type = 'expiry';
            } else if (dateYear >= currentYear - 10) {
              type = 'issue';
            }
          }
          
          foundDates.push({ date: formattedDate, type, context });
        }
      }
    }
  }

  // Assign dates based on context and logic
  const issueDates = foundDates.filter(d => d.type === 'issue');
  const expiryDates = foundDates.filter(d => d.type === 'expiry');
  const unknownDates = foundDates.filter(d => d.type === 'unknown');

  if (issueDates.length > 0) {
    extracted.issueDate = issueDates[0].date;
    console.log('Found issue date:', extracted.issueDate);
  }

  if (expiryDates.length > 0) {
    extracted.expiryDate = expiryDates[0].date;
    console.log('Found expiry date:', extracted.expiryDate);
  }

  // If we have unknown dates, try to assign them logically
  if (unknownDates.length >= 2 && !extracted.issueDate && !extracted.expiryDate) {
    // Sort dates and assume earlier is issue, later is expiry
    unknownDates.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    extracted.issueDate = unknownDates[0].date;
    extracted.expiryDate = unknownDates[unknownDates.length - 1].date;
    console.log('Assigned dates logically - Issue:', extracted.issueDate, 'Expiry:', extracted.expiryDate);
  }

  // Enhanced address extraction for Nepal
  const addressPatterns = [
    // Address: or ठेगाना: format
    /(?:Address|ठेगाना)[\s:]+([^\n]+?)(?:\n|Phone|फोन|Category|श्रेणी|$)/gi,
    
    // Multi-line address
    /(?:Address|ठेगाना)[\s:]+([^\n]+(?:\n[^\n]+)*?)(?:Phone|Category|$)/gi,
    
    // Common Nepal address patterns
    /([A-Za-z\s]+-\d+,?\s*[A-Za-z\s]+)/g,
  ];

  for (const pattern of addressPatterns) {
    const match = preprocessedText.match(pattern);
    if (match) {
      let address = match[1].trim().replace(/\n/g, ', ');
      
      // Clean up address
      address = address
        .replace(/\s+/g, ' ')
        .replace(/,\s*,/g, ',')
        .trim();
      
      if (address.length > 5 && 
          address.length < 200 &&
          address !== 'ADDRESS' && 
          !address.includes('NUMBERS') &&
          !address.includes('LICENSE') &&
          !address.includes('CATEGORY')) {
        extracted.address = address;
        console.log('Found address:', extracted.address);
        break;
      }
    }
  }

  // Set issuing authority for Nepal
  extracted.issuingAuthority = 'Department of Transport Management, Government of Nepal';

  console.log('Final extracted data:', extracted);
  return extracted;
};

export const processImageWithOCR = async (
  file: File,
  onProgress: (step: string) => void
): Promise<Partial<LicenseData>> => {
  onProgress('Initializing OCR engine for Nepal licenses...');

  const worker = await createWorker(['eng'], 1, {
    logger: m => {
      if (m.status === 'recognizing text') {
        onProgress(`Analyzing Nepal license... ${Math.round(m.progress * 100)}%`);
      }
    }
  });
  
  onProgress('Configuring OCR for Nepal license documents...');
  
  // Configure Tesseract specifically for Nepal license documents
  await worker.setParameters({
    tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-.,: /()[]',
    tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
    preserve_interword_spaces: '1',
    tessedit_do_invert: '0',
    // Enhanced for Nepal license card format
    tessedit_write_images: '0',
    user_defined_dpi: '300',
  });

  onProgress('Processing Nepal license image...');
  const { data: { text } } = await worker.recognize(file);
  
  onProgress('Extracting Nepal license details...');
  const extractedData = extractNepalLicenseInfo(text);
  
  onProgress('Cleaning up...');
  await worker.terminate();
  
  return extractedData;
};

// Legacy function for backward compatibility
export const extractLicenseInfo = extractNepalLicenseInfo;