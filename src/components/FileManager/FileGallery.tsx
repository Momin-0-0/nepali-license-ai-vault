import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Filter, 
  Download, 
  Trash2, 
  Eye, 
  MoreVertical,
  Grid,
  List,
  SortAsc,
  SortDesc
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { fileManager, ManagedFile } from '@/utils/fileManager';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface FileGalleryProps {
  onFileSelect?: (file: ManagedFile) => void;
  onFileDelete?: (fileId: string) => void;
  selectable?: boolean;
}

type ViewMode = 'grid' | 'list';
type SortBy = 'name' | 'date' | 'size';
type SortOrder = 'asc' | 'desc';

const FileGallery: React.FC<FileGalleryProps> = ({
  onFileSelect,
  onFileDelete,
  selectable = false
}) => {
  const [files, setFiles] = useState<ManagedFile[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<ManagedFile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortBy>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    loadFiles();
  }, []);

  useEffect(() => {
    filterAndSortFiles();
  }, [files, searchQuery, sortBy, sortOrder]);

  const loadFiles = async () => {
    const loadedFiles: ManagedFile[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('managed_file_')) {
        try {
          const file = await fileManager.loadFromStorage(key);
          if (file) {
            loadedFiles.push(file);
          }
        } catch (error) {
          console.error('Failed to load file:', key, error);
        }
      }
    }
    
    setFiles(loadedFiles);
  };

  const filterAndSortFiles = () => {
    let filtered = files.filter(file =>
      file.metadata.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Sort files
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.metadata.name.localeCompare(b.metadata.name);
          break;
        case 'date':
          comparison = a.metadata.lastModified - b.metadata.lastModified;
          break;
        case 'size':
          comparison = a.metadata.size - b.metadata.size;
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredFiles(filtered);
  };

  const handleFileSelect = (file: ManagedFile) => {
    if (selectable) {
      const newSelected = new Set(selectedFiles);
      if (newSelected.has(file.metadata.id)) {
        newSelected.delete(file.metadata.id);
      } else {
        newSelected.add(file.metadata.id);
      }
      setSelectedFiles(newSelected);
    }
    
    onFileSelect?.(file);
  };

  const handleFileDelete = async (file: ManagedFile) => {
    if (window.confirm(`Delete ${file.metadata.name}?`)) {
      try {
        const storageKey = `managed_file_${file.metadata.id}`;
        localStorage.removeItem(storageKey);
        
        setFiles(prev => prev.filter(f => f.metadata.id !== file.metadata.id));
        setSelectedFiles(prev => {
          const newSelected = new Set(prev);
          newSelected.delete(file.metadata.id);
          return newSelected;
        });
        
        onFileDelete?.(file.metadata.id);
        
        toast({
          title: "File Deleted",
          description: `${file.metadata.name} has been removed`,
        });
      } catch (error) {
        toast({
          title: "Delete Failed",
          description: "Failed to delete file",
          variant: "destructive"
        });
      }
    }
  };

  const handleFileDownload = (file: ManagedFile) => {
    try {
      const link = document.createElement('a');
      link.href = file.data as string;
      link.download = file.metadata.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Download Started",
        description: `Downloading ${file.metadata.name}`,
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download file",
        variant: "destructive"
      });
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const toggleSort = (newSortBy: SortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('asc');
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>File Gallery</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            >
              {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
            </Button>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Sort
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => toggleSort('name')}>
                Name {sortBy === 'name' && (sortOrder === 'asc' ? <SortAsc className="w-4 h-4 ml-2" /> : <SortDesc className="w-4 h-4 ml-2" />)}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toggleSort('date')}>
                Date {sortBy === 'date' && (sortOrder === 'asc' ? <SortAsc className="w-4 h-4 ml-2" /> : <SortDesc className="w-4 h-4 ml-2" />)}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toggleSort('size')}>
                Size {sortBy === 'size' && (sortOrder === 'asc' ? <SortAsc className="w-4 h-4 ml-2" /> : <SortDesc className="w-4 h-4 ml-2" />)}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent>
        {filteredFiles.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Eye className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No files found</p>
          </div>
        ) : (
          <div className={
            viewMode === 'grid' 
              ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'
              : 'space-y-2'
          }>
            {filteredFiles.map((file) => (
              <div
                key={file.metadata.id}
                className={`
                  border rounded-lg p-3 cursor-pointer transition-colors
                  ${selectedFiles.has(file.metadata.id) ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}
                  ${viewMode === 'list' ? 'flex items-center gap-3' : ''}
                `}
                onClick={() => handleFileSelect(file)}
              >
                {viewMode === 'grid' ? (
                  <>
                    {file.thumbnail && (
                      <img
                        src={file.thumbnail}
                        alt={file.metadata.name}
                        className="w-full h-32 object-cover rounded mb-2"
                      />
                    )}
                    <div className="space-y-1">
                      <p className="font-medium text-sm truncate">{file.metadata.name}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{formatFileSize(file.metadata.size)}</span>
                        <Badge variant="outline" className="text-xs">
                          {file.metadata.type.split('/')[1]?.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-400">
                        {format(new Date(file.metadata.lastModified), 'MMM dd, yyyy')}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    {file.thumbnail && (
                      <img
                        src={file.thumbnail}
                        alt={file.metadata.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{file.metadata.name}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span>{formatFileSize(file.metadata.size)}</span>
                        <span>•</span>
                        <span>{format(new Date(file.metadata.lastModified), 'MMM dd, yyyy')}</span>
                      </div>
                    </div>
                    <Badge variant="outline">
                      {file.metadata.type.split('/')[1]?.toUpperCase()}
                    </Badge>
                  </>
                )}
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <MoreVertical className="w-3 h-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      handleFileDownload(file);
                    }}>
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFileDelete(file);
                      }}
                      className="text-red-600"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FileGallery;