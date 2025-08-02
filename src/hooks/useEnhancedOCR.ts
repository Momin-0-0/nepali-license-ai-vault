import { useState, useCallback } from 'react';
import { enhancedOCRService } from '@/services/enhancedOCRService';
import type { LicenseData } from '@/types/license';

interface UseEnhancedOCRResult {
  processImage: (file: File) => Promise<Partial<LicenseData>>;
  isProcessing: boolean;
  progress: number;
  currentStep: string;
  error: string | null;
  cancelProcessing: () => void;
}

export const useEnhancedOCR = (): UseEnhancedOCRResult => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  const processImage = useCallback(async (file: File): Promise<Partial<LicenseData>> => {
    const controller = new AbortController();
    setAbortController(controller);
    setIsProcessing(true);
    setProgress(0);
    setError(null);
    setCurrentStep('Preparing AI models...');

    try {
      // Check if processing was cancelled
      if (controller.signal.aborted) {
        throw new Error('Processing cancelled');
      }

      const result = await enhancedOCRService.processNepalLicense(
        file,
        (status: string, progressValue: number) => {
          if (!controller.signal.aborted) {
            setCurrentStep(status);
            setProgress(progressValue);
          }
        }
      );

      if (controller.signal.aborted) {
        throw new Error('Processing cancelled');
      }

      setCurrentStep('Processing complete!');
      setProgress(100);
      
      return result.extractedData;
    } catch (err) {
      if (!controller.signal.aborted) {
        const errorMessage = err instanceof Error ? err.message : 'AI processing failed';
        setError(errorMessage);
        setCurrentStep('Processing failed');
      }
      throw err;
    } finally {
      if (!controller.signal.aborted) {
        setIsProcessing(false);
      }
      setAbortController(null);
    }
  }, []);

  const cancelProcessing = useCallback(() => {
    if (abortController) {
      abortController.abort();
      setIsProcessing(false);
      setCurrentStep('Processing cancelled');
      setError('Processing was cancelled');
    }
  }, [abortController]);

  return {
    processImage,
    isProcessing,
    progress,
    currentStep,
    error,
    cancelProcessing
  };
};