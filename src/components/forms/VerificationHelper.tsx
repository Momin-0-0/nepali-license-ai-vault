
import { CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VerificationHelperProps {
  show: boolean;
  onClose: () => void;
}

const VerificationHelper = ({ show, onClose }: VerificationHelperProps) => {
  if (!show) return null;

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
          <div className="text-sm text-green-700">
            <p className="font-medium mb-1">Verification Guide:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Yellow highlighted fields were auto-filled by OCR</li>
              <li>Click "✓ Correct" if the information is accurate</li>
              <li>Edit the field directly if corrections are needed</li>
              <li>All fields must be verified before saving</li>
            </ul>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-6 w-6 p-0"
        >
          <XCircle className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default VerificationHelper;
