
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, CheckCircle2, AlertCircle } from "lucide-react";
import AutoFillStatus from './AutoFillStatus';
import VerificationHelper from './VerificationHelper';

interface LicenseFormHeaderProps {
  autoFilledCount: number;
  verificationStatus: Record<string, 'pending' | 'verified' | 'corrected'>;
  verifiedCount: number;
  pendingCount: number;
  showVerificationHelper: boolean;
  onCloseVerificationHelper: () => void;
  onVerifyAllFields: () => void;
}

const LicenseFormHeader = ({
  autoFilledCount,
  verificationStatus,
  verifiedCount,
  pendingCount,
  showVerificationHelper,
  onCloseVerificationHelper,
  onVerifyAllFields
}: LicenseFormHeaderProps) => {
  return (
    <>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Nepal License Details (XX-XXX-XXXXXX) {autoFilledCount > 0 ? `- ${autoFilledCount} Fields Auto-Filled` : ''}
        </CardTitle>
        <CardDescription>
          {autoFilledCount > 0 
            ? `OCR has automatically extracted ${autoFilledCount} field(s) from your Nepal driving license. Please verify each field is correct.`
            : 'Please enter your Nepal driving license details manually in XX-XXX-XXXXXX format.'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AutoFillStatus 
          autoFilledCount={autoFilledCount} 
          verificationStatus={verificationStatus} 
        />

        <VerificationHelper 
          show={showVerificationHelper && autoFilledCount > 0}
          onClose={onCloseVerificationHelper}
        />

        {/* Verification Summary and Verify All Button */}
        {autoFilledCount > 0 && (
          <Card className="mb-6 border-blue-200 bg-blue-50/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-sm text-blue-700">
                    <span className="font-medium">Verification Status:</span> {verifiedCount} verified, {pendingCount} pending
                  </div>
                </div>
                {pendingCount > 0 && (
                  <Button
                    type="button"
                    onClick={onVerifyAllFields}
                    className="bg-green-600 hover:bg-green-700 text-white"
                    size="sm"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-1" />
                    Verify All ({pendingCount})
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {autoFilledCount === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div className="text-sm text-yellow-700">
                <p className="font-medium">No auto-fill data detected</p>
                <p>Please enter your Nepal license details manually in XX-XXX-XXXXXX format. Make sure to upload a clear image for better OCR results.</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </>
  );
};

export default LicenseFormHeader;
