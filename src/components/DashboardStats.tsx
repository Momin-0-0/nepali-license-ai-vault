import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Shield, Clock, Share2, TrendingUp, Calendar } from "lucide-react";
import { differenceInDays, parseISO, format, isValid } from 'date-fns';

interface DashboardStatsProps {
  licenses: any[];
}

const DashboardStats = ({ licenses }: DashboardStatsProps) => {
  const safeParseDate = (dateString: string) => {
    if (!dateString || typeof dateString !== 'string') return null;
    const parsed = parseISO(dateString);
    return isValid(parsed) ? parsed : null;
  };

  const safeFormatDate = (dateString: string, formatStr: string = 'MMM dd, yyyy') => {
    const date = safeParseDate(dateString);
    return date ? format(date, formatStr) : 'Invalid Date';
  };

  const getDaysUntilExpiry = (expiryDate: string) => {
    const date = safeParseDate(expiryDate);
    return date ? differenceInDays(date, new Date()) : null;
  };

  const activeLicenses = licenses.filter(l => {
    const days = getDaysUntilExpiry(l.expiryDate);
    return days !== null && days > 0;
  });

  const expiringLicenses = licenses.filter(l => {
    const days = getDaysUntilExpiry(l.expiryDate);
    return days !== null && days <= 30 && days >= 0;
  });

  const sharedLicenses = licenses.filter(l => l.shared);
  
  const expiredLicenses = licenses.filter(l => {
    const days = getDaysUntilExpiry(l.expiryDate);
    return days !== null && days < 0;
  });

  const stats = [
    {
      title: "Total Licenses",
      value: licenses.length,
      icon: FileText,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200"
    },
    {
      title: "Active Licenses",
      value: activeLicenses.length,
      icon: Shield,
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200"
    },
    {
      title: "Expiring Soon",
      value: expiringLicenses.length,
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200"
    },
    {
      title: "Shared Links",
      value: sharedLicenses.length,
      icon: Share2,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200"
    }
  ];

  const getNextExpiryDate = () => {
    const validActiveLicenses = activeLicenses.filter(l => safeParseDate(l.expiryDate));
    if (validActiveLicenses.length === 0) return 'No active licenses';
    
    const sortedLicenses = validActiveLicenses.sort((a, b) => {
      const dateA = safeParseDate(a.expiryDate);
      const dateB = safeParseDate(b.expiryDate);
      if (!dateA || !dateB) return 0;
      return dateA.getTime() - dateB.getTime();
    });
    
    return safeFormatDate(sortedLicenses[0].expiryDate);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {stats.map((stat, index) => (
        <Card key={index} className={`hover:shadow-md transition-shadow border-2 ${stat.borderColor}`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className={`text-3xl font-bold ${stat.color} mt-2`}>{stat.value}</p>
              </div>
              <div className={`p-3 rounded-full ${stat.bgColor}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      
      {/* Additional insight card */}
      <Card className="md:col-span-2 lg:col-span-4 border-2 border-indigo-200 bg-gradient-to-r from-indigo-50 to-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-indigo-700">
            <TrendingUp className="w-5 h-5" />
            License Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-600" />
              <span className="text-gray-600">
                Next expiry: {getNextExpiryDate()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-green-600" />
              <span className="text-gray-600">
                {expiredLicenses.length === 0 ? 'All licenses valid' : `${expiredLicenses.length} expired`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Share2 className="w-4 h-4 text-purple-600" />
              <span className="text-gray-600">
                {((sharedLicenses.length / Math.max(licenses.length, 1)) * 100).toFixed(0)}% shared
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardStats;