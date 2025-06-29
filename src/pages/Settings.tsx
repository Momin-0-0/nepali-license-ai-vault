import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, ArrowLeft, Bell, Eye, Database, Palette, Globe, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import BackupRestore from "@/components/BackupRestore";
import AppHeader from "@/components/AppHeader";

interface Settings {
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
    reminderDays: number[];
  };
  privacy: {
    shareAnalytics: boolean;
    allowIndexing: boolean;
    dataRetention: number;
  };
  appearance: {
    theme: 'light' | 'dark' | 'system';
    language: string;
    dateFormat: string;
    timezone: string;
  };
  security: {
    autoLock: boolean;
    autoLockTime: number;
    requireAuth: boolean;
    encryptData: boolean;
  };
}

const Settings = () => {
  const [user] = useLocalStorage('user', null, true);
  const [settings, setSettings] = useLocalStorage<Settings>('settings', {
    notifications: {
      email: true,
      push: true,
      sms: false,
      reminderDays: [30, 7, 1]
    },
    privacy: {
      shareAnalytics: false,
      allowIndexing: false,
      dataRetention: 365
    },
    appearance: {
      theme: 'system',
      language: 'en',
      dateFormat: 'MM/dd/yyyy',
      timezone: 'Asia/Kathmandu'
    },
    security: {
      autoLock: false,
      autoLockTime: 15,
      requireAuth: false,
      encryptData: true
    }
  }, false);

  const navigate = useNavigate();
  const { toast } = useToast();

  const updateSettings = (section: keyof Settings, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
    
    toast({
      title: "Settings Updated",
      description: "Your preferences have been saved.",
    });
  };

  const resetSettings = () => {
    if (window.confirm('Are you sure you want to reset all settings to default?')) {
      setSettings({
        notifications: {
          email: true,
          push: true,
          sms: false,
          reminderDays: [30, 7, 1]
        },
        privacy: {
          shareAnalytics: false,
          allowIndexing: false,
          dataRetention: 365
        },
        appearance: {
          theme: 'system',
          language: 'en',
          dateFormat: 'MM/dd/yyyy',
          timezone: 'Asia/Kathmandu'
        },
        security: {
          autoLock: false,
          autoLockTime: 15,
          requireAuth: false,
          encryptData: true
        }
      });
      
      toast({
        title: "Settings Reset",
        description: "All settings have been reset to default values.",
      });
    }
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-red-50">
      <AppHeader user={user} isOnline={true} licenses={[]} />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
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
              <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
              <p className="text-gray-600">Manage your preferences and account settings</p>
            </div>
          </div>

          <Tabs defaultValue="notifications" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="notifications" className="flex items-center gap-2">
                <Bell className="w-4 h-4" />
                <span className="hidden sm:inline">Notifications</span>
              </TabsTrigger>
              <TabsTrigger value="privacy" className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                <span className="hidden sm:inline">Privacy</span>
              </TabsTrigger>
              <TabsTrigger value="appearance" className="flex items-center gap-2">
                <Palette className="w-4 h-4" />
                <span className="hidden sm:inline">Appearance</span>
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                <span className="hidden sm:inline">Security</span>
              </TabsTrigger>
              <TabsTrigger value="backup" className="flex items-center gap-2">
                <Database className="w-4 h-4" />
                <span className="hidden sm:inline">Backup</span>
              </TabsTrigger>
            </TabsList>

            {/* Notifications */}
            <TabsContent value="notifications">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                  <CardDescription>
                    Choose how you want to receive reminders and updates
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="email-notifications">Email Notifications</Label>
                        <p className="text-sm text-gray-500">Receive expiry reminders via email</p>
                      </div>
                      <Switch
                        id="email-notifications"
                        checked={settings.notifications.email}
                        onCheckedChange={(checked) => 
                          updateSettings('notifications', 'email', checked)
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="push-notifications">Push Notifications</Label>
                        <p className="text-sm text-gray-500">Browser notifications for real-time updates</p>
                      </div>
                      <Switch
                        id="push-notifications"
                        checked={settings.notifications.push}
                        onCheckedChange={(checked) => 
                          updateSettings('notifications', 'push', checked)
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="sms-notifications">SMS Notifications</Label>
                        <p className="text-sm text-gray-500">Text messages for urgent reminders</p>
                      </div>
                      <Switch
                        id="sms-notifications"
                        checked={settings.notifications.sms}
                        onCheckedChange={(checked) => 
                          updateSettings('notifications', 'sms', checked)
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Reminder Schedule</Label>
                    <p className="text-sm text-gray-500">
                      Get reminders at these intervals before expiry (in days)
                    </p>
                    <div className="flex gap-2">
                      {[30, 14, 7, 3, 1].map(days => (
                        <Button
                          key={days}
                          variant={settings.notifications.reminderDays.includes(days) ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            const current = settings.notifications.reminderDays;
                            const updated = current.includes(days)
                              ? current.filter(d => d !== days)
                              : [...current, days].sort((a, b) => b - a);
                            updateSettings('notifications', 'reminderDays', updated);
                          }}
                        >
                          {days} day{days !== 1 ? 's' : ''}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Privacy */}
            <TabsContent value="privacy">
              <Card>
                <CardHeader>
                  <CardTitle>Privacy Settings</CardTitle>
                  <CardDescription>
                    Control how your data is used and shared
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="share-analytics">Share Analytics</Label>
                      <p className="text-sm text-gray-500">Help improve the app by sharing anonymous usage data</p>
                    </div>
                    <Switch
                      id="share-analytics"
                      checked={settings.privacy.shareAnalytics}
                      onCheckedChange={(checked) => 
                        updateSettings('privacy', 'shareAnalytics', checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="allow-indexing">Allow Search Indexing</Label>
                      <p className="text-sm text-gray-500">Allow search engines to index your public content</p>
                    </div>
                    <Switch
                      id="allow-indexing"
                      checked={settings.privacy.allowIndexing}
                      onCheckedChange={(checked) => 
                        updateSettings('privacy', 'allowIndexing', checked)
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="data-retention">Data Retention (days)</Label>
                    <Select
                      value={settings.privacy.dataRetention.toString()}
                      onValueChange={(value) => 
                        updateSettings('privacy', 'dataRetention', parseInt(value))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="90">90 days</SelectItem>
                        <SelectItem value="180">180 days</SelectItem>
                        <SelectItem value="365">1 year</SelectItem>
                        <SelectItem value="730">2 years</SelectItem>
                        <SelectItem value="-1">Forever</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-gray-500">
                      How long to keep your data before automatic deletion
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Appearance */}
            <TabsContent value="appearance">
              <Card>
                <CardHeader>
                  <CardTitle>Appearance Settings</CardTitle>
                  <CardDescription>
                    Customize the look and feel of the application
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="theme">Theme</Label>
                    <Select
                      value={settings.appearance.theme}
                      onValueChange={(value) => 
                        updateSettings('appearance', 'theme', value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="system">System</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="language">Language</Label>
                    <Select
                      value={settings.appearance.language}
                      onValueChange={(value) => 
                        updateSettings('appearance', 'language', value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="ne">नेपाली (Nepali)</SelectItem>
                        <SelectItem value="hi">हिन्दी (Hindi)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="date-format">Date Format</Label>
                    <Select
                      value={settings.appearance.dateFormat}
                      onValueChange={(value) => 
                        updateSettings('appearance', 'dateFormat', value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MM/dd/yyyy">MM/DD/YYYY</SelectItem>
                        <SelectItem value="dd/MM/yyyy">DD/MM/YYYY</SelectItem>
                        <SelectItem value="yyyy-MM-dd">YYYY-MM-DD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select
                      value={settings.appearance.timezone}
                      onValueChange={(value) => 
                        updateSettings('appearance', 'timezone', value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Asia/Kathmandu">Asia/Kathmandu (NPT)</SelectItem>
                        <SelectItem value="Asia/Kolkata">Asia/Kolkata (IST)</SelectItem>
                        <SelectItem value="UTC">UTC</SelectItem>
                        <SelectItem value="America/New_York">America/New_York (EST)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security */}
            <TabsContent value="security">
              <Card>
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>
                    Protect your account and data with advanced security features
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="auto-lock">Auto Lock</Label>
                      <p className="text-sm text-gray-500">Automatically lock the app after inactivity</p>
                    </div>
                    <Switch
                      id="auto-lock"
                      checked={settings.security.autoLock}
                      onCheckedChange={(checked) => 
                        updateSettings('security', 'autoLock', checked)
                      }
                    />
                  </div>

                  {settings.security.autoLock && (
                    <div className="space-y-2">
                      <Label htmlFor="auto-lock-time">Auto Lock Time (minutes)</Label>
                      <Select
                        value={settings.security.autoLockTime.toString()}
                        onValueChange={(value) => 
                          updateSettings('security', 'autoLockTime', parseInt(value))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">5 minutes</SelectItem>
                          <SelectItem value="15">15 minutes</SelectItem>
                          <SelectItem value="30">30 minutes</SelectItem>
                          <SelectItem value="60">1 hour</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="require-auth">Require Authentication</Label>
                      <p className="text-sm text-gray-500">Require login for sensitive operations</p>
                    </div>
                    <Switch
                      id="require-auth"
                      checked={settings.security.requireAuth}
                      onCheckedChange={(checked) => 
                        updateSettings('security', 'requireAuth', checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="encrypt-data">Encrypt Local Data</Label>
                      <p className="text-sm text-gray-500">Encrypt sensitive data stored locally</p>
                    </div>
                    <Switch
                      id="encrypt-data"
                      checked={settings.security.encryptData}
                      onCheckedChange={(checked) => 
                        updateSettings('security', 'encryptData', checked)
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Backup */}
            <TabsContent value="backup">
              <BackupRestore />
            </TabsContent>
          </Tabs>

          {/* Reset Settings */}
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-red-700">Reset Settings</CardTitle>
              <CardDescription>
                Reset all settings to their default values
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="destructive" onClick={resetSettings}>
                Reset All Settings
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Settings;