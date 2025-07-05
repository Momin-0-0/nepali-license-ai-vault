import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import AppHeader from "@/components/AppHeader";
import BatchProcessor from "@/components/BatchProcessor";
import DataExportImport from "@/components/DataExportImport";
import { useToast } from "@/hooks/use-toast";

const BatchUpload = () => {
  const [user] = useLocalStorage('user', null, true);
  const [licenses, setLicenses] = useLocalStorage<any[]>('licenses', [], true);
  const navigate = useNavigate();
  const { toast } = useToast();

  if (!user) {
    navigate('/login');
    return null;
  }

  const handleBatchComplete = (results: any[]) => {
    const successfulResults = results.filter(item => item.status === 'completed');
    
    if (successfulResults.length > 0) {
      const newLicenses = successfulResults.map((item, index) => ({
        ...item.extractedData,
        id: `batch-${Date.now()}-${index}`,
        image: URL.createObjectURL(item.file),
        shared: false,
        createdAt: new Date().toISOString()
      }));

      const updatedLicenses = [...licenses, ...newLicenses];
      setLicenses(updatedLicenses);

      toast({
        title: "Batch Processing Complete",
        description: `Successfully added ${newLicenses.length} licenses to your collection`,
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <AppHeader user={user} isOnline={true} licenses={licenses} />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/dashboard')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Advanced Processing</h1>
              <p className="text-gray-600">Batch processing and data management tools</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Batch Processor */}
            <div>
              <BatchProcessor 
                onBatchComplete={handleBatchComplete}
                maxFiles={10}
              />
            </div>

            {/* Data Export/Import */}
            <div>
              <DataExportImport />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BatchUpload;