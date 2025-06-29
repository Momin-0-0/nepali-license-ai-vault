import React, { useState, useRef, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { 
  RotateCw, 
  RotateCcw, 
  Crop, 
  Contrast, 
  Sun, 
  Palette,
  Download,
  Undo,
  Redo
} from "lucide-react";

interface ImageProcessorProps {
  imageUrl: string;
  onProcessedImage: (processedImageUrl: string) => void;
}

interface ImageFilters {
  brightness: number;
  contrast: number;
  saturation: number;
  rotation: number;
}

const AdvancedImageProcessor: React.FC<ImageProcessorProps> = ({ 
  imageUrl, 
  onProcessedImage 
}) => {
  const [filters, setFilters] = useState<ImageFilters>({
    brightness: 100,
    contrast: 100,
    saturation: 100,
    rotation: 0
  });
  
  const [history, setHistory] = useState<ImageFilters[]>([filters]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const applyFilters = useCallback(() => {
    if (!canvasRef.current || !imageRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    const img = imageRef.current;
    
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    
    ctx.save();
    
    // Apply rotation
    if (filters.rotation !== 0) {
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((filters.rotation * Math.PI) / 180);
      ctx.translate(-canvas.width / 2, -canvas.height / 2);
    }
    
    // Apply filters
    ctx.filter = `
      brightness(${filters.brightness}%) 
      contrast(${filters.contrast}%) 
      saturate(${filters.saturation}%)
    `;
    
    ctx.drawImage(img, 0, 0);
    ctx.restore();
    
    // Convert to blob and create URL
    canvas.toBlob((blob) => {
      if (blob) {
        const processedUrl = URL.createObjectURL(blob);
        onProcessedImage(processedUrl);
      }
    }, 'image/jpeg', 0.9);
  }, [filters, onProcessedImage]);

  const updateFilter = (key: keyof ImageFilters, value: number) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    
    // Add to history
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newFilters);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setFilters(history[historyIndex - 1]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setFilters(history[historyIndex + 1]);
    }
  };

  const resetFilters = () => {
    const defaultFilters = {
      brightness: 100,
      contrast: 100,
      saturation: 100,
      rotation: 0
    };
    setFilters(defaultFilters);
    setHistory([defaultFilters]);
    setHistoryIndex(0);
  };

  React.useEffect(() => {
    if (imageRef.current?.complete) {
      applyFilters();
    }
  }, [filters, applyFilters]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="w-5 h-5" />
          Image Enhancement
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Hidden image and canvas for processing */}
        <img
          ref={imageRef}
          src={imageUrl}
          alt="Original"
          className="hidden"
          onLoad={applyFilters}
        />
        <canvas ref={canvasRef} className="hidden" />
        
        {/* Controls */}
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={undo}
              disabled={historyIndex === 0}
            >
              <Undo className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={redo}
              disabled={historyIndex === history.length - 1}
            >
              <Redo className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={resetFilters}
            >
              Reset
            </Button>
          </div>
          
          {/* Brightness */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Sun className="w-4 h-4" />
              <span className="text-sm font-medium">Brightness: {filters.brightness}%</span>
            </div>
            <Slider
              value={[filters.brightness]}
              onValueChange={([value]) => updateFilter('brightness', value)}
              min={50}
              max={150}
              step={1}
            />
          </div>
          
          {/* Contrast */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Contrast className="w-4 h-4" />
              <span className="text-sm font-medium">Contrast: {filters.contrast}%</span>
            </div>
            <Slider
              value={[filters.contrast]}
              onValueChange={([value]) => updateFilter('contrast', value)}
              min={50}
              max={150}
              step={1}
            />
          </div>
          
          {/* Saturation */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4" />
              <span className="text-sm font-medium">Saturation: {filters.saturation}%</span>
            </div>
            <Slider
              value={[filters.saturation]}
              onValueChange={([value]) => updateFilter('saturation', value)}
              min={0}
              max={200}
              step={1}
            />
          </div>
          
          {/* Rotation */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <RotateCw className="w-4 h-4" />
              <span className="text-sm font-medium">Rotation: {filters.rotation}°</span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateFilter('rotation', filters.rotation - 90)}
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateFilter('rotation', filters.rotation + 90)}
              >
                <RotateCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
        
        <Button onClick={applyFilters} className="w-full">
          <Download className="w-4 h-4 mr-2" />
          Apply Enhancements
        </Button>
      </CardContent>
    </Card>
  );
};

export default AdvancedImageProcessor;