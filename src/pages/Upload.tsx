
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Shield, Upload as UploadIcon, Camera, FileText, Loader2, Check, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createWorker } from 'tesseract.js';

interface LicenseData {
  licenseNumber: string;
  holderName: string;
  issueDate: string;
  expiryDate: string;
  issuingAuthority: string;
  address: string;
}

const Upload = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrComplete, setOcrComplete] = useState(false);
  const [licenseData, setLicenseData] = useState<LicenseData>({
    licenseNumber: '',
    holderName: '',
    issueDate: '',
    expiryDate: '',
    issuingAuthority: 'Department of Transport Management',
    address: ''
  });
  const [processingStep, setProcessingStep] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 10MB",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      setOcrComplete(false);
    }
  };

  const extractLicenseInfo = (text: string): Partial<LicenseData> => {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const extracted: Partial<LicenseData> = {};

    for (const line of lines) {
      // License number patterns (Nepal format)
      if (/^[A-Z]{1,2}-?\d{2}-?\d{3}-?\d{3}$/i.test(line.replace(/\s/g, ''))) {
        extracted.licenseNumber = line.replace(/\s/g, '').toUpperCase();
      }
      
      // Date patterns
      const dateMatch = line.match(/(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
      if (dateMatch) {
        const [, year, month, day] = dateMatch;
        const formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        
        if (line.toLowerCase().includes('issue') || line.toLowerCase().includes('जारी')) {
          extracted.issueDate = formattedDate;
        } else if (line.toLowerCase().includes('expir') || line.toLowerCase().includes('समाप्त')) {
          extracted.expiryDate = formattedDate;
        }
      }

      // Name extraction (assuming it's in caps or after certain keywords)
      if (line.match(/^[A-Z\s]{3,}$/) && !line.includes('NEPAL') && !line.includes('GOVERNMENT')) {
        if (!extracted.holderName || line.length > (extracted.holderName?.length || 0)) {
          extracted.holderName = line;
        }
      }

      // Address (usually longer text with mixed case)
      if (line.length > 20 && line.includes(',') && !extracted.address) {
        extracted.address = line;
      }
    }

    return extracted;
  };

  const processImage = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setProcessingStep('Initializing OCR...');

    try {
      const worker = await createWorker('eng+nep');
      
      setProcessingStep('Processing image...');
      const { data: { text } } = await worker.recognize(selectedFile);
      
      setProcessingStep('Extracting license information...');
      const extractedData = extractLicenseInfo(text);
      
      setLicenseData(prev => ({
        ...prev,
        ...extractedData
      }));

      await worker.terminate();
      setOcrComplete(true);
      setProcessingStep('');
      
      toast({
        title: "OCR Complete",
        description: "License information extracted. Please review and edit if needed.",
      });
    } catch (error) {
      console.error('OCR Error:', error);
      toast({
        title: "OCR Failed",
        description: "Failed to process image. Please try again or enter details manually.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!licenseData.licenseNumber || !licenseData.expiryDate) {
      toast({
        title: "Missing Information",
        description: "Please fill in at least the license number and expiry date.",
        variant: "destructive",
      });
      return;
    }

    // Get existing licenses from localStorage
    const existingLicenses = JSON.parse(localStorage.getItem('licenses') || '[]');
    
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

    toast({
      title: "License Added",
      description: "Your driving license has been successfully added.",
    });

    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-red-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-red-600 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-red-600 bg-clip-text text-transparent">
              Upload License
            </h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Upload Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="w-5 h-5" />
                  Upload License Image
                </CardTitle>
                <CardDescription>
                  Take a photo or upload an image of your driving license for automatic data extraction
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  {imagePreview ? (
                    <div className="space-y-4">
                      <img 
                        src={imagePreview} 
                        alt="License preview" 
                        className="max-w-full h-64 object-contain mx-auto rounded-lg shadow-md"
                      />
                      <div className="flex gap-2 justify-center">
                        <Button 
                          variant="outline" 
                          onClick={() => fileInputRef.current?.click()}
                        >
                          Change Image
                        </Button>
                        {!ocrComplete && !isProcessing && (
                          <Button onClick={processImage}>
                            <FileText className="w-4 h-4 mr-2" />
                            Extract Data
                          </Button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <UploadIcon className="w-16 h-16 text-gray-400 mx-auto" />
                      <div>
                        <p className="text-lg font-medium text-gray-700">Upload your license image</p>
                        <p className="text-sm text-gray-500">PNG, JPG, WebP up to 10MB</p>
                      </div>
                      <Button onClick={() => fileInputRef.current?.click()}>
                        Choose File
                      </Button>
                    </div>
                  )}
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept="image/*"
                  className="hidden"
                />

                {isProcessing && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                      <span className="text-blue-700 font-medium">{processingStep}</span>
                    </div>
                  </div>
                )}

                {ocrComplete && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-600" />
                      <span className="text-green-700 font-medium">Data extracted successfully!</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Form Section */}
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
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="licenseNumber">License Number *</Label>
                    <Input
                      id="licenseNumber"
                      value={licenseData.licenseNumber}
                      onChange={(e) => setLicenseData(prev => ({...prev, licenseNumber: e.target.value.toUpperCase()}))}
                      placeholder="e.g., NP-12-345-678"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="holderName">Holder Name</Label>
                    <Input
                      id="holderName"
                      value={licenseData.holderName}
                      onChange={(e) => setLicenseData(prev => ({...prev, holderName: e.target.value}))}
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
                        onChange={(e) => setLicenseData(prev => ({...prev, issueDate: e.target.value}))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="expiryDate">Expiry Date *</Label>
                      <Input
                        id="expiryDate"
                        type="date"
                        value={licenseData.expiryDate}
                        onChange={(e) => setLicenseData(prev => ({...prev, expiryDate: e.target.value}))}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="issuingAuthority">Issuing Authority</Label>
                    <Input
                      id="issuingAuthority"
                      value={licenseData.issuingAuthority}
                      onChange={(e) => setLicenseData(prev => ({...prev, issuingAuthority: e.target.value}))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                      id="address"
                      value={licenseData.address}
                      onChange={(e) => setLicenseData(prev => ({...prev, address: e.target.value}))}
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
                    <Button type="button" variant="outline" onClick={() => navigate('/dashboard')}>
                      Cancel
                    </Button>
                    <Button type="submit" className="flex-1">
                      Save License
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Upload;
