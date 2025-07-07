import { LicenseData } from '@/types/license';

export interface FileMetadata {
  id: string;
  name: string;
  size: number;
  type: string;
  lastModified: number;
  checksum?: string;
  compressed?: boolean;
}

export interface ManagedFile {
  metadata: FileMetadata;
  data: string | ArrayBuffer;
  thumbnail?: string;
}

class FileManager {
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private readonly SUPPORTED_FORMATS = ['image/jpeg', 'image/png', 'image/webp'];
  private readonly COMPRESSION_QUALITY = 0.8;

  async processFile(file: File): Promise<ManagedFile> {
    // Validate file
    this.validateFile(file);

    // Generate metadata
    const metadata: FileMetadata = {
      id: this.generateFileId(),
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
      checksum: await this.generateChecksum(file)
    };

    // Process and optimize file
    const processedData = await this.optimizeFile(file);
    const thumbnail = await this.generateThumbnail(file);

    return {
      metadata,
      data: processedData,
      thumbnail
    };
  }

  private validateFile(file: File): void {
    if (!this.SUPPORTED_FORMATS.includes(file.type)) {
      throw new Error(`Unsupported file format: ${file.type}`);
    }

    if (file.size > this.MAX_FILE_SIZE) {
      throw new Error(`File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB (max: 10MB)`);
    }
  }

  private async optimizeFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate optimal dimensions
        const maxWidth = 1200;
        const maxHeight = 800;
        let { width, height } = img;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          'image/jpeg',
          this.COMPRESSION_QUALITY
        );
      };

      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  private async generateThumbnail(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        const size = 150;
        canvas.width = size;
        canvas.height = size;

        // Calculate crop area for square thumbnail
        const minDim = Math.min(img.width, img.height);
        const x = (img.width - minDim) / 2;
        const y = (img.height - minDim) / 2;

        ctx?.drawImage(img, x, y, minDim, minDim, 0, 0, size, size);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            } else {
              reject(new Error('Failed to generate thumbnail'));
            }
          },
          'image/jpeg',
          0.7
        );
      };

      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  private async generateChecksum(file: File): Promise<string> {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private generateFileId(): string {
    return `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Storage management
  async saveToStorage(managedFile: ManagedFile, storageKey: string): Promise<void> {
    try {
      const compressed = this.compressData(managedFile);
      localStorage.setItem(storageKey, compressed);
    } catch (error) {
      console.error('Failed to save file to storage:', error);
      throw new Error('Storage quota exceeded or file too large');
    }
  }

  async loadFromStorage(storageKey: string): Promise<ManagedFile | null> {
    try {
      const compressed = localStorage.getItem(storageKey);
      if (!compressed) return null;
      
      return this.decompressData(compressed);
    } catch (error) {
      console.error('Failed to load file from storage:', error);
      return null;
    }
  }

  private compressData(data: ManagedFile): string {
    // Simple compression using JSON + base64
    const jsonString = JSON.stringify(data);
    return btoa(jsonString);
  }

  private decompressData(compressed: string): ManagedFile {
    const jsonString = atob(compressed);
    return JSON.parse(jsonString);
  }

  // Cleanup utilities
  async cleanupOldFiles(maxAge: number = 30 * 24 * 60 * 60 * 1000): Promise<number> {
    const now = Date.now();
    let cleanedCount = 0;

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('file_')) {
        try {
          const file = await this.loadFromStorage(key);
          if (file && (now - file.metadata.lastModified) > maxAge) {
            localStorage.removeItem(key);
            cleanedCount++;
          }
        } catch (error) {
          // Remove corrupted entries
          localStorage.removeItem(key);
          cleanedCount++;
        }
      }
    }

    return cleanedCount;
  }

  getStorageUsage(): { used: number; total: number; percentage: number } {
    let used = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        used += localStorage.getItem(key)?.length || 0;
      }
    }

    const total = 5 * 1024 * 1024; // Approximate 5MB localStorage limit
    return {
      used,
      total,
      percentage: (used / total) * 100
    };
  }
}

export const fileManager = new FileManager();