import { useState, useEffect } from 'react';
import { Search, FileText, User, Calendar, MapPin } from 'lucide-react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { format, parseISO, isValid } from 'date-fns';

interface GlobalSearchProps {
  licenses: any[];
}

const GlobalSearch = ({ licenses }: GlobalSearchProps) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const handleLicenseSelect = (license: any) => {
    setOpen(false);
    navigate('/all-licenses', { state: { selectedLicense: license.id } });
  };

  const safeParseDate = (dateString: string): Date | null => {
    if (!dateString || typeof dateString !== 'string') {
      return null;
    }
    
    try {
      const parsedDate = parseISO(dateString);
      return isValid(parsedDate) ? parsedDate : null;
    } catch {
      return null;
    }
  };

  const getStatusBadge = (expiryDate: string) => {
    const parsedDate = safeParseDate(expiryDate);
    
    if (!parsedDate) {
      return <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600">Invalid Date</Badge>;
    }

    const daysUntilExpiry = Math.ceil((parsedDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) {
      return <Badge variant="destructive" className="text-xs">Expired</Badge>;
    } else if (daysUntilExpiry <= 30) {
      return <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800">Expiring</Badge>;
    }
    return <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">Valid</Badge>;
  };

  const formatExpiryDate = (expiryDate: string): string => {
    const parsedDate = safeParseDate(expiryDate);
    
    if (!parsedDate) {
      return 'Invalid Date';
    }
    
    try {
      return format(parsedDate, 'MMM dd, yyyy');
    } catch {
      return 'Invalid Date';
    }
  };

  return (
    <>
      <Button
        variant="outline"
        className="relative justify-start text-sm text-muted-foreground sm:pr-12 md:w-40 lg:w-64"
        onClick={() => setOpen(true)}
      >
        <Search className="mr-2 h-4 w-4" />
        Search licenses...
        <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>
      
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search licenses by number, name, or authority..." />
        <CommandList>
          <CommandEmpty>No licenses found.</CommandEmpty>
          
          {licenses.length > 0 && (
            <CommandGroup heading="Your Licenses">
              {licenses.map((license) => (
                <CommandItem
                  key={license.id}
                  value={`${license.licenseNumber} ${license.holderName || ''} ${license.issuingAuthority || ''}`}
                  onSelect={() => handleLicenseSelect(license)}
                  className="flex items-center justify-between p-3 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                      <FileText className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{license.licenseNumber}</span>
                        {getStatusBadge(license.expiryDate)}
                      </div>
                      {license.holderName && (
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <User className="w-3 h-3" />
                          {license.holderName}
                        </div>
                      )}
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <Calendar className="w-3 h-3" />
                        Expires: {formatExpiryDate(license.expiryDate)}
                      </div>
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          
          <CommandGroup heading="Quick Actions">
            <CommandItem onSelect={() => { setOpen(false); navigate('/upload'); }}>
              <FileText className="mr-2 h-4 w-4" />
              Upload New License
            </CommandItem>
            <CommandItem onSelect={() => { setOpen(false); navigate('/shared-links'); }}>
              <FileText className="mr-2 h-4 w-4" />
              Manage Shared Links
            </CommandItem>
            <CommandItem onSelect={() => { setOpen(false); navigate('/analytics'); }}>
              <FileText className="mr-2 h-4 w-4" />
              View Analytics
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
};

export default GlobalSearch;