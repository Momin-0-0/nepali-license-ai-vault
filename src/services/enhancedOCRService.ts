import { pipeline } from '@huggingface/transformers';
import type { LicenseData } from '@/types/license';

interface OCRResult {
  text: string;
  confidence: number;
  extractedData: Partial<LicenseData>;
}

class EnhancedOCRService {
  private documentQAPipeline: any = null;
  private ocrPipeline: any = null;
  private isInitialized = false;

  async initialize() {
    if (this.isInitialized) return;

    try {
      // Initialize document question-answering pipeline for structured data extraction
      this.documentQAPipeline = await pipeline(
        'document-question-answering',
        'microsoft/layoutlm-base-uncased',
        { device: 'webgpu' }
      );

      // Initialize OCR pipeline for text extraction
      this.ocrPipeline = await pipeline(
        'image-to-text',
        'microsoft/trocr-base-printed',
        { device: 'webgpu' }
      );

      this.isInitialized = true;
    } catch (error) {
      console.warn('WebGPU not available, falling back to CPU:', error);
      
      // Fallback to CPU
      this.documentQAPipeline = await pipeline(
        'document-question-answering',
        'microsoft/layoutlm-base-uncased'
      );

      this.ocrPipeline = await pipeline(
        'image-to-text',
        'microsoft/trocr-base-printed'
      );

      this.isInitialized = true;
    }
  }

  async processNepalLicense(
    imageFile: File,
    onProgress?: (status: string, progress: number) => void
  ): Promise<OCRResult> {
    await this.initialize();
    
    onProgress?.('Initializing AI models...', 10);

    // Convert file to image data
    const imageUrl = URL.createObjectURL(imageFile);
    
    try {
      onProgress?.('Extracting text with AI OCR...', 30);
      
      // First, extract text using TrOCR (Transformer-based OCR)
      const ocrResult = await this.ocrPipeline(imageUrl);
      const extractedText = ocrResult.generated_text || '';

      onProgress?.('Analyzing document structure...', 60);

      // Use document Q&A to extract structured data
      const questions = [
        'What is the license number?',
        'What is the holder name?',
        'What is the date of birth?',
        'What is the issue date?',
        'What is the expiry date?',
        'What is the address?',
        'What vehicle categories are allowed?',
        'What is the citizenship number?'
      ];

      const extractedData: Partial<LicenseData> = {};
      
      onProgress?.('Extracting structured data...', 80);

      // Process questions to extract structured data
      for (let i = 0; i < questions.length; i++) {
        try {
          const result = await this.documentQAPipeline({
            question: questions[i],
            image: imageUrl
          });

          // Map results to license data fields
          this.mapAnswerToField(questions[i], result.answer, extractedData);
          
          onProgress?.(`Processing field ${i + 1}/${questions.length}...`, 80 + (i / questions.length) * 15);
        } catch (error) {
          console.warn(`Failed to process question: ${questions[i]}`, error);
        }
      }

      // Fallback pattern matching for any missed fields
      this.applyPatternMatching(extractedText, extractedData);

      onProgress?.('Validating extracted data...', 95);

      // Validate and clean extracted data
      this.validateAndCleanData(extractedData);

      onProgress?.('AI extraction complete!', 100);

      return {
        text: extractedText,
        confidence: this.calculateOverallConfidence(extractedData),
        extractedData
      };

    } finally {
      URL.revokeObjectURL(imageUrl);
    }
  }

  private mapAnswerToField(question: string, answer: string, data: Partial<LicenseData>) {
    const cleanAnswer = answer?.trim();
    if (!cleanAnswer || cleanAnswer.toLowerCase() === 'none') return;

    if (question.includes('license number')) {
      data.licenseNumber = this.cleanLicenseNumber(cleanAnswer);
    } else if (question.includes('holder name')) {
      data.holderName = this.cleanName(cleanAnswer);
    } else if (question.includes('date of birth')) {
      data.dateOfBirth = this.parseDate(cleanAnswer);
    } else if (question.includes('issue date')) {
      data.issueDate = this.parseDate(cleanAnswer);
    } else if (question.includes('expiry date')) {
      data.expiryDate = this.parseDate(cleanAnswer);
    } else if (question.includes('address')) {
      data.address = cleanAnswer;
    } else if (question.includes('vehicle categories')) {
      data.category = this.parseVehicleCategories(cleanAnswer);
    } else if (question.includes('citizenship')) {
      data.citizenshipNo = this.cleanCitizenshipNumber(cleanAnswer);
    }
  }

  private applyPatternMatching(text: string, data: Partial<LicenseData>) {
    // Nepal license number pattern
    if (!data.licenseNumber) {
      const licenseMatch = text.match(/(?:License\s*No\.?\s*:?\s*)?([0-9]{2}-[0-9]{2}-[0-9]{6})/i);
      if (licenseMatch) {
        data.licenseNumber = licenseMatch[1];
      }
    }

    // Date patterns (DD/MM/YYYY or DD-MM-YYYY)
    const dateMatches = text.match(/\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}\b/g);
    if (dateMatches && dateMatches.length >= 2) {
      if (!data.issueDate) data.issueDate = dateMatches[0];
      if (!data.expiryDate) data.expiryDate = dateMatches[1];
    }

    // Citizenship number pattern
    if (!data.citizenshipNo) {
      const citizenshipMatch = text.match(/([0-9]{1,3}[-\/]?[0-9]{1,3}[-\/]?[0-9]{1,5})/);
      if (citizenshipMatch) {
        data.citizenshipNo = citizenshipMatch[1];
      }
    }
  }

  private cleanLicenseNumber(value: string): string {
    return value.replace(/[^\d\-]/g, '').slice(0, 11);
  }

  private cleanName(value: string): string {
    return value.replace(/[^a-zA-Z\s]/g, '').trim();
  }

  private cleanCitizenshipNumber(value: string): string {
    return value.replace(/[^\d\-\/]/g, '');
  }

  private parseDate(value: string): string {
    // Try to standardize date format
    const dateMatch = value.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    if (dateMatch) {
      const [, day, month, year] = dateMatch;
      return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
    }
    return value;
  }

  private parseVehicleCategories(value: string): string {
    // Extract vehicle categories (A, B, C, etc.)
    const categories = value.match(/[A-Z]/g);
    return categories ? categories.join(', ') : value;
  }

  private validateAndCleanData(data: Partial<LicenseData>) {
    // Remove empty or invalid fields
    Object.keys(data).forEach(key => {
      const value = data[key as keyof LicenseData];
      if (!value || typeof value === 'string' && value.trim().length === 0) {
        delete data[key as keyof LicenseData];
      }
    });
  }

  private calculateOverallConfidence(data: Partial<LicenseData>): number {
    const totalFields = 8; // Total expected fields
    const extractedFields = Object.keys(data).length;
    return Math.min((extractedFields / totalFields) * 100, 95);
  }

  async dispose() {
    // Clean up pipelines if needed
    this.documentQAPipeline = null;
    this.ocrPipeline = null;
    this.isInitialized = false;
  }
}

export const enhancedOCRService = new EnhancedOCRService();