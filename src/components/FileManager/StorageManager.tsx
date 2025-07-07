import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  HardDrive, 
  Trash2, 
  RefreshCw, 
  AlertTriangle,
  CheckCircle,
  Database,
  Download
} from 'lucide-react';
import { fileManager } from '@/utils/fileManager';
import { useToast } from '@/hooks/use-toast';

const StorageManager: React.FC = () => {
  const [storageInfo, setStorageInfo] = useState({
    used: 0,
    total: 0,
    percentage: 0
  });
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [lastCleanup, setLastCleanup] = useState<Date | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    updateStorageInfo();
    
    // Check for last cleanup
    const lastCleanupStr = localStorage.getItem('lastCleanup');
    if (lastCleanupStr) {
      setLastCleanup(new Date(lastCleanupStr));
    }
  }, []);

  const updateStorageInfo = () => {
    const info = fileManager.getStorageUsage();
    setStorageInfo(info);
  };

  const handleCleanup = async () => {
    setIsCleaningUp(true);
    
    try {
      const cleanedCount = await fileManager.cleanupOldFiles();
      
      localStorage.setItem('lastCleanup', new Date().toISOString());
      setLastCleanup(new Date());
      
      updateStorageInfo();
      
      toast({
        title: "Cleanup Complete",
        description: `Removed ${cleanedCount} old files`,
      });
    } catch (error) {
      toast({
        title: "Cleanup Failed",
        description: "Failed to clean up old files",
        variant: "destructive"
      });
    } finally {
      setIsCleaningUp(false);
    }
  };

  const exportAllData = () => {
    try {
      const allData: any = {};
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          allData[key] = localStorage.getItem(key);
        }
      }
      
      const dataStr = JSON.stringify(allData, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `neplife-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      
      toast({
        title: "Export Complete",
        description: "All data has been exported successfully",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export data",
        variant: "destructive"
      });
    }
  };

  const clearAllStorage = () => {
    if (window.confirm('Are you sure you want to clear all storage? This action cannot be undone.')) {
      localStorage.clear();
      updateStorageInfo();
      
      toast({
        title: "Storage Cleared",
        description: "All data has been removed",
        variant: "destructive"
      });
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStorageStatus = () => {
    if (storageInfo.percentage < 50) {
      return { color: 'text-green-600', icon: CheckCircle, message: 'Storage healthy' };
    } else if (storageInfo.percentage < 80) {
      return { color: 'text-yellow-600', icon: AlertTriangle, message: 'Storage getting full' };
    } else {
      return { color: 'text-red-600', icon: AlertTriangle, message: 'Storage almost full' };
    }
  };

  const status = getStorageStatus();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HardDrive className="w-5 h-5" />
          Storage Management
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Storage Usage */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Storage Usage</span>
            <div className="flex items-center gap-2">
              <status.icon className={`w-4 h-4 ${status.color}`} />
              <span className={`text-sm ${status.color}`}>{status.message}</span>
            </div>
          </div>
          
          <Progress value={storageInfo.percentage} className="h-3" />
          
          <div className="flex justify-between text-sm text-gray-600">
            <span>{formatBytes(storageInfo.used)} used</span>
            <span>{formatBytes(storageInfo.total)} total</span>
          </div>
        </div>

        {/* Storage Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <Database className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-600">
              {Math.round(storageInfo.percentage)}%
            </p>
            <p className="text-sm text-gray-600">Used</p>
          </div>
          
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <HardDrive className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-600">
              {formatBytes(storageInfo.total - storageInfo.used)}
            </p>
            <p className="text-sm text-gray-600">Available</p>
          </div>
        </div>

        {/* Last Cleanup Info */}
        {lastCleanup && (
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              Last cleanup: {lastCleanup.toLocaleDateString()} at {lastCleanup.toLocaleTimeString()}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={handleCleanup}
              disabled={isCleaningUp}
              variant="outline"
              className="w-full"
            >
              {isCleaningUp ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              {isCleaningUp ? 'Cleaning...' : 'Cleanup Old Files'}
            </Button>
            
            <Button
              onClick={exportAllData}
              variant="outline"
              className="w-full"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Data
            </Button>
          </div>
          
          <Button
            onClick={clearAllStorage}
            variant="destructive"
            className="w-full"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear All Storage
          </Button>
        </div>

        {/* Storage Tips */}
        <div className="p-4 bg-yellow-50 rounded-lg">
          <h4 className="font-semibold text-yellow-800 mb-2">Storage Tips</h4>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• Files are automatically optimized to save space</li>
            <li>• Old files (30+ days) can be cleaned up safely</li>
            <li>• Export data regularly for backup</li>
            <li>• Clear storage if you're running low on space</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default StorageManager;