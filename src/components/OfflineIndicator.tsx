import React from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useOfflineSync } from '@/hooks/useOfflineSync';

const OfflineIndicator: React.FC = () => {
  const { isOnline, pendingSync } = useOfflineSync();

  if (isOnline && pendingSync.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Badge 
        variant={isOnline ? "default" : "destructive"}
        className="flex items-center gap-2 px-3 py-2 shadow-lg"
      >
        {isOnline ? (
          <>
            <Wifi className="w-4 h-4" />
            {pendingSync.length > 0 && `Syncing ${pendingSync.length} items...`}
          </>
        ) : (
          <>
            <WifiOff className="w-4 h-4" />
            Offline Mode
          </>
        )}
      </Badge>
    </div>
  );
};

export default OfflineIndicator;