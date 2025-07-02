
import { useState, useCallback, useRef, useEffect } from 'react';
import { LicenseData } from '@/types/license';
import { OCRTaskManager } from '@/utils/ocr/ocrWorker';
import { preprocessNepalLicenseImage } from '@/utils/ocr/imagePreprocessing';
import { performAdvancedExtraction } from '@/utils/ocr/nepalLicenseProcessor';

export const useOCRProcessor = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const ocrManagerRef = useRef<OCRTaskManager | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  useEffect(() => {
    ocrManagerRef.current = new OCRTaskManager(2);
    
    return () => {
      if (ocrManagerRef.current) {
        ocrManagerRef.current.terminate();
      }
    };
  }, []);
  
  const processImage = useCallback(async (
    imageFile: File,
    onProgress?: (status: string) => void
  ): Promise<Partial<LicenseData>> => {
    if (!ocrManagerRef.current) {
      throw new Error('OCR Manager not initialized');
    }
    
    setIsProcessing(true);
    setError(null);
    setProgress(0);
    abortControllerRef.current = new AbortController();
    
    try {
      // Step 1: Preprocessing
      setCurrentStep('Preprocessing image...');
      setProgress(20);
      onProgress?.('🔄 Enhancing image quality for Nepal license...');
      
      const preprocessedImage = await preprocessNepalLicenseImage(imageFile);
      
      if (abortControllerRef.current.signal.aborted) {
        throw new Error('Process cancelled');
      }
      
      // Step 2: Multi-pass OCR
      setCurrentStep('Running OCR analysis...');
      setProgress(40);
      onProgress?.('🔍 Analyzing Nepal license with AI...');
      
      const ocrConfigs = [
        {
          name: 'Standard',
          params: {
            tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-+:.,/() ',
            tessedit_pageseg_mode: '6',
            preserve_interword_spaces: '1'
          }
        },
        {
          name: 'Precise',
          params: {
            tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-+:.,/() ',
            tessedit_pageseg_mode: '8',
            preserve_interword_spaces: '1'
          }
        }
      ];
      
      const ocrResults = [];
      for (let i = 0; i < ocrConfigs.length; i++) {
        if (abortControllerRef.current.signal.aborted) {
          throw new Error('Process cancelled');
        }
        
        setProgress(40 + (i * 20));
        onProgress?.(`🔄 Running ${ocrConfigs[i].name} OCR pass...`);
        
        const result = await ocrManagerRef.current.processImage(
          preprocessedImage,
          ocrConfigs[i]
        );
        
        ocrResults.push({
          ...result,
          configName: ocrConfigs[i].name
        });
      }
      
      // Step 3: Data extraction
      setCurrentStep('Extracting license data...');
      setProgress(80);
      onProgress?.('📄 Extracting Nepal license information...');
      
      const extractedData = await performAdvancedExtraction(ocrResults, onProgress);
      
      setProgress(100);
      setCurrentStep('Complete');
      onProgress?.('✅ Nepal license processing complete!');
      
      return extractedData;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
      throw error;
    } finally {
      setIsProcessing(false);
      abortControllerRef.current = null;
    }
  }, []);
  
  const cancelProcessing = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);
  
  return {
    processImage,
    cancelProcessing,
    isProcessing,
    progress,
    currentStep,
    error
  };
};
