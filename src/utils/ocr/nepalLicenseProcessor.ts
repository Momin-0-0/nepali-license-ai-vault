
import { LicenseData } from '@/types/license';
import { NEPAL_LICENSE_PATTERNS } from './patterns';
import { WordData, LineData } from './types';
import { 
  extractFromNepalLicenseLines, 
  extractFromWordPositions, 
  validateAndCleanupNepalData, 
  convertNepalDateToISO, 
  validateNepalLicenseNumber, 
  formatNepalLicenseNumber 
} from './dataExtraction';

export const performAdvancedExtractionForNepal = async (
  text: string, 
  words: WordData[], 
  lines: LineData[],
  confidence: number
): Promise<Partial<LicenseData>> => {
  const cleanText = text.replace(/\s+/g, ' ').trim();
  const textLines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  console.log('=== Advanced Nepal License Pattern Extraction ===');
  console.log('Processing lines:', textLines.length);
  console.log('Clean text:', cleanText);
  
  const extractedData: Partial<LicenseData> = {};

  // Stage 1: Enhanced pattern-based extraction
  for (const [field, patterns] of Object.entries(NEPAL_LICENSE_PATTERNS)) {
    for (const pattern of patterns) {
      const matches = cleanText.match(pattern);
      if (matches) {
        for (const match of matches) {
          const groups = pattern.exec(match);
          if (groups && groups.length > 1) {
            const value = groups[groups.length - 1].trim();
            if (value && value.length > 0) {
              switch (field) {
                case 'licenseNumber':
                  if (validateNepalLicenseNumber(value)) {
                    extractedData.licenseNumber = formatNepalLicenseNumber(value);
                  }
                  break;
                case 'holderName':
                  if (value.length >= 3 && /^[A-Za-z\s.]+$/.test(value)) {
                    extractedData.holderName = value.replace(/\s+/g, ' ').trim();
                  }
                  break;
                case 'address':
                  if (value.length >= 5) {
                    extractedData.address = value.replace(/\s+/g, ' ').trim();
                  }
                  break;
                case 'dateOfBirth':
                  extractedData.dateOfBirth = convertNepalDateToISO(value);
                  break;
                case 'citizenshipNo':
                  if (/^\d{10,15}$/.test(value)) {
                    extractedData.citizenshipNo = value;
                  }
                  break;
                case 'phoneNo':
                  if (/^98\d{8}$/.test(value) || /^\d{10}$/.test(value)) {
                    extractedData.phoneNo = value;
                  }
                  break;
                case 'issueDate':
                  extractedData.issueDate = convertNepalDateToISO(value);
                  break;
                case 'expiryDate':
                  extractedData.expiryDate = convertNepalDateToISO(value);
                  break;
                case 'category':
                  if (/^[A-Z]+$/.test(value)) {
                    extractedData.category = value;
                  }
                  break;
                case 'bloodGroup':
                  if (/^[ABO]{1,2}[+-]?$/.test(value)) {
                    extractedData.bloodGroup = value;
                  }
                  break;
              }
              
              if (extractedData[field as keyof LicenseData]) {
                console.log(`✓ ${field} found:`, value);
                break; // Move to next field once found
              }
            }
          }
          pattern.lastIndex = 0; // Reset regex
        }
        if (extractedData[field as keyof LicenseData]) break;
      }
    }
  }

  // Stage 2: Line-by-line analysis for missed fields
  const lineBasedData = extractFromNepalLicenseLines(textLines);
  Object.keys(lineBasedData).forEach(key => {
    if (!extractedData[key as keyof typeof extractedData] && lineBasedData[key as keyof typeof lineBasedData]) {
      (extractedData as any)[key] = lineBasedData[key as keyof typeof lineBasedData];
    }
  });

  // Stage 3: Word positioning analysis
  if (words.length > 0) {
    const positionBasedData = extractFromWordPositions(words);
    Object.keys(positionBasedData).forEach(key => {
      if (!extractedData[key as keyof typeof extractedData] && positionBasedData[key as keyof typeof positionBasedData]) {
        (extractedData as any)[key] = positionBasedData[key as keyof typeof positionBasedData];
      }
    });
  }

  // Stage 4: Set default issuing authority
  if (!extractedData.issuingAuthority) {
    extractedData.issuingAuthority = 'Department of Transport Management, Government of Nepal';
  }

  // Stage 5: Final validation and cleanup
  return validateAndCleanupNepalData(extractedData);
};
