
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Bell, Calendar, AlertTriangle, Plus, X } from "lucide-react";
import { format, differenceInDays, parseISO, addDays } from 'date-fns';
import { useToast } from "@/hooks/use-toast";
import { useState } from 'react';

interface License {
  id: string;
  licenseNumber: string;
  issueDate: string;
  expiryDate: string;
  issuingAuthority: string;
  image?: string;
  shared: boolean;
}

interface CustomReminder {
  id: string;
  licenseId: string;
  reminderDate: string;
  reminderTime: string;
  message: string;
  type: 'custom' | 'auto';
}

interface RemindersModalProps {
  isOpen: boolean;
  onClose: () => void;
  licenses: License[];
}

const RemindersModal = ({ isOpen, onClose, licenses }: RemindersModalProps) => {
  const { toast } = useToast();
  const [customReminders, setCustomReminders] = useState<CustomReminder[]>([]);
  const [showAddReminder, setShowAddReminder] = useState(false);
  const [newReminder, setNewReminder] = useState({
    licenseId: '',
    reminderDate: '',
    reminderTime: '09:00',
    message: ''
  });

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

  const handleSetCustomReminder = () => {
    if (!newReminder.licenseId || !newReminder.reminderDate) {
      toast({
        title: "Missing Information",
        description: "Please select a license and reminder date",
        variant: "destructive",
      });
      return;
    }

    const license = licenses.find(l => l.id === newReminder.licenseId);
    const reminder: CustomReminder = {
      id: Date.now().toString(),
      licenseId: newReminder.licenseId,
      reminderDate: newReminder.reminderDate,
      reminderTime: newReminder.reminderTime,
      message: newReminder.message || `Reminder for ${license?.licenseNumber}`,
      type: 'custom'
    };

    setCustomReminders(prev => [...prev, reminder]);
    
    // Save to localStorage
    const savedReminders = JSON.parse(localStorage.getItem('customReminders') || '[]');
    savedReminders.push(reminder);
    localStorage.setItem('customReminders', JSON.stringify(savedReminders));

    toast({
      title: "Reminder Set Successfully",
      description: `Custom reminder set for ${format(parseISO(newReminder.reminderDate), 'MMM dd, yyyy')} at ${newReminder.reminderTime}`,
    });

    setNewReminder({
      licenseId: '',
      reminderDate: '',
      reminderTime: '09:00',
      message: ''
    });
    setShowAddReminder(false);
  };

  const handleQuickReminder = (licenseId: string, daysBeforeExpiry: number) => {
    const license = licenses.find(l => l.id === licenseId);
    if (!license) return;

    const expiryDate = parseISO(license.expiryDate);
    const reminderDate = addDays(expiryDate, -daysBeforeExpiry);
    
    const reminder: CustomReminder = {
      id: Date.now().toString(),
      licenseId,
      reminderDate: format(reminderDate, 'yyyy-MM-dd'),
      reminderTime: '09:00',
      message: `${license.licenseNumber} expires in ${daysBeforeExpiry} days`,
      type: 'auto'
    };

    setCustomReminders(prev => [...prev, reminder]);
    
    // Save to localStorage
    const savedReminders = JSON.parse(localStorage.getItem('customReminders') || '[]');
    savedReminders.push(reminder);
    localStorage.setItem('customReminders', JSON.stringify(savedReminders));

    toast({
      title: "Quick Reminder Set",
      description: `Reminder set for ${daysBeforeExpiry} days before expiry`,
    });
  };

  const handleDeleteReminder = (reminderId: string) => {
    setCustomReminders(prev => prev.filter(r => r.id !== reminderId));
    
    // Update localStorage
    const savedReminders = JSON.parse(localStorage.getItem('customReminders') || '[]');
    const updatedReminders = savedReminders.filter((r: CustomReminder) => r.id !== reminderId);
    localStorage.setItem('customReminders', JSON.stringify(updatedReminders));

    toast({
      title: "Reminder Deleted",
      description: "Custom reminder has been removed",
    });
  };

  const handleRenewNow = (licenseNumber: string) => {
    toast({
      title: "Renewal Process",
      description: `Redirecting to renewal portal for ${licenseNumber}`,
    });
    // In a real app, this would redirect to government renewal portal
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            License Reminders
          </DialogTitle>
          <DialogDescription>
            Manage your license expiry notifications and set custom reminders
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-y-auto max-h-96">
          {/* Expiring Licenses */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              Expiring Soon
            </h3>
            <div className="space-y-3">
              {upcomingReminders.length === 0 ? (
                <div className="text-center py-6 text-gray-500 text-sm">
                  <Bell className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p>No licenses expiring soon</p>
                </div>
              ) : (
                upcomingReminders.map(license => {
                  const { status, color, bg, icon: Icon } = getExpiryStatus(license.expiryDate);
                  const daysLeft = differenceInDays(parseISO(license.expiryDate), new Date());
                  
                  return (
                    <Card key={license.id} className={`border-l-4 ${status === 'expired' ? 'border-l-red-500' : status === 'critical' ? 'border-l-orange-500' : 'border-l-yellow-500'}`}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Icon className={`w-3 h-3 ${color}`} />
                            <span>{license.licenseNumber}</span>
                          </div>
                          <div className={`px-2 py-1 rounded-full text-xs font-medium ${bg} ${color}`}>
                            {daysLeft < 0 ? 'Expired' : `${daysLeft} days`}
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-xs text-gray-500 mb-2">
                          Expires: {format(parseISO(license.expiryDate), 'MMM dd, yyyy')}
                        </p>
                        <div className="flex gap-1">
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="text-xs h-7"
                            onClick={() => handleQuickReminder(license.id, 7)}
                          >
                            7 days
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="text-xs h-7"
                            onClick={() => handleQuickReminder(license.id, 14)}
                          >
                            14 days
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="text-xs h-7"
                            onClick={() => handleRenewNow(license.licenseNumber)}
                          >
                            Renew
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </div>

          {/* Custom Reminders */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-500" />
                Custom Reminders
              </h3>
              <Button 
                size="sm" 
                onClick={() => setShowAddReminder(true)}
                className="h-7"
              >
                <Plus className="w-3 h-3 mr-1" />
                Add
              </Button>
            </div>

            {showAddReminder && (
              <Card className="mb-3 border-blue-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Set Custom Reminder</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label htmlFor="license-select" className="text-xs">License</Label>
                    <select
                      id="license-select"
                      value={newReminder.licenseId}
                      onChange={(e) => setNewReminder(prev => ({ ...prev, licenseId: e.target.value }))}
                      className="w-full mt-1 px-2 py-1 border rounded text-sm"
                    >
                      <option value="">Select a license</option>
                      {licenses.map(license => (
                        <option key={license.id} value={license.id}>
                          {license.licenseNumber}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="reminder-date" className="text-xs">Date</Label>
                      <Input
                        id="reminder-date"
                        type="date"
                        value={newReminder.reminderDate}
                        onChange={(e) => setNewReminder(prev => ({ ...prev, reminderDate: e.target.value }))}
                        className="text-sm h-8"
                      />
                    </div>
                    <div>
                      <Label htmlFor="reminder-time" className="text-xs">Time</Label>
                      <Input
                        id="reminder-time"
                        type="time"
                        value={newReminder.reminderTime}
                        onChange={(e) => setNewReminder(prev => ({ ...prev, reminderTime: e.target.value }))}
                        className="text-sm h-8"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="reminder-message" className="text-xs">Custom Message (optional)</Label>
                    <Input
                      id="reminder-message"
                      value={newReminder.message}
                      onChange={(e) => setNewReminder(prev => ({ ...prev, message: e.target.value }))}
                      placeholder="Custom reminder message"
                      className="text-sm h-8"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSetCustomReminder} className="h-7">
                      Set Reminder
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => setShowAddReminder(false)}
                      className="h-7"
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="space-y-2">
              {customReminders.length === 0 ? (
                <div className="text-center py-6 text-gray-500 text-sm">
                  <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p>No custom reminders set</p>
                </div>
              ) : (
                customReminders.map(reminder => {
                  const license = licenses.find(l => l.id === reminder.licenseId);
                  return (
                    <Card key={reminder.id} className="border-blue-200">
                      <CardContent className="py-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">{license?.licenseNumber}</p>
                            <p className="text-xs text-gray-500">
                              {format(parseISO(reminder.reminderDate), 'MMM dd, yyyy')} at {reminder.reminderTime}
                            </p>
                            {reminder.message && (
                              <p className="text-xs text-gray-600 mt-1">{reminder.message}</p>
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteReminder(reminder.id)}
                            className="h-6 w-6 p-0"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RemindersModal;
