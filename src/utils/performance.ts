export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

export const compressImage = (file: File, quality: number = 0.8): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }
    
    img.onload = () => {
      try {
        // Calculate new dimensions (max 1920x1080)
        const maxWidth = 1920;
        const maxHeight = 1080;
        let { width, height } = img;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Apply image smoothing for better quality
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          'image/jpeg',
          quality
        );
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
};

export const measurePerformance = (name: string, fn: () => void): void => {
  if (process.env.NODE_ENV === 'development') {
    const start = performance.now();
    fn();
    const end = performance.now();
    console.log(`${name} took ${end - start} milliseconds`);
  } else {
    fn();
  }
};

export const lazyLoad = (callback: () => void, delay: number = 100): void => {
  setTimeout(callback, delay);
};

// Memory management utilities
export const cleanupObjectURLs = (() => {
  const urls = new Set<string>();
  
  return {
    create: (blob: Blob): string => {
      const url = URL.createObjectURL(blob);
      urls.add(url);
      return url;
    },
    
    revoke: (url: string): void => {
      if (urls.has(url)) {
        URL.revokeObjectURL(url);
        urls.delete(url);
      }
    },
    
    revokeAll: (): void => {
      urls.forEach(url => URL.revokeObjectURL(url));
      urls.clear();
    }
  };
})();

// Intersection Observer for lazy loading
export const createIntersectionObserver = (
  callback: (entries: IntersectionObserverEntry[]) => void,
  options?: IntersectionObserverInit
): IntersectionObserver => {
  return new IntersectionObserver(callback, {
    rootMargin: '50px',
    threshold: 0.1,
    ...options
  });
};

// Performance monitoring
export const performanceMonitor = {
  mark: (name: string) => {
    if ('performance' in window && performance.mark) {
      performance.mark(name);
    }
  },
  
  measure: (name: string, startMark: string, endMark?: string) => {
    if ('performance' in window && performance.measure) {
      try {
        performance.measure(name, startMark, endMark);
        const measure = performance.getEntriesByName(name)[0];
        console.log(`${name}: ${measure.duration}ms`);
      } catch (error) {
        console.warn('Performance measurement failed:', error);
      }
    }
  }
};