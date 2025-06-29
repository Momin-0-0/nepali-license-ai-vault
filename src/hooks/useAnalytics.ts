import { useState, useEffect } from 'react';
import { differenceInDays, parseISO, format, subMonths } from 'date-fns';

interface License {
  id: string;
  licenseNumber: string;
  issueDate: string;
  expiryDate: string;
  issuingAuthority: string;
  createdAt: string;
}

interface SharedLink {
  id: string;
  licenseId: string;
  expiresAt: string;
  accessCount: number;
  createdAt: string;
}

interface AnalyticsData {
  licenseStats: {
    total: number;
    valid: number;
    expiring: number;
    expired: number;
  };
  sharingStats: {
    totalShares: number;
    activeShares: number;
    totalViews: number;
    averageViews: number;
  };
  trends: {
    monthlyAdditions: Array<{ month: string; count: number }>;
    expiryTrend: Array<{ month: string; expiring: number }>;
  };
  insights: Array<{
    type: 'info' | 'warning' | 'error' | 'success';
    title: string;
    description: string;
    action?: string;
  }>;
}

export const useAnalytics = (licenses: License[], sharedLinks: SharedLink[]) => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const calculateAnalytics = () => {
      setIsLoading(true);
      
      const now = new Date();
      
      // License statistics
      const licenseStats = licenses.reduce(
        (acc, license) => {
          const daysLeft = differenceInDays(parseISO(license.expiryDate), now);
          
          acc.total++;
          if (daysLeft < 0) acc.expired++;
          else if (daysLeft <= 30) acc.expiring++;
          else acc.valid++;
          
          return acc;
        },
        { total: 0, valid: 0, expiring: 0, expired: 0 }
      );

      // Sharing statistics
      const activeShares = sharedLinks.filter(link => 
        new Date(link.expiresAt) > now
      ).length;
      
      const totalViews = sharedLinks.reduce((sum, link) => 
        sum + (link.accessCount || 0), 0
      );
      
      const sharingStats = {
        totalShares: sharedLinks.length,
        activeShares,
        totalViews,
        averageViews: sharedLinks.length > 0 ? totalViews / sharedLinks.length : 0,
      };

      // Monthly trends
      const monthlyAdditions = Array.from({ length: 6 }, (_, i) => {
        const month = subMonths(now, 5 - i);
        const monthStr = format(month, 'MMM yyyy');
        const count = licenses.filter(license => {
          const createdDate = parseISO(license.createdAt);
          return format(createdDate, 'MMM yyyy') === monthStr;
        }).length;
        
        return { month: format(month, 'MMM'), count };
      });

      const expiryTrend = Array.from({ length: 6 }, (_, i) => {
        const month = subMonths(now, 5 - i);
        const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
        const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);
        
        const expiring = licenses.filter(license => {
          const expiryDate = parseISO(license.expiryDate);
          return expiryDate >= monthStart && expiryDate <= monthEnd;
        }).length;
        
        return { month: format(month, 'MMM'), expiring };
      });

      // Generate insights
      const insights = [];

      if (licenseStats.expired > 0) {
        insights.push({
          type: 'error' as const,
          title: 'Expired Licenses',
          description: `You have ${licenseStats.expired} expired license(s). Renew immediately to avoid legal issues.`,
          action: 'Renew Now',
        });
      }

      if (licenseStats.expiring > 0) {
        insights.push({
          type: 'warning' as const,
          title: 'Licenses Expiring Soon',
          description: `${licenseStats.expiring} license(s) will expire within 30 days. Plan for renewal.`,
          action: 'Set Reminders',
        });
      }

      if (sharingStats.totalShares > 0 && sharingStats.averageViews < 1) {
        insights.push({
          type: 'info' as const,
          title: 'Low Share Engagement',
          description: 'Your shared links have low view counts. Consider sharing with relevant authorities.',
        });
      }

      if (licenseStats.valid > 0) {
        insights.push({
          type: 'success' as const,
          title: 'Good License Management',
          description: `You have ${licenseStats.valid} valid license(s). Keep up the good work!`,
        });
      }

      const analyticsData: AnalyticsData = {
        licenseStats,
        sharingStats,
        trends: {
          monthlyAdditions,
          expiryTrend,
        },
        insights,
      };

      setAnalytics(analyticsData);
      setIsLoading(false);
    };

    // Debounce calculation to avoid excessive recalculations
    const timeoutId = setTimeout(calculateAnalytics, 100);
    
    return () => clearTimeout(timeoutId);
  }, [licenses, sharedLinks]);

  const exportAnalytics = () => {
    if (!analytics) return;

    const exportData = {
      generatedAt: new Date().toISOString(),
      summary: analytics.licenseStats,
      sharing: analytics.sharingStats,
      trends: analytics.trends,
      insights: analytics.insights,
      licenses: licenses.map(license => ({
        licenseNumber: license.licenseNumber,
        issueDate: license.issueDate,
        expiryDate: license.expiryDate,
        issuingAuthority: license.issuingAuthority,
        status: (() => {
          const daysLeft = differenceInDays(parseISO(license.expiryDate), new Date());
          if (daysLeft < 0) return 'expired';
          if (daysLeft <= 30) return 'expiring';
          return 'valid';
        })(),
      })),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `neplife-analytics-${format(new Date(), 'yyyy-MM-dd')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return {
    analytics,
    isLoading,
    exportAnalytics,
  };
};