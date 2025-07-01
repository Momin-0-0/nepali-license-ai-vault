import Tesseract from 'tesseract.js';
import { LicenseData } from '@/types/license';

interface OCRProgress {
  status: string;
  progress: number;
}

// Enhanced Nepal License Field Patterns based on actual license format
const NEPAL_LICENSE_PATTERNS = {
  licenseNumber: [
    /D\.L\.No[:\s]*(\d{2}-\d{2}-\d{8})/gi,
    /D\.L\.No[:\s]*(\d{2}-\d{2}-\d{9})/gi,
    /(\d{2}-\d{2}-\d{8,9})/gi,
    /D\.L\.No[:\s]*(\d{11,13})/gi
  ],
  bloodGroup: [
    /B\.G[:\s]*([ABO]{1,2}[+-]?)/gi,
    /BG[:\s]*([ABO]{1,2}[+-]?)/gi,
    /Blood[:\s]*Group[:\s]*([ABO]{1,2}[+-]?)/gi
  ],
  holderName: [
    /Name[:\s]*([A-Z][a-zA-Z\s]{3,50})/gi,
    /नाम[:\s]*([A-Z][a-zA-Z\s]{3,50})/gi,
    /([A-Z][a-zA-Z]+\s+[A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)/gi
  ],
  address: [
    /Address[:\s]*([A-Za-z0-9,\s\-]{5,100})/gi,
    /ठेगाना[:\s]*([A-Za-z0-9,\s\-]{5,100})/gi,
    /([A-Za-z\-]+,\s*[A-Za-z\-]+,\s*Nepal)/gi
  ],
  dateOfBirth: [
    /D\.O\.B[:\s]*(\d{2}-\d{2}-\d{4})/gi,
    /DOB[:\s]*(\d{2}-\d{2}-\d{4})/gi,
    /जन्म[:\s]*मिति[:\s]*(\d{2}-\d{2}-\d{4})/gi,
    /(\d{2}-\d{2}-\d{4})/gi
  ],
  citizenshipNo: [
    /Citizenship[:\s]*No[:\s]*(\d{10,15})/gi,
    /नागरिकता[:\s]*नं[:\s]*(\d{10,15})/gi,
    /(\d{11})/gi
  ],
  phoneNo: [
    /Phone[:\s]*No[:\s]*(\d{10})/gi,
    /फोन[:\s]*नं[:\s]*(\d{10})/gi,
    /Mobile[:\s]*(\d{10})/gi,
    /(98\d{8})/gi
  ],
  issueDate: [
    /D\.O\.I[:\s]*(\d{2}-\d{2}-\d{4})/gi,
    /DOI[:\s]*(\d{2}-\d{2}-\d{4})/gi,
    /Issue[:\s]*Date[:\s]*(\d{2}-\d{2}-\d{4})/gi,
    /जारी[:\s]*मिति[:\s]*(\d{2}-\d{2}-\d{4})/gi
  ],
  expiryDate: [
    /D\.O\.E[:\s]*(\d{2}-\d{2}-\d{4})/gi,
    /DOE[:\s]*(\d{2}-\d{2}-\d{4})/gi,
    /Expiry[:\s]*Date[:\s]*(\d{2}-\d{2}-\d{4})/gi,
    /समाप्ति[:\s]*मिति[:\s]*(\d{2}-\d{2}-\d{4})/gi
  ],
  category: [
    /Category[:\s]*([A-Z]+)/gi,
    /श्रेणी[:\s]*([A-Z]+)/gi,
    /Class[:\s]*([A-Z]+)/gi
  ],
  fatherName: [
    /F\/H[:\s]*Name[:\s]*([A-Z][a-zA-Z\s]{3,50})/gi,
    /Father[:\s]*Name[:\s]*([A-Z][a-zA-Z\s]{3,50})/gi,
    /बुबाको[:\s]*नाम[:\s]*([A-Z][a-zA-Z\s]{3,50})/gi
  ],
  passportNo: [
    /Passport[:\s]*No[:\s]*([A-Z0-9]{8,15})/gi,
    /राहदानी[:\s]*नं[:\s]*([A-Z0-9]{8,15})/gi
  ]
};

// Region-based extraction areas for Nepal license layout
const NEPAL_LICENSE_REGIONS = {
  topLeft: { x: 0, y: 0, width: 0.4, height: 0.4 },
  topRight: { x: 0.6, y: 0, width: 0.4, height: 0.4 },
  centerLeft: { x: 0, y: 0.4, width: 0.5, height: 0.4 },
  centerRight: { x: 0.5, y: 0.4, width: 0.5, height: 0.4 },
  bottom: { x: 0, y: 0.8, width: 1, height: 0.2 }
};

export const processImageWithOCR = async (
  imageFile: File,
  onProgress?: (progressText: string) => void
): Promise<Partial<LicenseData>> => {
  return new Promise(async (resolve, reject) => {
    try {
      onProgress?.('Initializing Nepal license OCR with advanced pattern recognition...');
      
      // Enhanced preprocessing for Nepal license format
      const enhancedImage = await preprocessNepalLicenseImage(imageFile);
      
      onProgress?.('Loading optimized dual-language OCR models...');
      
      const worker = await Tesseract.createWorker(['eng', 'nep'], 1, {
        logger: (m: OCRProgress) => {
          if (m.status === 'recognizing text') {
            const percentage = Math.round(m.progress * 100);
            onProgress?.(`Extracting Nepal license data... ${percentage}%`);
          } else {
            onProgress?.(m.status.replace(/([a-z])([A-Z])/g, '$1 $2'));
          }
        }
      });

      // Optimized parameters for Nepal license with holographic background
      await worker.setParameters({
        tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz -.,/:()[]+-।',
        tessedit_pageseg_mode: Tesseract.PSM.SINGLE_BLOCK,
        preserve_interword_spaces: '1',
        tessedit_do_invert: '0',
        tessedit_ocr_engine_mode: '1',
        user_defined_dpi: '300',
        load_system_dawg: '0',
        load_freq_dawg: '0',
        textord_heavy_nr: '1',
        textord_min_linesize: '1.25',
        classify_enable_learning: '0',
        classify_enable_adaptive_matcher: '1',
        edges_max_children_per_outline: '40',
        edges_children_count_limit: '45',
        textord_noise_sizelimit: '0.5',
        textord_noise_normratio: '2.0'
      });

      onProgress?.('Processing Nepal license with enhanced region detection...');

      // Full image OCR
      const result = await worker.recognize(enhancedImage);
      const text = result.data.text;
      const confidence = result.data.confidence;
      
      // Safely access word-level data
      const words = (result.data as any).words?.map((word: any) => ({
        text: word.text,
        confidence: word.confidence,
        bbox: word.bbox
      })) || [];
      
      const lines = (result.data as any).lines?.map((line: any) => ({
        text: line.text,
        confidence: line.confidence,
        bbox: line.bbox
      })) || [];
      
      console.log('=== Nepal License OCR Analysis ===');
      console.log('Raw OCR text:', text);
      console.log('Overall confidence:', confidence);
      console.log('Total words detected:', words.length);
      console.log('Total lines detected:', lines.length);
      
      onProgress?.('Analyzing extracted data with Nepal-specific patterns...');

      // Multi-stage extraction with region-based analysis
      const extractedData = await performAdvancedExtractionForNepal(text, words, lines, confidence);
      
      console.log('Final extracted Nepal license data:', extractedData);
      
      const fieldsFound = Object.keys(extractedData).filter(key => 
        extractedData[key as keyof typeof extractedData] && 
        extractedData[key as keyof typeof extractedData] !== ''
      ).length;
      
      console.log(`✓ Nepal license OCR completed: ${fieldsFound} fields extracted with ${Math.round(confidence)}% confidence`);

      await worker.terminate();
      
      onProgress?.(`Nepal license extraction complete! Found ${fieldsFound} fields with ${Math.round(confidence)}% accuracy`);
      
      resolve(extractedData);
    } catch (error) {
      console.error('Nepal License OCR Error:', error);
      onProgress?.('Nepal license OCR processing failed');
      reject(new Error('Failed to process Nepal license. Please ensure good lighting and clear image quality.'));
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
        // Set canvas dimensions
        canvas.width = img.width;
        canvas.height = img.height;

        // Advanced preprocessing pipeline for Nepal license
        ctx.filter = 'contrast(2.2) brightness(1.4) saturate(0.5) blur(0.2px)';
        ctx.drawImage(img, 0, 0);

        // Get image data for pixel-level processing
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Stage 1: Enhanced contrast and background removal
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const avg = (r + g + b) / 3;
          
          // Remove holographic background colors (blues, greens)
          if (b > r + 30 || g > r + 30) {
            // Make background whiter
            data[i] = Math.min(255, data[i] + 60);
            data[i + 1] = Math.min(255, data[i + 1] + 60);
            data[i + 2] = Math.min(255, data[i + 2] + 60);
          }
          
          // Enhance dark text (black/dark colors)
          if (avg < 100) {
            data[i] = Math.max(0, data[i] - 50);
            data[i + 1] = Math.max(0, data[i + 1] - 50);
            data[i + 2] = Math.max(0, data[i + 2] - 50);
          }
          
          // Brighten light background
          if (avg > 200) {
            data[i] = 255;
            data[i + 1] = 255;
            data[i + 2] = 255;
          }
        }

        // Apply processed image data
        ctx.putImageData(imageData, 0, 0);
        
        // Stage 2: Additional sharpening
        const finalData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        applyAdvancedSharpenFilter(finalData);
        ctx.putImageData(finalData, 0, 0);

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

const applyAdvancedSharpenFilter = (imageData: ImageData) => {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  const newData = new Uint8ClampedArray(data);

  // Enhanced sharpening kernel for text
  const kernel = [
    0, -1, 0,
    -1, 6, -1,
    0, -1, 0
  ];

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      for (let c = 0; c < 3; c++) {
        let sum = 0;
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const pixel = ((y + ky) * width + (x + kx)) * 4 + c;
            const kernelIndex = (ky + 1) * 3 + (kx + 1);
            sum += data[pixel] * kernel[kernelIndex];
          }
        }
        const index = (y * width + x) * 4 + c;
        newData[index] = Math.max(0, Math.min(255, sum));
      }
    }
  }

  for (let i = 0; i < data.length; i++) {
    data[i] = newData[i];
  }
};

