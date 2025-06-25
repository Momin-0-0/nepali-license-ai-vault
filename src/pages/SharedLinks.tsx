
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Share2, QrCode, Copy, Eye, Clock, Trash2, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, differenceInDays, parseISO } from 'date-fns';

interface SharedLink {
  id: string;
  licenseId: string;
  licenseName: string;
  shareToken: string;
  expiresAt: string;
  accessCount: number;
  maxAccess?: number;
  createdAt: string;
}

const SharedLinks = () => {
  const [sharedLinks, setSharedLinks] = useState<SharedLink[]>([]);
  const [licenses, setLicenses] = useState<any[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Load shared links and licenses from localStorage
    const savedLinks = localStorage.getItem('sharedLinks');
    const savedLicenses = localStorage.getItem('licenses');
    
    if (savedLinks) {
      setSharedLinks(JSON.parse(savedLinks));
    }
    if (savedLicenses) {
      setLicenses(JSON.parse(savedLicenses));
    }
  }, []);

  const generateShareLink = (licenseId: string, expiryHours: number = 24, maxAccess?: number) => {
    const license = licenses.find(l => l.id === licenseId);
    if (!license) return;

    const shareToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000).toISOString();
    
    const newSharedLink: SharedLink = {
      id: Date.now().toString(),
      licenseId,
      licenseName: license.licenseNumber,
      shareToken,
      expiresAt,
      accessCount: 0,
      maxAccess,
      createdAt: new Date().toISOString()
    };

    const updatedLinks = [...sharedLinks, newSharedLink];
    setSharedLinks(updatedLinks);
    localStorage.setItem('sharedLinks', JSON.stringify(updatedLinks));

    toast({
      title: "Share Link Created",
      description: "Your license share link has been generated successfully.",
    });

    return newSharedLink;
  };

  const copyShareLink = (shareToken: string) => {
    const shareUrl = `${window.location.origin}/shared/${shareToken}`;
    navigator.clipboard.writeText(shareUrl);
    toast({
      title: "Link Copied",
      description: "Share link has been copied to clipboard.",
    });
  };

  const deleteSharedLink = (linkId: string) => {
    const updatedLinks = sharedLinks.filter(link => link.id !== linkId);
    setSharedLinks(updatedLinks);
    localStorage.setItem('sharedLinks', JSON.stringify(updatedLinks));
    
    toast({
      title: "Link Deleted",
      description: "Share link has been deleted.",
    });
  };

  const getExpiryStatus = (expiresAt: string) => {
    const days = differenceInDays(parseISO(expiresAt), new Date());
    if (days < 0) return { status: 'expired', color: 'destructive', text: 'Expired' };
    if (days === 0) return { status: 'today', color: 'default', text: 'Expires today' };
    if (days <= 1) return { status: 'soon', color: 'secondary', text: `${days} day left` };
    return { status: 'active', color: 'default', text: `${days} days left` };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-red-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-red-600 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-red-600 bg-clip-text text-transparent">
              Shared Links
            </h1>
          </div>
          <Button onClick={() => navigate('/dashboard')} variant="outline">
            Back to Dashboard
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Create New Share Link */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Create New Share Link
              </CardTitle>
              <CardDescription>
                Generate secure links to share your license with authorities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {licenses.map(license => (
                  <div key={license.id} className="border rounded-lg p-4">
                    <h3 className="font-semibold">{license.licenseNumber}</h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Expires: {format(parseISO(license.expiryDate), 'MMM dd, yyyy')}
                    </p>
                    <div className="space-y-2">
                      <Button 
                        size="sm" 
                        className="w-full"
                        onClick={() => generateShareLink(license.id, 24)}
                      >
                        Share (24h)
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="w-full"
                        onClick={() => generateShareLink(license.id, 168)}
                      >
                        Share (7 days)
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              
              {licenses.length === 0 && (
                <div className="text-center py-8">
                  <Share2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">No licenses available to share</p>
                  <Button onClick={() => navigate('/upload')}>
                    Upload Your First License
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Active Share Links */}
          <Card>
            <CardHeader>
              <CardTitle>Active Share Links</CardTitle>
              <CardDescription>
                Manage your currently active license share links
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sharedLinks.length === 0 ? (
                <div className="text-center py-8">
                  <QrCode className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No active share links</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sharedLinks.map(link => {
                    const { status, color, text } = getExpiryStatus(link.expiresAt);
                    const shareUrl = `${window.location.origin}/shared/${link.shareToken}`;
                    
                    return (
                      <div key={link.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold">{link.licenseName}</h3>
                            <p className="text-sm text-gray-600">
                              Created: {format(parseISO(link.createdAt), 'MMM dd, yyyy')}
                            </p>
                          </div>
                          <Badge variant={color as any}>{text}</Badge>
                        </div>
                        
                        <div className="bg-gray-50 rounded p-3 mb-3">
                          <p className="text-sm font-mono break-all">{shareUrl}</p>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Eye className="w-4 h-4" />
                              {link.accessCount} views
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {text}
                            </span>
                          </div>
                          
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => copyShareLink(link.shareToken)}
                            >
                              <Copy className="w-4 h-4 mr-1" />
                              Copy
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => deleteSharedLink(link.id)}
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>How to Share Your License</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Plus className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold mb-2">1. Create Link</h3>
                  <p className="text-sm text-gray-600">Generate a secure share link for your license</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Copy className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold mb-2">2. Copy & Share</h3>
                  <p className="text-sm text-gray-600">Copy the link and share with authorities</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Eye className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="font-semibold mb-2">3. Track Access</h3>
                  <p className="text-sm text-gray-600">Monitor who accessed your license</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SharedLinks;
