import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Shield, ArrowLeft } from "lucide-react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import AppHeader from "@/components/AppHeader";
import AnalyticsDashboard from "@/components/AnalyticsDashboard";

const Analytics = () => {
  const [user] = useLocalStorage('user', null, true);
  const [licenses] = useLocalStorage<any[]>('licenses', [], true);
  const [sharedLinks] = useLocalStorage<any[]>('sharedLinks', [], true);
  const navigate = useNavigate();

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-red-50">
      <AppHeader user={user} isOnline={true} licenses={licenses} />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/dashboard')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
              <p className="text-gray-600">Insights and statistics about your license management</p>
            </div>
          </div>

          <AnalyticsDashboard licenses={licenses} sharedLinks={sharedLinks} />
        </div>
      </div>
    </div>
  );
};

export default Analytics;