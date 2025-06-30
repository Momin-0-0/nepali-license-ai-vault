
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

export const enhancedNepalLicenseExtraction = (text: string): Partial<LicenseData> => {
  console.log('Raw OCR text:', text);
  
  const preprocessedText = preprocessText(text);
  const lines = preprocessedText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  const extracted: Partial<LicenseData> = {};
  const allText = preprocessedText.replace(/\n/g, ' ').toUpperCase();

  console.log('Enhanced OCR processing started...');
  console.log('Preprocessed text:', preprocessedText);

  // Enhanced license number extraction for Nepal format
  const extractLicenseNumber = (text: string): string | null => {
    const patterns = [
      // Nepal format: 03-06-041605052 or variations
      /(?:DL\.?\s*NO\.?|LICENSE\s*NO\.?|LICENCE\s*NO\.?)[\s:]*(\d{2}[-\s]?\d{2}[-\s]?\d{9})/gi,
      /\b(\d{2}[-\s]?\d{2}[-\s]?\d{9})\b/g,
      /\b(\d{2}[-\s]?\d{2}[-\s]?\d{8})\b/g,
      // Continuous digits (11-14 digits)
      /\b(\d{11,14})\b/g,
      // With context
      /(?:DRIVING|LICENSE|LICENCE)[\s\S]*?(\d{2}[-\s]?\d{2}[-\s]?\d{7,9})/gi,
    ];

    for (const pattern of patterns) {
      const matches = [...text.matchAll(pattern)];
      for (const match of matches) {
        let potential = (match[1] || match[0]).trim().replace(/\s+/g, '');
        
        // Clean OCR errors
        potential = potential
          .replace(/[|]/g, '1')
          .replace(/[O]/g, '0')
          .replace(/[S]/g, '5')
          .replace(/[Z]/g, '2')
          .replace(/[B]/g, '8')
          .replace(/[G]/g, '6');
        
        // Validate Nepal license format
        const digits = potential.replace(/[-\s]/g, '');
        if (digits.length >= 11 && digits.length <= 14 && /^\d+$/.test(digits)) {
          // Format as Nepal standard
          if (digits.length >= 13) {
            return `${digits.substring(0, 2)}-${digits.substring(2, 4)}-${digits.substring(4, 13)}`;
          } else if (digits.length >= 11) {
            return `${digits.substring(0, 2)}-${digits.substring(2, 4)}-${digits.substring(4)}`;
          }
        }
      }
    }
    return null;
  };

  // Enhanced name extraction
  const extractName = (text: string): string | null => {
    const patterns = [
      // After Name: or नाम:
      /(?:Name|नाम)[\s:]+([A-Z][a-zA-Z\s]+?)(?:\n|Address|ठेगाना|DOB|Category|$)/gi,
      // Common Nepal name patterns
      /\b([A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/g,
      // Names in specific positions
      /\d{2}-\d{2}-\d{9}[\s\n]*([A-Z][a-z]+\s+[A-Z][a-z]+)/g,
    ];

    for (const pattern of patterns) {
      const matches = [...text.matchAll(pattern)];
      for (const match of matches) {
        const potential = (match[1] || match[0]).trim();
        
        if (potential.length > 3 && 
            potential.length < 50 &&
            !/\d/.test(potential) &&
            !potential.includes('GOVERNMENT') && 
            !potential.includes('NEPAL') &&
            !potential.includes('LICENSE') &&
            !potential.includes('CATEGORY') &&
            /^[A-Za-z\s\.]+$/.test(potential)) {
          return potential;
        }
      }
    }
    return null;
  };

  // Enhanced date extraction
  const extractDates = (text: string): { issue?: string, expiry?: string } => {
    const datePatterns = [
      /\b(\d{1,2}[-\/]\d{1,2}[-\/]\d{4})\b/g,
      /\b(\d{1,2}[-\/]\d{1,2}[-\/]\d{2})\b/g,
      /(?:DOI|Issue|जारी)[\s:]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/gi,
      /(?:DOE|Expiry|म्याद)[\s:]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/gi,
    ];

    const foundDates: Array<{date: string, type: string, context: string}> = [];

    for (const pattern of datePatterns) {
      const matches = [...text.matchAll(pattern)];
      for (const match of matches) {
        const dateStr = match[1] || match[0];
        const context = match.input?.substring(Math.max(0, match.index! - 30), match.index! + 50).toUpperCase() || '';
        
        const parts = dateStr.split(/[-\/]/);
        if (parts.length === 3) {
          let year = parts[2].length === 2 ? (parseInt(parts[2]) > 50 ? '19' + parts[2] : '20' + parts[2]) : parts[2];
          const formattedDate = `${year}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
          
          const dateObj = new Date(formattedDate);
          if (!isNaN(dateObj.getTime())) {
            let type = 'unknown';
            if (context.includes('DOI') || context.includes('ISSUE') || context.includes('जारी')) {
              type = 'issue';
            } else if (context.includes('DOE') || context.includes('EXPIRY') || context.includes('म्याद')) {
              type = 'expiry';
            } else {
              const currentYear = new Date().getFullYear();
              const dateYear = parseInt(year);
              type = dateYear > currentYear ? 'expiry' : 'issue';
            }
            
            foundDates.push({ date: formattedDate, type, context });
          }
        }
      }
    }

    const result: { issue?: string, expiry?: string } = {};
    
    const issueDates = foundDates.filter(d => d.type === 'issue');
    const expiryDates = foundDates.filter(d => d.type === 'expiry');
    
    if (issueDates.length > 0) result.issue = issueDates[0].date;
    if (expiryDates.length > 0) result.expiry = expiryDates[0].date;
    
    // If we have unknown dates, assign logically
    if (!result.issue || !result.expiry) {
      const unknownDates = foundDates.filter(d => d.type === 'unknown');
      if (unknownDates.length >= 2) {
        unknownDates.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        if (!result.issue) result.issue = unknownDates[0].date;
        if (!result.expiry) result.expiry = unknownDates[unknownDates.length - 1].date;
      }
    }
    
    return result;
  };

  // Enhanced address extraction
  const extractAddress = (text: string): string | null => {
    const patterns = [
      /(?:Address|ठेगाना)[\s:]+([^\n]+?)(?:\n|Phone|Category|$)/gi,
      /([A-Za-z\s]+-\d+,?\s*[A-Za-z\s]+)/g,
      /\b([A-Za-z\s,-]+\d+[A-Za-z\s,-]*)\b/g,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        let address = match[1] ? match[1].trim() : match[0].trim();
        address = address.replace(/\n/g, ', ').replace(/\s+/g, ' ').trim();
        
        if (address.length > 5 && 
            address.length < 200 &&
            address !== 'ADDRESS' &&
            !address.includes('LICENSE') &&
            !address.includes('CATEGORY')) {
          return address;
        }
      }
    }
    return null;
  };

  // Extract all data
  const licenseNumber = extractLicenseNumber(preprocessedText);
  if (licenseNumber) {
    extracted.licenseNumber = licenseNumber;
    console.log('✓ License number extracted:', licenseNumber);
  }

  const name = extractName(preprocessedText);
  if (name) {
    extracted.holderName = name;
    console.log('✓ Name extracted:', name);
  }

  const dates = extractDates(preprocessedText);
  if (dates.issue) {
    extracted.issueDate = dates.issue;
    console.log('✓ Issue date extracted:', dates.issue);
  }
  if (dates.expiry) {
    extracted.expiryDate = dates.expiry;
    console.log('✓ Expiry date extracted:', dates.expiry);
  }

  const address = extractAddress(preprocessedText);
  if (address) {
    extracted.address = address;
    console.log('✓ Address extracted:', address);
  }

  // Always set issuing authority for Nepal
  extracted.issuingAuthority = 'Department of Transport Management, Government of Nepal';
  console.log('✓ Issuing authority set for Nepal');

  console.log('Enhanced extraction completed:', extracted);
  return extracted;
};

export const processImageWithOCR = async (
  file: File,
  onProgress: (step: string) => void
): Promise<Partial<LicenseData>> => {
  onProgress('Initializing enhanced OCR engine for Nepal licenses...');

  const worker = await createWorker(['eng'], 1, {
    logger: m => {
      if (m.status === 'recognizing text') {
        onProgress(`Analyzing Nepal license... ${Math.round(m.progress * 100)}%`);
      }
    }
  });
  
  onProgress('Configuring OCR with enhanced Nepal license settings...');
  
  // Enhanced configuration for Nepal license documents
  await worker.setParameters({
    tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-.,: /()[]',
    tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
    preserve_interword_spaces: '1',
    tessedit_do_invert: '0',
    user_defined_dpi: '300',
    // Enhanced settings for better text recognition
    tessedit_ocr_engine_mode: '1', // Use LSTM OCR engine
    tessedit_enable_dict_correction: '1',
    tessedit_enable_bigram_correction: '1',
  });

  onProgress('Processing Nepal license image with enhanced algorithm...');
  const { data: { text } } = await worker.recognize(file);
  
  onProgress('Extracting all Nepal license details automatically...');
  const extractedData = enhancedNepalLicenseExtraction(text);
  
  onProgress('Finalizing automatic form filling...');
  await worker.terminate();
  
  // Log extraction results
  const extractedFields = Object.keys(extractedData).length;
  console.log(`✓ Extraction complete: ${extractedFields} fields automatically filled`);
  
  return extractedData;
};

// Legacy function for backward compatibility
export const extractLicenseInfo = enhancedNepalLicenseExtraction;
export const extractNepalLicenseInfo = enhancedNepalLicenseExtraction;