const performAdvancedExtractionForNepal = async (
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

const extractFromNepalLicenseLines = (lines: string[]): Partial<LicenseData> => {
  const data: Partial<LicenseData> = {};
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const nextLine = lines[i + 1] || '';
    
    // License number detection
    if (/D\.L\.No/i.test(line)) {
      const numberMatch = line.match(/(\d{2}-\d{2}-\d{8,9})/);
      if (numberMatch) {
        data.licenseNumber = numberMatch[1];
      }
    }
    
    // Name detection (usually after "Name:")
    if (/^Name[:\s]/i.test(line)) {
      const nameMatch = line.match(/Name[:\s]*([A-Z][a-zA-Z\s]{3,})/i);
      if (nameMatch) {
        data.holderName = nameMatch[1].trim();
      }
    }
    
    // Address detection (usually spans multiple lines)
    if (/^Address[:\s]/i.test(line)) {
      let address = line.replace(/^Address[:\s]*/i, '').trim();
      if (nextLine && !nextLine.match(/^(D\.O\.B|DOB|Phone|Category|F\/H)/i)) {
        address += ', ' + nextLine.trim();
      }
      if (address.length > 5) {
        data.address = address;
      }
    }
    
    // Date extractions
    if (/D\.O\.B[:\s]/.test(line)) {
      const dobMatch = line.match(/(\d{2}-\d{2}-\d{4})/);
      if (dobMatch) {
        data.dateOfBirth = convertNepalDateToISO(dobMatch[1]);
      }
    }
    
    if (/D\.O\.I[:\s]/.test(line)) {
      const doiMatch = line.match(/(\d{2}-\d{2}-\d{4})/);
      if (doiMatch) {
        data.issueDate = convertNepalDateToISO(doiMatch[1]);
      }
    }
    
    if (/D\.O\.E[:\s]/.test(line)) {
      const doeMatch = line.match(/(\d{2}-\d{2}-\d{4})/);
      if (doeMatch) {
        data.expiryDate = convertNepalDateToISO(doeMatch[1]);
      }
    }
    
    // Phone number
    if (/Phone[:\s]*No/i.test(line)) {
      const phoneMatch = line.match(/(\d{10})/);
      if (phoneMatch) {
        data.phoneNo = phoneMatch[1];
      }
    }
    
    // Category
    if (/Category[:\s]/i.test(line)) {
      const categoryMatch = line.match(/Category[:\s]*([A-Z]+)/i);
      if (categoryMatch) {
        data.category = categoryMatch[1];
      }
    }
    
    // Citizenship number
    if (/Citizenship[:\s]*No/i.test(line)) {
      const citizenshipMatch = line.match(/(\d{10,15})/);
      if (citizenshipMatch) {
        data.citizenshipNo = citizenshipMatch[1];
      }
    }
  }
  
  return data;
};

