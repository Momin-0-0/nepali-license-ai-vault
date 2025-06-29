import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  Download, 
  Upload, 
  Shield, 
  AlertTriangle, 
  CheckCircle,
  FileText,
  Cloud
} from "lucide-react";
import { encryptSensitiveData, decryptSensitiveData, generateSecureToken } from '@/utils/security';

interface BackupData {
  version: string;
  timestamp: string;
  licenses: any[];
  sharedLinks: any[];
  reminders: any[];
  settings: any;
  checksum: string;
}

const BackupRestore: React.FC = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const { toast } = useToast();

  const generateChecksum = async (data: string): Promise<string> => {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const exportData = async () => {
    setIsExporting(true);
    
    try {
      // Gather all data
      const licenses = JSON.parse(localStorage.getItem('licenses') || '[]');
      const sharedLinks = JSON.parse(localStorage.getItem('sharedLinks') || '[]');
      const reminders = JSON.parse(localStorage.getItem('reminders') || '[]');
      const settings = JSON.parse(localStorage.getItem('settings') || '{}');
      
      const backupData: BackupData = {
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        licenses,
        sharedLinks,
        reminders,
        settings,
        checksum: ''
      };
      
      // Generate checksum
      const dataString = JSON.stringify({
        licenses,
        sharedLinks,
        reminders,
        settings
      });
      backupData.checksum = await generateChecksum(dataString);
      
      // Encrypt the backup
      const encryptedBackup = encryptSensitiveData(backupData);
      
      // Create and download file
      const blob = new Blob([encryptedBackup], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `neplife-backup-${new Date().toISOString().split('T')[0]}.nlb`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Backup Created",
        description: "Your data has been exported successfully. Keep this file safe!",
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "Failed to create backup. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const importData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setIsImporting(true);
    
    try {
      const fileContent = await file.text();
      
      // Decrypt the backup
      const backupData: BackupData = decryptSensitiveData(fileContent);
      
      if (!backupData || !backupData.version) {
        throw new Error('Invalid backup file format');
      }
      
      // Verify checksum
      const dataString = JSON.stringify({
        licenses: backupData.licenses,
        sharedLinks: backupData.sharedLinks,
        reminders: backupData.reminders,
        settings: backupData.settings
      });
      const calculatedChecksum = await generateChecksum(dataString);
      
      if (calculatedChecksum !== backupData.checksum) {
        throw new Error('Backup file integrity check failed');
      }
      
      // Restore data
      localStorage.setItem('licenses', JSON.stringify(backupData.licenses || []));
      localStorage.setItem('sharedLinks', JSON.stringify(backupData.sharedLinks || []));
      localStorage.setItem('reminders', JSON.stringify(backupData.reminders || []));
      localStorage.setItem('settings', JSON.stringify(backupData.settings || {}));
      
      toast({
        title: "Restore Complete",
        description: `Successfully restored ${backupData.licenses?.length || 0} licenses and related data.`,
      });
      
      // Refresh the page to load new data
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Failed to restore backup. Please check the file.",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const clearAllData = () => {
    if (window.confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
      localStorage.clear();
      toast({
        title: "Data Cleared",
        description: "All application data has been removed.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Export Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Export Data
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            Create a secure backup of all your licenses, shared links, and settings. 
            The backup file is encrypted and can be used to restore your data.
          </p>
          
          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
            <Shield className="w-5 h-5 text-blue-600" />
            <div className="text-sm">
              <p className="font-medium text-blue-800">Secure Backup</p>
              <p className="text-blue-700">Your backup will be encrypted for security</p>
            </div>
          </div>
          
          <Button 
            onClick={exportData} 
            disabled={isExporting}
            className="w-full"
          >
            {isExporting ? (
              <>
                <Download className="w-4 h-4 mr-2 animate-pulse" />
                Creating Backup...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Export All Data
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Import Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Import Data
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            Restore your data from a previously created backup file. 
            This will replace all current data.
          </p>
          
          <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            <div className="text-sm">
              <p className="font-medium text-orange-800">Warning</p>
              <p className="text-orange-700">This will replace all existing data</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="backup-file">Select Backup File (.nlb)</Label>
            <Input
              id="backup-file"
              type="file"
              accept=".nlb"
              onChange={importData}
              disabled={isImporting}
            />
          </div>
          
          {isImporting && (
            <div className="flex items-center gap-2 text-blue-600">
              <Upload className="w-4 h-4 animate-pulse" />
              <span className="text-sm">Restoring data...</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cloud Sync Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="w-5 h-5" />
            Cloud Sync (Coming Soon)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            Automatic cloud synchronization will be available in a future update. 
            This will allow seamless data sync across multiple devices.
          </p>
          
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <FileText className="w-5 h-5 text-gray-600" />
            <div className="text-sm">
              <p className="font-medium text-gray-800">Features Coming Soon</p>
              <ul className="text-gray-700 list-disc list-inside mt-1">
                <li>Automatic cloud backup</li>
                <li>Multi-device synchronization</li>
                <li>Version history</li>
                <li>Collaborative sharing</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="w-5 h-5" />
            Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            Permanently delete all your data. This action cannot be undone.
          </p>
          
          <Button 
            variant="destructive" 
            onClick={clearAllData}
            className="w-full"
          >
            Clear All Data
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default BackupRestore;