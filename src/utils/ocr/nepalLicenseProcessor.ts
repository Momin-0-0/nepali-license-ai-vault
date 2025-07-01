
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
    onProgress?.('Initializing OCR engine for Nepal license...');
    
    // Enhanced preprocessing for Nepal license
    const preprocessedImage = await preprocessNepalLicenseImage(imageFile);
    
    // Initialize Tesseract worker
    worker = await createWorker('eng');
    
    // Configure for Nepal license text recognition
    await worker.setParameters({
      tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-+:., /',
      tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
      preserve_interword_spaces: '1'
    });
    
    onProgress?.('Analyzing Nepal license image...');
    
    // Perform OCR with detailed output
    const { data } = await worker.recognize(preprocessedImage);
    
    onProgress?.('Extracting license fields...');
    
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
    
    const extractedData = await performAdvancedExtractionForNepal(
      data.text || '',
      words,
      lines,
      data.confidence || 0
    );
    
    onProgress?.('Validation and cleanup...');
    
    return extractedData;
    
  } catch (error) {
    console.error('OCR Processing Error:', error);
    throw new Error(`OCR failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  } finally {
    if (worker) {
      await worker.terminate();
    }
  }
};

export const preprocessImageForOCR = async (imageFile: File): Promise<File> => {
  return preprocessNepalLicenseImage(imageFile);
};

export const performAdvancedExtractionForNepal = async (
  text: string, 
  words: any[], 
  lines: any[],
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

  // Stage 4: Set default issuing authority
  if (!extractedData.issuingAuthority) {
    extractedData.issuingAuthority = 'Department of Transport Management, Government of Nepal';
  }

  // Stage 5: Final validation and cleanup
  return validateAndCleanupNepalData(extractedData);
};

