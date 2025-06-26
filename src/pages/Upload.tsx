
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
    console.log('Raw OCR text:', text);
    
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const extracted: Partial<LicenseData> = {};

    console.log('Processed lines:', lines);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const upperLine = line.toUpperCase();
      
      // Enhanced license number patterns for Nepal
      // Look for patterns like "4203055074", "NP-12-345-678", etc.
      const licensePatterns = [
        /\b\d{10}\b/, // 10 digits
        /\b[A-Z]{2}[-\s]?\d{2}[-\s]?\d{3}[-\s]?\d{3}\b/, // NP-12-345-678
        /\bLIC\s*NO[\s:]*([A-Z0-9\-\s]+)/i,
        /\bLICEN[CS]E\s*NO[\s:]*([A-Z0-9\-\s]+)/i
      ];

      for (const pattern of licensePatterns) {
        const match = line.match(pattern);
        if (match) {
          const potential = match[1] || match[0];
          if (potential.replace(/\D/g, '').length >= 8) {
            extracted.licenseNumber = potential.trim().toUpperCase();
            console.log('Found license number:', extracted.licenseNumber);
            break;
          }
        }
      }

      // Enhanced name extraction - look for full name patterns
      if (upperLine.includes('NAME') || upperLine.includes('NM')) {
        const nameMatch = line.match(/(?:NAME|NM)[\s:]*(.+)/i);
        if (nameMatch) {
          extracted.holderName = nameMatch[1].trim();
          console.log('Found name from label:', extracted.holderName);
        }
      }

      // Look for capitalized names (common in licenses)
      if (line.match(/^[A-Z][a-z]+ [A-Z][a-z]+/) && 
          !upperLine.includes('NEPAL') && 
          !upperLine.includes('GOVERNMENT') &&
          !upperLine.includes('LICENSE') &&
          !upperLine.includes('CATEGORY')) {
        if (!extracted.holderName || line.length > (extracted.holderName?.length || 0)) {
          extracted.holderName = line.trim();
          console.log('Found capitalized name:', extracted.holderName);
        }
      }

      // Enhanced date extraction
      const datePatterns = [
        /\b(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})\b/, // YYYY-MM-DD or YYYY/MM/DD
        /\b(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})\b/, // DD-MM-YYYY or MM/DD/YYYY
        /\bD\.O\.I[\s:]*(\d{4}[-\/]\d{1,2}[-\/]\d{1,2})/i, // D.O.I: date
        /\bD\.O\.E[\s:]*(\d{4}[-\/]\d{1,2}[-\/]\d{1,2})/i, // D.O.E: date
      ];

      for (const pattern of datePatterns) {
        const dateMatch = line.match(pattern);
        if (dateMatch) {
          let year, month, day;
          
          if (dateMatch[1].length === 4) {
            // YYYY-MM-DD format
            [, year, month, day] = dateMatch;
          } else {
            // DD-MM-YYYY or MM-DD-YYYY format
            if (parseInt(dateMatch[1]) > 12) {
              // DD-MM-YYYY
              [, day, month, year] = dateMatch;
            } else {
              // MM-DD-YYYY
              [, month, day, year] = dateMatch;
            }
          }
          
          const formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
          
          if (upperLine.includes('ISSUE') || upperLine.includes('D.O.I') || 
              (i > 0 && lines[i-1].toUpperCase().includes('ISSUE'))) {
            extracted.issueDate = formattedDate;
            console.log('Found issue date:', extracted.issueDate);
          } else if (upperLine.includes('EXPIR') || upperLine.includes('D.O.E') || 
                     (i > 0 && lines[i-1].toUpperCase().includes('EXPIR'))) {
            extracted.expiryDate = formattedDate;
            console.log('Found expiry date:', extracted.expiryDate);
          }
        }
      }

      // Address extraction - look for common address indicators
      if (upperLine.includes('ADDRESS') || upperLine.includes('ADD:')) {
        const addressMatch = line.match(/(?:ADDRESS|ADD:)[\s:]*(.+)/i);
        if (addressMatch) {
          extracted.address = addressMatch[1].trim();
          console.log('Found address from label:', extracted.address);
        }
      }

      // Look for district/location names (common in Nepal addresses)
      if (line.includes('-') && line.length > 15 && line.includes(',')) {
        if (!extracted.address || line.length > (extracted.address?.length || 0)) {
          extracted.address = line.trim();
          console.log('Found potential address:', extracted.address);
        }
      }
    }

    // Fallback: try to extract 10-digit number if no license found
    if (!extracted.licenseNumber) {
      const allNumbers = text.match(/\b\d{10}\b/g);
      if (allNumbers && allNumbers.length > 0) {
        extracted.licenseNumber = allNumbers[0];
        console.log('Found fallback license number:', extracted.licenseNumber);
      }
    }

    console.log('Final extracted data:', extracted);
    return extracted;
  };

  const processImage = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setProcessingStep('Initializing OCR...');

    try {
      const worker = await createWorker(['eng', 'nep'], 1, {
        logger: m => {
          if (m.status === 'recognizing text') {
            setProcessingStep(`Processing... ${Math.round(m.progress * 100)}%`);
          }
        }
      });
      
      setProcessingStep('Analyzing license image...');
      
      // Configure Tesseract for better accuracy - fix the PSM type
      await worker.setParameters({
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-.,: /',
        tessedit_pageseg_mode: 6, // Changed from '6' to 6 (number instead of string)
      });

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
      
      if (Object.keys(extractedData).length > 0) {
        toast({
          title: "OCR Complete",
          description: "License information extracted. Please review and edit if needed.",
        });
      } else {
        toast({
          title: "Limited Data Found",
          description: "Please enter the license details manually.",
          variant: "destructive",
        });
      }
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
                      placeholder="e.g., NP-12-345-678 or 4203055074"
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
