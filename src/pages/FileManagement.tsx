import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Upload, FolderOpen, Settings } from "lucide-react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import AppHeader from "@/components/AppHeader";
import FileUploadZone from "@/components/FileManager/FileUploadZone";
import FileGallery from "@/components/FileManager/FileGallery";
import StorageManager from "@/components/FileManager/StorageManager";
import { ManagedFile } from "@/utils/fileManager";
import { useToast } from "@/hooks/use-toast";

const FileManagement = () => {
  const [user] = useLocalStorage('user', null, true);
  const [licenses] = useLocalStorage<any[]>('licenses', [], true);
  const [selectedFiles, setSelectedFiles] = useState<ManagedFile[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  if (!user) {
    navigate('/login');
    return null;
  }

  const handleFileProcessed = (file: ManagedFile) => {
    toast({
      title: "File Added",
      description: `${file.metadata.name} has been processed and added to your gallery`,
    });
  };

  const handleFileSelect = (file: ManagedFile) => {
    setSelectedFiles(prev => {
      const exists = prev.find(f => f.metadata.id === file.metadata.id);
      if (exists) {
        return prev.filter(f => f.metadata.id !== file.metadata.id);
      } else {
        return [...prev, file];
      }
    });
  };

  const handleFileDelete = (fileId: string) => {
    setSelectedFiles(prev => prev.filter(f => f.metadata.id !== fileId));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <AppHeader user={user} isOnline={true} licenses={licenses} />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/dashboard')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">File Management</h1>
              <p className="text-gray-600">Upload, organize, and manage your files efficiently</p>
            </div>
          </div>

          {/* File Management Interface */}
          <Tabs defaultValue="upload" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="upload" className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Upload Files
              </TabsTrigger>
              <TabsTrigger value="gallery" className="flex items-center gap-2">
                <FolderOpen className="w-4 h-4" />
                File Gallery
              </TabsTrigger>
              <TabsTrigger value="storage" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Storage
              </TabsTrigger>
            </TabsList>

            {/* Upload Tab */}
            <TabsContent value="upload" className="space-y-6">
              <FileUploadZone
                onFileProcessed={handleFileProcessed}
                maxFiles={10}
              />
              
              {selectedFiles.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-800 mb-2">
                    Selected Files ({selectedFiles.length})
                  </h3>
                  <div className="space-y-2">
                    {selectedFiles.map(file => (
                      <div key={file.metadata.id} className="text-sm text-blue-700">
                        {file.metadata.name} ({(file.metadata.size / 1024 / 1024).toFixed(2)} MB)
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Gallery Tab */}
            <TabsContent value="gallery">
              <FileGallery
                onFileSelect={handleFileSelect}
                onFileDelete={handleFileDelete}
                selectable={true}
              />
            </TabsContent>

            {/* Storage Tab */}
            <TabsContent value="storage">
              <StorageManager />
            </TabsContent>
          </Tabs>

          {/* Quick Actions */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-2">Smart Organization</h3>
              <p className="text-sm text-blue-700 mb-3">
                Files are automatically optimized and organized for better performance
              </p>
              <div className="flex items-center gap-2 text-xs text-blue-600">
                <span>✓ Auto-compression</span>
                <span>✓ Thumbnail generation</span>
                <span>✓ Metadata extraction</span>
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-800 mb-2">Secure Storage</h3>
              <p className="text-sm text-green-700 mb-3">
                All files are stored securely with checksums for integrity verification
              </p>
              <div className="flex items-center gap-2 text-xs text-green-600">
                <span>✓ Checksum validation</span>
                <span>✓ Local encryption</span>
                <span>✓ Backup ready</span>
              </div>
            </div>

            <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg p-4">
              <h3 className="font-semibold text-orange-800 mb-2">Performance</h3>
              <p className="text-sm text-orange-700 mb-3">
                Optimized file handling ensures fast loading and minimal storage usage
              </p>
              <div className="flex items-center gap-2 text-xs text-orange-600">
                <span>✓ Fast loading</span>
                <span>✓ Memory efficient</span>
                <span>✓ Progressive loading</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileManagement;