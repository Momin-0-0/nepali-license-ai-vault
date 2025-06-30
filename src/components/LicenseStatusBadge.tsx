
import { Badge } from "@/components/ui/badge";
import { differenceInDays, parseISO } from 'date-fns';
import { Shield, Clock, AlertTriangle, X } from "lucide-react";

interface LicenseStatusBadgeProps {
  expiryDate: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

const LicenseStatusBadge = ({ expiryDate, size = 'md', showIcon = true }: LicenseStatusBadgeProps) => {
  const daysUntilExpiry = differenceInDays(parseISO(expiryDate), new Date());
  
  const getStatusConfig = () => {
    if (daysUntilExpiry < 0) {
      return {
        label: 'Expired',
        variant: 'destructive' as const,
        icon: X,
        className: 'bg-red-100 text-red-800 hover:bg-red-100'
      };
    }
    
    if (daysUntilExpiry <= 7) {
      return {
        label: 'Critical',
        variant: 'destructive' as const,
        icon: AlertTriangle,
        className: 'bg-red-100 text-red-800 hover:bg-red-100'
      };
    }
    
    if (daysUntilExpiry <= 30) {
      return {
        label: 'Expiring Soon',
        variant: 'secondary' as const,
        icon: Clock,
        className: 'bg-orange-100 text-orange-800 hover:bg-orange-100'
      };
    }
    
    return {
      label: 'Valid',
      variant: 'secondary' as const,
      icon: Shield,
      className: 'bg-green-100 text-green-800 hover:bg-green-100'
    };
  };

  const config = getStatusConfig();
  const IconComponent = config.icon;
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5'
  };

  return (
    <Badge 
      variant={config.variant} 
      className={`${config.className} ${sizeClasses[size]} flex items-center gap-1 font-medium`}
    >
      {showIcon && <IconComponent className="w-3 h-3" />}
      {config.label}
      {daysUntilExpiry >= 0 && (
        <span className="ml-1 opacity-75">
          ({daysUntilExpiry} day{daysUntilExpiry !== 1 ? 's' : ''})
        </span>
      )}
    </Badge>
  );
};

export default LicenseStatusBadge;
