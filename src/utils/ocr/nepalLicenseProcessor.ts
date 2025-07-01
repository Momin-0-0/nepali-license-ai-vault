
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
  console.log('Original text lines:', textLines);
  
  const extractedData: Partial<LicenseData> = {};

  // Stage 1: Advanced pattern-based extraction with better regex patterns
  
  // Enhanced license number extraction with multiple attempts
  const licensePatterns = [
    /D\.?L\.?\s*No\.?\s*[:\-]?\s*(\d{2}-\d{2,3}-\d{6,8})/gi,
    /License.*No\.?\s*[:\-]?\s*(\d{2}-\d{2,3}-\d{6,8})/gi,
    /(\d{2}-\d{2,3}-\d{6,8})(?!\d)/g,
    /D\.?L\.?\s*No\.?\s*[:\-]?\s*(\d{11,12})/gi,
    /(\d{11,12})(?=\s|$)/g  // Standalone 11-12 digit numbers
  ];
  
  for (const pattern of licensePatterns) {
    let match;
    pattern.lastIndex = 0; // Reset regex
    while ((match = pattern.exec(cleanText)) !== null) {
      const licenseNum = match[1];
      console.log('Testing license number:', licenseNum);
      if (validateNepalLicenseNumber(licenseNum)) {
        extractedData.licenseNumber = formatNepalLicenseNumber(licenseNum);
        console.log('✓ License number found:', extractedData.licenseNumber);
        break;
      }
    }
    if (extractedData.licenseNumber) break;
  }
  
  // Enhanced date extraction with context-aware patterns
  const dateExtractionPatterns = [
    {
      field: 'issueDate',
      patterns: [
        /D\.?O\.?I\.?\s*[:\-]?\s*(\d{1,2}[-\/]\d{1,2}[-\/]\d{4})/gi,
        /Issue.*Date\s*[:\-]?\s*(\d{1,2}[-\/]\d{1,2}[-\/]\d{4})/gi,
        /(\d{1,2}[-\/]\d{1,2}[-\/]\d{4})(?=.*(?:D\.?O\.?E|Expiry|Valid))/gi
      ]
    },
    {
      field: 'expiryDate', 
      patterns: [
        /D\.?O\.?E\.?\s*[:\-]?\s*(\d{1,2}[-\/]\d{1,2}[-\/]\d{4})/gi,
        /Expiry.*Date\s*[:\-]?\s*(\d{1,2}[-\/]\d{1,2}[-\/]\d{4})/gi,
        /Valid.*Till\s*[:\-]?\s*(\d{1,2}[-\/]\d{1,2}[-\/]\d{4})/gi,
        /(\d{1,2}[-\/]\d{1,2}[-\/]\d{4})(?=.*(?:Phone|Category|Issued))/gi
      ]
    },
    {
      field: 'dateOfBirth',
      patterns: [
        /D\.?O\.?B\.?\s*[:\-]?\s*(\d{1,2}[-\/]\d{1,2}[-\/]\d{4})/gi,
        /Birth.*Date\s*[:\-]?\s*(\d{1,2}[-\/]\d{1,2}[-\/]\d{4})/gi
      ]
    }
  ];
  
  for (const { field, patterns } of dateExtractionPatterns) {
    for (const pattern of patterns) {
      let match;
      pattern.lastIndex = 0;
      while ((match = pattern.exec(cleanText)) !== null) {
        const dateStr = match[1];
        console.log(`Testing ${field} with date:`, dateStr);
        const isoDate = convertNepalDateToISO(dateStr);
        if (isoDate && isoDate !== dateStr && /^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
          (extractedData as any)[field] = isoDate;
          console.log(`✓ ${field} found:`, isoDate);
          break;
        }
      }
      if ((extractedData as any)[field]) break;
    }
    if ((extractedData as any)[field]) continue;
  }

  // Stage 2: Line-by-line analysis for missed fields
  const lineBasedData = extractFromNepalLicenseLines(textLines);
  Object.keys(lineBasedData).forEach(key => {
    if (!extractedData[key as keyof typeof extractedData] && lineBasedData[key as keyof typeof lineBasedData]) {
      (extractedData as any)[key] = lineBasedData[key as keyof typeof lineBasedData];
      console.log(`✓ ${key} found from line analysis:`, lineBasedData[key as keyof typeof lineBasedData]);
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
        console.log(`✓ ${key} found from word positioning:`, positionBasedData[key as keyof typeof positionBasedData]);
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
