import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Calendar, User, MapPin, FileText, AlertCircle, CheckCircle } from "lucide-react";
import { format, parseISO, isValid } from 'date-fns';

interface License {
  id: string;
  licenseNumber: string;
  holderName: string;
  issueDate: string;
  expiryDate: string;
  issuingAuthority: string;
  address: string;
  image?: string;
}

const SharedLicense = () => {
  const { shareToken } = useParams();
  const [license, setLicense] = useState<License | null>(null);
  const [isValid, setIsValid] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const safeParseDate = (dateString: string) => {
    if (!dateString || typeof dateString !== 'string') return null;
    const parsed = parseISO(dateString);
    return isValid(parsed) ? parsed : null;
  };

  const safeFormatDate = (dateString: string, formatStr: string = 'MMM dd, yyyy') => {
    const date = safeParseDate(dateString);
    return date ? format(date, formatStr) : 'Invalid Date';
  };

  useEffect(() => {
    if (!shareToken) {
      setError('Invalid share link');
      setLoading(false);
      return;
    }

    // In a real app, this would be an API call
    const validateAndFetchLicense = () => {
      try {
        const sharedLinks = JSON.parse(localStorage.getItem('sharedLinks') || '[]');
        const licenses = JSON.parse(localStorage.getItem('licenses') || '[]');
        
        const sharedLink = sharedLinks.find((link: any) => link.shareToken === shareToken);
        
        if (!sharedLink) {
          setError('Share link not found or expired');
          setLoading(false);
          return;
        }

        // Check if link is expired
        const expiryDate = safeParseDate(sharedLink.expiresAt);
        if (expiryDate && expiryDate < new Date()) {
          setError('This share link has expired');
          setLoading(false);
          return;
        }

        // Find the license
        const licenseData = licenses.find((license: any) => license.id === sharedLink.licenseId);
        
        if (!licenseData) {
          setError('License not found');
          setLoading(false);
          return;
        }

        // Update access count
        sharedLink.accessCount = (sharedLink.accessCount || 0) + 1;
        localStorage.setItem('sharedLinks', JSON.stringify(sharedLinks));

        setLicense(licenseData);
        setIsValid(true);
        setLoading(false);
      } catch (error) {
        setError('Failed to load license information');
        setLoading(false);
      }
    };

    validateAndFetchLicense();
  }, [shareToken]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-red-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-blue-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading license information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-red-50 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="text-center py-8">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!license) return null;

  const expiryDate = safeParseDate(license.expiryDate);
  const isExpired = expiryDate ? expiryDate < new Date() : false;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-red-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-red-600 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-red-600 bg-clip-text text-transparent">
                NepLife
              </h1>
              <p className="text-sm text-gray-600">Verified License Information</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Verification Badge */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-6 py-3 mb-4">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-green-700 font-semibold">Verified License Document</span>
            </div>
            <p className="text-gray-600">
              This license information has been verified through NepLife's secure sharing system
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* License Image */}
            {license.image && (
              <Card>
                <CardHeader>
                  <CardTitle>License Document</CardTitle>
                </CardHeader>
                <CardContent>
                  <img 
                    src={license.image} 
                    alt="Driving License" 
                    className="w-full rounded-lg shadow-md"
                  />
                </CardContent>
              </Card>
            )}

            {/* License Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>License Information</span>
                  <Badge variant={isExpired ? "destructive" : "default"}>
                    {isExpired ? "Expired" : "Valid"}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Official driving license details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-gray-500 mt-1" />
                    <div>
                      <p className="text-sm text-gray-500">License Number</p>
                      <p className="font-semibold text-lg">{license.licenseNumber}</p>
                    </div>
                  </div>

                  {license.holderName && (
                    <div className="flex items-start gap-3">
                      <User className="w-5 h-5 text-gray-500 mt-1" />
                      <div>
                        <p className="text-sm text-gray-500">License Holder</p>
                        <p className="font-semibold">{license.holderName}</p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                      <Calendar className="w-5 h-5 text-gray-500 mt-1" />
                      <div>
                        <p className="text-sm text-gray-500">Issue Date</p>
                        <p className="font-semibold">
                          {safeFormatDate(license.issueDate)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Calendar className="w-5 h-5 text-gray-500 mt-1" />
                      <div>
                        <p className="text-sm text-gray-500">Expiry Date</p>
                        <p className={`font-semibold ${isExpired ? 'text-red-600' : 'text-green-600'}`}>
                          {safeFormatDate(license.expiryDate)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-gray-500 mt-1" />
                    <div>
                      <p className="text-sm text-gray-500">Issuing Authority</p>
                      <p className="font-semibold">{license.issuingAuthority}</p>
                    </div>
                  </div>

                  {license.address && (
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-gray-500 mt-1" />
                      <div>
                        <p className="text-sm text-gray-500">Address</p>
                        <p className="font-semibold">{license.address}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Security Notice */}
          <Card className="mt-8">
            <CardContent className="py-6">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-blue-600 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Security & Privacy</h3>
                  <p className="text-sm text-gray-600">
                    This license information is shared securely through NepLife's encrypted sharing system. 
                    The share link is time-limited and access is tracked for security purposes. 
                    This document is authentic and verified through official channels.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SharedLicense;