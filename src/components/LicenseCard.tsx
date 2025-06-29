
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  MoreVertical, 
  Edit, 
  Share2, 
  Download, 
  Image as ImageIcon,
  Calendar,
  MapPin,
  Trash2
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format, differenceInDays, parseISO } from 'date-fns';

interface License {
  id: string;
  licenseNumber: string;
  holderName?: string;
  issueDate: string;
  expiryDate: string;
  issuingAuthority: string;
  image?: string;
  shared: boolean;
  address?: string;
}

interface LicenseCardProps {
  license: License;
  onEdit: (id: string) => void;
  onShare: (id: string) => void;
  onDownload: (id: string) => void;
  onViewImage: (license: License) => void;
  onDelete?: (id: string) => void;
}

const LicenseCard = ({ 
  license, 
  onEdit, 
  onShare, 
  onDownload, 
  onViewImage,
  onDelete 
}: LicenseCardProps) => {
  const getExpiryStatus = (expiryDate: string) => {
    const days = differenceInDays(parseISO(expiryDate), new Date());
    if (days < 0) return { status: 'expired', color: 'destructive', label: 'Expired' };
    if (days <= 7) return { status: 'critical', color: 'destructive', label: 'Expires Soon' };
    if (days <= 30) return { status: 'warning', color: 'secondary', label: 'Expires This Month' };
    return { status: 'good', color: 'default', label: 'Valid' };
  };

  const { color, label } = getExpiryStatus(license.expiryDate);
  const daysLeft = differenceInDays(parseISO(license.expiryDate), new Date());

  return (
    <Card className="hover:shadow-lg transition-all duration-200 hover:scale-[1.01] group">
      <CardContent className="p-0">
        <div className="flex">
          {/* License Image */}
          <div className="flex-shrink-0 p-4">
            {license.image ? (
              <div 
                className="w-20 h-16 bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity shadow-sm"
                onClick={() => onViewImage(license)}
              >
                <img
                  src={license.image}
                  alt={`License ${license.licenseNumber}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-20 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                <ImageIcon className="w-6 h-6 text-gray-400" />
              </div>
            )}
          </div>

          {/* License Details */}
          <div className="flex-1 p-4 pl-0">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-bold text-lg text-gray-900 mb-1">
                  {license.licenseNumber}
                </h3>
                {license.holderName && (
                  <p className="text-sm text-gray-600 mb-1">{license.holderName}</p>
                )}
                <p className="text-xs text-gray-500">{license.issuingAuthority}</p>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge variant={color as any} className="text-xs">
                  {label}
                </Badge>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-white">
                    <DropdownMenuItem onClick={() => onEdit(license.id)} className="cursor-pointer">
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onShare(license.id)} className="cursor-pointer">
                      <Share2 className="mr-2 h-4 w-4" />
                      Share
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDownload(license.id)} className="cursor-pointer">
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </DropdownMenuItem>
                    {license.image && (
                      <DropdownMenuItem onClick={() => onViewImage(license)} className="cursor-pointer">
                        <ImageIcon className="mr-2 h-4 w-4" />
                        View Image
                      </DropdownMenuItem>
                    )}
                    {onDelete && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => onDelete(license.id)} 
                          className="cursor-pointer text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* License Info Grid */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-3 h-3 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Issue Date</p>
                  <p className="text-sm font-medium">{format(parseISO(license.issueDate), 'MMM dd, yyyy')}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-3 h-3 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Expires</p>
                  <p className="text-sm font-medium">{format(parseISO(license.expiryDate), 'MMM dd, yyyy')}</p>
                  {daysLeft >= 0 && (
                    <p className="text-xs text-gray-500">{daysLeft} days left</p>
                  )}
                </div>
              </div>
            </div>

            {license.address && (
              <div className="flex items-start gap-2 mb-3">
                <MapPin className="w-3 h-3 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Address</p>
                  <p className="text-sm text-gray-600 line-clamp-2">{license.address}</p>
                </div>
              </div>
            )}

            {/* Status indicator */}
            {daysLeft < 0 && (
              <div className="flex items-center justify-center p-2 bg-red-50 rounded-lg">
                <p className="text-sm font-medium text-red-600">License Expired</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LicenseCard;
