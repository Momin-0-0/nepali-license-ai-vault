import { differenceInDays, parseISO, addDays, format, isValid } from 'date-fns';

export interface ExpiryPrediction {
  licenseId: string;
  daysUntilExpiry: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  recommendedRenewalDate: string;
  predictionConfidence: number;
  aiInsights: string[];
}

export interface UsagePattern {
  averageRenewalDelay: number;
  hasRenewedBefore: boolean;
  totalLicenses: number;
  averageProcessingTime: number;
}

class ExpiryPredictionService {
  private safeParseDate(dateString: string) {
    if (!dateString || typeof dateString !== 'string') return null;
    const parsed = parseISO(dateString);
    return isValid(parsed) ? parsed : null;
  }

  private safeFormatDate(dateString: string, formatStr: string = 'yyyy-MM-dd') {
    const date = this.safeParseDate(dateString);
    return date ? format(date, formatStr) : '';
  }

  generatePredictions(licenses: any[], usageHistory: any[] = []): ExpiryPrediction[] {
    const usagePattern = this.analyzeUsagePattern(usageHistory);
    
    return licenses
      .filter(license => this.safeParseDate(license.expiryDate)) // Only process licenses with valid dates
      .map(license => {
        const expiryDate = this.safeParseDate(license.expiryDate);
        if (!expiryDate) return null; // This shouldn't happen due to filter above, but safety check
        
        const daysUntilExpiry = differenceInDays(expiryDate, new Date());
        const riskLevel = this.calculateRiskLevel(daysUntilExpiry, usagePattern);
        const recommendedDate = this.calculateRecommendedRenewalDate(license.expiryDate, usagePattern);
        
        return {
          licenseId: license.id,
          daysUntilExpiry,
          riskLevel,
          recommendedRenewalDate: recommendedDate,
          predictionConfidence: this.calculateConfidence(usagePattern, daysUntilExpiry),
          aiInsights: this.generateInsights(license, usagePattern, daysUntilExpiry)
        };
      })
      .filter(Boolean) as ExpiryPrediction[]; // Remove any null values
  }

  private analyzeUsagePattern(history: any[]): UsagePattern {
    return {
      averageRenewalDelay: history.length > 0 ? 
        history.reduce((sum, h) => sum + (h.renewalDelay || 0), 0) / history.length : 30,
      hasRenewedBefore: history.length > 0,
      totalLicenses: history.length,
      averageProcessingTime: 7 // Typical processing time in Nepal
    };
  }

  private calculateRiskLevel(daysUntilExpiry: number, pattern: UsagePattern): 'low' | 'medium' | 'high' | 'critical' {
    const adjustedDays = daysUntilExpiry - pattern.averageRenewalDelay;
    
    if (adjustedDays < 0) return 'critical';
    if (adjustedDays <= 7) return 'high';
    if (adjustedDays <= 30) return 'medium';
    return 'low';
  }

  private calculateRecommendedRenewalDate(expiryDate: string, pattern: UsagePattern): string {
    const expiry = this.safeParseDate(expiryDate);
    if (!expiry) return '';
    
    const recommendedDays = Math.max(
      pattern.averageProcessingTime + pattern.averageRenewalDelay + 7, // Buffer
      30 // Minimum 30 days before
    );
    
    return this.safeFormatDate(addDays(expiry, -recommendedDays).toISOString());
  }

  private calculateConfidence(pattern: UsagePattern, daysUntilExpiry: number): number {
    let confidence = 0.6; // Base confidence
    
    if (pattern.hasRenewedBefore) confidence += 0.2;
    if (pattern.totalLicenses > 2) confidence += 0.1;
    if (daysUntilExpiry > 0) confidence += 0.1;
    
    return Math.min(confidence, 0.95);
  }

  private generateInsights(license: any, pattern: UsagePattern, daysLeft: number): string[] {
    const insights: string[] = [];
    
    if (daysLeft <= 7) {
      insights.push("🚨 Urgent: License expires very soon. Start renewal process immediately.");
    } else if (daysLeft <= 30) {
      insights.push("⏰ Consider starting the renewal process soon to avoid last-minute rush.");
    }
    
    if (pattern.averageRenewalDelay > 14) {
      insights.push("📊 Based on your history, you typically delay renewals. Consider setting earlier reminders.");
    }
    
    if (!pattern.hasRenewedBefore) {
      insights.push("💡 First-time renewal: The process typically takes 7-10 days in Nepal.");
    }
    
    const authority = license.issuingAuthority?.toLowerCase() || '';
    if (authority.includes('kathmandu')) {
      insights.push("🏢 Kathmandu TMO: Consider online pre-application to save time.");
    }
    
    return insights;
  }
}

export const expiryPredictionService = new ExpiryPredictionService();