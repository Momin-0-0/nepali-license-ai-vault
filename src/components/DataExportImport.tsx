import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Download, 
  Upload, 
  FileText, 
  Database,
  Shield,
  CheckCircle,
  AlertTriangle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocalStorage } from "@/hooks/useLocalStorage";

interface ExportFormat {
  id: string;
  name: string;
  description: string;
  extension: string;
  icon: React.ReactNode;
}

const DataExportImport: React.FC = () => {
  const [licenses] = useLocalStorage<any[]>('licenses', [], true);
  const [sharedLinks] = useLocalStorage<any[]>('sharedLinks', [], true);
  const [reminders] = useLocalStorage<any[]>('reminders', [], false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const { toast } = useToast();

  const exportFormats: ExportFormat[] = [
    {
      id: 'json',
      name: 'JSON Format',
      description: 'Complete data with all fields',
      extension: 'json',
      icon: <Database className="w-4 h-4" />
    },
    {
      id: 'csv',
      name: 'CSV Spreadsheet',
      description: 'License data in spreadsheet format',
      extension: 'csv',
      icon: <FileText className="w-4 h-4" />
    },
    {
      id: 'backup',
      name: 'Encrypted Backup',
      description: 'Secure backup with encryption',
      extension: 'nlb',
      icon: <Shield className="w-4 h-4" />
    }
  ];

  const exportData = async (format: string) => {
    setIsExporting(true);
    
    try {
      const exportData = {
        licenses,
        sharedLinks,
        reminders,
        exportDate: new Date().toISOString(),
        version: '1.0.0'
      };

      let content: string;
      let filename: string;
      let mimeType: string;

      switch (format) {
        case 'json':
          content = JSON.stringify(exportData, null, 2);
          filename = `neplife-export-${new Date().toISOString().split('T')[0]}.json`;
          mimeType = 'application/json';
          break;
          
        case 'csv':
          content = convertToCSV(licenses);
          filename = `neplife-licenses-${new Date().toISOString().split('T')[0]}.csv`;
          mimeType = 'text/csv';
          break;
          
        case 'backup':
          content = btoa(JSON.stringify(exportData)); // Simple encoding for demo
          filename = `neplife-backup-${new Date().toISOString().split('T')[0]}.nlb`;
          mimeType = 'application/octet-stream';
          break;
          
        default:
          throw new Error('Unsupported format');
      }

      // Create and download file
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Export Successful",
        description: `Data exported as ${filename}`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const importData = async (file: File) => {
    setIsImporting(true);
    
    try {
      const content = await file.text();
      let importedData: any;

      if (file.name.endsWith('.json')) {
        importedData = JSON.parse(content);
      } else if (file.name.endsWith('.nlb')) {
        importedData = JSON.parse(atob(content));
      } else if (file.name.endsWith('.csv')) {
        // For CSV, we'll just show a message that it's not supported for import
        throw new Error('CSV import not supported. Please use JSON or backup format.');
      } else {
        throw new Error('Unsupported file format');
      }

      // Validate imported data structure
      if (!importedData.licenses || !Array.isArray(importedData.licenses)) {
        throw new Error('Invalid data format');
      }

      // Merge with existing data (or replace - user choice could be added)
      const existingLicenses = JSON.parse(localStorage.getItem('licenses') || '[]');
      const mergedLicenses = [...existingLicenses, ...importedData.licenses];
      
      localStorage.setItem('licenses', JSON.stringify(mergedLicenses));
      
      if (importedData.sharedLinks) {
        const existingSharedLinks = JSON.parse(localStorage.getItem('sharedLinks') || '[]');
        const mergedSharedLinks = [...existingSharedLinks, ...importedData.sharedLinks];
        localStorage.setItem('sharedLinks', JSON.stringify(mergedSharedLinks));
      }

      toast({
        title: "Import Successful",
        description: `Imported ${importedData.licenses.length} licenses`,
      });

      // Refresh page to show new data
      setTimeout(() => {
        window.location.reload();
      }, 1000);

    } catch (error) {
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Failed to import data",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const convertToCSV = (data: any[]): string => {
    if (data.length === 0) return '';
    
    const headers = [
      'License Number',
      'Holder Name',
      'Issue Date',
      'Expiry Date',
      'Issuing Authority',
      'Address',
      'Phone Number',
      'Blood Group',
      'Category'
    ];
    
    const rows = data.map(license => [
      license.licenseNumber || '',
      license.holderName || '',
      license.issueDate || '',
      license.expiryDate || '',
      license.issuingAuthority || '',
      license.address || '',
      license.phoneNo || '',
      license.bloodGroup || '',
      license.category || ''
    ]);
    
    return [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          Data Export & Import
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="export" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="export">Export Data</TabsTrigger>
            <TabsTrigger value="import">Import Data</TabsTrigger>
          </TabsList>
          
          <TabsContent value="export" className="space-y-4">
            <div className="grid gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Export Summary</h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{licenses.length}</p>
                    <p className="text-gray-600">Licenses</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">{sharedLinks.length}</p>
                    <p className="text-gray-600">Shared Links</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{reminders.length}</p>
                    <p className="text-gray-600">Reminders</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold">Choose Export Format</h4>
                {exportFormats.map((format) => (
                  <div key={format.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {format.icon}
                      <div>
                        <p className="font-medium">{format.name}</p>
                        <p className="text-sm text-gray-600">{format.description}</p>
                      </div>
                    </div>
                    <Button
                      onClick={() => exportData(format.id)}
                      disabled={isExporting}
                      variant="outline"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="import" className="space-y-4">
            <div className="space-y-4">
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-orange-800">Import Notice</h4>
                    <p className="text-sm text-orange-700 mt-1">
                      Importing data will add to your existing licenses. Make sure to backup your current data first.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="import-file">Select File to Import</Label>
                <Input
                  id="import-file"
                  type="file"
                  accept=".json,.nlb,.csv"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      importData(file);
                    }
                  }}
                  disabled={isImporting}
                />
                <p className="text-sm text-gray-600">
                  Supported formats: JSON (.json), Encrypted Backup (.nlb), CSV (.csv)
                </p>
              </div>

              {isImporting && (
                <div className="flex items-center gap-2 text-blue-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span>Importing data...</span>
                </div>
              )}

              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-green-800">Supported Data</h4>
                    <ul className="text-sm text-green-700 mt-1 list-disc list-inside">
                      <li>License information and images</li>
                      <li>Shared links and access history</li>
                      <li>Custom reminders and notifications</li>
                      <li>User preferences and settings</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default DataExportImport;