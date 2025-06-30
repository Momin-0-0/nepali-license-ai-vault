import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, Share2, FileText, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, differenceInDays, parseISO } from 'date-fns';
import RemindersModal from "@/components/RemindersModal";
import NotificationService from "@/components/NotificationService";
import LicenseImageModal from "@/components/LicenseImageModal";
import AppHeader from "@/components/AppHeader";
import QuickActionCard from "@/components/QuickActionCard";
import LicenseCard from "@/components/LicenseCard";
import EmptyState from "@/components/EmptyState";
import LoadingSpinner from "@/components/LoadingSpinner";
import DashboardStats from "@/components/DashboardStats";
import { useOfflineSync } from "@/hooks/useOfflineSync";
import { useLocalStorage } from "@/hooks/useLocalStorage";

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
  const [user] = useLocalStorage('user', null, true);
  const [licenses, setLicenses] = useLocalStorage<License[]>('licenses', [], true);
  const [reminders, setReminders] = useLocalStorage<any[]>('reminders', [], false);
  const [isRemindersOpen, setIsRemindersOpen] = useState(false);
  const [selectedImageLicense, setSelectedImageLicense] = useState<License | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isOnline } = useOfflineSync();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    // Simulate loading time for better UX
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  }, [user, navigate]);

  const handleLogout = useCallback(() => {
    localStorage.clear();
    toast({
      title: "Logged out",
      description: "You have been logged out successfully",
    });
    navigate('/');
  }, [toast, navigate]);

  const handleRenewLicense = useCallback((licenseId: string) => {
    toast({
      title: "Renewal Process",
      description: "Redirecting to license renewal portal...",
    });
    // In a real app, this would redirect to government renewal portal
  }, [toast]);

  const handleEditLicense = useCallback((licenseId: string) => {
    navigate(`/edit-license/${licenseId}`);
  }, [navigate]);

  const handleShareLicense = useCallback((licenseId: string) => {
    navigate('/shared-links', { state: { licenseId } });
  }, [navigate]);

  const handleDownloadLicense = useCallback((licenseId: string) => {
    toast({
      title: "Download Started",
      description: "Your license document is being prepared...",
    });
    // In a real app, this would generate and download the license
  }, [toast]);

  const getExpiryStatus = useCallback((expiryDate: string) => {
    const days = differenceInDays(parseISO(expiryDate), new Date());
    if (days < 0) return { status: 'expired', color: 'text-red-600', bg: 'bg-red-50' };
    if (days <= 7) return { status: 'critical', color: 'text-orange-600', bg: 'bg-orange-50' };
    if (days <= 30) return { status: 'warning', color: 'text-yellow-600', bg: 'bg-yellow-50' };
    return { status: 'good', color: 'text-green-600', bg: 'bg-green-50' };
  }, []);

  const expiringLicenses = licenses.filter(license => {
    const days = differenceInDays(parseISO(license.expiryDate), new Date());
    return days <= 30 && days >= 0;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-red-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading your dashboard..." />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-red-50">
      <AppHeader 
        user={user} 
        isOnline={isOnline} 
        licenses={licenses}
        showSearch={true}
        onSearch={(query) => console.log('Search:', query)}
      />

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.name || user?.firstName || 'User'}!
          </h2>
          <p className="text-gray-600">
            Manage your driving licenses and stay on top of renewals
          </p>
        </div>

        {/* Notification Service */}
        <NotificationService licenses={licenses} reminders={reminders} />

        {/* Enhanced Stats Dashboard */}
        <DashboardStats licenses={licenses} />

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <QuickActionCard
            title="Upload License"
            description="Add a new license"
            icon={Plus}
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
                    Action Required - Licenses Expiring Soon
                  </CardTitle>
                  <CardDescription>
                    You have {expiringLicenses.length} license(s) expiring within 30 days
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {expiringLicenses.map(license => {
                    const daysLeft = differenceInDays(parseISO(license.expiryDate), new Date());
                    return (
                      <div key={license.id} className="flex justify-between items-center p-3 bg-white rounded-lg mb-2 last:mb-0 shadow-sm">
                        <div>
                          <p className="font-medium">{license.licenseNumber}</p>
                          <p className="text-sm text-orange-600">
                            Expires in {daysLeft} day{daysLeft !== 1 ? 's' : ''} ({format(parseISO(license.expiryDate), 'MMM dd, yyyy')})
                          </p>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleRenewLicense(license.id)}
                          className="bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100"
                        >
                          Renew Now
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
                      Manage all your driving licenses ({licenses.length} total)
                    </CardDescription>
                  </div>
                  <Button onClick={() => navigate('/upload')} className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700">
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
                    description="Upload your first driving license to get started with managing your documents securely."
                    actionLabel="Upload Your First License"
                    onAction={() => navigate('/upload')}
                  />
                ) : (
                  <div className="space-y-4">
                    {licenses.slice(0, 3).map(license => (
                      <LicenseCard
                        key={license.id}
                        license={license}
                        onEdit={handleEditLicense}
                        onShare={handleShareLicense}
                        onDownload={handleDownloadLicense}
                        onViewImage={setSelectedImageLicense}
                      />
                    ))}
                    {licenses.length > 3 && (
                      <div className="text-center pt-4">
                        <Button 
                          variant="outline" 
                          onClick={() => navigate('/all-licenses')}
                          className="w-full"
                        >
                          View All {licenses.length} Licenses
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats - moved to top as DashboardStats component */}
            
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  {licenses.slice(0, 5).map((license, index) => (
                    <div key={license.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-gray-600 flex-1">
                        License {license.licenseNumber} {index === 0 ? 'uploaded' : 'processed'}
                      </span>
                      <span className="text-gray-400">
                        {index === 0 ? '2h ago' : `${index + 1}d ago`}
                      </span>
                    </div>
                  ))}
                  {licenses.length === 0 && (
                    <p className="text-gray-500 text-center py-4">No recent activity</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Tips */}
            <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-200">
              <CardHeader>
                <CardTitle className="text-indigo-800">💡 Pro Tips</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <p className="text-indigo-700">• Upload clear, well-lit license images for better OCR accuracy</p>
                <p className="text-indigo-700">• Set up renewal reminders 60 days before expiry</p>
                <p className="text-indigo-700">• Use shared links to provide temporary access</p>
                <p className="text-indigo-700">• Keep digital backups of all your important documents</p>
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
