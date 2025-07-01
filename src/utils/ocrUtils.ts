
// Main OCR utilities - re-export from modular files
export { processImageWithOCR, preprocessImageForOCR } from './ocr/nepalLicenseProcessor';
export { preprocessNepalLicenseImage } from './ocr/imagePreprocessing';
export type { OCRProgress, WordData, LineData } from './ocr/types';
