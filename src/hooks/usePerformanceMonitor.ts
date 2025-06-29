
import { useState, useEffect } from 'react';

interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  memoryUsage: number;
  isOnline: boolean;
  connectionType: string;
}

export const usePerformanceMonitor = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    loadTime: 0,
    renderTime: 0,
    memoryUsage: 0,
    isOnline: navigator.onLine,
    connectionType: 'unknown'
  });

  useEffect(() => {
    // Monitor page load performance
    const measurePerformance = () => {
      if (typeof window !== 'undefined' && 'performance' in window) {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        const loadTime = navigation.loadEventEnd - navigation.loadEventStart;
        const renderTime = navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart;
        
        setMetrics(prev => ({
          ...prev,
          loadTime,
          renderTime
        }));
      }
    };

    // Monitor memory usage (if available)
    const measureMemory = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        setMetrics(prev => ({
          ...prev,
          memoryUsage: memory.usedJSHeapSize / 1024 / 1024 // Convert to MB
        }));
      }
    };

    // Monitor network status
    const updateOnlineStatus = () => {
      setMetrics(prev => ({
        ...prev,
        isOnline: navigator.onLine
      }));
    };

    // Monitor connection type
    const updateConnectionType = () => {
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        setMetrics(prev => ({
          ...prev,
          connectionType: connection.effectiveType || 'unknown'
        }));
      }
    };

    // Set up performance monitoring
    setTimeout(measurePerformance, 100);
    const memoryInterval = setInterval(measureMemory, 5000);
    
    // Set up network monitoring
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      connection.addEventListener('change', updateConnectionType);
      updateConnectionType();
    }

    return () => {
      clearInterval(memoryInterval);
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
      
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        connection.removeEventListener('change', updateConnectionType);
      }
    };
  }, []);

  return {
    metrics,
    isSlowConnection: metrics.connectionType === '2g' || metrics.connectionType === 'slow-2g',
    isHighMemoryUsage: metrics.memoryUsage > 50, // MB
    isSlowRender: metrics.renderTime > 1000 // ms
  };
};
