
import { useState, useEffect } from 'react';

interface OfflineData {
  id: string;
  type: 'license' | 'reminder' | 'shared_link';
  data: any;
  timestamp: number;
}

export const useOfflineSync = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSync, setPendingSync] = useState<OfflineData[]>([]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncPendingData();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration);
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('NepLifeDB', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains('licenses')) {
          db.createObjectStore('licenses', { keyPath: 'id' });
        }
        
        if (!db.objectStoreNames.contains('reminders')) {
          db.createObjectStore('reminders', { keyPath: 'id' });
        }
        
        if (!db.objectStoreNames.contains('pendingSync')) {
          db.createObjectStore('pendingSync', { keyPath: 'id' });
        }
      };
    });
  };

  const saveOfflineData = async (storeName: string, data: any) => {
    try {
      const db = await openDB();
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      await store.put(data);
      
      // Also save to localStorage as fallback
      const existingData = JSON.parse(localStorage.getItem(storeName) || '[]');
      const updatedData = existingData.filter((item: any) => item.id !== data.id);
      updatedData.push(data);
      localStorage.setItem(storeName, JSON.stringify(updatedData));
      
    } catch (error) {
      console.error('Error saving offline data:', error);
      // Fallback to localStorage only
      const existingData = JSON.parse(localStorage.getItem(storeName) || '[]');
      const updatedData = existingData.filter((item: any) => item.id !== data.id);
      updatedData.push(data);
      localStorage.setItem(storeName, JSON.stringify(updatedData));
    }
  };

  const getOfflineData = async (storeName: string): Promise<any[]> => {
    try {
      const db = await openDB();
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      
      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Error getting offline data:', error);
      // Fallback to localStorage
      return JSON.parse(localStorage.getItem(storeName) || '[]');
    }
  };

  const syncPendingData = async () => {
    if (!isOnline) return;
    
    try {
      const pending = await getOfflineData('pendingSync');
      setPendingSync(pending);
      
      // In a real app, you would sync with your backend here
      console.log('Syncing pending data:', pending);
      
      // Clear pending data after successful sync
      if (pending.length > 0) {
        const db = await openDB();
        const transaction = db.transaction(['pendingSync'], 'readwrite');
        const store = transaction.objectStore('pendingSync');
        await store.clear();
        setPendingSync([]);
      }
    } catch (error) {
      console.error('Error syncing pending data:', error);
    }
  };

  const addToPendingSync = async (data: OfflineData) => {
    await saveOfflineData('pendingSync', data);
    setPendingSync(prev => [...prev, data]);
  };

  return {
    isOnline,
    pendingSync,
    saveOfflineData,
    getOfflineData,
    addToPendingSync,
    syncPendingData
  };
};
