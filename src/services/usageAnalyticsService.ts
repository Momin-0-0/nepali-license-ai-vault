
import { differenceInDays, parseISO, format, startOfMonth, endOfMonth } from 'date-fns';

export interface UsageInsight {
  type: 'trend' | 'pattern' | 'recommendation' | 'alert';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  actionable: boolean;
  data?: any;
}

export interface UsageStats {
  totalLicenses: number;
  activeLicenses: number;
  expiringLicenses: number;
  averageValidityDays: number;
  uploadFrequency: number;
  renewalPatterns: any;
}

class UsageAnalyticsService {
  generateInsights(licenses: any[], activityLog: any[] = []): {
    insights: UsageInsight[];
    stats: UsageStats;
    predictions: any[];
  } {
    const stats = this.calculateStats(licenses);
    const insights = this.analyzePatterns(licenses, activityLog, stats);
    const predictions = this.generatePredictions(licenses, stats);
    
    return { insights, stats, predictions };
  }

  private calculateStats(licenses: any[]): UsageStats {
    const now = new Date();
    const activeLicenses = licenses.filter(l => 
      differenceInDays(parseISO(l.expiryDate), now) > 0
    );
    const expiringLicenses = licenses.filter(l => {
      const days = differenceInDays(parseISO(l.expiryDate), now);
      return days <= 30 && days >= 0;
    });
    
    const totalValidityDays = licenses.reduce((sum, license) => {
      return sum + differenceInDays(parseISO(license.expiryDate), parseISO(license.issueDate));
    }, 0);
    
    return {
      totalLicenses: licenses.length,
      activeLicenses: activeLicenses.length,
      expiringLicenses: expiringLicenses.length,
      averageValidityDays: licenses.length > 0 ? totalValidityDays / licenses.length : 0,
      uploadFrequency: this.calculateUploadFrequency(licenses),
      renewalPatterns: this.analyzeRenewalPatterns(licenses)
    };
  }

  private calculateUploadFrequency(licenses: any[]): number {
    if (licenses.length < 2) return 0;
    
    const dates = licenses
      .filter(l => l.createdAt)
      .map(l => parseISO(l.createdAt))
      .sort((a, b) => a.getTime() - b.getTime());
    
    if (dates.length < 2) return 0;
    
    const totalDays = differenceInDays(dates[dates.length - 1], dates[0]);
    return totalDays > 0 ? licenses.length / (totalDays / 30) : 0; // licenses per month
  }

  private analyzeRenewalPatterns(licenses: any[]): any {
    const patterns = {
      earlyRenewers: 0,
      lastMinute: 0,
      expired: 0,
      averageDaysBeforeExpiry: 0
    };
    
    const now = new Date();
    licenses.forEach(license => {
      const daysLeft = differenceInDays(parseISO(license.expiryDate), now);
      
      if (daysLeft < 0) patterns.expired++;
      else if (daysLeft <= 7) patterns.lastMinute++;
      else if (daysLeft > 60) patterns.earlyRenewers++;
    });
    
    return patterns;
  }

  private analyzePatterns(licenses: any[], activityLog: any[], stats: UsageStats): UsageInsight[] {
    const insights: UsageInsight[] = [];
    
    // License expiry pattern analysis
    if (stats.expiringLicenses > 0) {
      insights.push({
        type: 'alert',
        title: 'Upcoming Expiries Detected',
        description: `${stats.expiringLicenses} license(s) expiring within 30 days. Peak renewal season detected.`,
        impact: 'high',
        actionable: true,
        data: { count: stats.expiringLicenses }
      });
    }
    
    // Upload frequency insights
    if (stats.uploadFrequency > 2) {
      insights.push({
        type: 'trend',
        title: 'High Activity Period',
        description: `You're uploading ${stats.uploadFrequency.toFixed(1)} licenses per month. Consider bulk processing features.`,
        impact: 'medium',
        actionable: true
      });
    }
    
    // Renewal behavior analysis
    const lateRenewalRate = (stats.renewalPatterns.lastMinute + stats.renewalPatterns.expired) / 
                           Math.max(stats.totalLicenses, 1);
    
    if (lateRenewalRate > 0.3) {
      insights.push({
        type: 'pattern',
        title: 'Late Renewal Pattern Detected',
        description: `${Math.round(lateRenewalRate * 100)}% of your licenses are renewed close to expiry. Early planning recommended.`,
        impact: 'medium',
        actionable: true,
        data: { rate: lateRenewalRate }
      });
    }
    
    // License validity insights
    if (stats.averageValidityDays > 0) {
      const years = (stats.averageValidityDays / 365).toFixed(1);
      insights.push({
        type: 'trend',
        title: 'License Validity Pattern',
        description: `Your licenses have an average validity of ${years} years. Plan renewals accordingly.`,
        impact: 'low',
        actionable: false,
        data: { averageYears: parseFloat(years) }
      });
    }
    
    // Usage efficiency recommendations
    if (stats.totalLicenses > 5) {
      insights.push({
        type: 'recommendation',
        title: 'Portfolio Management',
        description: 'With multiple licenses, consider setting up automated reminders and renewal tracking.',
        impact: 'medium',
        actionable: true
      });
    }
    
    // Seasonal patterns (if we had historical data)
    const currentMonth = format(new Date(), 'MMMM');
    insights.push({
      type: 'pattern',
      title: 'Seasonal Insights',
      description: `${currentMonth} analysis: Monitor for government processing delays during festival seasons.`,
      impact: 'low',
      actionable: false
    });
    
    return insights;
  }

  private generatePredictions(licenses: any[], stats: UsageStats): any[] {
    const predictions = [];
    
    // Predict next likely upload based on frequency
    if (stats.uploadFrequency > 0) {
      const daysUntilNext = Math.round(30 / stats.uploadFrequency);
      predictions.push({
        type: 'upload',
        description: `Next license upload predicted in ~${daysUntilNext} days`,
        confidence: stats.uploadFrequency > 1 ? 0.7 : 0.4
      });
    }
    
    // Predict renewal workload
    const upcomingRenewals = licenses.filter(l => {
      const days = differenceInDays(parseISO(l.expiryDate), new Date());
      return days > 0 && days <= 90;
    }).length;
    
    if (upcomingRenewals > 0) {
      predictions.push({
        type: 'renewal',
        description: `${upcomingRenewals} renewal(s) needed in next 3 months`,
        confidence: 0.9
      });
    }
    
    return predictions;
  }

  // Real-time analytics for dashboard
  getRealtimeInsights(licenses: any[]): UsageInsight[] {
    const insights: UsageInsight[] = [];
    const now = new Date();
    
    // Immediate attention needed
    const criticalLicenses = licenses.filter(l => 
      differenceInDays(parseISO(l.expiryDate), now) <= 7
    );
    
    if (criticalLicenses.length > 0) {
      insights.push({
        type: 'alert',
        title: 'Immediate Action Required',
        description: `${criticalLicenses.length} license(s) expire within 7 days`,
        impact: 'high',
        actionable: true,
        data: { licenses: criticalLicenses }
      });
    }
    
    return insights;
  }
}

export const usageAnalyticsService = new UsageAnalyticsService();
