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

export const extractLicenseInfo = (text: string): Partial<LicenseData> => {
  console.log('Raw OCR text:', text);
  
  const preprocessedText = preprocessText(text);
  const lines = preprocessedText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  const extracted: Partial<LicenseData> = {};
  const allText = preprocessedText.replace(/\n/g, ' ').toUpperCase();

  console.log('Preprocessed text:', preprocessedText);
  console.log('Processed lines:', lines);

  // Enhanced license number patterns with more variations
  const licensePatterns = [
    // Nepal formats
    /\b(NP[-\s]?\d{2}[-\s]?\d{3}[-\s]?\d{3})\b/gi,
    /\b(NP[-\s]?\d{2}[-\s]?\d{4}[-\s]?\d{7})\b/gi,
    
    // Indian formats
    /\b([A-Z]{2}[-\s]?\d{2}[-\s]?\d{4}[-\s]?\d{7})\b/gi,
    /\b([A-Z]{2}[-\s]?\d{2}[-\s]?\d{3}[-\s]?\d{3})\b/gi,
    
    // Numeric only patterns
    /\b(\d{10,15})\b/g,
    
    // With keywords
    /(?:DL\s*NO|LICENSE\s*NO|LICENCE\s*NO)[\s:]*([A-Z0-9\-\s]{8,20})/gi,
    /(?:DRIVING\s*LICENSE|DRIVING\s*LICENCE)[\s:]*([A-Z0-9\-\s]{8,20})/gi,
  ];

  // Extract license number with better validation
  for (const pattern of licensePatterns) {
    const matches = [...preprocessedText.matchAll(pattern)];
    for (const match of matches) {
      let potential = (match[1] || match[0]).trim().replace(/\s+/g, '').toUpperCase();
      
      // Clean up common OCR errors
      potential = potential
        .replace(/[|]/g, '1')
        .replace(/[O]/g, '0')
        .replace(/[S]/g, '5')
        .replace(/[Z]/g, '2');
      
      // Validate license number format
      if (potential.length >= 8 && 
          !potential.includes('FORM') && 
          !potential.includes('RULE') &&
          !potential.includes('MAHARASHTRA') &&
          !potential.includes('INDIA') &&
          /[A-Z0-9\-]/.test(potential)) {
        extracted.licenseNumber = potential;
        console.log('Found license number:', extracted.licenseNumber);
        break;
      }
    }
    if (extracted.licenseNumber) break;
  }

  // Enhanced name extraction with better patterns
  const namePatterns = [
    // Direct name patterns
    /(?:NAME|HOLDER)[\s:]+([A-Z][a-zA-Z\s]+?)(?:\n|S\/D\/W|Add:|PIN:|DOB:|DL|$)/gi,
    /(?:MR|MS|DR)[\s\.]+([A-Z][a-zA-Z\s]+?)(?:\n|S\/D\/W|Add:|PIN:|DOB:|DL|$)/gi,
    
    // Line-based extraction (names are often on separate lines)
    /^([A-Z][a-zA-Z]+\s+[A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)$/gm,
  ];

  for (const pattern of namePatterns) {
    const matches = [...preprocessedText.matchAll(pattern)];
    for (const match of matches) {
      const potential = (match[1] || match[0]).trim();
      
      // Validate name
      if (potential.length > 3 && 
          potential.length < 50 &&
          !/\d/.test(potential) && // No numbers
          !potential.includes('MAHARASHTRA') && 
          !potential.includes('INDIA') &&
          !potential.includes('LICENCE') &&
          !potential.includes('LICENSE') &&
          !potential.includes('MOTOR') &&
          !potential.includes('STATE') &&
          !potential.includes('FORM') &&
          !potential.includes('RULE') &&
          !potential.includes('SURNAME') &&
          !potential.includes('ADDRESS') &&
          potential !== 'NAME SURNAME' &&
          /^[A-Za-z\s\.]+$/.test(potential)) {
        extracted.holderName = potential;
        console.log('Found name:', extracted.holderName);
        break;
      }
    }
    if (extracted.holderName) break;
  }

  // Enhanced date extraction with multiple formats
  const datePatterns = [
    // With keywords
    /(?:DOI|DATE\s*OF\s*ISSUE)[\s:]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/gi,
    /(?:VALID\s*TILL|EXPIRY|EXPIRES)[\s:]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/gi,
    /(?:DLR|RENEWAL)[\s:]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/gi,
    
    // Standalone dates
    /\b(\d{1,2}[-\/]\d{1,2}[-\/]\d{4})\b/g,
    /\b(\d{1,2}[-\/]\d{1,2}[-\/]\d{2})\b/g,
  ];

  const foundDates: Array<{date: string, type: 'issue' | 'expiry' | 'unknown', context: string}> = [];

  for (const pattern of datePatterns) {
    const matches = [...preprocessedText.matchAll(pattern)];
    for (const match of matches) {
      const dateStr = match[1];
      const context = match.input?.substring(Math.max(0, match.index! - 30), match.index! + 50).toUpperCase() || '';
      
      // Parse and validate date
      const parts = dateStr.split(/[-\/]/);
      if (parts.length === 3) {
        let day, month, year;
        
        // Handle different date formats
        if (parts[2].length === 2) {
          year = parseInt(parts[2]) > 50 ? '19' + parts[2] : '20' + parts[2];
        } else {
          year = parts[2];
        }
        
        // Assume DD/MM/YYYY or MM/DD/YYYY format
        if (parseInt(parts[0]) > 12) {
          // First part is day
          day = parts[0].padStart(2, '0');
          month = parts[1].padStart(2, '0');
        } else if (parseInt(parts[1]) > 12) {
          // Second part is day
          day = parts[1].padStart(2, '0');
          month = parts[0].padStart(2, '0');
        } else {
          // Ambiguous, assume DD/MM format (common in Nepal/India)
          day = parts[0].padStart(2, '0');
          month = parts[1].padStart(2, '0');
        }
        
        const formattedDate = `${year}-${month}-${day}`;
        
        // Validate date
        const dateObj = new Date(formattedDate);
        if (!isNaN(dateObj.getTime()) && 
            dateObj.getFullYear() >= 1950 && 
            dateObj.getFullYear() <= 2050) {
          
          let type: 'issue' | 'expiry' | 'unknown' = 'unknown';
          
          if (context.includes('DOI') || context.includes('ISSUE') || context.includes('DLR')) {
            type = 'issue';
          } else if (context.includes('VALID') || context.includes('TILL') || context.includes('EXPIRY') || context.includes('EXPIRES')) {
            type = 'expiry';
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
  } else if (unknownDates.length === 1) {
    if (!extracted.expiryDate) {
      extracted.expiryDate = unknownDates[0].date;
      console.log('Assigned unknown date as expiry:', extracted.expiryDate);
    } else if (!extracted.issueDate) {
      extracted.issueDate = unknownDates[0].date;
      console.log('Assigned unknown date as issue:', extracted.issueDate);
    }
  }

  // Enhanced address extraction
  const addressPatterns = [
    /(?:ADD|ADDRESS)[\s:]+([^\n]+?)(?:PIN|Signature|DL|$)/gi,
    /(?:ADDR)[\s:]+([^\n]+?)(?:PIN|Signature|DL|$)/gi,
    // Multi-line address
    /(?:ADD|ADDRESS)[\s:]+([^\n]+(?:\n[^\n]+)*?)(?:PIN|Signature|DL|$)/gi,
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
          !address.includes('LICENCE')) {
        extracted.address = address;
        console.log('Found address:', extracted.address);
        break;
      }
    }
  }

  // Set issuing authority based on detected patterns
  if (allText.includes('MAHARASHTRA') || allText.includes('MH-')) {
    extracted.issuingAuthority = 'Maharashtra State Transport Department';
  } else if (allText.includes('NEPAL') || allText.includes('NP-')) {
    extracted.issuingAuthority = 'Department of Transport Management';
  } else if (allText.includes('KARNATAKA') || allText.includes('KA-')) {
    extracted.issuingAuthority = 'Karnataka State Transport Department';
  } else if (allText.includes('DELHI') || allText.includes('DL-')) {
    extracted.issuingAuthority = 'Delhi Transport Department';
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
  
  onProgress('Configuring OCR for license documents...');
  
  // Configure Tesseract for better accuracy with license documents
  await worker.setParameters({
    tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-.,: /()[]',
    tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
    preserve_interword_spaces: '1',
    tessedit_do_invert: '0',
  });

  onProgress('Processing license image...');
  const { data: { text } } = await worker.recognize(file);
  
  onProgress('Extracting license details...');
  const extractedData = extractLicenseInfo(text);
  
  onProgress('Cleaning up...');
  await worker.terminate();
  
  return extractedData;
};