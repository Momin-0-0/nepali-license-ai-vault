import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { 
  Bell, 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  X,
  Settings
} from "lucide-react";
import { format, differenceInDays, parseISO, isValid } from 'date-fns';

interface Notification {
  id: string;
  type: 'warning' | 'info' | 'success' | 'error';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  licenseId?: string;
}

interface NotificationCenterProps {
  licenses: any[];
}

const NotificationCenter = ({ licenses }: NotificationCenterProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

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

  useEffect(() => {
    // Generate notifications based on license status
    const newNotifications: Notification[] = [];

    licenses.forEach(license => {
      const daysLeft = getDaysUntilExpiry(license.expiryDate);
      
      if (daysLeft === null) {
        // Skip licenses with invalid dates
        return;
      }
      
      if (daysLeft < 0) {
        newNotifications.push({
          id: `expired-${license.id}`,
          type: 'error',
          title: 'License Expired',
          message: `License ${license.licenseNumber} expired on ${safeFormatDate(license.expiryDate)}`,
          timestamp: new Date().toISOString(),
          read: false,
          licenseId: license.id
        });
      } else if (daysLeft <= 7) {
        newNotifications.push({
          id: `critical-${license.id}`,
          type: 'warning',
          title: 'License Expiring Soon',
          message: `License ${license.licenseNumber} expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`,
          timestamp: new Date().toISOString(),
          read: false,
          licenseId: license.id
        });
      } else if (daysLeft <= 30) {
        newNotifications.push({
          id: `warning-${license.id}`,
          type: 'warning',
          title: 'Renewal Reminder',
          message: `License ${license.licenseNumber} expires on ${safeFormatDate(license.expiryDate)}`,
          timestamp: new Date().toISOString(),
          read: false,
          licenseId: license.id
        });
      }
    });

    // Add system notifications
    if (licenses.length === 0) {
      newNotifications.push({
        id: 'welcome',
        type: 'info',
        title: 'Welcome to NepLife',
        message: 'Upload your first driving license to get started with license management.',
        timestamp: new Date().toISOString(),
        read: false
      });
    }

    setNotifications(newNotifications);
  }, [licenses]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return <Clock className="w-4 h-4 text-blue-500" />;
    }
  };

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'warning':
        return 'border-l-orange-400 bg-orange-50';
      case 'error':
        return 'border-l-red-400 bg-red-50';
      case 'success':
        return 'border-l-green-400 bg-green-50';
      default:
        return 'border-l-blue-400 bg-blue-50';
    }
  };

  const safeFormatTimestamp = (timestamp: string) => {
    const date = safeParseDate(timestamp);
    return date ? format(date, 'MMM dd, h:mm a') : 'Invalid Date';
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-red-500 text-white text-xs">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 bg-white" align="end">
        <Card className="border-0 shadow-lg">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Notifications</CardTitle>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    className="text-xs"
                  >
                    Mark all read
                  </Button>
                )}
                <Button variant="ghost" size="sm">
                  <Settings className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="p-0 max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p>No notifications</p>
                <p className="text-xs">You're all caught up!</p>
              </div>
            ) : (
              <div className="space-y-1">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border-l-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                      getNotificationColor(notification.type)
                    } ${!notification.read ? 'bg-opacity-100' : 'bg-opacity-50'}`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        {getNotificationIcon(notification.type)}
                        <div className="flex-1">
                          <h4 className={`text-sm font-medium ${
                            !notification.read ? 'text-gray-900' : 'text-gray-600'
                          }`}>
                            {notification.title}
                          </h4>
                          <p className={`text-xs mt-1 ${
                            !notification.read ? 'text-gray-700' : 'text-gray-500'
                          }`}>
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-2">
                            {safeFormatTimestamp(notification.timestamp)}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeNotification(notification.id);
                        }}
                        className="h-6 w-6 p-0 hover:bg-gray-200"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                    {!notification.read && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full absolute right-2 top-4"></div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationCenter;