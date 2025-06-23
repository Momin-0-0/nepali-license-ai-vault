
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
    }
  };

  const processWithOCR = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setProgress(0);

    try {
      const result = await Tesseract.recognize(
        selectedFile,
        'eng',
        {
          logger: m => {
            if (m.status === 'recognizing text') {
              setProgress(Math.round(m.progress * 100));
            }
          }
        }
      );

      const text = result.data.text;
      console.log('OCR Text:', text);

      // Extract license information using regex patterns
      const licensePatterns = {
        licenseNumber: /(?:license\s*(?:no|number)|driving\s*license)\s*:?\s*([A-Z0-9\-\s]+)/i,
        issueDate: /(?:issue\s*date|issued\s*on)\s*:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
        expiryDate: /(?:expiry\s*date|expires\s*on|valid\s*until)\s*:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
        issuingAuthority: /(?:issued\s*by|authority)\s*:?\s*([A-Za-z\s,\.]+)/i
      };

      const extracted = {
        licenseNumber: licensePatterns.licenseNumber.exec(text)?.[1]?.trim() || '',
        issueDate: licensePatterns.issueDate.exec(text)?.[1]?.trim() || '',
        expiryDate: licensePatterns.expiryDate.exec(text)?.[1]?.trim() || '',
        issuingAuthority: licensePatterns.issuingAuthority.exec(text)?.[1]?.trim() || 'Department of Transport Management'
      };

      // If patterns don't match, try to find any numbers that could be license numbers
      if (!extracted.licenseNumber) {
        const numberPattern = /([A-Z]{2}-\d{2}-\d{3}-\d{3})/;
        const match = numberPattern.exec(text);
        if (match) {
          extracted.licenseNumber = match[1];
        }
      }

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

    // Simulate saving to database
    toast({
      title: "License Saved",
      description: "Your driving license has been successfully added to your account.",
    });

    navigate('/dashboard');
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
                          // In a real app, this would open camera
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
                    <Button type="submit" className="flex-1">
                      Save License
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => navigate('/dashboard')}
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
