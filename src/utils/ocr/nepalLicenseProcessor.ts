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
  formatNepalLicenseNumber,
  extractWithAdvancedPatterns,
  extractWithContextualAnalysis
} from './dataExtraction';

export const processImageWithOCR = async (
  imageFile: File,
  onProgress?: (status: string) => void
): Promise<Partial<LicenseData>> => {
  let worker: Tesseract.Worker | null = null;
  
  try {
    onProgress?.('🔄 Initializing advanced OCR engine for Nepal license...');
    
    // Enhanced preprocessing
    const preprocessedImage = await preprocessNepalLicenseImage(imageFile);
    
    // Initialize Tesseract with optimized settings
    worker = await createWorker(['eng', 'nep']);
    
    // Multi-pass OCR with different configurations
    const ocrResults = await performMultiPassOCR(worker, preprocessedImage, onProgress);
    
    onProgress?.('🔍 Analyzing Nepal license with advanced algorithms...');
    
    // Comprehensive extraction pipeline
    const extractedData = await performAdvancedExtraction(ocrResults, onProgress);
    
    onProgress?.('✅ Nepal license extraction complete!');
    
    return extractedData;
    
  } catch (error) {
    console.error('Advanced OCR Processing Error:', error);
    throw new Error(`OCR failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  } finally {
    if (worker) {
      await worker.terminate();
    }
  }
};

const performMultiPassOCR = async (
  worker: Tesseract.Worker,
  image: File,
  onProgress?: (status: string) => void
): Promise<any[]> => {
  const ocrConfigs = [
    {
      name: 'Standard OCR',
      params: {
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-+:.,/() ',
        tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
        preserve_interword_spaces: '1'
      }
    },
    {
      name: 'High Precision',
      params: {
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-+:.,/() ',
        tessedit_pageseg_mode: PSM.SINGLE_WORD,
        preserve_interword_spaces: '1',
        tessedit_do_invert: '0'
      }
    },
    {
      name: 'Line Detection',
      params: {
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-+:.,/() ',
        tessedit_pageseg_mode: PSM.SINGLE_LINE,
        preserve_interword_spaces: '1'
      }
    }
  ];
  
  const results = [];
  
  for (const config of ocrConfigs) {
    onProgress?.(`🔄 Running ${config.name}...`);
    
    await worker.setParameters(config.params);
    const { data } = await worker.recognize(image);
    
    results.push({
      ...data,
      configName: config.name,
      confidence: data.confidence || 0
    });
    
    console.log(`${config.name} - Confidence: ${data.confidence}%`);
    console.log(`${config.name} - Text:`, data.text?.substring(0, 200));
  }
  
  return results;
};

export const performAdvancedExtraction = async (
  ocrResults: any[],
  onProgress?: (status: string) => void
): Promise<Partial<LicenseData>> => {
  
  onProgress?.('🔍 Extracting license data with advanced patterns...');
  
  const extractedData: Partial<LicenseData> = {
    issuingAuthority: 'Department of Transport Management, Government of Nepal'
  };
  
  // Combine all OCR results
  const allTexts = ocrResults.map(result => result.text || '').join('\n');
  const bestResult = ocrResults.reduce((best, current) => 
    (current.confidence || 0) > (best.confidence || 0) ? current : best
  );
  
  console.log('=== Advanced Nepal License Extraction ===');
  console.log('Combined text length:', allTexts.length);
  console.log('Best OCR confidence:', bestResult.confidence);
  
  // Multi-strategy extraction
  const strategies = [
    () => extractWithAdvancedPatterns(allTexts),
    () => extractWithContextualAnalysis(allTexts),
    () => extractFromNepalLicenseLines(allTexts.split('\n')),
    () => extractFromBestOCRResult(bestResult)
  ];
  
  for (const strategy of strategies) {
    try {
      const strategyData = strategy();
      mergeExtractionData(extractedData, strategyData);
    } catch (error) {
      console.warn('Extraction strategy failed:', error);
    }
  }
  
  // Post-processing and validation
  onProgress?.('🔧 Validating and cleaning extracted data...');
  const validatedData = validateAndCleanupNepalData(extractedData);
  
  console.log('=== Final Extraction Results ===');
  console.log('Extracted fields:', Object.keys(validatedData).length);
  console.log('Data:', validatedData);
  
  return validatedData;
};

const extractFromBestOCRResult = (ocrResult: any): Partial<LicenseData> => {
  const data: Partial<LicenseData> = {};
  const text = ocrResult.text || '';
  
  // Extract from word positions if available
  if (ocrResult.words && ocrResult.words.length > 0) {
    const wordData: WordData[] = ocrResult.words.map((word: any) => ({
      text: word.text || '',
      confidence: word.confidence || 0,
      bbox: word.bbox || {}
    }));
    
    const positionData = extractFromWordPositions(wordData);
    Object.assign(data, positionData);
  }
  
  return data;
};

const mergeExtractionData = (target: Partial<LicenseData>, source: Partial<LicenseData>) => {
  Object.keys(source).forEach(key => {
    const typedKey = key as keyof LicenseData;
    if (source[typedKey] && !target[typedKey]) {
      (target as any)[typedKey] = source[typedKey];
    }
  });
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
  return performAdvancedExtraction([{ text, words, lines, confidence }]);
};
