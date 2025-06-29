
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, ArrowLeft, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { LicenseData } from '@/types/license';
import ImageUpload from '@/components/ImageUpload';
import LicenseForm from '@/components/LicenseForm';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const Upload = () => {
  const [imagePreview, setImagePreview] = useState<string>('');
  const [licenseData, setLicenseData] = useState<LicenseData>({
    licenseNumber: '',
    holderName: '',
    issueDate: '',
    expiryDate: '',
    issuingAuthority: 'Department of Transport Management',
    address: ''
  });
  const [step, setStep] = useState<'upload' | 'form' | 'complete'>('upload');
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleDataExtracted = (extractedData: Partial<LicenseData>) => {
    setLicenseData(prev => ({
      ...prev,
      ...extractedData
    }));
    
    // Auto-advance to form if we have good extraction
    if (extractedData.licenseNumber || extractedData.holderName) {
      setStep('form');
      toast({
        title: "License Detected",
        description: "We've extracted some information from your license image.",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    
    if (!licenseData.licenseNumber || !licenseData.expiryDate) {
      toast({
        title: "Missing Information",
        description: "Please fill in at least the license number and expiry date.",
        variant: "destructive",
      });
      setIsProcessing(false);
      return;
    }

    try {
      // Get existing licenses from localStorage
      const existingLicenses = JSON.parse(localStorage.getItem('licenses') || '[]');
      
      // Check for duplicates
      const isDuplicate = existingLicenses.some((license: any) => 
        license.licenseNumber === licenseData.licenseNumber
      );
      
      if (isDuplicate) {
        toast({
          title: "Duplicate License",
          description: "This license number already exists in your vault.",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }
      
      // Create new license object
      const newLicense = {
        id: Date.now().toString(),
        ...licenseData,
        image: imagePreview,
        shared: false,
        createdAt: new Date().toISOString()
      };

      // Save to localStorage
      const updatedLicenses = [...existingLicenses, newLicense];
      localStorage.setItem('licenses', JSON.stringify(updatedLicenses));

      setStep('complete');
      
      setTimeout(() => {
        toast({
          title: "License Added Successfully",
          description: "Your driving license has been added to your vault.",
        });
        navigate('/dashboard');
      }, 2000);
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save license. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center gap-4 mb-8">
      <div className={`flex items-center gap-2 ${step === 'upload' ? 'text-blue-600' : 'text-green-600'}`}>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
          step === 'upload' ? 'bg-blue-100 border-2 border-blue-600' : 'bg-green-100'
        }`}>
          {step === 'upload' ? '1' : <CheckCircle className="w-5 h-5" />}
        </div>
        <span className="font-medium">Upload Image</span>
      </div>
      
      <Separator className="w-12" />
      
      <div className={`flex items-center gap-2 ${
        step === 'form' ? 'text-blue-600' : 
        step === 'complete' ? 'text-green-600' : 'text-gray-400'
      }`}>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
          step === 'form' ? 'bg-blue-100 border-2 border-blue-600' :
          step === 'complete' ? 'bg-green-100' : 'bg-gray-100'
        }`}>
          {step === 'complete' ? <CheckCircle className="w-5 h-5" /> : '2'}
        </div>
        <span className="font-medium">Enter Details</span>
      </div>
      
      <Separator className="w-12" />
      
      <div className={`flex items-center gap-2 ${
        step === 'complete' ? 'text-green-600' : 'text-gray-400'
      }`}>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
          step === 'complete' ? 'bg-green-100' : 'bg-gray-100'
        }`}>
          {step === 'complete' ? <CheckCircle className="w-5 h-5" /> : '3'}
        </div>
        <span className="font-medium">Complete</span>
      </div>
    </div>
  );

  if (step === 'complete') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-red-50 flex items-center justify-center">
        <Card className="w-full max-w-md text-center shadow-xl">
          <CardContent className="p-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">License Added!</h2>
            <p className="text-gray-600 mb-6">
              Your driving license has been successfully added to your vault.
            </p>
            <div className="w-8 h-1 bg-gradient-to-r from-blue-600 to-green-600 rounded mx-auto animate-pulse"></div>
            <p className="text-sm text-gray-500 mt-4">Redirecting to dashboard...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-red-50">
      {/* Enhanced Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/dashboard')}
                className="hover:bg-gray-100"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-red-600 rounded-lg flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-red-600 bg-clip-text text-transparent">
                    Add New License
                  </h1>
                  <p className="text-sm text-gray-600">Upload and manage your driving license</p>
                </div>
              </div>
            </div>
            
            <Badge variant="outline" className="hidden sm:inline-flex">
              Step {step === 'upload' ? '1' : '2'} of 3
            </Badge>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {renderStepIndicator()}
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className={`transition-all duration-300 ${step === 'form' ? 'lg:order-2' : ''}`}>
              <ImageUpload 
                onDataExtracted={handleDataExtracted} 
                onImageUploaded={setImagePreview}
              />
            </div>
            
            <div className={`transition-all duration-300 ${
              step === 'upload' ? 'opacity-60 pointer-events-none' : 'opacity-100'
            } ${step === 'form' ? 'lg:order-1' : ''}`}>
              <LicenseForm 
                licenseData={licenseData}
                onDataChange={setLicenseData}
                onSubmit={handleSubmit}
                onCancel={() => navigate('/dashboard')}
                isProcessing={isProcessing}
                disabled={step === 'upload'}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Upload;
