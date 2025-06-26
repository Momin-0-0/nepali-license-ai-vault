
import { useRef, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, FileText, Loader2, Check, UploadIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { processImageWithOCR } from '@/utils/ocrUtils';
import { LicenseData } from '@/types/license';

interface ImageUploadProps {
  onDataExtracted: (data: Partial<LicenseData>) => void;
}

const ImageUpload = ({ onDataExtracted }: ImageUploadProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrComplete, setOcrComplete] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 10MB",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      setOcrComplete(false);
    }
  };

  const processImage = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);

    try {
      const extractedData = await processImageWithOCR(selectedFile, setProcessingStep);
      
      onDataExtracted(extractedData);
      setOcrComplete(true);
      setProcessingStep('');
      
      if (Object.keys(extractedData).length > 0) {
        toast({
          title: "OCR Complete",
          description: "License information extracted. Please review and edit if needed.",
        });
      } else {
        toast({
          title: "Limited Data Found",
          description: "Please enter the license details manually.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('OCR Error:', error);
      toast({
        title: "OCR Failed",
        description: "Failed to process image. Please try again or enter details manually.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="w-5 h-5" />
          Upload License Image
        </CardTitle>
        <CardDescription>
          Take a photo or upload an image of your driving license for automatic data extraction
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          {imagePreview ? (
            <div className="space-y-4">
              <img 
                src={imagePreview} 
                alt="License preview" 
                className="max-w-full h-64 object-contain mx-auto rounded-lg shadow-md"
              />
              <div className="flex gap-2 justify-center">
                <Button 
                  variant="outline" 
                  onClick={() => fileInputRef.current?.click()}
                >
                  Change Image
                </Button>
                {!ocrComplete && !isProcessing && (
                  <Button onClick={processImage}>
                    <FileText className="w-4 h-4 mr-2" />
                    Extract Data
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <UploadIcon className="w-16 h-16 text-gray-400 mx-auto" />
              <div>
                <p className="text-lg font-medium text-gray-700">Upload your license image</p>
                <p className="text-sm text-gray-500">PNG, JPG, WebP up to 10MB</p>
              </div>
              <Button onClick={() => fileInputRef.current?.click()}>
                Choose File
              </Button>
            </div>
          )}
        </div>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="image/*"
          className="hidden"
        />

        {isProcessing && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              <span className="text-blue-700 font-medium">{processingStep}</span>
            </div>
          </div>
        )}

        {ocrComplete && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Check className="w-5 h-5 text-green-600" />
              <span className="text-green-700 font-medium">Data extracted successfully!</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ImageUpload;
