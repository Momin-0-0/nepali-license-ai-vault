import React, { createContext, useContext, useEffect, useState } from 'react';

interface AccessibilityContextType {
  reducedMotion: boolean;
  highContrast: boolean;
  fontSize: 'normal' | 'large' | 'larger';
  announceMessage: (message: string) => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return context;
};

interface AccessibilityProviderProps {
  children: React.ReactNode;
}

export const AccessibilityProvider: React.FC<AccessibilityProviderProps> = ({ children }) => {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'larger'>('normal');

  useEffect(() => {
    // Check for reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    
    // Check for high contrast preference
    const contrastQuery = window.matchMedia('(prefers-contrast: high)');
    setHighContrast(contrastQuery.matches);
    
    const handleContrastChange = (e: MediaQueryListEvent) => setHighContrast(e.matches);
    contrastQuery.addEventListener('change', handleContrastChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
      contrastQuery.removeEventListener('change', handleContrastChange);
    };
  }, []);

  useEffect(() => {
    // Apply accessibility classes to document
    document.documentElement.classList.toggle('reduce-motion', reducedMotion);
    document.documentElement.classList.toggle('high-contrast', highContrast);
    document.documentElement.setAttribute('data-font-size', fontSize);
  }, [reducedMotion, highContrast, fontSize]);

  const announceMessage = (message: string) => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  };

  const value: AccessibilityContextType = {
    reducedMotion,
    highContrast,
    fontSize,
    announceMessage
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
};