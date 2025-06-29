
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  FileText, 
  Upload, 
  Share2, 
  Bell, 
  User, 
  Settings, 
  HelpCircle,
  ChevronRight,
  Calendar,
  BarChart3,
  Shield
} from "lucide-react";

interface DashboardSidebarProps {
  licenses: any[];
  expiringCount: number;
  sharedCount: number;
}

const DashboardSidebar = ({ licenses, expiringCount, sharedCount }: DashboardSidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const navigationItems = [
    {
      label: 'Overview',
      icon: BarChart3,
      path: '/dashboard',
      badge: null,
      color: 'text-blue-600'
    },
    {
      label: 'All Licenses',
      icon: FileText,
      path: '/all-licenses',
      badge: licenses.length,
      color: 'text-green-600'
    },
    {
      label: 'Upload License',
      icon: Upload,
      path: '/upload',
      badge: null,
      color: 'text-purple-600'
    },
    {
      label: 'Shared Links',
      icon: Share2,
      path: '/shared-links',
      badge: sharedCount,
      color: 'text-orange-600'
    },
    {
      label: 'Reminders',
      icon: Bell,
      path: '/reminders',
      badge: expiringCount > 0 ? expiringCount : null,
      color: expiringCount > 0 ? 'text-red-600' : 'text-gray-600'
    }
  ];

  const accountItems = [
    {
      label: 'Profile',
      icon: User,
      path: '/profile'
    },
    {
      label: 'Settings',
      icon: Settings,
      path: '/settings'
    },
    {
      label: 'Help & Support',
      icon: HelpCircle,
      path: '/help'
    }
  ];

  const isActivePath = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className={`h-full bg-white border-r transition-all duration-300 ${
      collapsed ? 'w-16' : 'w-64'
    }`}>
      <div className="p-4">
        {/* Toggle Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="w-full justify-between mb-4"
        >
          {!collapsed && <span className="text-sm font-medium">Navigation</span>}
          <ChevronRight className={`w-4 h-4 transition-transform ${collapsed ? 'rotate-0' : 'rotate-180'}`} />
        </Button>

        {/* Quick Stats */}
        {!collapsed && (
          <Card className="p-4 mb-6 bg-gradient-to-br from-blue-50 to-green-50">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg overflow-hidden">
                <img 
                  src="/lovable-uploads/455034fe-c1dd-4b6a-91a0-baa4c7ab5738.png" 
                  alt="NepLife Logo"
                  className="w-full h-full object-contain bg-white"
                />
              </div>
              <span className="font-semibold text-gray-900">NepLife Vault</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{licenses.length}</div>
                <div className="text-gray-600">Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {licenses.filter(l => new Date(l.expiryDate) > new Date()).length}
                </div>
                <div className="text-gray-600">Active</div>
              </div>
            </div>
          </Card>
        )}

        {/* Navigation Items */}
        <div className="space-y-2 mb-6">
          {navigationItems.map((item) => (
            <Button
              key={item.path}
              variant={isActivePath(item.path) ? "default" : "ghost"}
              className={`w-full justify-start ${
                isActivePath(item.path) 
                  ? 'bg-gradient-to-r from-blue-600 to-green-600 text-white' 
                  : 'hover:bg-gray-50'
              } ${collapsed ? 'px-2' : 'px-3'}`}
              onClick={() => navigate(item.path)}
            >
              <item.icon className={`w-5 h-5 ${
                isActivePath(item.path) ? 'text-white' : item.color
              } ${collapsed ? '' : 'mr-3'}`} />
              {!collapsed && (
                <>
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.badge !== null && (
                    <Badge 
                      variant={isActivePath(item.path) ? "secondary" : "outline"}
                      className="ml-2 text-xs"
                    >
                      {item.badge}
                    </Badge>
                  )}
                </>
              )}
            </Button>
          ))}
        </div>

        {!collapsed && <Separator className="my-4" />}

        {/* Account Items */}
        <div className="space-y-2">
          {accountItems.map((item) => (
            <Button
              key={item.path}
              variant="ghost"
              className={`w-full justify-start hover:bg-gray-50 ${collapsed ? 'px-2' : 'px-3'}`}
              onClick={() => navigate(item.path)}
            >
              <item.icon className={`w-5 h-5 text-gray-600 ${collapsed ? '' : 'mr-3'}`} />
              {!collapsed && <span className="text-left">{item.label}</span>}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardSidebar;