const extractFromWordPositions = (words: any[]): Partial<LicenseData> => {
  const data: Partial<LicenseData> = {};
  
  for (let i = 0; i < words.length - 1; i++) {
    const word = words[i];
    const nextWord = words[i + 1];
    const nextNextWord = words[i + 2];
    
    if (!word || !nextWord) continue;
    
    const wordText = word.text?.trim() || '';
    const nextWordText = nextWord.text?.trim() || '';
    const nextNextWordText = nextNextWord?.text?.trim() || '';
    
    // Look for "Name:" followed by actual name
    if (/Name/i.test(wordText) && nextWordText.length > 2) {
      const possibleName = nextNextWordText ? 
        `${nextWordText} ${nextNextWordText}` : nextWordText;
      if (/^[A-Z][a-zA-Z\s]{2,}$/.test(possibleName)) {
        data.holderName = possibleName;
      }
    }
    
    // Look for license number patterns
    if (/D\.L\.No/i.test(wordText) && /\d{2}-\d{2}-\d{8,9}/.test(nextWordText)) {
      data.licenseNumber = nextWordText;
    }
    
    // Category detection
    if (/Category/i.test(wordText) && /^[A-Z]+$/.test(nextWordText)) {
      data.category = nextWordText;
    }
  }
  
  return data;
};

