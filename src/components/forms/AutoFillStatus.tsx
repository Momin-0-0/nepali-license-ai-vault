
import { Info } from "lucide-react";

interface AutoFillStatusProps {
  autoFilledCount: number;
  verificationStatus: Record<string, 'pending' | 'verified' | 'corrected'>;
}

const AutoFillStatus = ({ autoFilledCount, verificationStatus }: AutoFillStatusProps) => {
  if (autoFilledCount === 0) return null;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div className="flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 mt-0.5" />
        <div className="text-sm text-blue-700">
          <p className="font-medium mb-2">Auto-Fill Status ({autoFilledCount} fields found):</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
            {Object.entries(verificationStatus).map(([field, status]) => (
              <div key={field} className="flex items-center gap-2">
                <span className="capitalize">{field.replace(/([A-Z])/g, ' $1').trim()}:</span>
                {status === 'verified' && (
                  <span className="text-green-600 font-medium">✓ Verified</span>
                )}
                {status === 'corrected' && (
                  <span className="text-blue-600 font-medium">✓ Corrected</span>
                )}
                {status === 'pending' && (
                  <span className="text-yellow-600 font-medium">⏳ Needs verification</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AutoFillStatus;
