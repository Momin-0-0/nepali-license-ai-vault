
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut } from "lucide-react";
import { AspectRatio } from "@/components/ui/aspect-ratio";

interface LicenseImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  licenseNumber: string;
}

const LicenseImageModal = ({ isOpen, onClose, imageUrl, licenseNumber }: LicenseImageModalProps) => {
  const [zoom, setZoom] = useState(1);

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 0.5));
  };

  const resetZoom = () => {
    setZoom(1);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>License Image - {licenseNumber}</span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomOut}
                disabled={zoom <= 0.5}
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-sm font-medium min-w-[60px] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomIn}
                disabled={zoom >= 3}
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={resetZoom}
              >
                Reset
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>
        <div className="overflow-auto max-h-[calc(90vh-120px)]">
          <AspectRatio ratio={16 / 10} className="bg-muted">
            <img
              src={imageUrl}
              alt={`License ${licenseNumber}`}
              className="rounded-md object-contain w-full h-full transition-transform duration-200"
              style={{ 
                transform: `scale(${zoom})`,
                transformOrigin: 'center center'
              }}
            />
          </AspectRatio>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LicenseImageModal;
