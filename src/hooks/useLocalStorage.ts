import { useState, useEffect, useCallback } from 'react';
import { sanitizeForStorage, encryptSensitiveData, decryptSensitiveData } from '@/utils/security';

export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  encrypt: boolean = false
): [T, (value: T | ((val: T) => T)) => void, () => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item === null) return initialValue;
      
      const parsedItem = encrypt ? decryptSensitiveData(item) : JSON.parse(item);
      return parsedItem || initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      const sanitizedValue = sanitizeForStorage(valueToStore);
      
      setStoredValue(sanitizedValue);
      
      const stringValue = encrypt 
        ? encryptSensitiveData(sanitizedValue)
        : JSON.stringify(sanitizedValue);
        
      window.localStorage.setItem(key, stringValue);
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue, encrypt]);

  const removeValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          const newValue = encrypt 
            ? decryptSensitiveData(e.newValue)
            : JSON.parse(e.newValue);
          setStoredValue(newValue);
        } catch (error) {
          console.error(`Error parsing storage change for key "${key}":`, error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key, encrypt]);

  return [storedValue, setValue, removeValue];
}