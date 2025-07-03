
export interface DataQualityScore {
  field: string;
  score: number; // 0-100
  confidence: number; // 0-1
  issues: string[];
  suggestions: string[];
  aiExtracted: boolean;
}

export interface OverallQuality {
  totalScore: number;
  fieldsAnalyzed: number;
  criticalIssues: number;
  suggestions: string[];
  extractionAccuracy: number;
}

class DataQualityService {
  scoreLicenseData(licenseData: any, ocrConfidence: Record<string, number> = {}): {
    fieldScores: DataQualityScore[];
    overallQuality: OverallQuality;
  } {
    const fieldScores: DataQualityScore[] = [];
    
    // Score each field
    Object.entries(licenseData).forEach(([field, value]) => {
      if (value && typeof value === 'string' && value.trim() !== '') {
        const score = this.scoreField(field, value as string, ocrConfidence[field] || 0);
        fieldScores.push(score);
      }
    });
    
    const overallQuality = this.calculateOverallQuality(fieldScores);
    
    return { fieldScores, overallQuality };
  }

  private scoreField(field: string, value: string, ocrConfidence: number): DataQualityScore {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let score = 70; // Base score
    
    // Field-specific validation
    switch (field) {
      case 'licenseNumber':
        const licenseScore = this.scoreLicenseNumber(value);
        score = licenseScore.score;
        issues.push(...licenseScore.issues);
        suggestions.push(...licenseScore.suggestions);
        break;
        
      case 'holderName':
        const nameScore = this.scoreName(value);
        score = nameScore.score;
        issues.push(...nameScore.issues);
        suggestions.push(...nameScore.suggestions);
        break;
        
      case 'phoneNo':
        const phoneScore = this.scorePhone(value);
        score = phoneScore.score;
        issues.push(...phoneScore.issues);
        suggestions.push(...phoneScore.suggestions);
        break;
        
      case 'address':
        const addressScore = this.scoreAddress(value);
        score = addressScore.score;
        issues.push(...addressScore.issues);
        suggestions.push(...addressScore.suggestions);
        break;
        
      default:
        score = this.scoreGeneric(value);
    }
    
    // Adjust score based on OCR confidence
    if (ocrConfidence > 0) {
      score = Math.round(score * (0.3 + ocrConfidence * 0.7));
      if (ocrConfidence < 0.7) {
        issues.push('Low OCR confidence - manual verification recommended');
      }
    }
    
    return {
      field,
      score: Math.max(0, Math.min(100, score)),
      confidence: ocrConfidence || 0.5,
      issues,
      suggestions,
      aiExtracted: ocrConfidence > 0
    };
  }

  private scoreLicenseNumber(value: string): { score: number; issues: string[]; suggestions: string[] } {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let score = 90;
    
    // Nepal license format: XX-XXX-XXXXXX
    const nepalPattern = /^[A-Z]{2}-\d{3}-\d{6}$/;
    
    if (!nepalPattern.test(value)) {
      score -= 30;
      issues.push('Does not match Nepal license format (XX-XXX-XXXXXX)');
      suggestions.push('Verify license number format: 2 letters, dash, 3 digits, dash, 6 digits');
    }
    
    if (value.length !== 12) {
      score -= 20;
      issues.push('Incorrect length for Nepal license number');
    }
    
    return { score, issues, suggestions };
  }

  private scoreName(value: string): { score: number; issues: string[]; suggestions: string[] } {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let score = 85;
    
    if (value.length < 2) {
      score -= 40;
      issues.push('Name too short');
    }
    
    if (/\d/.test(value)) {
      score -= 25;
      issues.push('Name contains numbers');
      suggestions.push('Remove any digits from the name');
    }
    
    if (!/^[a-zA-Z\s.'-]+$/.test(value)) {
      score -= 15;
      issues.push('Name contains invalid characters');
      suggestions.push('Use only letters, spaces, dots, hyphens, and apostrophes');
    }
    
    return { score, issues, suggestions };
  }

  private scorePhone(value: string): { score: number; issues: string[]; suggestions: string[] } {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let score = 80;
    
    const cleaned = value.replace(/\D/g, '');
    
    if (cleaned.length !== 10) {
      score -= 30;
      issues.push('Phone number should be 10 digits');
      suggestions.push('Ensure phone number has exactly 10 digits');
    }
    
    if (cleaned.length === 10 && !cleaned.startsWith('9')) {
      score -= 10;
      issues.push('Nepal mobile numbers typically start with 9');
      suggestions.push('Verify if this is a valid Nepal mobile number');
    }
    
    return { score, issues, suggestions };
  }

  private scoreAddress(value: string): { score: number; issues: string[]; suggestions: string[] } {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let score = 75;
    
    if (value.length < 5) {
      score -= 30;
      issues.push('Address too short');
      suggestions.push('Provide more detailed address information');
    }
    
    // Check for common Nepal locations
    const nepalLocations = ['kathmandu', 'pokhara', 'chitwan', 'butwal', 'nepalgunj', 'dhangadhi', 'biratnagar'];
    const hasNepalLocation = nepalLocations.some(location => 
      value.toLowerCase().includes(location)
    );
    
    if (hasNepalLocation) {
      score += 10;
    } else {
      score -= 5;
      suggestions.push('Consider including city or district name');
    }
    
    return { score, issues, suggestions };
  }

  private scoreGeneric(value: string): number {
    let score = 70;
    
    if (value.length < 2) score -= 20;
    if (value.length > 100) score -= 10;
    if (/^\s+|\s+$/.test(value)) score -= 5; // Leading/trailing spaces
    
    return score;
  }

  private calculateOverallQuality(fieldScores: DataQualityScore[]): OverallQuality {
    if (fieldScores.length === 0) {
      return {
        totalScore: 0,
        fieldsAnalyzed: 0,
        criticalIssues: 0,
        suggestions: ['No data to analyze'],
        extractionAccuracy: 0
      };
    }
    
    const totalScore = Math.round(
      fieldScores.reduce((sum, field) => sum + field.score, 0) / fieldScores.length
    );
    
    const criticalIssues = fieldScores.filter(field => field.score < 50).length;
    const aiExtractedFields = fieldScores.filter(field => field.aiExtracted);
    const extractionAccuracy = aiExtractedFields.length > 0 ? 
      aiExtractedFields.reduce((sum, field) => sum + field.confidence, 0) / aiExtractedFields.length : 0;
    
    const suggestions: string[] = [];
    if (totalScore < 60) {
      suggestions.push('🔍 Multiple data quality issues detected - review and correct highlighted fields');
    }
    if (criticalIssues > 0) {
      suggestions.push(`⚠️ ${criticalIssues} field(s) need immediate attention`);
    }
    if (extractionAccuracy < 0.7) {
      suggestions.push('🤖 Low AI extraction confidence - manual verification recommended');
    }
    
    return {
      totalScore,
      fieldsAnalyzed: fieldScores.length,
      criticalIssues,
      suggestions,
      extractionAccuracy: Math.round(extractionAccuracy * 100) / 100
    };
  }
}

export const dataQualityService = new DataQualityService();
