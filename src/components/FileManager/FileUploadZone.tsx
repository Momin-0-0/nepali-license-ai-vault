import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  File, 
  Image, 
  CheckCircle, 
  AlertCircle, 
  X,
  FileImage,
  Loader2
} from 'lucide-react';
import { fileManager, ManagedFile } from '@/utils/fileManager';
import { useToast } from '@/hooks/use-toast';

interface FileUploadZoneProps {
  onFileProcessed: (file: ManagedFile) => void;
  maxFiles?: number;
  accept?: Record<string, string[]>;
  disabled?: boolean;
}

interface UploadProgress {
  file: File;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
  result?: ManagedFile;
}

const FileUploadZone: React.FC<FileUploadZoneProps> = ({
  onFileProcessed,
  maxFiles = 5,
  accept = {
    'image/*': ['.jpeg', '.jpg', '.png', '.webp']
  },
  disabled = false
}) => {
  const [uploads, setUploads] = useState<UploadProgress[]>([]);
  const { toast } = useToast();

  const processFiles = useCallback(async (files: File[]) => {
    const newUploads: UploadProgress[] = files.map(file => ({
      file,
      progress: 0,
      status: 'uploading'
    }));

    setUploads(prev => [...prev, ...newUploads]);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const uploadIndex = uploads.length + i;

      try {
        // Update progress
        setUploads(prev => prev.map((upload, idx) => 
          idx === uploadIndex 
            ? { ...upload, progress: 25, status: 'processing' }
            : upload
        ));

        // Process file
        const managedFile = await fileManager.processFile(file);

        // Update progress
        setUploads(prev => prev.map((upload, idx) => 
          idx === uploadIndex 
            ? { ...upload, progress: 75 }
            : upload
        ));

        // Save to storage
        const storageKey = `managed_file_${managedFile.metadata.id}`;
        await fileManager.saveToStorage(managedFile, storageKey);

        // Complete
        setUploads(prev => prev.map((upload, idx) => 
          idx === uploadIndex 
            ? { ...upload, progress: 100, status: 'completed', result: managedFile }
            : upload
        ));

        onFileProcessed(managedFile);

        toast({
          title: "File Processed",
          description: `${file.name} has been optimized and saved`,
        });

      } catch (error) {
        setUploads(prev => prev.map((upload, idx) => 
          idx === uploadIndex 
            ? { 
                ...upload, 
                progress: 0, 
                status: 'error', 
                error: error instanceof Error ? error.message : 'Processing failed'
              }
            : upload
        ));

        toast({
          title: "Processing Failed",
          description: error instanceof Error ? error.message : 'Unknown error',
          variant: "destructive"
        });
      }
    }
  }, [uploads.length, onFileProcessed, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: processFiles,
    accept,
    maxFiles,
    disabled,
    multiple: maxFiles > 1
  });

  const removeUpload = (index: number) => {
    setUploads(prev => prev.filter((_, idx) => idx !== index));
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <FileImage className="w-4 h-4" />;
    }
    return <File className="w-4 h-4" />;
  };

  const getStatusIcon = (status: UploadProgress['status']) => {
    switch (status) {
      case 'uploading':
      case 'processing':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Zone */}
      <Card className={`border-2 border-dashed transition-colors ${
        isDragActive 
          ? 'border-blue-500 bg-blue-50' 
          : disabled 
          ? 'border-gray-200 bg-gray-50' 
          : 'border-gray-300 hover:border-gray-400'
      }`}>
        <CardContent 
          {...getRootProps()} 
          className="p-8 text-center cursor-pointer"
        >
          <input {...getInputProps()} />
          
          <div className="space-y-4">
            <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center ${
              isDragActive ? 'bg-blue-100' : 'bg-gray-100'
            }`}>
              <Upload className={`w-8 h-8 ${
                isDragActive ? 'text-blue-600' : 'text-gray-400'
              }`} />
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {isDragActive ? 'Drop files here' : 'Upload Files'}
              </h3>
              <p className="text-gray-600 mb-4">
                Drag and drop files here, or click to browse
              </p>
              
              <div className="flex flex-wrap justify-center gap-2 text-xs text-gray-500">
                <Badge variant="outline">JPEG</Badge>
                <Badge variant="outline">PNG</Badge>
                <Badge variant="outline">WebP</Badge>
                <Badge variant="outline">Max 10MB</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upload Progress */}
      {uploads.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h4 className="font-semibold mb-3">Processing Files</h4>
            <div className="space-y-3">
              {uploads.map((upload, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 flex-1">
                    {getFileIcon(upload.file)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {upload.file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(upload.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {getStatusIcon(upload.status)}
                    
                    {upload.status === 'error' && upload.error && (
                      <span className="text-xs text-red-600 max-w-32 truncate">
                        {upload.error}
                      </span>
                    )}
                    
                    {(upload.status === 'uploading' || upload.status === 'processing') && (
                      <div className="w-20">
                        <Progress value={upload.progress} className="h-1" />
                      </div>
                    )}
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeUpload(index)}
                      className="h-6 w-6 p-0"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FileUploadZone;