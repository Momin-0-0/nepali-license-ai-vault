
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, CreditCard, Cpu, Shield, Zap, User, MapPin, Phone, Calendar, Droplets } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useOfflineSync } from "@/hooks/useOfflineSync";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useEnhancedOCR } from "@/hooks/useEnhancedOCR";
import { validateLicenseData } from "@/utils/dataValidation";
import { LicenseData } from "@/types/license";
import LicenseForm from "@/components/LicenseForm";
import AppHeader from "@/components/AppHeader";
import EnhancedImageUpload from "@/components/EnhancedImageUpload";
import LicenseFormSkeleton from "@/components/LicenseFormSkeleton";
import OCRProgressIndicator from "@/components/OCRProgressIndicator";
import ErrorBoundaryWithRecovery from "@/components/ErrorBoundaryWithRecovery";

const Upload = () => {
  const [user] = useLocalStorage('user', null, true);
  const [licenseData, setLicenseData] = useState<LicenseData>({
    licenseNumber: '',
    holderName: '',
    issueDate: '',
    expiryDate: '',
    issuingAuthority: '',
    address: '',
    dateOfBirth: '',
    fatherOrHusbandName: '',
    citizenshipNo: '',
    passportNo: '',
    phoneNo: '',
    bloodGroup: undefined,
    category: ''
  });
  const [uploadedImage, setUploadedImage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [extractedFieldsCount, setExtractedFieldsCount] = useState(0);
  const [extractionDetails, setExtractionDetails] = useState<{[key: string]: boolean}>({});
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isOnline } = useOfflineSync();
  
  // Use the enhanced AI OCR processor hook
  const {
    processImage,
    cancelProcessing,
    isProcessing,
    progress,
    currentStep: ocrStep,
    error: ocrError
  } = useEnhancedOCR();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
  }, [user, navigate]);

  const handleImageUpload = useCallback(async (file: File) => {
    console.log('Nepal license image uploaded (XX-XXX-XXXXXX format):', file);
    setCurrentStep(2);

    try {
      const extractedData = await processImage(file);

      if (extractedData && Object.keys(extractedData).length > 0) {
        // Merge extracted data with existing data
        const mergedData: LicenseData = { 
          ...licenseData, 
          ...extractedData,
          bloodGroup: extractedData.bloodGroup && ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].includes(extractedData.bloodGroup as string) 
            ? extractedData.bloodGroup as LicenseData['bloodGroup']
            : undefined
        };
        setLicenseData(mergedData);
        
        // Track extraction success
        const extractionStatus: {[key: string]: boolean} = {};
        const fieldLabels: {[key: string]: string} = {
          licenseNumber: 'License Number (XX-XXX-XXXXXX)',
          holderName: 'Name',
          address: 'Address', 
          dateOfBirth: 'Date of Birth',
          fatherOrHusbandName: 'Father/Husband Name',
          citizenshipNo: 'Citizenship Number',
          passportNo: 'Passport Number',
          phoneNo: 'Phone Number (10 digits)',
          bloodGroup: 'Blood Group',
          issueDate: 'Date of Issue',
          expiryDate: 'Date of Expiry',
          category: 'Category',
          issuingAuthority: 'Issued By'
        };
        
        Object.keys(fieldLabels).forEach(key => {
          extractionStatus[key] = !!(extractedData[key as keyof typeof extractedData] && 
            extractedData[key as keyof typeof extractedData] !== '');
        });
        
        setExtractionDetails(extractionStatus);
        const fieldsExtracted = Object.values(extractionStatus).filter(Boolean).length;
        setExtractedFieldsCount(fieldsExtracted);
        
        const accuracy = Math.round((fieldsExtracted / Object.keys(fieldLabels).length) * 100);
        
        toast({
          title: "🎉 Nepal License Extraction Complete!",
          description: `AI extracted ${fieldsExtracted}/${Object.keys(fieldLabels).length} fields. Accuracy: ${accuracy}%`,
        });
        
        console.log('✓ Nepal license auto-fill completed:', fieldsExtracted, 'fields extracted');
      } else {
        toast({
          title: "Limited Extraction",
          description: "Some fields detected. Please review and complete manually.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Nepal License OCR Error:", error);
      toast({
        title: "Extraction Failed", 
        description: "Please ensure good lighting and try again, or enter data manually.",
        variant: "destructive",
      });
    }
  }, [licenseData, processImage, toast]);

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);

    try {
      validateLicenseData(licenseData);
      await new Promise(resolve => setTimeout(resolve, 1500));

      const licenses = JSON.parse(localStorage.getItem('licenses') || '[]') as any[];
      const newLicense = { 
        ...licenseData, 
        id: Date.now().toString(), 
        image: uploadedImage, 
        shared: false 
      };
      licenses.push(newLicense);
      localStorage.setItem('licenses', JSON.stringify(licenses));

      toast({
        title: "Nepal License Saved Successfully",
        description: "Your license data has been securely saved.",
      });
      setCurrentStep(3);
    } catch (error: any) {
      console.error("Validation Error:", error);
      toast({
        title: "Validation Error",
        description: error.message || "Please check the license form data.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [licenseData, uploadedImage, toast]);

  const handleRetryOCR = useCallback(() => {
    if (uploadedImage) {
      fetch(uploadedImage)
        .then(r => r.blob())
        .then(blob => {
          // Create a proper File object from the blob
          const file = new File([blob], 'retry-image.png', { 
            type: blob.type || 'image/png',
            lastModified: Date.now()
          });
          handleImageUpload(file);
        });
    }
  }, [uploadedImage, handleImageUpload]);

  const resetForm = useCallback(() => {
    setCurrentStep(1);
    setUploadedImage('');
    setExtractedFieldsCount(0);
    setExtractionDetails({});
    setLicenseData({
      licenseNumber: '',
      holderName: '',
      issueDate: '',
      expiryDate: '',
      issuingAuthority: '',
      address: '',
      dateOfBirth: '',
      fatherOrHusbandName: '',
      citizenshipNo: '',
      passportNo: '',
      phoneNo: '',
      bloodGroup: undefined,
      category: ''
    });
  }, []);

  return (
    <ErrorBoundaryWithRecovery>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
        <AppHeader user={user} isOnline={isOnline} />

        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="relative">
                  <CreditCard className="w-12 h-12 text-blue-600" />
                  <Cpu className="w-6 h-6 text-orange-500 absolute -top-1 -right-1" />
                </div>
                <Shield className="w-8 h-8 text-green-600" />
                <Zap className="w-8 h-8 text-yellow-500" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-green-600 to-orange-600 bg-clip-text text-transparent mb-4">
                Nepal License Scanner (XX-XXX-XXXXXX)
              </h1>
              <p className="text-xl text-gray-700 mb-2">
                🚀 Enhanced AI-powered extraction with advanced algorithms
              </p>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Multi-pass OCR with intelligent pattern recognition for superior accuracy
              </p>
            </div>

            {/* Feature Highlights */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="p-4 text-center">
                  <User className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <h3 className="font-semibold text-blue-800">Personal Data</h3>
                  <p className="text-sm text-blue-600">Name, Father/Husband, DOB</p>
                </CardContent>
              </Card>
              <Card className="border-green-200 bg-green-50">
                <CardContent className="p-4 text-center">
                  <MapPin className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <h3 className="font-semibold text-green-800">Location Info</h3>
                  <p className="text-sm text-green-600">Address, Citizenship No.</p>
                </CardContent>
              </Card>
              <Card className="border-purple-200 bg-purple-50">
                <CardContent className="p-4 text-center">
                  <Phone className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <h3 className="font-semibold text-purple-800">Contact Data</h3>
                  <p className="text-sm text-purple-600">Phone, Passport Numbers</p>
                </CardContent>
              </Card>
              <Card className="border-red-200 bg-red-50">
                <CardContent className="p-4 text-center">
                  <Droplets className="w-8 h-8 text-red-600 mx-auto mb-2" />
                  <h3 className="font-semibold text-red-800">Medical Info</h3>
                  <p className="text-sm text-red-600">Blood Group, Category</p>
                </CardContent>
              </Card>
            </div>

            {/* Progress Indicator */}
            <div className="flex items-center justify-center mb-8">
              <div className="flex items-center space-x-4">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  currentStep >= 1 ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-300 text-gray-500'
                }`}>
                  <CreditCard className="w-5 h-5" />
                </div>
                <div className={`h-1 w-20 rounded-full ${currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  currentStep >= 2 ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-300 text-gray-500'
                }`}>
                  <Zap className="w-5 h-5" />
                </div>
                <div className={`h-1 w-20 rounded-full ${currentStep >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  currentStep >= 3 ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-300 text-gray-500'
                }`}>
                  <CheckCircle className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="space-y-8">
              {/* Step Labels */}
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-semibold text-gray-800">
                  {currentStep === 1 && "Step 1: Upload Nepal License"}
                  {currentStep === 2 && "Step 2: AI Verification & Processing"}
                  {currentStep === 3 && "Step 3: Secure Storage Complete"}
                </h2>
                <p className="text-gray-600">
                  {currentStep === 1 && "Upload your Nepal license for enhanced AI extraction"}
                  {currentStep === 2 && `Verify ${extractedFieldsCount}/13+ AI-extracted fields`}
                  {currentStep === 3 && "Your Nepal license data has been securely processed"}
                </p>
              </div>

              {/* Step 1: Image Upload */}
              {currentStep === 1 && (
                <EnhancedImageUpload
                  onImageSelected={handleImageUpload}
                  onImageProcessed={setUploadedImage}
                  isProcessing={isProcessing}
                  acceptedFormats={['image/jpeg', 'image/png', 'image/webp']}
                  maxSizeInMB={10}
                />
              )}

              {/* OCR Progress */}
              <OCRProgressIndicator
                isProcessing={isProcessing}
                progress={progress}
                currentStep={ocrStep}
                error={ocrError}
                onCancel={cancelProcessing}
                onRetry={handleRetryOCR}
              />

              {/* Step 2: License Form */}
              {currentStep === 2 && !isProcessing && (
                <>
                  {/* Extraction Summary */}
                  {extractedFieldsCount > 0 && (
                    <Card className="border-green-200 bg-green-50/30">
                      <CardContent className="p-6">
                        <h3 className="text-lg font-semibold text-green-800 mb-4">
                          Nepal License Extraction Summary
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                          {Object.entries(extractionDetails).map(([field, extracted]) => {
                            const labels: {[key: string]: string} = {
                              licenseNumber: 'License No.',
                              holderName: 'Name',
                              address: 'Address',
                              dateOfBirth: 'Date of Birth',
                              fatherOrHusbandName: 'Father/Husband',
                              citizenshipNo: 'Citizenship No.',
                              passportNo: 'Passport No.',
                              phoneNo: 'Phone',
                              bloodGroup: 'Blood Group',
                              issueDate: 'Date of Issue',
                              expiryDate: 'Date of Expiry',
                              category: 'Category',
                              issuingAuthority: 'Issued By'
                            };
                            return (
                              <div key={field} className={`flex items-center gap-2 p-2 rounded ${
                                extracted ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                              }`}>
                                {extracted ? 
                                  <CheckCircle className="w-4 h-4 text-green-600" /> : 
                                  <div className="w-4 h-4 border-2 border-gray-400 rounded-full"></div>
                                }
                                <span className="text-xs">{labels[field]}</span>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  
                  <LicenseForm
                    licenseData={licenseData}
                    onDataChange={setLicenseData}
                    onSubmit={handleSubmit}
                    onCancel={() => setCurrentStep(1)}
                    isProcessing={isSubmitting}
                    disabled={isSubmitting}
                  />
                </>
              )}

              {/* Step 3: Success */}
              {currentStep === 3 && (
                <Card className="border-2 border-green-200 bg-gradient-to-r from-green-50 to-blue-50">
                  <CardContent className="p-8 text-center">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-10 h-10 text-green-600" />
                    </div>
                    <h3 className="text-3xl font-bold text-green-800 mb-2">Processing Complete! 🎉</h3>
                    <p className="text-green-700 mb-6">
                      Your Nepal driving license has been successfully processed with enhanced AI technology.
                    </p>
                    <div className="flex gap-4 justify-center">
                      <Button onClick={() => navigate('/dashboard')} className="bg-green-600 hover:bg-green-700">
                        Go to Dashboard
                      </Button>
                      <Button variant="outline" onClick={resetForm} className="border-green-200 text-green-700 hover:bg-green-50">
                        Upload Another License
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundaryWithRecovery>
  );
};

export default Upload;
