
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, ArrowLeft, Share2, Copy, Eye, Trash2, Plus, Calendar, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, addDays } from 'date-fns';

interface SharedLink {
  id: string;
  licenseNumber: string;
  recipientName: string;
  expiresAt: string;
  createdAt: string;
  accessCount: number;
  isActive: boolean;
  shareUrl: string;
}

const SharedLinks = () => {
  const [sharedLinks, setSharedLinks] = useState<SharedLink[]>([
    {
      id: '1',
      licenseNumber: 'NP-12-345-678',
      recipientName: 'Traffic Police Office',
      expiresAt: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
      createdAt: format(new Date(), 'yyyy-MM-dd'),
      accessCount: 3,
      isActive: true,
      shareUrl: 'https://neplife.com/shared/abc123'
    }
  ]);
  const navigate = useNavigate();
  const { toast } = useToast();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Link Copied",
      description: "Share link has been copied to clipboard",
    });
  };

  const revokeLink = (id: string) => {
    setSharedLinks(prev => prev.map(link => 
      link.id === id ? { ...link, isActive: false } : link
    ));
    toast({
      title: "Link Revoked",
      description: "The shared link has been deactivated",
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
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-red-600 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-red-600 bg-clip-text text-transparent">
              Shared Links
            </h1>
          </div>
          <Button onClick={() => navigate('/create-share')}>
            <Plus className="w-4 h-4 mr-2" />
            Create New Link
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Share2 className="w-5 h-5" />
                Active Shared Links
              </CardTitle>
              <CardDescription>
                Manage and monitor your shared license links
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sharedLinks.length === 0 ? (
                <div className="text-center py-8">
                  <Share2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">No shared links yet</p>
                  <Button onClick={() => navigate('/create-share')}>
                    Create Your First Shared Link
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {sharedLinks.map(link => (
                    <div key={link.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold">{link.licenseNumber}</h3>
                          <p className="text-sm text-gray-600">Shared with: {link.recipientName}</p>
                        </div>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                          link.isActive 
                            ? 'bg-green-50 text-green-600' 
                            : 'bg-red-50 text-red-600'
                        }`}>
                          {link.isActive ? 'Active' : 'Revoked'}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                        <div>
                          <p className="text-gray-500">Created</p>
                          <p className="font-medium">{format(new Date(link.createdAt), 'MMM dd, yyyy')}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Expires</p>
                          <p className="font-medium">{format(new Date(link.expiresAt), 'MMM dd, yyyy')}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Access Count</p>
                          <p className="font-medium">{link.accessCount} views</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Status</p>
                          <p className="font-medium">{link.isActive ? 'Active' : 'Inactive'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mb-3">
                        <input 
                          type="text" 
                          value={link.shareUrl}
                          readOnly
                          className="flex-1 px-3 py-2 border rounded-md bg-gray-50 text-sm"
                        />
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => copyToClipboard(link.shareUrl)}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>

                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Eye className="w-3 h-3 mr-1" />
                          Preview
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => window.open(link.shareUrl, '_blank')}
                        >
                          <ExternalLink className="w-3 h-3 mr-1" />
                          Open
                        </Button>
                        {link.isActive && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => revokeLink(link.id)}
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Revoke
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SharedLinks;
