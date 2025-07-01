
import { CheckCircle, RefreshCw, Eye } from "lucide-react";

interface FieldVerificationBadgeProps {
  status: 'pending' | 'verified' | 'corrected';
}

const FieldVerificationBadge = ({ status }: FieldVerificationBadgeProps) => {
  if (status === 'pending') {
    return (
      <div className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
        <Eye className="w-3 h-3" />
        Auto-filled - Please verify
      </div>
    );
  }
  
  if (status === 'verified') {
    return (
      <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
        <CheckCircle className="w-3 h-3" />
        Verified
      </div>
    );
  }
  
  if (status === 'corrected') {
    return (
      <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
        <RefreshCw className="w-3 h-3" />
        Corrected
      </div>
    );
  }
  
  return null;
};

export default FieldVerificationBadge;
