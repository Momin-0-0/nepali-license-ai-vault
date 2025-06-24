import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Upload, Bell, Share2, FileText, Calendar, User, LogOut, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, differenceInDays, parseISO } from 'date-fns';
import RemindersModal from "@/components/RemindersModal";

interface License {
  id: string;
  licenseNumber: string;
  issueDate: string;
  expiryDate: string;
  issuingAuthority: string;
  image?: string;
  shared: boolean;
}

const Dashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [licenses, setLicenses] = useState<License[]>([
    {
      id: '1',
      licenseNumber: 'NP-12-345-678',
      issueDate: '2023-01-15',
      expiryDate: '2025-01-15',
      issuingAuthority: 'Department of Transport Management',
      shared: false
    }
  ]);
  const [isRemindersOpen, setIsRemindersOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/login');
    } else {
      setUser(JSON.parse(userData));
    }

    // Load saved licenses from localStorage
    const savedLicenses = localStorage.getItem('licenses');
    if (savedLicenses) {
      const parsedLicenses = JSON.parse(savedLicenses);
      if (parsedLicenses.length > 0) {
        setLicenses(parsedLicenses);
      }
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    toast({
      title: "Logged out",
      description: "You have been logged out successfully",
    });
    navigate('/');
  };

  const handleRenewLicense = (licenseId: string) => {
    toast({
      title: "Renewal Process",
      description: "Redirecting to license renewal portal...",
    });
    // In a real app, this would redirect to government renewal portal
  };

  const handleEditLicense = (licenseId: string) => {
    navigate(`/edit-license/${licenseId}`);
  };

  const handleShareLicense = (licenseId: string) => {
    navigate('/create-share', { state: { licenseId } });
  };

  const handleDownloadLicense = (licenseId: string) => {
    toast({
      title: "Download Started",
      description: "Your license document is being prepared...",
    });
    // In a real app, this would generate and download the license
  };

  const getExpiryStatus = (expiryDate: string) => {
    const days = differenceInDays(parseISO(expiryDate), new Date());
    if (days < 0) return { status: 'expired', color: 'text-red-600', bg: 'bg-red-50' };
    if (days <= 7) return { status: 'critical', color: 'text-orange-600', bg: 'bg-orange-50' };
    if (days <= 30) return { status: 'warning', color: 'text-yellow-600', bg: 'bg-yellow-50' };
    return { status: 'good', color: 'text-green-600', bg: 'bg-green-50' };
  };

  const expiringLicenses = licenses.filter(license => {
    const days = differenceInDays(parseISO(license.expiryDate), new Date());
    return days <= 30 && days >= 0;
  });

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-red-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-red-600 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-red-600 bg-clip-text text-transparent">
              NepLife
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/profile')}>
              <User className="w-5 h-5 text-gray-600 mr-2" />
              <span className="text-gray-700">{user.name}</span>
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user.name}!
          </h2>
          <p className="text-gray-600">
            Manage your driving licenses and stay on top of renewals
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Button 
            onClick={() => navigate('/upload')}
            className="h-24 flex flex-col items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <Upload className="w-6 h-6" />
            Upload License
          </Button>
          <Button 
            variant="outline" 
            className="h-24 flex flex-col items-center justify-center gap-2"
            onClick={() => setIsRemindersOpen(true)}
          >
            <Bell className="w-6 h-6" />
            Reminders
          </Button>
          <Button 
            variant="outline" 
            className="h-24 flex flex-col items-center justify-center gap-2"
            onClick={() => navigate('/shared-links')}
          >
            <Share2 className="w-6 h-6" />
            Shared Links
          </Button>
          <Button 
            variant="outline" 
            className="h-24 flex flex-col items-center justify-center gap-2"
            onClick={() => navigate('/all-licenses')}
          >
            <FileText className="w-6 h-6" />
            All Licenses
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Expiring Licenses Alert */}
            {expiringLicenses.length > 0 && (
              <Card className="border-orange-200 bg-gradient-to-r from-orange-50 to-red-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-orange-700">
                    <Bell className="w-5 h-5" />
                    Expiring Soon
                  </CardTitle>
                  <CardDescription>
                    You have {expiringLicenses.length} license(s) expiring within 30 days
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {expiringLicenses.map(license => {
                    const { status, color } = getExpiryStatus(license.expiryDate);
                    const daysLeft = differenceInDays(parseISO(license.expiryDate), new Date());
                    return (
                      <div key={license.id} className="flex justify-between items-center p-3 bg-white rounded-lg mb-2 last:mb-0">
                        <div>
                          <p className="font-medium">{license.licenseNumber}</p>
                          <p className={`text-sm ${color}`}>
                            Expires in {daysLeft} day{daysLeft !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleRenewLicense(license.id)}
                        >
                          Renew
                        </Button>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            {/* My Licenses */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>My Licenses</CardTitle>
                    <CardDescription>
                      Manage all your driving licenses
                    </CardDescription>
                  </div>
                  <Button onClick={() => navigate('/upload')}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add License
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {licenses.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">No licenses uploaded yet</p>
                    <Button onClick={() => navigate('/upload')}>
                      Upload Your First License
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {licenses.map(license => {
                      const { status, color, bg } = getExpiryStatus(license.expiryDate);
                      return (
                        <div key={license.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h3 className="font-semibold text-lg">{license.licenseNumber}</h3>
                              <p className="text-sm text-gray-600">{license.issuingAuthority}</p>
                            </div>
                            <div className={`px-3 py-1 rounded-full text-xs font-medium ${bg} ${color}`}>
                              {status === 'expired' ? 'Expired' : 
                               status === 'critical' ? 'Expires Soon' :
                               status === 'warning' ? 'Expires This Month' : 'Valid'}
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                            <div>
                              <p className="text-gray-500">Issue Date</p>
                              <p className="font-medium">{format(parseISO(license.issueDate), 'MMM dd, yyyy')}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Expiry Date</p>
                              <p className="font-medium">{format(parseISO(license.expiryDate), 'MMM dd, yyyy')}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleEditLicense(license.id)}
                            >
                              Edit
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleShareLicense(license.id)}
                            >
                              Share
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleDownloadLicense(license.id)}
                            >
                              Download
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Licenses</span>
                  <span className="font-semibold">{licenses.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Active Licenses</span>
                  <span className="font-semibold text-green-600">
                    {licenses.filter(l => differenceInDays(parseISO(l.expiryDate), new Date()) > 0).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Expiring Soon</span>
                  <span className="font-semibold text-orange-600">{expiringLicenses.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shared Links</span>
                  <span className="font-semibold">{licenses.filter(l => l.shared).length}</span>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-gray-600">License uploaded</span>
                    <span className="text-gray-400 ml-auto">2h ago</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-gray-600">Account created</span>
                    <span className="text-gray-400 ml-auto">1d ago</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <RemindersModal 
        isOpen={isRemindersOpen}
        onClose={() => setIsRemindersOpen(false)}
        licenses={licenses}
      />
    </div>
  );
};

export default Dashboard;
