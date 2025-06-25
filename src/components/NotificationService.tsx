
import React, { useEffect } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Bell, BellOff } from 'lucide-react';

interface NotificationServiceProps {
  licenses: any[];
  reminders: any[];
}

const NotificationService: React.FC<NotificationServiceProps> = ({ licenses, reminders }) => {
  const { permission, isSupported, requestPermission, checkExpiryReminders } = useNotifications();

  useEffect(() => {
    // Check reminders every minute
    const interval = setInterval(() => {
      if (permission === 'granted') {
        checkExpiryReminders(licenses, reminders);
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [licenses, reminders, permission, checkExpiryReminders]);

  if (!isSupported) {
    return null;
  }

  if (permission === 'denied') {
    return (
      <Alert className="mb-4">
        <BellOff className="h-4 w-4" />
        <AlertDescription>
          Notifications are blocked. Enable them in your browser settings to receive expiry reminders.
        </AlertDescription>
      </Alert>
    );
  }

  if (permission === 'default') {
    return (
      <Alert className="mb-4">
        <Bell className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>Enable notifications to receive license expiry reminders</span>
          <Button size="sm" onClick={requestPermission}>
            Enable Notifications
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return null;
};

export default NotificationService;
