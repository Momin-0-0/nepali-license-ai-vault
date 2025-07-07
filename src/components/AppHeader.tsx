
import { Shield, User, LogOut, Menu, Settings, Search, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import NotificationCenter from "./NotificationCenter";
import GlobalSearch from "./GlobalSearch";

interface AppHeaderProps {
  user: any;
  isOnline: boolean;
  onToggleSidebar?: () => void;
  licenses?: any[];
  showSearch?: boolean;
  onSearch?: (query: string) => void;
}

const AppHeader = ({ 
  user, 
  isOnline, 
  onToggleSidebar, 
  licenses = [],
  showSearch = false,
  onSearch
}: AppHeaderProps) => {
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

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 shadow-sm">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left section */}
          <div className="flex items-center gap-4">
            {onToggleSidebar && (
              <Button variant="ghost" size="sm" onClick={onToggleSidebar} className="md:hidden">
                <Menu className="w-5 h-5" />
              </Button>
            )}
            
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => handleNavigation('/dashboard')}>
              <div className="w-12 h-12 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                <img 
                  src="/Gemini_Generated_Image_w0veeiw0veeiw0ve 1.png" 
                  alt="NepLife Logo"
                  className="w-full h-full object-contain bg-white"
                />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                  NepLife
                </h1>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                    AI Powered
                  </Badge>
                  {!isOnline && (
                    <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                      Offline Mode
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Center section - Enhanced Global Search */}
          {showSearch && (
            <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
              <GlobalSearch licenses={licenses} />
            </div>
          )}

          {/* Right section */}
          <div className="flex items-center gap-3">
            {/* Notifications */}
            <NotificationCenter licenses={licenses} />

            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 px-2 gap-2 hover:bg-gray-100">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-green-500 text-white text-sm font-medium">
                      {user?.name?.charAt(0)?.toUpperCase() || user?.firstName?.charAt(0)?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium hidden sm:inline-block max-w-[100px] truncate">
                    {user?.name || user?.firstName || 'User'}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-white shadow-xl border" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user?.name || `${user?.firstName} ${user?.lastName}` || 'User'}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleNavigation('/profile')} className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleNavigation('/analytics')} className="cursor-pointer">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Analytics
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleNavigation('/settings')} className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50">
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
