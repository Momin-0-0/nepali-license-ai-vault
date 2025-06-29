import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Upload, Bell, Share2, FileText, Calendar, User, LogOut, Plus, Image } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, differenceInDays, parseISO } from 'date-fns';
import RemindersModal from "@/components/RemindersModal";
import NotificationService from "@/components/NotificationService";
import LicenseImageModal from "@/components/LicenseImageModal";
import AppHeader from "@/components/AppHeader";
import QuickActionCard from "@/components/QuickActionCard";
import LicenseCard from "@/components/LicenseCard";
import EmptyState from "@/components/EmptyState";
import { useOfflineSync } from "@/hooks/useOfflineSync";

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
  const [reminders, setReminders] = useState<any[]>([]);
  const [isRemindersOpen, setIsRemindersOpen] = useState(false);
  const [selectedImageLicense, setSelectedImageLicense] = useState<License | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isOnline, saveOfflineData, getOfflineData } = useOfflineSync();

  // Memoize the data loading function to prevent recreating it on every render
  const loadData = useCallback(async () => {
    if (dataLoaded) return;
    
    try {
      console.log('Loading offline data...');
      const savedLicenses = await getOfflineData('licenses');
      const savedReminders = await getOfflineData('reminders');
      
      console.log('Loaded licenses:', savedLicenses);
      console.log('Loaded reminders:', savedReminders);
      
      if (savedLicenses && savedLicenses.length > 0) {
        setLicenses(savedLicenses);
      }
      if (savedReminders && savedReminders.length > 0) {
        setReminders(savedReminders);
      }
      
      setDataLoaded(true);
    } catch (error) {
      console.error('Error loading offline data:', error);
      // Fallback to localStorage
      const savedLicenses = localStorage.getItem('licenses');
      const savedReminders = localStorage.getItem('reminders');
      
      if (savedLicenses) {
        const parsedLicenses = JSON.parse(savedLicenses);
        if (parsedLicenses.length > 0) {
          setLicenses(parsedLicenses);
        }
      }
      if (savedReminders) {
        setReminders(JSON.parse(savedReminders));
      }
      
      setDataLoaded(true);
    }
  }, [getOfflineData, dataLoaded]);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/login');
    } else {
      setUser(JSON.parse(userData));
    }

    // Load saved licenses and reminders
    loadData();
  }, [navigate, loadData]);

  // Save data offline when it changes - but only after initial load
  useEffect(() => {
    if (dataLoaded && licenses.length > 0) {
      console.log('Saving licenses to offline storage...');
      saveOfflineData('licenses', licenses).catch(console.error);
    }
  }, [licenses, saveOfflineData, dataLoaded]);

  useEffect(() => {
    if (dataLoaded && reminders.length > 0) {
      console.log('Saving reminders to offline storage...');
      saveOfflineData('reminders', reminders).catch(console.error);
    }
  }, [reminders, saveOfflineData, dataLoaded]);

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
      <AppHeader 
        user={user} 
        isOnline={isOnline} 
        licenses={licenses}
      />

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.name}!
          </h2>
          <p className="text-gray-600">
            Manage your driving licenses and stay on top of renewals
          </p>
        </div>

        {/* Notification Service */}
        <NotificationService licenses={licenses} reminders={reminders} />

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <QuickActionCard
            title="Upload License"
            description="Add a new license"
            icon={Upload}
            onClick={() => navigate('/upload')}
            variant="primary"
          />
          <QuickActionCard
            title="Reminders"
            description="Manage notifications"
            icon={Bell}
            onClick={() => setIsRemindersOpen(true)}
          />
          <QuickActionCard
            title="Shared Links"
            description="View shared licenses"
            icon={Share2}
            onClick={() => navigate('/shared-links')}
          />
          <QuickActionCard
            title="All Licenses"
            description="Browse all licenses"
            icon={FileText}
            onClick={() => navigate('/all-licenses')}
          />
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
                    const daysLeft = differenceInDays(parseISO(license.expiryDate), new Date());
                    return (
                      <div key={license.id} className="flex justify-between items-center p-3 bg-white rounded-lg mb-2 last:mb-0">
                        <div>
                          <p className="font-medium">{license.licenseNumber}</p>
                          <p className="text-sm text-orange-600">
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
                  <EmptyState
                    icon={FileText}
                    title="No licenses uploaded yet"
                    description="Upload your first driving license to get started with managing your documents."
                    actionLabel="Upload Your First License"
                    onAction={() => navigate('/upload')}
                  />
                ) : (
                  <div className="space-y-4">
                    {licenses.map(license => (
                      <LicenseCard
                        key={license.id}
                        license={license}
                        onEdit={handleEditLicense}
                        onShare={handleShareLicense}
                        onDownload={handleDownloadLicense}
                        onViewImage={setSelectedImageLicense}
                      />
                    ))}
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
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Licenses</span>
                  <span className="font-semibold text-2xl">{licenses.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Active Licenses</span>
                  <span className="font-semibold text-2xl text-green-600">
                    {licenses.filter(l => differenceInDays(parseISO(l.expiryDate), new Date()) > 0).length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Expiring Soon</span>
                  <span className="font-semibold text-2xl text-orange-600">{expiringLicenses.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Shared Links</span>
                  <span className="font-semibold text-2xl text-blue-600">{licenses.filter(l => l.shared).length}</span>
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
                  <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-gray-600 flex-1">License uploaded</span>
                    <span className="text-gray-400">2h ago</span>
                  </div>
                  <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-gray-600 flex-1">Account created</span>
                    <span className="text-gray-400">1d ago</span>
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

      {selectedImageLicense?.image && (
        <LicenseImageModal
          isOpen={!!selectedImageLicense}
          onClose={() => setSelectedImageLicense(null)}
          imageUrl={selectedImageLicense.image}
          licenseNumber={selectedImageLicense.licenseNumber}
        />
      )}
    </div>
  );
};

export default Dashboard;