const validateNepalLicenseNumber = (licenseNumber: string): boolean => {
  const patterns = [
    /^\d{2}-\d{2}-\d{8}$/,
    /^\d{2}-\d{2}-\d{9}$/,
    /^\d{11,13}$/
  ];
  
  return patterns.some(pattern => pattern.test(licenseNumber));
};

const formatNepalLicenseNumber = (licenseNumber: string): string => {
  const cleaned = licenseNumber.replace(/[-\s]/g, '');
  
  if (cleaned.length >= 12) {
    return `${cleaned.substring(0, 2)}-${cleaned.substring(2, 4)}-${cleaned.substring(4)}`;
  }
  
  return licenseNumber;
};

const validateAndCleanupNepalData = (data: Partial<LicenseData>): Partial<LicenseData> => {
  const cleaned: Partial<LicenseData> = {};
  
  // Validate and clean license number
  if (data.licenseNumber && validateNepalLicenseNumber(data.licenseNumber)) {
    cleaned.licenseNumber = formatNepalLicenseNumber(data.licenseNumber);
  }
  
  // Validate and clean name
  if (data.holderName) {
    const cleanName = data.holderName.replace(/[^\w\s]/g, '').trim();
    if (cleanName.length >= 3 && /^[A-Za-z\s]+$/.test(cleanName)) {
      cleaned.holderName = cleanName;
    }
  }
  
  // Validate address
  if (data.address && data.address.length >= 5) {
    cleaned.address = data.address.trim();
  }
  
  // Validate dates
  if (data.dateOfBirth && /^\d{4}-\d{2}-\d{2}$/.test(data.dateOfBirth)) {
    cleaned.dateOfBirth = data.dateOfBirth;
  }
  
  if (data.issueDate && /^\d{4}-\d{2}-\d{2}$/.test(data.issueDate)) {
    cleaned.issueDate = data.issueDate;
  }
  
  if (data.expiryDate && /^\d{4}-\d{2}-\d{2}$/.test(data.expiryDate)) {
    cleaned.expiryDate = data.expiryDate;
  }
  
  // Keep other validated fields
  ['citizenshipNo', 'phoneNo', 'category', 'bloodGroup', 'issuingAuthority'].forEach(field => {
    if (data[field as keyof LicenseData]) {
      (cleaned as any)[field] = data[field as keyof LicenseData];
    }
  });
  
  return cleaned;
};

const convertNepalDateToISO = (dateString: string): string => {
  // Handle Nepal date format DD-MM-YYYY
  const match = dateString.match(/(\d{2})-(\d{2})-(\d{4})/);
  if (match) {
    const [, day, month, year] = match;
    return `${year}-${month}-${day}`;
  }
  
  return dateString;
};

export const preprocessImageForOCR = preprocessNepalLicenseImage;
