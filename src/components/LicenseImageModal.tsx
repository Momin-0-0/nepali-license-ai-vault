
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AspectRatio } from "@/components/ui/aspect-ratio";

interface LicenseImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  licenseNumber: string;
}

const LicenseImageModal = ({ isOpen, onClose, imageUrl, licenseNumber }: LicenseImageModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>License Image - {licenseNumber}</DialogTitle>
        </DialogHeader>
        <AspectRatio ratio={16 / 10} className="bg-muted">
          <img
            src={imageUrl}
            alt={`License ${licenseNumber}`}
            className="rounded-md object-cover w-full h-full"
          />
        </AspectRatio>
      </DialogContent>
    </Dialog>
  );
};

export default LicenseImageModal;
