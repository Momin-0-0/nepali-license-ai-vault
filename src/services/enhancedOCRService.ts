import Tesseract from 'tesseract.js';
import { preprocessNepalLicenseImage } from '@/utils/ocr/imagePreprocessing';
import { extractWithAdvancedPatterns, extractWithContextualAnalysis } from '@/utils/ocr/dataExtraction';
import type { LicenseData } from '@/types/license';

interface OCRResult {
  text: string;
  confidence: number;
  extractedData: Partial<LicenseData>;
}

class EnhancedOCRService {
  private worker: Tesseract.Worker | null = null;

  async initialize() {
    if (this.worker) return;

    this.worker = await Tesseract.createWorker(['eng']);

    // Set enhanced parameters for better Nepal license recognition
    await this.worker.setParameters({
      tessedit_page_seg_mode: Tesseract.PSM.SINGLE_BLOCK,
      tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 /-:.,',
      preserve_interword_spaces: '1',
    });
  }

  async processNepalLicense(
    imageFile: File,
    onProgress?: (status: string, progress: number) => void
  ): Promise<OCRResult> {
    await this.initialize();
    
    onProgress?.('Preprocessing image for better recognition...', 10);

    try {
      // Preprocess the image for better OCR results
      const preprocessedImage = await preprocessNepalLicenseImage(imageFile);
      
      onProgress?.('Running advanced OCR analysis...', 30);

      // Perform multi-pass OCR with different configurations
      const ocrResults = await this.performMultiPassOCR(preprocessedImage, onProgress);
      
      onProgress?.('Extracting structured data...', 80);

      // Extract structured data using advanced patterns
      const extractedData = await this.extractLicenseData(ocrResults);

      onProgress?.('Validating and cleaning data...', 95);

      // Validate and clean the extracted data
      this.validateAndCleanData(extractedData);

      onProgress?.('OCR processing complete!', 100);

      return {
        text: ocrResults.map(r => r.text).join('\n'),
        confidence: this.calculateOverallConfidence(extractedData, ocrResults),
        extractedData
      };

    } catch (error) {
      console.error('Enhanced OCR Error:', error);
      throw new Error('OCR processing failed. Please ensure good lighting and try again.');
    }
  }

  private async performMultiPassOCR(
    imageFile: File, 
    onProgress?: (status: string, progress: number) => void
  ): Promise<any[]> {
    if (!this.worker) throw new Error('OCR worker not initialized');

    const results = [];

    // Pass 1: Standard OCR
    onProgress?.('Pass 1: Standard text recognition...', 35);
    await this.worker.setParameters({
      tessedit_page_seg_mode: Tesseract.PSM.SINGLE_BLOCK,
    });
    
    const result1 = await this.worker.recognize(imageFile);
    results.push(result1.data);

    // Pass 2: Line-by-line analysis
    onProgress?.('Pass 2: Line-by-line analysis...', 50);
    await this.worker.setParameters({
      tessedit_page_seg_mode: Tesseract.PSM.SINGLE_LINE,
    });
    
    const result2 = await this.worker.recognize(imageFile);
    results.push(result2.data);

    // Pass 3: Word-level analysis for better accuracy
    onProgress?.('Pass 3: Word-level precision analysis...', 65);
    await this.worker.setParameters({
      tessedit_page_seg_mode: Tesseract.PSM.SINGLE_WORD,
    });
    
    const result3 = await this.worker.recognize(imageFile);
    results.push(result3.data);

    return results;
  }

  private async extractLicenseData(ocrResults: any[]): Promise<Partial<LicenseData>> {
    // Combine all OCR text
    const combinedText = ocrResults.map(r => r.text).join('\n');
    
    // Use advanced pattern matching
    const advancedData = extractWithAdvancedPatterns(combinedText);
    
    // Use contextual analysis
    const contextualData = extractWithContextualAnalysis(combinedText);
    
    // Merge results, giving priority to advanced patterns
    return { ...contextualData, ...advancedData };
  }

