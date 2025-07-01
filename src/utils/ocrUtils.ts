
import Tesseract from 'tesseract.js';
import { LicenseData } from '@/types/license';

interface OCRProgress {
  status: string;
  progress: number;
}

// Nepal License Field Patterns
const NEPAL_LICENSE_PATTERNS = {
  licenseNumber: /(D\.L\.No[:\s]*)?(\d{2}-\d{3}-\d{6,})/gi,
  bloodGroup: /BG[:\s]*([ABO]{1,2}[+-])/gi,
  holderName: /Name[:\s]*([A-Z][a-zA-Z\s]+)/gi,
  address: /Address[:\s]*([A-Za-z0-9,\s\-]+)/gi,
  dateOfBirth: /D\.O\.B[:\s]*(\d{2}-\d{2}-\d{4})/gi,
  citizenshipNo: /Citizenship No[:\s]*(\d+)/gi,
  phoneNo: /Phone No[:\s]*(\d{10})/gi,
  issueDate: /D\.O\.I[:\s]*(\d{2}-\d{2}-\d{4})/gi,
  expiryDate: /D\.O\.E[:\s]*(\d{2}-\d{2}-\d{4})/gi,
  category: /Category[:\s]*([A-Z]+)/gi,
  issuingAuthority: /(Department\s*of\s*Transport\s*Management|Transport\s*Management\s*Office|DoTM)/gi
};

export const processImageWithOCR = async (
  imageFile: File,
  onProgress?: (progressText: string) => void
): Promise<Partial<LicenseData>> => {
  return new Promise(async (resolve, reject) => {
    try {
      onProgress?.('Initializing enhanced OCR for Nepal license format...');
      
      // Preprocess image for Nepal license (landscape rotated)
      const enhancedImage = await preprocessNepalLicenseImage(imageFile);
      
      const worker = await Tesseract.createWorker(['eng', 'nep'], 1, {
        logger: (m: OCRProgress) => {
          if (m.status === 'recognizing text') {
            const percentage = Math.round(m.progress * 100);
            onProgress?.(`Processing Nepal license with dual language support... ${percentage}%`);
          } else {
            onProgress?.(m.status);
          }
        }
      });

      // Enhanced parameters for Nepal license with landscape orientation
      await worker.setParameters({
        tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz -.,/:()[]+-',
        tessedit_pageseg_mode: Tesseract.PSM.SPARSE_TEXT,
        preserve_interword_spaces: '1',
        tessedit_do_invert: '0',
        tessedit_ocr_engine_mode: '1', // Use LSTM OCR engine
        user_defined_dpi: '300',
        // Nepal-specific character recognition
        load_system_dawg: '0',
        load_freq_dawg: '0',
        textord_heavy_nr: '1'
      });

      onProgress?.('Extracting text from Nepal license with field-specific patterns...');

      const result = await worker.recognize(enhancedImage);
      const text = result.data.text;
      // Use type assertion to access word-level data safely
      const words = (result.data as any).words?.map((word: any) => ({
        text: word.text,
        confidence: word.confidence,
        bbox: word.bbox
      })) || [];
      
      console.log('=== Nepal License OCR Analysis (Enhanced) ===');
      console.log('Raw OCR text:', text);
      console.log('Word-level data:', words.map((w: any) => ({ text: w.text, confidence: w.confidence, bbox: w.bbox })));
      
      onProgress?.('Analyzing extracted data with Nepal-specific patterns...');

      const extractedData = extractNepalLicenseDataWithPatterns(text, words);
      
      console.log('Extracted Nepal license data:', extractedData);
      
      const fieldsFound = Object.keys(extractedData).filter(key => 
        extractedData[key as keyof typeof extractedData] && 
        extractedData[key as keyof typeof extractedData] !== ''
      ).length;
      
      console.log(`✓ Successfully extracted ${fieldsFound} fields from Nepal license`);

      await worker.terminate();
      
      onProgress?.(`Enhanced OCR complete! Extracted ${fieldsFound} fields using Nepal patterns`);
      
      resolve(extractedData);
    } catch (error) {
      console.error('Nepal License OCR Error:', error);
      onProgress?.('Enhanced OCR processing failed');
      reject(new Error('Failed to process Nepal license format. Please try again or enter details manually.'));
    }
  });
};

