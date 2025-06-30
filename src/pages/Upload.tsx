import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useOfflineSync } from "@/hooks/useOfflineSync";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { processImageWithOCR } from "@/utils/ocrUtils";
import { validateLicenseData } from "@/utils/dataValidation";
import LicenseForm from "@/components/LicenseForm";
import AppHeader from "@/components/AppHeader";
import EnhancedImageUpload from "@/components/EnhancedImageUpload";
import LicenseFormSkeleton from "@/components/LicenseFormSkeleton";

const Upload = () => {
  const [user] = useLocalStorage('user', null, true);
  const [licenseData, setLicenseData] = useState({
    licenseNumber: '',
    holderName: '',
    issueDate: '',
    expiryDate: '',
    issuingAuthority: '',
    address: ''
  });
  const [uploadedImage, setUploadedImage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progressText, setProgressText] = useState('Initializing...');
  const [currentStep, setCurrentStep] = useState(1);
  const [extractedFieldsCount, setExtractedFieldsCount] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isOnline } = useOfflineSync();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
  }, [user, navigate]);

  const handleImageUpload = async (file: File) => {
    console.log('Image uploaded:', file);
    setCurrentStep(2);
    setIsProcessing(true);
    setProgressText('Starting enhanced OCR processing...');

    try {
      // Process image with enhanced OCR
      const extractedData = await processImageWithOCR(file, (progress) => {
        setProgressText(progress);
      });

      if (extractedData && Object.keys(extractedData).length > 0) {
        // Merge extracted data with existing data
        const mergedData = { ...licenseData, ...extractedData };
        setLicenseData(mergedData);
        
        const fieldsExtracted = Object.keys(extractedData).filter(key => 
          extractedData[key as keyof typeof extractedData] && 
          extractedData[key as keyof typeof extractedData] !== ''
        ).length;
        
        setExtractedFieldsCount(fieldsExtracted);
        
        toast({
          title: "Auto-Fill Complete!",
          description: `Successfully extracted ${fieldsExtracted} fields from your Nepal license. Please verify the information.`,
        });
        
        console.log('✓ Auto-fill completed:', fieldsExtracted, 'fields extracted');
      } else {
        toast({
          title: "Limited Auto-Fill",
          description: "Could not extract all details. Please fill in the form manually.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Enhanced OCR Error:", error);
      toast({
        title: "Auto-Fill Failed",
        description: "Could not automatically fill the form. Please enter details manually.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setProgressText('Ready for verification');
    }
  };

  const handleStartOCR = useCallback(async () => {
    if (!uploadedImage) {
      toast({
        title: "No Image",
        description: "Please upload a license image first.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setProgressText('Starting OCR...');
    setCurrentStep(2);

    try {
      const file = await fetch(uploadedImage).then(r => r.blob());
      const extractedData = await processImageWithOCR(file as any, (progress) => {
        setProgressText(progress);
      });

      if (extractedData) {
        setLicenseData(extractedData as any);
      } else {
        toast({
          title: "OCR Failed",
          description: "Could not extract data from the image. Please try again or enter manually.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("OCR Error:", error);
      toast({
        title: "OCR Error",
        description: error.message || "Failed to process image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [uploadedImage, toast]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setProgressText('Submitting data...');

    try {
      validateLicenseData(licenseData);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Save to local storage
      const licenses = JSON.parse(localStorage.getItem('licenses') || '[]') as any[];
      const newLicense = { ...licenseData, id: Date.now().toString(), image: uploadedImage, shared: false };
      licenses.push(newLicense);
      localStorage.setItem('licenses', JSON.stringify(licenses));

      toast({
        title: "License Saved",
        description: "Your license has been successfully saved.",
      });
      setCurrentStep(3);
    } catch (error: any) {
      console.error("Validation Error:", error);
      toast({
        title: "Validation Error",
        description: error.message || "Please check the form data.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      setProgressText('Ready');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-red-50">
      <AppHeader user={user} isOnline={isOnline} />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Enhanced Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent mb-4">
              Smart Nepal License Upload
            </h1>
            <p className="text-xl text-gray-600 mb-2">
              AI-powered automatic form filling with verification
            </p>
            <p className="text-gray-500">
              Upload your license image and our enhanced OCR will automatically extract and fill all details
            </p>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center space-x-4">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                <span className="text-sm font-medium">1</span>
              </div>
              <div className={`h-1 w-16 ${currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                <span className="text-sm font-medium">2</span>
              </div>
              <div className={`h-1 w-16 ${currentStep >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                currentStep >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                <span className="text-sm font-medium">3</span>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            {/* Step Labels */}
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-semibold text-gray-800">
                {currentStep === 1 && "Step 1: Upload & Auto-Extract"}
                {currentStep === 2 && "Step 2: Verify Auto-Filled Data"}
                {currentStep === 3 && "Step 3: Save License"}
              </h2>
              <p className="text-gray-600">
                {currentStep === 1 && "Upload your Nepal license image for automatic data extraction"}
                {currentStep === 2 && `Verify the ${extractedFieldsCount} auto-filled fields and make corrections if needed`}
                {currentStep === 3 && "Complete the process and save your verified license"}
              </p>
            </div>

            {/* Step 1: Enhanced Image Upload */}
            {currentStep === 1 && (
              <EnhancedImageUpload
                onImageSelected={handleImageUpload}
                onImageProcessed={setUploadedImage}
                isProcessing={isProcessing}
                acceptedFormats={['image/jpeg', 'image/png', 'image/webp']}
                maxSizeInMB={10}
              />
            )}

            {/* Auto-Fill Processing Status */}
            {isProcessing && (
              <Card className="border-2 border-blue-200 bg-blue-50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-center space-x-4">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <div className="text-center">
                      <p className="text-lg font-medium text-blue-800">{progressText}</p>
                      <p className="text-sm text-blue-600 mt-1">Enhanced OCR is analyzing your Nepal license...</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="bg-white rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, (progressText.includes('%') ? 
                          parseInt(progressText.match(/\d+/)?.[0] || '0') : 50))}%` }}
                      ></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 2: Enhanced License Form with Verification */}
            {currentStep === 2 && (
              <>
                {isProcessing ? (
                  <LicenseFormSkeleton />
                ) : (
                  <LicenseForm
                    licenseData={licenseData}
                    onDataChange={setLicenseData}
                    onSubmit={handleSubmit}
                    onCancel={() => setCurrentStep(1)}
                    isProcessing={isSubmitting}
                    disabled={isSubmitting}
                  />
                )}
              </>
            )}

            {/* Step 3: Success Message */}
            {currentStep === 3 && (
              <Card className="border-2 border-green-200 bg-green-50">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-green-800 mb-2">License Uploaded Successfully!</h3>
                  <p className="text-green-700 mb-4">
                    Your Nepal driving license has been automatically processed and securely stored.
                  </p>
                  <div className="bg-white rounded-lg p-4 mb-6">
                    <p className="text-sm text-gray-600">
                      <strong>Auto-Fill Results:</strong> {extractedFieldsCount} fields were automatically extracted and verified from your license image.
                    </p>
                  </div>
                  <div className="flex gap-4 justify-center">
                    <Button onClick={() => navigate('/dashboard')} className="bg-green-600 hover:bg-green-700">
                      Go to Dashboard
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setCurrentStep(1);
                        setUploadedImage('');
                        setExtractedFieldsCount(0);
                        setLicenseData({
                          licenseNumber: '',
                          holderName: '',
                          issueDate: '',
                          expiryDate: '',
                          issuingAuthority: '',
                          address: ''
                        });
                      }}
                      className="border-green-200 text-green-700 hover:bg-green-50"
                    >
                      Upload Another License
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Navigation Buttons */}
            {currentStep < 3 && uploadedImage && !isProcessing && (
              <div className="text-center">
                <Button
                  onClick={handleStartOCR}
                  disabled={isProcessing || !uploadedImage}
                  className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 px-8 py-3 text-lg font-semibold"
                >
                  {currentStep === 1 ? 'Extract License Data' : 'Process License'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Upload;
