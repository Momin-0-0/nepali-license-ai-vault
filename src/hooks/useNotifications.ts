import { useState, useEffect } from 'react';
import { differenceInDays, parseISO, isValid } from 'date-fns';

interface License {
  id: string;
  licenseNumber: string;
  expiryDate: string;
}

interface Reminder {
  id: string;
  licenseId: string;
  reminderDate: string;
  message: string;
  isActive: boolean;
}

export const useNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);

  const safeParseDate = (dateString: string) => {
    if (!dateString || typeof dateString !== 'string') return null;
    const parsed = parseISO(dateString);
    return isValid(parsed) ? parsed : null;
  };

  useEffect(() => {
    setIsSupported('Notification' in window);
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (!isSupported) return false;
    
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  };

  const showNotification = (title: string, options?: NotificationOptions) => {
    if (!isSupported || permission !== 'granted') return;

    const notification = new Notification(title, {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      ...options
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    return notification;
  };

  const checkExpiryReminders = (licenses: License[], reminders: Reminder[]) => {
    const today = new Date();
    
    licenses.forEach(license => {
      const expiryDate = safeParseDate(license.expiryDate);
      if (!expiryDate) return; // Skip invalid dates
      
      const daysUntilExpiry = differenceInDays(expiryDate, today);
      
      // Check for automatic reminders
      if (daysUntilExpiry === 30 || daysUntilExpiry === 7 || daysUntilExpiry === 1) {
        showNotification(`License Expiry Reminder`, {
          body: `Your license ${license.licenseNumber} expires in ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''}`,
          tag: `expiry-${license.id}`,
          requireInteraction: true
        });
      }
    });

    // Check custom reminders
    reminders.forEach(reminder => {
      if (!reminder.isActive) return;
      
      const reminderDate = safeParseDate(reminder.reminderDate);
      if (!reminderDate) return; // Skip invalid dates
      
      const timeDiff = reminderDate.getTime() - today.getTime();
      
      // Show reminder if it's within 1 hour of the reminder time
      if (timeDiff > 0 && timeDiff <= 60 * 60 * 1000) {
        showNotification('License Reminder', {
          body: reminder.message,
          tag: `reminder-${reminder.id}`,
          requireInteraction: true
        });
      }
    });
  };

  return {
    permission,
    isSupported,
    requestPermission,
    showNotification,
    checkExpiryReminders
  };
};