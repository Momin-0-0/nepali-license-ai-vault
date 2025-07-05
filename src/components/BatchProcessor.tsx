
import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Download,
  Zap,
  Brain,
  Clock,
  Eye
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { processImageWithOCR } from '@/utils/ocrUtils';
import { LicenseData } from '@/types/license';
import BatchVerificationModal from './BatchVerificationModal';

interface BatchItem {
  id: string;
  file: File;
  status: 'pending' | 'processing' | 'completed' | 'error' | 'verifying';
  progress: number;
  extractedData?: Partial<LicenseData>;
  error?: string;
}

interface BatchProcessorProps {
  onBatchComplete: (results: BatchItem[]) => void;
  maxFiles?: number;
}

const BatchProcessor: React.FC<BatchProcessorProps> = ({ 
  onBatchComplete, 
  maxFiles = 10 
}) => {
  const [batchItems, setBatchItems] = useState<BatchItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentProcessing, setCurrentProcessing] = useState<string | null>(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const { toast } = useToast();

  const handleFileSelection = useCallback((files: FileList) => {
    const fileArray = Array.from(files).slice(0, maxFiles);
    const newBatchItems: BatchItem[] = fileArray.map((file, index) => ({
      id: `batch-${Date.now()}-${index}`,
      file,
      status: 'pending',
      progress: 0
    }));

    setBatchItems(newBatchItems);
    toast({
      title: "Batch Upload Ready",
      description: `${fileArray.length} files prepared for AI processing`,
    });
  }, [maxFiles, toast]);

  const processBatch = useCallback(async () => {
    if (batchItems.length === 0) return;

    setIsProcessing(true);
    const results: BatchItem[] = [...batchItems];

    for (let i = 0; i < results.length; i++) {
      const item = results[i];
      setCurrentProcessing(item.id);
      
      try {
        // Update status to processing
        results[i] = { ...item, status: 'processing', progress: 0 };
        setBatchItems([...results]);

        // Simulate progress updates
        for (let progress = 10; progress <= 90; progress += 20) {
          results[i] = { ...item, status: 'processing', progress };
          setBatchItems([...results]);
          await new Promise(resolve => setTimeout(resolve, 200));
        }

        // Process with OCR
        const extractedData = await processImageWithOCR(item.file);
        
        results[i] = {
          ...item,
          status: 'verifying',
          progress: 100,
          extractedData
        };

      } catch (error) {
        results[i] = {
          ...item,
          status: 'error',
          progress: 0,
          error: error instanceof Error ? error.message : 'Processing failed'
        };
      }

      setBatchItems([...results]);
    }

    setCurrentProcessing(null);
    setIsProcessing(false);
    
    // Show verification modal for successful items
    const successfulItems = results.filter(item => item.status === 'verifying');
    if (successfulItems.length > 0) {
      setShowVerificationModal(true);
      toast({
        title: "OCR Processing Complete",
        description: `${successfulItems.length} licenses ready for verification`,
      });
    } else {
      toast({
        title: "Processing Failed",
        description: "No licenses were successfully processed",
        variant: "destructive"
      });
    }
  }, [batchItems, toast]);

  const handleVerificationComplete = (verifiedItems: BatchItem[]) => {
    // Update the batch items with the verified results
    const updatedItems = batchItems.map(item => {
      const verifiedItem = verifiedItems.find(v => v.id === item.id);
      return verifiedItem || item;
    });
    
    setBatchItems(updatedItems);
    setShowVerificationModal(false);
    onBatchComplete(updatedItems);
    
    const successCount = verifiedItems.filter(item => item.status === 'completed').length;
    toast({
      title: "Batch Verification Complete",
      description: `${successCount} licenses verified and saved`,
    });
  };

  const clearBatch = useCallback(() => {
    setBatchItems([]);
    setCurrentProcessing(null);
  }, []);

  const getStatusIcon = (status: BatchItem['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'processing':
        return <Brain className="w-4 h-4 text-blue-600 animate-pulse" />;
      case 'verifying':
        return <Eye className="w-4 h-4 text-yellow-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const overallProgress = batchItems.length > 0 
    ? (batchItems.filter(item => item.status === 'completed').length / batchItems.length) * 100
    : 0;

  const verifyingCount = batchItems.filter(item => item.status === 'verifying').length;
  const verifyingItems = batchItems.filter(item => item.status === 'verifying');

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            AI Batch Processor
            <Badge variant="secondary" className="ml-2">
              Advanced OCR
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* File Upload Area */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => e.target.files && handleFileSelection(e.target.files)}
              className="hidden"
              id="batch-upload"
              disabled={isProcessing}
            />
            <label htmlFor="batch-upload" className="cursor-pointer">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                Upload Multiple Licenses
              </h3>
              <p className="text-gray-500">
                Select up to {maxFiles} license images for batch processing
              </p>
            </label>
          </div>

          {/* Batch Progress */}
          {batchItems.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Batch Progress</h4>
                <Badge variant="outline">
                  {batchItems.filter(item => item.status === 'completed').length}/{batchItems.length}
                </Badge>
              </div>
              
              <Progress value={overallProgress} className="h-2" />
              
              <div className="flex gap-2 flex-wrap">
                <Button 
                  onClick={processBatch} 
                  disabled={isProcessing || batchItems.length === 0}
                  className="bg-gradient-to-r from-blue-600 to-purple-600"
                >
                  {isProcessing ? (
                    <>
                      <Brain className="w-4 h-4 mr-2 animate-pulse" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Start AI Processing
                    </>
                  )}
                </Button>
                
                {verifyingCount > 0 && (
                  <Button 
                    onClick={() => setShowVerificationModal(true)}
                    className="bg-yellow-600 hover:bg-yellow-700"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Verify Results ({verifyingCount})
                  </Button>
                )}
                
                <Button 
                  variant="outline" 
                  onClick={clearBatch}
                  disabled={isProcessing}
                >
                  Clear Batch
                </Button>
              </div>
            </div>
          )}

          {/* Batch Items List */}
          {batchItems.length > 0 && (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {batchItems.map((item) => (
                <div 
                  key={item.id} 
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    currentProcessing === item.id ? 'bg-blue-50 border-blue-200' : 
                    item.status === 'verifying' ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(item.status)}
                    <div>
                      <p className="font-medium text-sm">{item.file.name}</p>
                      <p className="text-xs text-gray-500">
                        {(item.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {item.status === 'processing' && (
                      <div className="w-16">
                        <Progress value={item.progress} className="h-1" />
                      </div>
                    )}
                    
                    {item.status === 'verifying' && (
                      <Badge variant="outline" className="text-yellow-600">
                        Needs Verification
                      </Badge>
                    )}
                    
                    {item.status === 'completed' && item.extractedData && (
                      <Badge variant="outline" className="text-green-600">
                        {Object.keys(item.extractedData).length} fields
                      </Badge>
                    )}
                    
                    {item.status === 'error' && (
                      <Badge variant="destructive">
                        Error
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Results Summary */}
          {batchItems.length > 0 && !isProcessing && (
            <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Processing Summary</h4>
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {batchItems.filter(item => item.status === 'completed').length}
                  </p>
                  <p className="text-gray-600">Verified</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-600">
                    {batchItems.filter(item => item.status === 'verifying').length}
                  </p>
                  <p className="text-gray-600">Pending</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">
                    {batchItems.filter(item => item.status === 'error').length}
                  </p>
                  <p className="text-gray-600">Failed</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">
                    {batchItems.reduce((sum, item) => 
                      sum + (item.extractedData ? Object.keys(item.extractedData).length : 0), 0
                    )}
                  </p>
                  <p className="text-gray-600">Fields Extracted</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Verification Modal */}
      <BatchVerificationModal
        isOpen={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
        batchItems={verifyingItems}
        onVerificationComplete={handleVerificationComplete}
      />
    </>
  );
};

export default BatchProcessor;
