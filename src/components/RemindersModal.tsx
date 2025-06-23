
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, Calendar, AlertTriangle } from "lucide-react";
import { format, differenceInDays, parseISO } from 'date-fns';

interface License {
  id: string;
  licenseNumber: string;
  issueDate: string;
  expiryDate: string;
  issuingAuthority: string;
  image?: string;
  shared: boolean;
}

interface RemindersModalProps {
  isOpen: boolean;
  onClose: () => void;
  licenses: License[];
}

const RemindersModal = ({ isOpen, onClose, licenses }: RemindersModalProps) => {
  const getExpiryStatus = (expiryDate: string) => {
    const days = differenceInDays(parseISO(expiryDate), new Date());
    if (days < 0) return { status: 'expired', color: 'text-red-600', bg: 'bg-red-50', icon: AlertTriangle };
    if (days <= 7) return { status: 'critical', color: 'text-orange-600', bg: 'bg-orange-50', icon: AlertTriangle };
    if (days <= 30) return { status: 'warning', color: 'text-yellow-600', bg: 'bg-yellow-50', icon: Bell };
    return { status: 'good', color: 'text-green-600', bg: 'bg-green-50', icon: Bell };
  };

  const upcomingReminders = licenses.filter(license => {
    const days = differenceInDays(parseISO(license.expiryDate), new Date());
    return days <= 30;
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            License Reminders
          </DialogTitle>
          <DialogDescription>
            Manage your license expiry notifications and reminders
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 max-h-96 overflow-y-auto">
          {upcomingReminders.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">No upcoming reminders</p>
              <p className="text-sm text-gray-400">All your licenses are valid for more than 30 days</p>
            </div>
          ) : (
            <>
              <div className="text-sm text-gray-600 mb-4">
                You have {upcomingReminders.length} license(s) requiring attention
              </div>
              
              {upcomingReminders.map(license => {
                const { status, color, bg, icon: Icon } = getExpiryStatus(license.expiryDate);
                const daysLeft = differenceInDays(parseISO(license.expiryDate), new Date());
                
                return (
                  <Card key={license.id} className={`border-l-4 ${status === 'expired' ? 'border-l-red-500' : status === 'critical' ? 'border-l-orange-500' : 'border-l-yellow-500'}`}>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className={`w-4 h-4 ${color}`} />
                          <span className="text-base">{license.licenseNumber}</span>
                        </div>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${bg} ${color}`}>
                          {daysLeft < 0 ? 'Expired' : `${daysLeft} days left`}
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                        <div>
                          <p className="text-gray-500">Issuing Authority</p>
                          <p className="font-medium">{license.issuingAuthority}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Expiry Date</p>
                          <p className="font-medium">{format(parseISO(license.expiryDate), 'MMM dd, yyyy')}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Calendar className="w-3 h-3 mr-1" />
                          Set Reminder
                        </Button>
                        <Button size="sm" variant="outline">
                          Renew Now
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </>
          )}
        </div>

        <div className="flex justify-end">
          <Button onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RemindersModal;
