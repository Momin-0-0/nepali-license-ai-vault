
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileText, AlertCircle } from "lucide-react";
import { LicenseData } from '@/types/license';

interface LicenseFormProps {
  licenseData: LicenseData;
  onDataChange: (data: LicenseData) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

const LicenseForm = ({ licenseData, onDataChange, onSubmit, onCancel }: LicenseFormProps) => {
  const updateField = (field: keyof LicenseData, value: string) => {
    onDataChange({
      ...licenseData,
      [field]: value
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          License Details
        </CardTitle>
        <CardDescription>
          Review and edit the extracted information
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="licenseNumber">License Number *</Label>
            <Input
              id="licenseNumber"
              value={licenseData.licenseNumber}
              onChange={(e) => updateField('licenseNumber', e.target.value.toUpperCase())}
              placeholder="e.g., NP-12-345-678 or 4203055074"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="holderName">Holder Name</Label>
            <Input
              id="holderName"
              value={licenseData.holderName}
              onChange={(e) => updateField('holderName', e.target.value)}
              placeholder="Full name as on license"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="issueDate">Issue Date</Label>
              <Input
                id="issueDate"
                type="date"
                value={licenseData.issueDate}
                onChange={(e) => updateField('issueDate', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiryDate">Expiry Date *</Label>
              <Input
                id="expiryDate"
                type="date"
                value={licenseData.expiryDate}
                onChange={(e) => updateField('expiryDate', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="issuingAuthority">Issuing Authority</Label>
            <Input
              id="issuingAuthority"
              value={licenseData.issuingAuthority}
              onChange={(e) => updateField('issuingAuthority', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={licenseData.address}
              onChange={(e) => updateField('address', e.target.value)}
              placeholder="Address as on license"
              rows={3}
            />
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div className="text-sm text-yellow-700">
                <p className="font-medium">Please verify the extracted information</p>
                <p>OCR may not be 100% accurate. Please review and correct any errors before saving.</p>
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              Save License
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default LicenseForm;
