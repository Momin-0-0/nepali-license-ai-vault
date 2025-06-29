// Centralized error handling utility
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

export const handleAsyncError = (fn: Function) => {
  return (...args: any[]) => {
    const result = fn(...args);
    if (result && typeof result.catch === 'function') {
      return result.catch((error: Error) => {
        console.error('Async error caught:', error);
        throw new AppError(error.message || 'An unexpected error occurred');
      });
    }
    return result;
  };
};

export const logError = (error: Error, context?: string) => {
  const errorInfo = {
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href
  };
  
  console.error('Application Error:', errorInfo);
  
  // In production, send to error tracking service
  if (process.env.NODE_ENV === 'production') {
    // Example: Sentry.captureException(error, { extra: errorInfo });
  }
};

export const sanitizeErrorMessage = (error: any): string => {
  if (typeof error === 'string') return error;
  if (error?.message) return error.message;
  return 'An unexpected error occurred';
};