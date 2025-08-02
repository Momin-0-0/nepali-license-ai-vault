
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Loader2, X, CheckCircle, AlertCircle } from "lucide-react";

interface OCRProgressIndicatorProps {
  isProcessing: boolean;
  progress: number;
  currentStep: string;
  error: string | null;
  onCancel: () => void;
  onRetry?: () => void;
}

const OCRProgressIndicator = ({
  isProcessing,
  progress,
  currentStep,
  error,
  onCancel,
  onRetry
}: OCRProgressIndicatorProps) => {
  if (!isProcessing && !error && progress !== 100) return null;
  
  return (
    <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-green-50">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {error ? (
                <AlertCircle className="w-6 h-6 text-red-500" />
              ) : progress === 100 ? (
                <CheckCircle className="w-6 h-6 text-green-500" />
              ) : (
                <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
              )}
              <div>
                <p className="font-medium text-gray-800">
                  {error ? 'AI Processing Failed' : progress === 100 ? 'AI Extraction Complete!' : 'AI-Powered License Processing'}
                </p>
                <p className="text-sm text-gray-600">{currentStep}</p>
              </div>
            </div>
            
            {isProcessing && (
              <Button
                variant="outline"
                size="sm"
                onClick={onCancel}
                className="text-red-600 hover:text-red-700"
              >
                <X className="w-4 h-4 mr-1" />
                Cancel
              </Button>
            )}
          </div>
          
          {/* Progress Bar */}
          {!error && (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <div className="flex justify-between text-xs text-gray-500">
                <span>Progress</span>
                <span>{progress}%</span>
              </div>
            </div>
          )}
          
          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700 mb-2">{error}</p>
              {onRetry && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRetry}
                  className="text-red-600 hover:text-red-700"
                >
                  Try Again
                </Button>
              )}
            </div>
          )}
          
          {/* Success Message */}
          {progress === 100 && !error && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-700 font-medium">
                ✨ AI successfully extracted Nepal license data with enhanced accuracy! Please review the information below.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default OCRProgressIndicator;