const preprocessNepalLicenseImage = async (imageFile: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }

    img.onload = () => {
      try {
        // Handle landscape_rotated_90 orientation
        canvas.width = img.height; // Swap dimensions for rotation
        canvas.height = img.width;

        // Rotate image 90 degrees counter-clockwise to correct orientation
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.translate(-img.width / 2, -img.height / 2);

        // Enhanced preprocessing for Nepal license
        ctx.filter = 'contrast(1.5) brightness(1.2) saturate(0.8) sharpen(1.2)';
        ctx.drawImage(img, 0, 0);

        // Additional processing for better text recognition
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Enhanced contrast and noise reduction for Nepal license text
        for (let i = 0; i < data.length; i += 4) {
          const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
          
          // More aggressive text enhancement
          if (avg < 140) {
            // Darken text regions
            data[i] = Math.max(0, data[i] - 30);
            data[i + 1] = Math.max(0, data[i + 1] - 30);
            data[i + 2] = Math.max(0, data[i + 2] - 30);
          } else {
            // Brighten background
            data[i] = Math.min(255, data[i] + 30);
            data[i + 1] = Math.min(255, data[i + 1] + 30);
            data[i + 2] = Math.min(255, data[i + 2] + 30);
          }
        }

        ctx.putImageData(imageData, 0, 0);

        canvas.toBlob((blob) => {
          if (blob) {
            const enhancedFile = new File([blob], `enhanced_nepal_${imageFile.name}`, {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            resolve(enhancedFile);
          } else {
            reject(new Error('Failed to enhance Nepal license image'));
          }
        }, 'image/jpeg', 0.95);
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(imageFile);
  });
};

const extractNepalLicenseDataWithPatterns = (text: string, words: any[]): Partial<LicenseData> => {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  const cleanText = text.replace(/\s+/g, ' ').trim();
  
  console.log('=== Nepal License Pattern Extraction ===');
  console.log('Processing lines:', lines);
  console.log('Clean text:', cleanText);
  
  const extractedData: Partial<LicenseData> = {};

  // Extract License Number (D.L. No)
  const licenseMatch = cleanText.match(NEPAL_LICENSE_PATTERNS.licenseNumber);
  if (licenseMatch) {
    extractedData.licenseNumber = licenseMatch[2] || licenseMatch[0];
    console.log('✓ License Number found:', extractedData.licenseNumber);
  }

  // Extract Holder Name
  const nameMatch = cleanText.match(NEPAL_LICENSE_PATTERNS.holderName);
  if (nameMatch) {
    extractedData.holderName = nameMatch[1].trim();
    console.log('✓ Holder Name found:', extractedData.holderName);
  }

  // Extract Address
  const addressMatch = cleanText.match(NEPAL_LICENSE_PATTERNS.address);
  if (addressMatch) {
    extractedData.address = addressMatch[1].trim();
    console.log('✓ Address found:', extractedData.address);
  }

  // Extract Issue Date (D.O.I.)
  const issueDateMatch = cleanText.match(NEPAL_LICENSE_PATTERNS.issueDate);
  if (issueDateMatch) {
    extractedData.issueDate = convertNepalDateToISO(issueDateMatch[1]);
    console.log('✓ Issue Date found:', extractedData.issueDate);
  }

  // Extract Expiry Date (D.O.E.)
  const expiryDateMatch = cleanText.match(NEPAL_LICENSE_PATTERNS.expiryDate);
  if (expiryDateMatch) {
    extractedData.expiryDate = convertNepalDateToISO(expiryDateMatch[1]);
    console.log('✓ Expiry Date found:', extractedData.expiryDate);
  }

  // Extract or set Issuing Authority
  const authorityMatch = cleanText.match(NEPAL_LICENSE_PATTERNS.issuingAuthority);
  if (authorityMatch) {
    extractedData.issuingAuthority = 'Department of Transport Management, Government of Nepal';
  } else {
    extractedData.issuingAuthority = 'Department of Transport Management, Government of Nepal';
  }
  console.log('✓ Issuing Authority set:', extractedData.issuingAuthority);

  // Fallback extraction using word-level analysis
  if (!extractedData.licenseNumber || !extractedData.holderName) {
    console.log('Running fallback word-level analysis...');
    const fallbackData = extractWithWordAnalysis(words);
    
    if (!extractedData.licenseNumber && fallbackData.licenseNumber) {
      extractedData.licenseNumber = fallbackData.licenseNumber;
    }
    if (!extractedData.holderName && fallbackData.holderName) {
      extractedData.holderName = fallbackData.holderName;
    }
    if (!extractedData.address && fallbackData.address) {
      extractedData.address = fallbackData.address;
    }
  }

  return extractedData;
};

const extractWithWordAnalysis = (words: any[]): Partial<LicenseData> => {
  const fallbackData: Partial<LicenseData> = {};
  
  // Look for license number pattern in words
  for (let i = 0; i < words.length - 2; i++) {
    const word1 = words[i]?.text || '';
    const word2 = words[i + 1]?.text || '';
    const word3 = words[i + 2]?.text || '';
    
    // Check for D.L.No pattern
    if (/D\.L/i.test(word1) && /No/i.test(word2)) {
      const possibleNumber = words[i + 3]?.text || word3;
      if (/\d{2}-\d{3}-\d{6}/.test(possibleNumber)) {
        fallbackData.licenseNumber = possibleNumber;
        console.log('✓ License number from word analysis:', possibleNumber);
      }
    }
    
    // Check for Name pattern
    if (/Name/i.test(word1) && word2 && word3) {
      const possibleName = `${word2} ${word3}`;
      if (/^[A-Z][a-zA-Z\s]+$/.test(possibleName) && possibleName.length > 5) {
        fallbackData.holderName = possibleName;
        console.log('✓ Name from word analysis:', possibleName);
      }
    }
  }
  
  return fallbackData;
};

const convertNepalDateToISO = (dateString: string): string => {
  // Nepal license dates are in DD-MM-YYYY format
  const parts = dateString.split('-');
  if (parts.length === 3) {
    const [day, month, year] = parts;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  return dateString;
};

export const preprocessImageForOCR = preprocessNepalLicenseImage;
