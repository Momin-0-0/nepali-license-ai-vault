import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Shield, ArrowLeft, FileText, Search, Filter, Download, Share2, Edit, Trash2, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, differenceInDays, parseISO, isValid } from 'date-fns';

interface License {
  id: string;
  licenseNumber: string;
  issueDate: string;
  expiryDate: string;
  issuingAuthority: string;
  image?: string;
  shared: boolean;
  category: string;
}

const AllLicenses = () => {
  const [licenses, setLicenses] = useState<License[]>([
    {
      id: '1',
      licenseNumber: 'NP-12-345-678',
      issueDate: '2023-01-15',
      expiryDate: '2025-01-15',
      issuingAuthority: 'Department of Transport Management',
      shared: false,
      category: 'Motorcycle'
    },
    {
      id: '2',
      licenseNumber: 'NP-12-987-654',
      issueDate: '2022-06-20',
      expiryDate: '2024-12-31',
      issuingAuthority: 'Department of Transport Management',
      shared: true,
      category: 'Car'
    }
  ]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const navigate = useNavigate();
  const { toast } = useToast();

  const safeParseDate = (dateString: string) => {
    if (!dateString || typeof dateString !== 'string') return null;
    const parsed = parseISO(dateString);
    return isValid(parsed) ? parsed : null;
  };

  const safeFormatDate = (dateString: string, formatStr: string = 'MMM dd, yyyy') => {
    const date = safeParseDate(dateString);
    return date ? format(date, formatStr) : 'Invalid Date';
  };

  const getDaysUntilExpiry = (expiryDate: string) => {
    const date = safeParseDate(expiryDate);
    return date ? differenceInDays(date, new Date()) : null;
  };

  const getExpiryStatus = (expiryDate: string) => {
    const days = getDaysUntilExpiry(expiryDate);
    if (days === null) return { status: 'unknown', color: 'text-gray-600', bg: 'bg-gray-50' };
    if (days < 0) return { status: 'expired', color: 'text-red-600', bg: 'bg-red-50' };
    if (days <= 7) return { status: 'critical', color: 'text-orange-600', bg: 'bg-orange-50' };
    if (days <= 30) return { status: 'warning', color: 'text-yellow-600', bg: 'bg-yellow-50' };
    return { status: 'good', color: 'text-green-600', bg: 'bg-green-50' };
  };

  const filteredLicenses = licenses.filter(license => {
    const matchesSearch = license.licenseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         license.issuingAuthority.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterStatus === 'all') return matchesSearch;
    if (filterStatus === 'expired') {
      const days = getDaysUntilExpiry(license.expiryDate);
      return matchesSearch && days !== null && days < 0;
    }
    if (filterStatus === 'expiring') {
      const days = getDaysUntilExpiry(license.expiryDate);
      return matchesSearch && days !== null && days >= 0 && days <= 30;
    }
    if (filterStatus === 'valid') {
      const days = getDaysUntilExpiry(license.expiryDate);
      return matchesSearch && days !== null && days > 30;
    }
    return matchesSearch;
  });

  const handleDelete = (id: string) => {
    setLicenses(prev => prev.filter(license => license.id !== id));
    toast({
      title: "License Deleted",
      description: "The license has been removed from your account",
    });
  };

  const handleShare = (license: License) => {
    toast({
      title: "Share License",
      description: `Creating share link for ${license.licenseNumber}`,
    });
  };

  const handleDownload = (license: License) => {
    toast({
      title: "Download Started",
      description: `Downloading ${license.licenseNumber}`,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-red-50">
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
            <div className="w-12 h-12 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
              <img 
                src="/Gemini_Generated_Image_w0veeiw0veeiw0ve 1.png" 
                alt="NepLife Logo"
                className="w-full h-full object-contain bg-white"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                NepLife
              </h1>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                  AI Powered
                </Badge>
              </div>
            </div>
          </div>
          <Button onClick={() => navigate('/upload')}>
            <Plus className="w-4 h-4 mr-2" />
            Add License
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Search and Filter */}
          <Card className="mb-6">
            <CardContent className="pt-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search licenses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-3 py-2 border rounded-md"
                  >
                    <option value="all">All Status</option>
                    <option value="valid">Valid</option>
                    <option value="expiring">Expiring Soon</option>
                    <option value="expired">Expired</option>
                  </select>
                  <Button variant="outline">
                    <Filter className="w-4 h-4 mr-2" />
                    Filter
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Licenses Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLicenses.map(license => {
              const { status, color, bg } = getExpiryStatus(license.expiryDate);
              const daysLeft = getDaysUntilExpiry(license.expiryDate);
              
              return (
                <Card key={license.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{license.licenseNumber}</CardTitle>
                        <CardDescription>{license.category} License</CardDescription>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${bg} ${color}`}>
                        {status === 'expired' ? 'Expired' : 
                         status === 'critical' ? 'Critical' :
                         status === 'warning' ? 'Expiring' : 
                         status === 'unknown' ? 'Unknown' : 'Valid'}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm mb-4">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Authority:</span>
                        <span className="font-medium">{license.issuingAuthority}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Issue Date:</span>
                        <span className="font-medium">{safeFormatDate(license.issueDate)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Expiry Date:</span>
                        <span className="font-medium">{safeFormatDate(license.expiryDate)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Days Left:</span>
                        <span className={`font-medium ${color}`}>
                          {daysLeft === null ? 'Unknown' : daysLeft < 0 ? 'Expired' : `${daysLeft} days`}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" className="flex-1">
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleShare(license)}
                      >
                        <Share2 className="w-3 h-3" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleDownload(license)}
                      >
                        <Download className="w-3 h-3" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleDelete(license.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filteredLicenses.length === 0 && (
            <Card className="text-center py-8">
              <CardContent>
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No licenses found</p>
                <Button onClick={() => navigate('/upload')}>
                  Upload Your First License
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default AllLicenses;