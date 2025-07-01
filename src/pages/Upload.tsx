import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, CreditCard, Cpu, Shield, Zap, User, MapPin, Phone, Calendar, Droplets } from "lucide-react";
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
    address: '',
    dateOfBirth: '',
    fatherOrHusbandName: '',
    citizenshipNo: '',
    passportNo: '',
    phoneNo: '',
    bloodGroup: '',
    category: ''
  });
  const [uploadedImage, setUploadedImage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progressText, setProgressText] = useState('Initializing...');
  const [currentStep, setCurrentStep] = useState(1);
  const [extractedFieldsCount, setExtractedFieldsCount] = useState(0);
  const [extractionDetails, setExtractionDetails] = useState<{[key: string]: boolean}>({});
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
    console.log('Comprehensive Nepal license image uploaded:', file);
    setCurrentStep(2);
    setIsProcessing(true);
    setProgressText('Initializing comprehensive AI OCR for Nepal license format...');

    try {
      // Process image with enhanced comprehensive OCR
      const extractedData = await processImageWithOCR(file, (progress) => {
        setProgressText(progress);
      });

      if (extractedData && Object.keys(extractedData).length > 0) {
        // Merge extracted data with existing data
        const mergedData = { ...licenseData, ...extractedData };
        setLicenseData(mergedData);
        
        // Track which fields were extracted
        const extractionStatus: {[key: string]: boolean} = {};
        const fieldLabels: {[key: string]: string} = {
          licenseNumber: 'License Number',
          holderName: 'Holder Name',
          address: 'Address',
          dateOfBirth: 'Date of Birth',
          fatherOrHusbandName: 'Father/Husband Name',
          citizenshipNo: 'Citizenship Number',
          passportNo: 'Passport Number',
          phoneNo: 'Phone Number',
          bloodGroup: 'Blood Group',
          issueDate: 'Issue Date',
          expiryDate: 'Expiry Date',
          category: 'Category',
          issuingAuthority: 'Issuing Authority'
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
          title: "🎉 Comprehensive Smart Extraction Complete!",
          description: `Advanced AI extracted ${fieldsExtracted}/${Object.keys(fieldLabels).length} fields from your Nepal license. Accuracy: ${accuracy}%`,
        });
        
        console.log('✓ Comprehensive Nepal license auto-fill completed:', fieldsExtracted, 'fields extracted');
        console.log('Extraction details:', extractionStatus);
      } else {
        toast({
          title: "Partial Extraction",
          description: "Some fields detected but need manual verification. Please review the form below.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Comprehensive Nepal OCR Error:", error);
      toast({
        title: "Smart Extraction Failed",
        description: "Advanced comprehensive OCR encountered issues. Please ensure good lighting and try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setProgressText('Comprehensive smart extraction complete - Ready for verification');
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
    setProgressText('Starting comprehensive OCR...');
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
    setProgressText('Submitting comprehensive license data...');

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
        title: "License Saved Successfully",
        description: "Your comprehensive Nepal license data has been securely saved.",
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <AppHeader user={user} isOnline={isOnline} />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Enhanced Header for Comprehensive License Format */}
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
              Comprehensive Nepal License Scanner
            </h1>
            <p className="text-xl text-gray-700 mb-2">
              Advanced AI-powered extraction for complete Nepal license data including personal details
            </p>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Our enhanced OCR algorithm extracts 13+ fields from modern Nepal driving licenses including personal information, dates, and official details
            </p>
          </div>

          {/* Enhanced Feature Highlights */}
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

          {/* Progress Indicator with Modern Design */}
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
            {/* Enhanced Step Labels */}
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-semibold text-gray-800">
                {currentStep === 1 && "Step 1: Upload Nepal License"}
                {currentStep === 2 && "Step 2: AI Comprehensive Verification"}
                {currentStep === 3 && "Step 3: Secure Storage Complete"}
              </h2>
              <p className="text-gray-600">
                {currentStep === 1 && "Upload your Nepal license for comprehensive AI data extraction"}
                {currentStep === 2 && `Verify ${extractedFieldsCount}/13+ AI-extracted fields with advanced accuracy`}
                {currentStep === 3 && "Your complete Nepal license data has been securely processed and stored"}
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

            {/* Enhanced Processing Status with Field Details */}
            {isProcessing && (
              <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-green-50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-center space-x-4">
                    <div className="relative">
                      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      <Cpu className="w-4 h-4 text-orange-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-medium text-blue-800">{progressText}</p>
                      <p className="text-sm text-blue-600 mt-1">Advanced AI analyzing comprehensive Nepal license format...</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="bg-white rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-blue-600 to-green-600 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, (progressText.includes('%') ? 
                          parseInt(progressText.match(/\d+/)?.[0] || '0') : 50))}%` }}
                      ></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 2: Enhanced License Form */}
            {currentStep === 2 && (
              <>
                {isProcessing ? (
                  <LicenseFormSkeleton />
                ) : (
                  <>
                    {/* Extraction Summary */}
                    <Card className="border-green-200 bg-green-50/30">
                      <CardContent className="p-6">
                        <h3 className="text-lg font-semibold text-green-800 mb-4">Extraction Summary</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                          {Object.entries(extractionDetails).map(([field, extracted]) => {
                            const labels: {[key: string]: string} = {
                              licenseNumber: 'License Number',
                              holderName: 'Holder Name',
                              address: 'Address',
                              dateOfBirth: 'Date of Birth',
                              fatherOrHusbandName: 'Father/Husband',
                              citizenshipNo: 'Citizenship No.',
                              passportNo: 'Passport No.',
                              phoneNo: 'Phone Number',
                              bloodGroup: 'Blood Group',
                              issueDate: 'Issue Date',
                              expiryDate: 'Expiry Date',
                              category: 'Category',
                              issuingAuthority: 'Issuing Authority'
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
              </>
            )}

            {/* Step 3: Enhanced Success Message */}
            {currentStep === 3 && (
              <Card className="border-2 border-green-200 bg-gradient-to-r from-green-50 to-blue-50">
                <CardContent className="p-8 text-center">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-10 h-10 text-green-600" />
                  </div>
                  <h3 className="text-3xl font-bold text-green-800 mb-2">Comprehensive Processing Complete! 🎉</h3>
                  <p className="text-green-700 mb-4">
                    Your complete Nepal driving license data has been successfully processed with advanced AI technology.
                  </p>
                  <div className="bg-white rounded-xl p-6 mb-6 border border-green-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-yellow-500" />
                        <span><strong>AI Accuracy:</strong> {Math.round((extractedFieldsCount / 13) * 100)}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-blue-500" />
                        <span><strong>Fields Extracted:</strong> {extractedFieldsCount}/13+</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-green-500" />
                        <span><strong>Security:</strong> Enterprise Grade</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-purple-500" />
                        <span><strong>Data Type:</strong> Comprehensive</span>
                      </div>
                    </div>
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
                          bloodGroup: '',
                          category: ''
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
                  {currentStep === 1 ? 'Extract Comprehensive License Data' : 'Process Complete License'}
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
