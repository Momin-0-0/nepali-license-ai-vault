import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Shield, 
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { differenceInDays, parseISO, format, subMonths } from 'date-fns';

interface License {
  id: string;
  licenseNumber: string;
  issueDate: string;
  expiryDate: string;
  issuingAuthority: string;
  createdAt: string;
}

interface AnalyticsDashboardProps {
  licenses: License[];
  sharedLinks: any[];
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ 
  licenses, 
  sharedLinks 
}) => {
  const analytics = useMemo(() => {
    const now = new Date();
    
    // License status distribution
    const statusData = licenses.reduce((acc, license) => {
      const daysLeft = differenceInDays(parseISO(license.expiryDate), now);
      
      if (daysLeft < 0) acc.expired++;
      else if (daysLeft <= 30) acc.expiring++;
      else acc.valid++;
      
      return acc;
    }, { valid: 0, expiring: 0, expired: 0 });

    // Monthly license additions
    const monthlyData = Array.from({ length: 6 }, (_, i) => {
      const month = subMonths(now, 5 - i);
      const monthStr = format(month, 'MMM yyyy');
      const count = licenses.filter(license => {
        const createdDate = parseISO(license.createdAt);
        return format(createdDate, 'MMM yyyy') === monthStr;
      }).length;
      
      return { month: format(month, 'MMM'), count };
    });

    // Authority distribution
    const authorityData = licenses.reduce((acc, license) => {
      const authority = license.issuingAuthority;
      acc[authority] = (acc[authority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Sharing activity
    const sharingData = {
      totalShares: sharedLinks.length,
      activeShares: sharedLinks.filter(link => 
        new Date(link.expiresAt) > now
      ).length,
      totalViews: sharedLinks.reduce((sum, link) => 
        sum + (link.accessCount || 0), 0
      )
    };

    return {
      statusData,
      monthlyData,
      authorityData: Object.entries(authorityData).map(([name, value]) => ({ name, value })),
      sharingData,
      totalLicenses: licenses.length,
      averageValidityYears: licenses.length > 0 
        ? licenses.reduce((sum, license) => {
            const years = differenceInDays(parseISO(license.expiryDate), parseISO(license.issueDate)) / 365;
            return sum + years;
          }, 0) / licenses.length
        : 0
    };
  }, [licenses, sharedLinks]);

  const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#8B5CF6'];

  const pieData = [
    { name: 'Valid', value: analytics.statusData.valid, color: '#10B981' },
    { name: 'Expiring Soon', value: analytics.statusData.expiring, color: '#F59E0B' },
    { name: 'Expired', value: analytics.statusData.expired, color: '#EF4444' }
  ].filter(item => item.value > 0);

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Licenses</p>
                <p className="text-2xl font-bold">{analytics.totalLicenses}</p>
              </div>
              <Shield className="w-8 h-8 text-blue-500" />
            </div>
            <div className="flex items-center mt-2">
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-sm text-green-600">Active management</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Valid Licenses</p>
                <p className="text-2xl font-bold text-green-600">{analytics.statusData.valid}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <div className="flex items-center mt-2">
              <Badge variant="outline" className="text-green-600 border-green-200">
                {((analytics.statusData.valid / analytics.totalLicenses) * 100).toFixed(1)}%
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Expiring Soon</p>
                <p className="text-2xl font-bold text-orange-600">{analytics.statusData.expiring}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-500" />
            </div>
            <div className="flex items-center mt-2">
              <Badge variant="outline" className="text-orange-600 border-orange-200">
                Needs attention
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Shares</p>
                <p className="text-2xl font-bold text-blue-600">{analytics.sharingData.totalShares}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-500" />
            </div>
            <div className="flex items-center mt-2">
              <span className="text-sm text-gray-600">
                {analytics.sharingData.totalViews} total views
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* License Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>License Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Monthly License Additions */}
        <Card>
          <CardHeader>
            <CardTitle>License Additions (Last 6 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Authority Distribution */}
      {analytics.authorityData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Licenses by Issuing Authority</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.authorityData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={150} />
                <Tooltip />
                <Bar dataKey="value" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Insights & Recommendations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {analytics.statusData.expiring > 0 && (
            <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
              <div>
                <p className="font-medium text-orange-800">Renewal Required</p>
                <p className="text-sm text-orange-700">
                  You have {analytics.statusData.expiring} license(s) expiring within 30 days. 
                  Consider starting the renewal process soon.
                </p>
              </div>
            </div>
          )}

          {analytics.statusData.expired > 0 && (
            <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <p className="font-medium text-red-800">Immediate Action Required</p>
                <p className="text-sm text-red-700">
                  You have {analytics.statusData.expired} expired license(s). 
                  Please renew immediately to avoid legal issues.
                </p>
              </div>
            </div>
          )}

          {analytics.averageValidityYears > 0 && (
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
              <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-blue-800">License Validity</p>
                <p className="text-sm text-blue-700">
                  Your licenses have an average validity of {analytics.averageValidityYears.toFixed(1)} years.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsDashboard;