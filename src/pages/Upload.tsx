import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Shield, Upload, Camera, FileText, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Tesseract from 'tesseract.js';

const UploadPage = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [extractedData, setExtractedData] = useState({
    licenseNumber: '',
    issueDate: '',
    expiryDate: '',
    issuingAuthority: ''
  });
  const [showPreview, setShowPreview] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast({
          title: "File too large",
          description: "Please select a file smaller than 10MB",
          variant: "destructive",
        });
        return;
      }

      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Please select a JPG, PNG, or PDF file",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      
      console.log('File selected:', file.name, 'Size:', file.size, 'Type:', file.type);
    }
  };

  const processWithOCR = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setProgress(0);

    try {
      console.log('Starting OCR processing for:', selectedFile.name);
      
      const result = await Tesseract.recognize(
        selectedFile,
        'eng',
        {
          logger: m => {
            console.log('OCR Progress:', m);
            if (m.status === 'recognizing text') {
              setProgress(Math.round(m.progress * 100));
            }
          }
        }
      );

      const text = result.data.text;
      console.log('Raw OCR Text:', text);

      // Clean and preprocess the text
      const cleanText = text
        .replace(/\n/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      
      console.log('Cleaned OCR Text:', cleanText);

      // Enhanced extraction patterns for better matching
      const extracted = {
        licenseNumber: extractLicenseNumber(cleanText),
        issueDate: extractDate(cleanText, ['issue', 'issued', 'doi']),
        expiryDate: extractDate(cleanText, ['expiry', 'expires', 'valid until', 'doe', 'exp']),
        issuingAuthority: extractAuthority(cleanText)
      };

      console.log('Extracted data:', extracted);
      setExtractedData(extracted);
      
      toast({
        title: "OCR Processing Complete",
        description: "License information has been extracted. Please verify the details.",
      });

    } catch (error) {
      console.error('OCR Error:', error);
      toast({
        title: "OCR Processing Failed",
        description: "Failed to extract text from the image. Please try again or enter details manually.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  // Helper function to extract license number
  const extractLicenseNumber = (text: string): string => {
    const patterns = [
      // Nepal license format: NP-XX-XXX-XXX
      /NP-\d{2}-\d{3}-\d{3}/i,
      // Alternative Nepal format: NPXX-XXXXXX
      /NP\d{2}-\d{6}/i,
      // General patterns
      /(?:license\s*(?:no|number|#)|dl\s*(?:no|number|#))\s*:?\s*([A-Z0-9\-\s]{6,20})/i,
      /(?:driving\s*license)\s*:?\s*([A-Z0-9\-\s]{6,20})/i,
      // Look for sequences that could be license numbers
      /([A-Z]{2,3}-?\d{2,3}-?\d{3,6})/i,
      /([A-Z]{2}\d{8,12})/i,
      // Fallback: any alphanumeric sequence 8-15 characters
      /([A-Z0-9]{8,15})/i
    ];

    for (const pattern of patterns) {
      const match = pattern.exec(text);
      if (match) {
        const licenseNumber = match[1] || match[0];
        console.log('Found license number:', licenseNumber);
        return licenseNumber.trim().replace(/\s+/g, '');
      }
    }

    return '';
  };

  // Helper function to extract dates
  const extractDate = (text: string, keywords: string[]): string => {
    for (const keyword of keywords) {
      const patterns = [
        // DD/MM/YYYY or DD-MM-YYYY
        new RegExp(`${keyword}\\s*:?\\s*(\\d{1,2}[\/\\-]\\d{1,2}[\/\\-]\\d{2,4})`, 'i'),
        // YYYY/MM/DD or YYYY-MM-DD
        new RegExp(`${keyword}\\s*:?\\s*(\\d{4}[\/\\-]\\d{1,2}[\/\\-]\\d{1,2})`, 'i'),
        // DD MMM YYYY (e.g., 15 Jan 2025)
        new RegExp(`${keyword}\\s*:?\\s*(\\d{1,2}\\s+[A-Za-z]{3,9}\\s+\\d{4})`, 'i'),
        // MMM DD, YYYY (e.g., Jan 15, 2025)
        new RegExp(`${keyword}\\s*:?\\s*([A-Za-z]{3,9}\\s+\\d{1,2},?\\s+\\d{4})`, 'i')
      ];

      for (const pattern of patterns) {
        const match = pattern.exec(text);
        if (match) {
          let dateStr = match[1].trim();
          console.log(`Found ${keyword} date:`, dateStr);
          
          // Try to convert to YYYY-MM-DD format
          const convertedDate = convertToStandardDate(dateStr);
          if (convertedDate) {
            return convertedDate;
          }
          return dateStr;
        }
      }
    }

    return '';
  };

  // Helper function to extract issuing authority
  const extractAuthority = (text: string): string => {
    const patterns = [
      /(?:issued\s*by|authority|government)\s*:?\s*([A-Za-z\s,\.]{10,50})/i,
      /(?:department\s*of\s*transport)/i,
      /(?:transport\s*management)/i,
      /(?:government\s*of\s*nepal)/i
    ];

    for (const pattern of patterns) {
      const match = pattern.exec(text);
      if (match) {
        const authority = match[1] || match[0];
        console.log('Found authority:', authority);
        return authority.trim();
      }
    }

    // Default for Nepal
    return 'Department of Transport Management';
  };

  // Helper function to convert various date formats to YYYY-MM-DD
  const convertToStandardDate = (dateStr: string): string => {
    try {
      // Handle DD/MM/YYYY or DD-MM-YYYY
      const ddmmyyyy = /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/.exec(dateStr);
      if (ddmmyyyy) {
        const day = ddmmyyyy[1].padStart(2, '0');
        const month = ddmmyyyy[2].padStart(2, '0');
        let year = ddmmyyyy[3];
        if (year.length === 2) {
          year = '20' + year;
        }
        return `${year}-${month}-${day}`;
      }

      // Handle YYYY/MM/DD or YYYY-MM-DD
      const yyyymmdd = /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/.exec(dateStr);
      if (yyyymmdd) {
        const year = yyyymmdd[1];
        const month = yyyymmdd[2].padStart(2, '0');
        const day = yyyymmdd[3].padStart(2, '0');
        return `${year}-${month}-${day}`;
      }

      // Handle month names
      const monthNames = {
        'jan': '01', 'january': '01',
        'feb': '02', 'february': '02',
        'mar': '03', 'march': '03',
        'apr': '04', 'april': '04',
        'may': '05',
        'jun': '06', 'june': '06',
        'jul': '07', 'july': '07',
        'aug': '08', 'august': '08',
        'sep': '09', 'september': '09',
        'oct': '10', 'october': '10',
        'nov': '11', 'november': '11',
        'dec': '12', 'december': '12'
      };

      // Handle DD MMM YYYY
      const ddmmmyyyy = /(\d{1,2})\s+([A-Za-z]{3,9})\s+(\d{4})/.exec(dateStr);
      if (ddmmmyyyy) {
        const day = ddmmmyyyy[1].padStart(2, '0');
        const monthName = ddmmmyyyy[2].toLowerCase();
        const year = ddmmmyyyy[3];
        const month = monthNames[monthName as keyof typeof monthNames];
        if (month) {
          return `${year}-${month}-${day}`;
        }
      }

      // Handle MMM DD, YYYY
      const mmmddyyyy = /([A-Za-z]{3,9})\s+(\d{1,2}),?\s+(\d{4})/.exec(dateStr);
      if (mmmddyyyy) {
        const monthName = mmmddyyyy[1].toLowerCase();
        const day = mmmddyyyy[2].padStart(2, '0');
        const year = mmmddyyyy[3];
        const month = monthNames[monthName as keyof typeof monthNames];
        if (month) {
          return `${year}-${month}-${day}`;
        }
      }

    } catch (error) {
      console.error('Date conversion error:', error);
    }

    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!extractedData.licenseNumber || !extractedData.expiryDate) {
      toast({
        title: "Missing Information",
        description: "Please fill in at least the license number and expiry date.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    console.log('Saving license data:', extractedData);

    try {
      // Create license data object
      const licenseData = {
        id: Date.now().toString(),
        licenseNumber: extractedData.licenseNumber,
        issueDate: extractedData.issueDate,
        expiryDate: extractedData.expiryDate,
        issuingAuthority: extractedData.issuingAuthority,
        image: previewUrl,
        shared: false,
        uploadDate: new Date().toISOString()
      };

      // Save to localStorage (in a real app, this would be saved to a database)
      const existingLicenses = JSON.parse(localStorage.getItem('licenses') || '[]');
      existingLicenses.push(licenseData);
      localStorage.setItem('licenses', JSON.stringify(existingLicenses));
      
      console.log('License saved successfully:', licenseData);
      
      toast({
        title: "License Saved Successfully",
        description: `License ${extractedData.licenseNumber} has been added to your account.`,
      });

      // Clear form and redirect to dashboard
      setSelectedFile(null);
      setPreviewUrl('');
      setExtractedData({
        licenseNumber: '',
        issueDate: '',
        expiryDate: '',
        issuingAuthority: ''
      });

      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);

    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save your license. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-red-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/dashboard')}
              className="mr-2"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
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
                  <Upload className="w-5 h-5" />
                  Upload Document
                </CardTitle>
                <CardDescription>
                  Upload your driving license image or PDF file
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!selectedFile ? (
                  <div className="space-y-4">
                    <div 
                      className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-lg font-medium text-gray-700 mb-2">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-sm text-gray-500">
                        JPG, PNG or PDF (max 10MB)
                      </p>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Choose File
                      </Button>
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => {
                          toast({
                            title: "Camera Feature",
                            description: "Camera integration will be implemented with mobile access",
                          });
                        }}
                      >
                        <Camera className="w-4 h-4 mr-2" />
                        Take Photo
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-gray-600">Preview</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowPreview(!showPreview)}
                        >
                          {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                      {showPreview && (
                        <div className="border rounded-lg overflow-hidden">
                          <img 
                            src={previewUrl} 
                            alt="License preview" 
                            className="w-full h-48 object-cover"
                          />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        onClick={processWithOCR}
                        disabled={isProcessing}
                        className="flex-1"
                      >
                        {isProcessing ? "Processing..." : "Extract Data with AI"}
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => {
                          setSelectedFile(null);
                          setPreviewUrl('');
                          setExtractedData({
                            licenseNumber: '',
                            issueDate: '',
                            expiryDate: '',
                            issuingAuthority: ''
                          });
                        }}
                      >
                        Remove
                      </Button>
                    </div>

                    {isProcessing && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Processing with AI OCR...</span>
                          <span>{progress}%</span>
                        </div>
                        <Progress value={progress} className="w-full" />
                      </div>
                    )}
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </CardContent>
            </Card>

            {/* Form Section */}
            <Card>
              <CardHeader>
                <CardTitle>License Details</CardTitle>
                <CardDescription>
                  Verify and edit the extracted information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="licenseNumber">License Number *</Label>
                    <Input
                      id="licenseNumber"
                      value={extractedData.licenseNumber}
                      onChange={(e) => setExtractedData(prev => ({
                        ...prev,
                        licenseNumber: e.target.value
                      }))}
                      placeholder="e.g., NP-12-345-678"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="issueDate">Issue Date</Label>
                    <Input
                      id="issueDate"
                      type="date"
                      value={extractedData.issueDate}
                      onChange={(e) => setExtractedData(prev => ({
                        ...prev,
                        issueDate: e.target.value
                      }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expiryDate">Expiry Date *</Label>
                    <Input
                      id="expiryDate"
                      type="date"
                      value={extractedData.expiryDate}
                      onChange={(e) => setExtractedData(prev => ({
                        ...prev,
                        expiryDate: e.target.value
                      }))}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="issuingAuthority">Issuing Authority</Label>
                    <Input
                      id="issuingAuthority"
                      value={extractedData.issuingAuthority}
                      onChange={(e) => setExtractedData(prev => ({
                        ...prev,
                        issuingAuthority: e.target.value
                      }))}
                      placeholder="Department of Transport Management"
                    />
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button 
                      type="submit" 
                      className="flex-1"
                      disabled={isSaving}
                    >
                      {isSaving ? "Saving..." : "Save License"}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => navigate('/dashboard')}
                      disabled={isSaving}
                    >
                      Cancel
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

export default UploadPage;
