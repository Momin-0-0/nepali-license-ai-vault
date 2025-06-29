import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { logError, sanitizeErrorMessage } from '@/utils/errorHandling';

export const useErrorHandler = () => {
  const { toast } = useToast();

  const handleError = useCallback((error: any, context?: string) => {
    logError(error, context);
    
    const message = sanitizeErrorMessage(error);
    
    toast({
      title: "Error",
      description: message,
      variant: "destructive",
    });
  }, [toast]);

  const handleAsyncOperation = useCallback(async (
    operation: () => Promise<any>,
    successMessage?: string,
    errorContext?: string
  ) => {
    try {
      const result = await operation();
      
      if (successMessage) {
        toast({
          title: "Success",
          description: successMessage,
        });
      }
      
      return result;
    } catch (error) {
      handleError(error, errorContext);
      throw error;
    }
  }, [handleError, toast]);

  return { handleError, handleAsyncOperation };
};