
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { LicenseData } from '@/types/license';
import ImageUpload from '@/components/ImageUpload';
import LicenseForm from '@/components/LicenseForm';

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
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleDataExtracted = (extractedData: Partial<LicenseData>) => {
    setLicenseData(prev => ({
      ...prev,
      ...extractedData
    }));
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
            <ImageUpload onDataExtracted={handleDataExtracted} />
            <LicenseForm 
              licenseData={licenseData}
              onDataChange={setLicenseData}
              onSubmit={handleSubmit}
              onCancel={() => navigate('/dashboard')}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Upload;
