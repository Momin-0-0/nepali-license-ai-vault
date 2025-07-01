
import { createWorker, PSM } from 'tesseract.js';
import { LicenseData } from '@/types/license';
import { NEPAL_LICENSE_PATTERNS } from './patterns';
import { WordData, LineData, OCRProgress } from './types';
import { preprocessNepalLicenseImage } from './imagePreprocessing';
import { 
  extractFromNepalLicenseLines, 
  extractFromWordPositions, 
  validateAndCleanupNepalData, 
  convertNepalDateToISO, 
  validateNepalLicenseNumber, 
  formatNepalLicenseNumber 
} from './dataExtraction';

export const processImageWithOCR = async (
  imageFile: File,
  onProgress?: (status: string) => void
): Promise<Partial<LicenseData>> => {
  let worker: Tesseract.Worker | null = null;
  
  try {
    onProgress?.('Initializing enhanced OCR engine for comprehensive Nepal license format...');
    
    // Enhanced preprocessing for Nepal license
    const preprocessedImage = await preprocessNepalLicenseImage(imageFile);
    
    // Initialize Tesseract worker
    worker = await createWorker('eng');
    
    // Configure for comprehensive Nepal license text recognition
    await worker.setParameters({
      tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-+:., /',
      tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
      preserve_interword_spaces: '1'
    });
    
    onProgress?.('Analyzing comprehensive Nepal license format...');
    
    // Perform OCR with detailed output
    const { data } = await worker.recognize(preprocessedImage);
    
    onProgress?.('Extracting all license fields including enhanced metadata...');
    
    // Extract structured data using advanced algorithms
    // Access words and lines from the blocks structure
    const words: any[] = [];
    const lines: any[] = [];
    
    // Collect all words and lines from all blocks, paragraphs, and lines
    if (data.blocks) {
      for (const block of data.blocks) {
        if (block.paragraphs) {
          for (const paragraph of block.paragraphs) {
            if (paragraph.lines) {
              for (const line of paragraph.lines) {
                lines.push(line);
                if (line.words) {
                  words.push(...line.words);
                }
              }
            }
          }
        }
      }
    }
    
    const extractedData = await performComprehensiveExtractionForNepal(
      data.text || '',
      words,
      lines,
      data.confidence || 0
    );
    
    onProgress?.('Final validation and cleanup of comprehensive data...');
    
    return extractedData;
    
  } catch (error) {
    console.error('Enhanced OCR Processing Error:', error);
    throw new Error(`Enhanced OCR failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  } finally {
    if (worker) {
      await worker.terminate();
    }
  }
};

export const preprocessImageForOCR = async (imageFile: File): Promise<File> => {
  return preprocessNepalLicenseImage(imageFile);
};

export const performComprehensiveExtractionForNepal = async (
  text: string, 
  words: any[], 
  lines: any[],
  confidence: number
): Promise<Partial<LicenseData>> => {
  const cleanText = text.replace(/\s+/g, ' ').trim();
  const textLines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  console.log('=== Comprehensive Nepal License Pattern Extraction ===');
  console.log('Processing lines:', textLines.length);
  console.log('Clean text:', cleanText);
  
  const extractedData: Partial<LicenseData> = {};

  // Stage 1: Enhanced pattern-based extraction for all fields with focus on missing fields
  
  // Special handling for license number from the OCR text
  const licensePatterns = [
    /D\.?L\.?\s*No\.?\s*(\d{2}-?\d{2,3}-?\d{6,8})/i,
    /License.*No\.?\s*(\d{2}-?\d{2,3}-?\d{6,8})/i,
    /(\d{2}-\d{2,3}-\d{6,8})/,
    /(\d{11,12})/
  ];
  
  for (const pattern of licensePatterns) {
    const match = cleanText.match(pattern);
    if (match) {
      const licenseNum = match[1] || match[0];
      if (validateNepalLicenseNumber(licenseNum)) {
        extractedData.licenseNumber = formatNepalLicenseNumber(licenseNum);
        console.log('✓ License number found:', extractedData.licenseNumber);
        break;
      }
    }
  }
  
  // Special handling for dates - look for date patterns around D.O.I and D.O.E
  const datePatterns = [
    /D\.?O\.?I\.?[:\s]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{4})/i, // Issue date
    /D\.?O\.?E\.?[:\s]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{4})/i, // Expiry date
    /Issue.*Date[:\s]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{4})/i,
    /Expiry.*Date[:\s]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{4})/i,
    /Valid.*Till[:\s]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{4})/i
  ];
  
  for (const pattern of datePatterns) {
    const match = cleanText.match(pattern);
    if (match) {
      const dateStr = match[1];
      const isoDate = convertNepalDateToISO(dateStr);
      
      if (pattern.source.includes('D.O.I') || pattern.source.includes('Issue')) {
        extractedData.issueDate = isoDate;
        console.log('✓ Issue date found:', extractedData.issueDate);
      } else if (pattern.source.includes('D.O.E') || pattern.source.includes('Expiry') || pattern.source.includes('Valid')) {
        extractedData.expiryDate = isoDate;
        console.log('✓ Expiry date found:', extractedData.expiryDate);
      }
    }
  }

  // Continue with existing pattern-based extraction for other fields
  for (const [field, patterns] of Object.entries(NEPAL_LICENSE_PATTERNS)) {
    if (extractedData[field as keyof LicenseData]) continue; // Skip if already found
    
    for (const pattern of patterns) {
      const matches = cleanText.match(pattern);
      if (matches) {
        for (const match of matches) {
          const groups = pattern.exec(match);
          if (groups && groups.length > 1) {
            const value = groups[groups.length - 1].trim();
            if (value && value.length > 0) {
              switch (field) {
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
                case 'fatherOrHusbandName':
                  if (value.length >= 3 && /^[A-Za-z\s.]+$/.test(value)) {
                    extractedData.fatherOrHusbandName = value.replace(/\s+/g, ' ').trim();
                  }
                  break;
                case 'citizenshipNo':
                  if (/^\d{10,15}$/.test(value)) {
                    extractedData.citizenshipNo = value;
                  }
                  break;
                case 'passportNo':
                  if (/^[A-Z0-9]{8,15}$/.test(value)) {
                    extractedData.passportNo = value;
                  }
                  break;
                case 'phoneNo':
                  if (/^98\d{8}$/.test(value) || /^\d{10}$/.test(value)) {
                    extractedData.phoneNo = value;
                  }
                  break;
                case 'bloodGroup':
                  if (['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].includes(value)) {
                    extractedData.bloodGroup = value as any;
                  }
                  break;
                case 'category':
                  if (/^[A-Z]+$/.test(value)) {
                    extractedData.category = value;
                  }
                  break;
                case 'issuedBy':
                  if (value.length >= 5) {
                    extractedData.issuingAuthority = value.replace(/\s+/g, ' ').trim();
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

  // Stage 3: Word positioning analysis (only if words data is available)
  if (words && words.length > 0) {
    const wordData: WordData[] = words.map((word: any) => ({
      text: word.text || '',
      confidence: word.confidence || 0,
      bbox: word.bbox || {}
    }));
    
    const positionBasedData = extractFromWordPositions(wordData);
    Object.keys(positionBasedData).forEach(key => {
      if (!extractedData[key as keyof typeof extractedData] && positionBasedData[key as keyof typeof positionBasedData]) {
        (extractedData as any)[key] = positionBasedData[key as keyof typeof positionBasedData];
      }
    });
  }

  // Stage 4: Set default issuing authority if not found
  if (!extractedData.issuingAuthority) {
    extractedData.issuingAuthority = 'Department of Transport Management, Government of Nepal';
  }

  // Stage 5: Final validation and cleanup
  const validatedData = validateAndCleanupNepalData(extractedData);
  
  console.log('=== Extraction Summary ===');
  console.log('Fields extracted:', Object.keys(validatedData).length);
  console.log('Extracted data:', validatedData);
  
  return validatedData;
};
