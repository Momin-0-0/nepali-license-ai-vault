
import { Shield, User, LogOut, Menu, Bell, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface AppHeaderProps {
  user: any;
  isOnline: boolean;
  onToggleSidebar?: () => void;
  notificationCount?: number;
}

const AppHeader = ({ user, isOnline, onToggleSidebar, notificationCount = 0 }: AppHeaderProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = () => {
    localStorage.removeItem('user');
    toast({
      title: "Logged out",
      description: "You have been logged out successfully",
    });
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left section */}
          <div className="flex items-center gap-4">
            {onToggleSidebar && (
              <Button variant="ghost" size="sm" onClick={onToggleSidebar} className="md:hidden">
                <Menu className="w-5 h-5" />
              </Button>
            )}
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-red-600 rounded-lg flex items-center justify-center shadow-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-red-600 bg-clip-text text-transparent">
                  NepLife
                </h1>
                {!isOnline && (
                  <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                    Offline Mode
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Right section */}
          <div className="flex items-center gap-3">
            {/* Notifications */}
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="w-5 h-5" />
              {notificationCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-red-500 text-white text-xs">
                  {notificationCount > 9 ? '9+' : notificationCount}
                </Badge>
              )}
            </Button>

            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 px-2 gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-sm">
                      {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium hidden sm:inline-block max-w-[100px] truncate">
                    {user?.name || 'User'}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-white" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.name || 'User'}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/profile')} className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/settings')} className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
