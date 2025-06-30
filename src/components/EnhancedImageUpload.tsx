
import { useState, useRef, useCallback } from 'react';
import { Upload, Camera, FileImage, X, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

interface EnhancedImageUploadProps {
  onImageSelected: (file: File) => void;
  onImageProcessed: (imageUrl: string) => void;
  isProcessing?: boolean;
  acceptedFormats?: string[];
  maxSizeInMB?: number;
}

const EnhancedImageUpload = ({ 
  onImageSelected, 
  onImageProcessed, 
  isProcessing = false,
  acceptedFormats = ['image/jpeg', 'image/png', 'image/webp'],
  maxSizeInMB = 10
}: EnhancedImageUploadProps) => {
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const validateFile = useCallback((file: File): string | null => {
    if (!acceptedFormats.includes(file.type)) {
      return `File type not supported. Please use ${acceptedFormats.map(f => f.split('/')[1].toUpperCase()).join(', ')}`;
    }
    
    if (file.size > maxSizeInMB * 1024 * 1024) {
      return `File size must be less than ${maxSizeInMB}MB`;
    }
    
    return null;
  }, [acceptedFormats, maxSizeInMB]);

  const processFile = useCallback(async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      toast({
        title: "Invalid file",
        description: validationError,
        variant: "destructive"
      });
      return;
    }

    setError(null);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPreview(result);
      onImageProcessed(result);
    };
    reader.readAsDataURL(file);
    
    // Simulate upload progress
    setUploadProgress(0);
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 10;
      });
    }, 100);
    
    onImageSelected(file);
  }, [validateFile, onImageSelected, onImageProcessed, toast]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  }, [processFile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const clearImage = () => {
    setPreview(null);
    setUploadProgress(0);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedFormats.join(',')}
        onChange={handleFileChange}
        className="hidden"
      />
      
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!preview ? (
        <Card 
          className={`border-2 border-dashed transition-all duration-200 cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 ${
            dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={openFileDialog}
        >
          <CardContent className="flex flex-col items-center justify-center py-12 px-6">
            <div className={`mb-4 p-4 rounded-full transition-colors ${
              dragActive ? 'bg-blue-100' : 'bg-gray-100'
            }`}>
              <Upload className={`w-8 h-8 ${dragActive ? 'text-blue-600' : 'text-gray-400'}`} />
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Upload Nepal License Image
            </h3>
            <p className="text-gray-600 text-center mb-4">
              Drag and drop your license image here, or click to browse
            </p>
            
            <div className="flex gap-2 mb-4">
              <Button variant="outline" size="sm" className="gap-2">
                <FileImage className="w-4 h-4" />
                Choose File
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <Camera className="w-4 h-4" />
                Take Photo
              </Button>
            </div>
            
            <p className="text-xs text-gray-500 text-center">
              Supports: {acceptedFormats.map(f => f.split('/')[1].toUpperCase()).join(', ')} 
              • Max size: {maxSizeInMB}MB
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-2 border-green-200 bg-green-50/30">
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <div className="relative">
                  <img 
                    src={preview} 
                    alt="License preview" 
                    className="max-w-full h-auto rounded-lg shadow-sm border"
                    style={{ maxHeight: '300px' }}
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={clearImage}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                
                {uploadProgress < 100 && (
                  <div className="mt-3">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Processing image...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} className="h-2" />
                  </div>
                )}
                
                {uploadProgress === 100 && !isProcessing && (
                  <div className="flex items-center gap-2 mt-3 text-green-600">
                    <Check className="w-4 h-4" />
                    <span className="text-sm font-medium">Image ready for processing</span>
                  </div>
                )}
                
                {isProcessing && (
                  <div className="flex items-center gap-2 mt-3 text-blue-600">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm font-medium">Extracting license data...</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EnhancedImageUpload;
