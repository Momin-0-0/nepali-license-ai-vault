
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Target,
  Languages,
  BarChart3,
  Lightbulb
} from "lucide-react";
import { translationService } from "@/services/translationService";
import { expiryPredictionService } from "@/services/expiryPredictionService";
import { dataQualityService } from "@/services/dataQualityService";
import { usageAnalyticsService } from "@/services/usageAnalyticsService";

interface AIInsightsProps {
  licenses: any[];
  selectedLicense?: any;
}

const AIInsights = ({ licenses, selectedLicense }: AIInsightsProps) => {
  const [insights, setInsights] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'predictions' | 'quality' | 'analytics' | 'translation'>('predictions');

  useEffect(() => {
    generateInsights();
  }, [licenses, selectedLicense]);

  const generateInsights = () => {
    // Generate expiry predictions
    const predictions = expiryPredictionService.generatePredictions(licenses);
    
    // Analyze usage patterns
    const analytics = usageAnalyticsService.generateInsights(licenses);
    
    // Quality scoring for selected license
    let qualityData = null;
    if (selectedLicense) {
      qualityData = dataQualityService.scoreLicenseData(selectedLicense);
    }
    
    setInsights({
      predictions,
      analytics,
      qualityData
    });
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-orange-600 bg-orange-50 border-orange-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      default: return 'bg-green-500';
    }
  };

  if (!insights) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Brain className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <p className="text-gray-500">Generating AI insights...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* AI Insights Header */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-700">
            <Brain className="w-5 h-5" />
            AI-Powered Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            <Button
              variant={activeTab === 'predictions' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('predictions')}
            >
              <Target className="w-4 h-4 mr-1" />
              Predictions
            </Button>
            <Button
              variant={activeTab === 'analytics' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('analytics')}
            >
              <BarChart3 className="w-4 h-4 mr-1" />
              Analytics
            </Button>
            {selectedLicense && (
              <Button
                variant={activeTab === 'quality' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTab('quality')}
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Quality Score
              </Button>
            )}
            <Button
              variant={activeTab === 'translation' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('translation')}
            >
              <Languages className="w-4 h-4 mr-1" />
              Translation
            </Button>
          </div>

          {/* Expiry Predictions */}
          {activeTab === 'predictions' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-800">Smart Expiry Predictions</h3>
              {insights.predictions.slice(0, 3).map((prediction: any) => {
                const license = licenses.find(l => l.id === prediction.licenseId);
                return (
                  <div key={prediction.licenseId} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{license?.licenseNumber}</span>
                      <Badge className={getRiskColor(prediction.riskLevel)}>
                        {prediction.riskLevel}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {prediction.daysUntilExpiry} days left • Renew by {prediction.recommendedRenewalDate}
                    </p>
                    <div className="space-y-1">
                      {prediction.aiInsights.map((insight: string, idx: number) => (
                        <p key={idx} className="text-xs text-gray-500">{insight}</p>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Usage Analytics */}
          {activeTab === 'analytics' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-800">Usage Pattern Analysis</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center p-3 bg-white rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{insights.analytics.stats.totalLicenses}</p>
                  <p className="text-sm text-gray-600">Total Licenses</p>
                </div>
                <div className="text-center p-3 bg-white rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{insights.analytics.stats.activeLicenses}</p>
                  <p className="text-sm text-gray-600">Active Licenses</p>
                </div>
              </div>
              
              {insights.analytics.insights.map((insight: any, idx: number) => (
                <div key={idx} className={`p-3 border rounded-lg ${getImpactColor(insight.impact)}`}>
                  <div className="flex items-start gap-2">
                    {insight.type === 'alert' && <AlertTriangle className="w-4 h-4 mt-0.5" />}
                    {insight.type === 'trend' && <TrendingUp className="w-4 h-4 mt-0.5" />}
                    {insight.type === 'recommendation' && <Lightbulb className="w-4 h-4 mt-0.5" />}
                    <div>
                      <h4 className="font-medium">{insight.title}</h4>
                      <p className="text-sm mt-1">{insight.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Data Quality Score */}
          {activeTab === 'quality' && insights.qualityData && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-800">Data Quality Analysis</h3>
              <div className="p-4 bg-white rounded-lg border">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium">Overall Quality Score</span>
                  <Badge variant={insights.qualityData.overallQuality.totalScore >= 80 ? 'default' : 'destructive'}>
                    {insights.qualityData.overallQuality.totalScore}/100
                  </Badge>
                </div>
                <div className="space-y-2">
                  {insights.qualityData.fieldScores.slice(0, 5).map((field: any) => (
                    <div key={field.field} className="flex items-center justify-between text-sm">
                      <span className="capitalize">{field.field.replace('_', ' ')}</span>
                      <div className="flex items-center gap-2">
                        {field.aiExtracted && <Brain className="w-3 h-3 text-purple-500" />}
                        <Badge variant={field.score >= 70 ? 'outline' : 'destructive'}>
                          {field.score}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {insights.qualityData.overallQuality.suggestions.map((suggestion: string, idx: number) => (
                <div key={idx} className="p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
                  {suggestion}
                </div>
              ))}
            </div>
          )}

          {/* Translation Tool */}
          {activeTab === 'translation' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-800">Nepali Translation Helper</h3>
              <div className="p-4 bg-white rounded-lg border">
                <p className="text-sm text-gray-600 mb-3">
                  AI can help translate common Nepal license terms between Nepali and English.
                </p>
                <div className="space-y-2">
                  <div className="p-2 bg-gray-50 rounded text-sm">
                    <strong>Example:</strong> "चालक अनुमतिपत्र" → "Driving License"
                  </div>
                  <div className="p-2 bg-gray-50 rounded text-sm">
                    <strong>Example:</strong> "यातायात व्यवस्थापन कार्यालय" → "Transport Management Office"
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  Translation confidence varies based on text recognition quality. 
                  Always verify important translations manually.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AIInsights;
