
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle, XCircle, Edit, Save } from "lucide-react";
import { LicenseData } from '@/types/license';
import LicenseForm from './LicenseForm';

interface BatchItem {
  id: string;
  file: File;
  status: 'pending' | 'processing' | 'completed' | 'error' | 'verifying';
  progress: number;
  extractedData?: Partial<LicenseData>;
  error?: string;
}

interface BatchVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  batchItems: BatchItem[];
  onVerificationComplete: (verifiedItems: BatchItem[]) => void;
}

const BatchVerificationModal: React.FC<BatchVerificationModalProps> = ({
  isOpen,
  onClose,
  batchItems,
  onVerificationComplete
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [verifiedItems, setVerifiedItems] = useState<BatchItem[]>(batchItems);
  const [isEditing, setIsEditing] = useState(false);

  const currentItem = verifiedItems[currentIndex];
  const totalItems = verifiedItems.length;

  const handleDataChange = (newData: LicenseData) => {
    const updatedItems = [...verifiedItems];
    updatedItems[currentIndex] = {
      ...updatedItems[currentIndex],
      extractedData: newData
    };
    setVerifiedItems(updatedItems);
  };

  const handleVerifyItem = () => {
    const updatedItems = [...verifiedItems];
    updatedItems[currentIndex] = {
      ...updatedItems[currentIndex],
      status: 'completed'
    };
    setVerifiedItems(updatedItems);
    setIsEditing(false);
    
    // Move to next item if available
    if (currentIndex < totalItems - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleRejectItem = () => {
    const updatedItems = [...verifiedItems];
    updatedItems[currentIndex] = {
      ...updatedItems[currentIndex],
      status: 'error',
      error: 'Rejected by user'
    };
    setVerifiedItems(updatedItems);
    
    // Move to next item if available
    if (currentIndex < totalItems - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleFinishVerification = () => {
    onVerificationComplete(verifiedItems);
    onClose();
  };

  const completedCount = verifiedItems.filter(item => item.status === 'completed').length;
  const rejectedCount = verifiedItems.filter(item => item.status === 'error').length;

  if (!currentItem) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center justify-between">
            <span>Verify OCR Results</span>
            <div className="flex gap-2">
              <Badge variant="outline">
                {currentIndex + 1} of {totalItems}
              </Badge>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                ✓ {completedCount}
              </Badge>
              <Badge variant="secondary" className="bg-red-100 text-red-800">
                ✗ {rejectedCount}
              </Badge>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 p-6 pt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
            {/* Image Preview */}
            <div className="space-y-4">
              <h3 className="font-semibold">Original License Image</h3>
              <div className="border rounded-lg p-4 bg-gray-50">
                <img
                  src={URL.createObjectURL(currentItem.file)}
                  alt="License"
                  className="w-full h-auto max-h-64 object-contain rounded"
                />
              </div>
              
              <div className="text-sm text-gray-600">
                <p><strong>File:</strong> {currentItem.file.name}</p>
                <p><strong>Size:</strong> {(currentItem.file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            </div>

            {/* Form for Verification/Editing */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Extracted Data</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  {isEditing ? 'View Only' : 'Edit'}
                </Button>
              </div>

              <ScrollArea className="h-96">
                {currentItem.extractedData && (
                  <LicenseForm
                    licenseData={currentItem.extractedData as LicenseData}
                    onDataChange={handleDataChange}
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleVerifyItem();
                    }}
                    onCancel={() => setIsEditing(false)}
                    disabled={!isEditing}
                  />
                )}
              </ScrollArea>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="border-t p-6">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                disabled={currentIndex === 0}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                onClick={() => setCurrentIndex(Math.min(totalItems - 1, currentIndex + 1))}
                disabled={currentIndex === totalItems - 1}
              >
                Next
              </Button>
            </div>

            <div className="flex gap-2">
              <Button
                variant="destructive"
                onClick={handleRejectItem}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Reject
              </Button>
              <Button
                onClick={handleVerifyItem}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Verify & Accept
              </Button>
              {currentIndex === totalItems - 1 && (
                <Button
                  onClick={handleFinishVerification}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Finish Verification
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BatchVerificationModal;
