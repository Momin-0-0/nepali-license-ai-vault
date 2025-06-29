import { useRef, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, FileText, Loader2, Check, UploadIcon, ZoomIn, ZoomOut, RotateCcw, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { processImageWithOCR } from '@/utils/ocrUtils';
import { LicenseData } from '@/types/license';

interface ImageUploadProps {
  onDataExtracted: (data: Partial<LicenseData>) => void;
  onImageUploaded?: (imageUrl: string) => void;
}

const ImageUpload = ({ onDataExtracted, onImageUploaded }: ImageUploadProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrComplete, setOcrComplete] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
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
        const imageUrl = e.target?.result as string;
        setImagePreview(imageUrl);
        onImageUploaded?.(imageUrl);
        // Reset zoom and position when new image is loaded
        setZoomLevel(1);
        setImagePosition({ x: 0, y: 0 });
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
          description: "Nepal license information extracted. Please review and edit if needed.",
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

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
    setImagePosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - imagePosition.x,
        y: e.clientY - imagePosition.y
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoomLevel > 1) {
      setImagePosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="w-5 h-5" />
          Upload Nepal License Image
        </CardTitle>
        <CardDescription>
          Take a photo or upload an image of your Nepal driving license for automatic data extraction
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Nepal License Tips */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-700">
              <p className="font-medium mb-2">Tips for better OCR results with Nepal licenses:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Ensure good lighting and avoid shadows</li>
                <li>Keep the license flat and straight</li>
                <li>Make sure all text is clearly visible</li>
                <li>Avoid glare from the plastic surface</li>
                <li>Include the entire license in the frame</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          {imagePreview ? (
            <div className="space-y-4">
              <div 
                className="relative max-w-full h-64 mx-auto rounded-lg shadow-md overflow-hidden bg-gray-100 cursor-move"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onWheel={handleWheel}
              >
                <img 
                  ref={imageRef}
                  src={imagePreview} 
                  alt="Nepal license preview" 
                  className="object-contain transition-transform duration-200 select-none"
                  style={{ 
                    transform: `scale(${zoomLevel}) translate(${imagePosition.x / zoomLevel}px, ${imagePosition.y / zoomLevel}px)`,
                    transformOrigin: 'center center',
                    width: '100%',
                    height: '100%',
                    cursor: zoomLevel > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
                  }}
                  draggable={false}
                />
              </div>
              
              {/* Zoom Controls */}
              <div className="flex items-center justify-center gap-2 bg-gray-50 rounded-lg p-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleZoomOut}
                  disabled={zoomLevel <= 0.5}
                  className="h-8 w-8 p-0"
                >
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <span className="text-sm font-medium min-w-[60px] text-center">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleZoomIn}
                  disabled={zoomLevel >= 3}
                  className="h-8 w-8 p-0"
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetZoom}
                  className="h-8 px-3"
                >
                  <RotateCcw className="w-4 h-4 mr-1" />
                  Reset
                </Button>
              </div>
              
              <div className="flex gap-2 justify-center">
                <Button 
                  variant="outline" 
                  onClick={() => fileInputRef.current?.click()}
                >
                  Change Image
                </Button>
                {!ocrComplete && !isProcessing && (
                  <Button onClick={processImage} className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700">
                    <FileText className="w-4 h-4 mr-2" />
                    Extract Nepal License Data
                  </Button>
                )}
              </div>
              
              <div className="text-xs text-gray-500 text-center">
                Use mouse wheel to zoom • Click and drag to pan when zoomed
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <UploadIcon className="w-16 h-16 text-gray-400 mx-auto" />
              <div>
                <p className="text-lg font-medium text-gray-700">Upload your Nepal license image</p>
                <p className="text-sm text-gray-500">PNG, JPG, WebP up to 10MB</p>
                <p className="text-xs text-gray-400 mt-2">Optimized for Nepal driving license format</p>
              </div>
              <Button onClick={() => fileInputRef.current?.click()} className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700">
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
            <div className="mt-2 text-xs text-blue-600">
              Processing Nepal license with enhanced OCR algorithm...
            </div>
          </div>
        )}

        {ocrComplete && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Check className="w-5 h-5 text-green-600" />
              <span className="text-green-700 font-medium">Nepal license data extracted successfully!</span>
            </div>
            <div className="mt-2 text-xs text-green-600">
              Please review the extracted information and make any necessary corrections.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ImageUpload;