  private validateAndCleanData(data: Partial<LicenseData>) {
    // Clean and validate license number
    if (data.licenseNumber) {
      data.licenseNumber = this.cleanLicenseNumber(data.licenseNumber);
      if (!this.isValidLicenseNumber(data.licenseNumber)) {
        delete data.licenseNumber;
      }
    }

    // Clean and validate names
    if (data.holderName) {
      data.holderName = this.cleanName(data.holderName);
      if (data.holderName.length < 2) {
        delete data.holderName;
      }
    }

    if (data.fatherOrHusbandName) {
      data.fatherOrHusbandName = this.cleanName(data.fatherOrHusbandName);
      if (data.fatherOrHusbandName.length < 2) {
        delete data.fatherOrHusbandName;
      }
    }

    // Clean and validate dates
    ['dateOfBirth', 'issueDate', 'expiryDate'].forEach(field => {
      if (data[field as keyof LicenseData]) {
        const cleanedDate = this.cleanDate(data[field as keyof LicenseData] as string);
        if (this.isValidDate(cleanedDate)) {
          (data as any)[field] = cleanedDate;
        } else {
          delete (data as any)[field];
        }
      }
    });

    // Clean citizenship number
    if (data.citizenshipNo) {
      data.citizenshipNo = this.cleanCitizenshipNumber(data.citizenshipNo);
      if (!this.isValidCitizenshipNumber(data.citizenshipNo)) {
        delete data.citizenshipNo;
      }
    }

    // Clean phone number
    if (data.phoneNo) {
      data.phoneNo = this.cleanPhoneNumber(data.phoneNo);
      if (!this.isValidPhoneNumber(data.phoneNo)) {
        delete data.phoneNo;
      }
    }

    // Remove empty fields
    Object.keys(data).forEach(key => {
      const value = data[key as keyof LicenseData];
      if (!value || (typeof value === 'string' && value.trim().length === 0)) {
        delete data[key as keyof LicenseData];
      }
    });
  }

  private cleanLicenseNumber(value: string): string {
    // Normalize common OCR confusions and format to new Nepal spec (XX-XX-XXXXXXXX) with fallback (XX-XXX-XXXXXX)
    const normalized = value
      .replace(/[O]/g, '0')
      .replace(/[Il|]/g, '1')
      .replace(/S/g, '5')
      .replace(/B/g, '8')
      .replace(/Z/g, '2')
      .replace(/[–—−]/g, '-')
      .replace(/\s+/g, '')
      .replace(/[^0-9-]/g, '');

    // Extract digits only and format
    const digits = normalized.replace(/[^0-9]/g, '');

    if (digits.length >= 12) {
      const d = digits.slice(0, 12);
      return `${d.slice(0, 2)}-${d.slice(2, 4)}-${d.slice(4, 12)}`;
    }

    if (digits.length >= 11) {
      const d = digits.slice(0, 11);
      return `${d.slice(0, 2)}-${d.slice(2, 5)}-${d.slice(5, 11)}`;
    }

    return normalized;
  }

  private isValidLicenseNumber(value: string): boolean {
    return /^(?:\d{2}-\d{2}-\d{8}|\d{2}-\d{3}-\d{6})$/.test(value);
  }

  private cleanName(value: string): string {
    return value.replace(/[^a-zA-Z\s]/g, '')
                .replace(/\s+/g, ' ')
                .trim()
                .toLowerCase()
                .replace(/\b\w/g, l => l.toUpperCase());
  }

  private cleanDate(value: string): string {
    // Normalize separators and common OCR confusions, output DD-MM-YYYY
    const normalized = value
      .replace(/[O]/g, '0')
      .replace(/[–—−]/g, '-')
      .replace(/[\.\/]/g, '-')
      .trim();
    const dateMatch = normalized.match(/(\d{1,2})-(\d{1,2})-(\d{4})/);
    if (dateMatch) {
      const [, day, month, year] = dateMatch;
      return `${day.padStart(2, '0')}-${month.padStart(2, '0')}-${year}`;
    }
    return value;
  }

  private isValidDate(value: string): boolean {
    const dateMatch = value.match(/^(\d{2})-(\d{2})-(\d{4})$/);
    if (!dateMatch) return false;

    const [, day, month, year] = dateMatch;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return date.getFullYear() === parseInt(year) &&
           date.getMonth() === parseInt(month) - 1 &&
           date.getDate() === parseInt(day);
  }

  private cleanCitizenshipNumber(value: string): string {
    const digits = value.replace(/O/g, '0').replace(/[^\d]/g, '');
    if (digits.length >= 11) return digits.slice(0, 11);
    return digits;
  }

  private isValidCitizenshipNumber(value: string): boolean {
    return /^(?:\d{11}|\d{2}-\d{2}-\d{2}-\d{5})$/.test(value);
  }

  private cleanPhoneNumber(value: string): string {
    return value.replace(/[^\d]/g, '');
  }

  private isValidPhoneNumber(value: string): boolean {
    return /^9\d{9}$/.test(value) || /^\d{10}$/.test(value);
  }

  private calculateOverallConfidence(data: Partial<LicenseData>, ocrResults: any[]): number {
    const totalFields = 13; // Total expected fields
    const extractedFields = Object.keys(data).length;
    const avgOCRConfidence = ocrResults.reduce((sum, r) => sum + (r.confidence || 0), 0) / ocrResults.length;
    
    const dataQuality = (extractedFields / totalFields) * 100;
    const ocrQuality = avgOCRConfidence;
    
    return Math.round((dataQuality * 0.7 + ocrQuality * 0.3));
  }

  async dispose() {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
    }
  }
}

export const enhancedOCRService = new EnhancedOCRService();