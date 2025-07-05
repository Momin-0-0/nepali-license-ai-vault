import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Monitor,
  Users,
  Zap,
  Brain,
  Shield,
  CheckCircle,
  ArrowRight
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DemoStep {
  id: string;
  title: string;
  description: string;
  action: string;
  duration: number;
  highlight?: string;
}

interface DemoModeProps {
  onDemoComplete?: () => void;
}

const DemoMode: React.FC<DemoModeProps> = ({ onDemoComplete }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const { toast } = useToast();

  const demoSteps: DemoStep[] = [
    {
      id: 'intro',
      title: 'Welcome to NepLife',
      description: 'AI-powered driving license management for Nepal',
      action: 'Initializing smart license scanner...',
      duration: 3000,
      highlight: 'AI Technology'
    },
    {
      id: 'upload',
      title: 'Smart Image Upload',
      description: 'Advanced OCR recognizes Nepal license format (XX-XXX-XXXXXX)',
      action: 'Processing license image with AI...',
      duration: 4000,
      highlight: 'OCR Processing'
    },
    {
      id: 'extraction',
      title: 'Data Extraction',
      description: 'AI extracts 13+ fields automatically with 95% accuracy',
      action: 'Extracting: Name, Address, License Number, Dates...',
      duration: 3500,
      highlight: 'Field Recognition'
    },
    {
      id: 'validation',
      title: 'Smart Validation',
      description: 'Validates Nepal license patterns and suggests corrections',
      action: 'Validating license format and data integrity...',
      duration: 2500,
      highlight: 'Data Quality'
    },
    {
      id: 'storage',
      title: 'Secure Storage',
      description: 'Bank-level encryption with cloud backup capabilities',
      action: 'Encrypting and storing license data securely...',
      duration: 2000,
      highlight: 'Security'
    },
    {
      id: 'features',
      title: 'Smart Features',
      description: 'Expiry reminders, secure sharing, and analytics',
      action: 'Setting up intelligent notifications and sharing...',
      duration: 3000,
      highlight: 'Automation'
    },
    {
      id: 'complete',
      title: 'Demo Complete',
      description: 'Ready for real-world license management',
      action: 'NepLife is ready to manage your licenses!',
      duration: 2000,
      highlight: 'Success'
    }
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning && currentStep < demoSteps.length) {
      const step = demoSteps[currentStep];
      interval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + (100 / (step.duration / 100));
          if (newProgress >= 100) {
            setCompletedSteps(prev => new Set([...prev, currentStep]));
            setCurrentStep(prev => prev + 1);
            setProgress(0);
            
            // Show step completion toast
            toast({
              title: step.title,
              description: "Step completed successfully",
            });
            
            return 0;
          }
          return newProgress;
        });
      }, 100);
    } else if (currentStep >= demoSteps.length) {
      setIsRunning(false);
      onDemoComplete?.();
      toast({
        title: "Demo Complete!",
        description: "NepLife demonstration finished successfully",
      });
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, currentStep, demoSteps, toast, onDemoComplete]);

  const startDemo = () => {
    setIsRunning(true);
    setCurrentStep(0);
    setProgress(0);
    setCompletedSteps(new Set());
  };

  const pauseDemo = () => {
    setIsRunning(false);
  };

  const resetDemo = () => {
    setIsRunning(false);
    setCurrentStep(0);
    setProgress(0);
    setCompletedSteps(new Set());
  };

  const currentStepData = demoSteps[currentStep] || demoSteps[demoSteps.length - 1];

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Demo Header */}
      <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-2xl">
            <Monitor className="w-8 h-8" />
            NepLife Demo Mode
            <Badge variant="secondary" className="bg-white text-blue-600">
              College Presentation
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-blue-100 text-lg">
            Interactive demonstration of AI-powered license management for Nepal
          </p>
          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              <span>Perfect for presentations</span>
            </div>
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5" />
              <span>AI Technology showcase</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              <span>Security features</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Demo Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex gap-3">
              <Button 
                onClick={startDemo} 
                disabled={isRunning}
                className="bg-green-600 hover:bg-green-700"
              >
                <Play className="w-4 h-4 mr-2" />
                Start Demo
              </Button>
              
              <Button 
                onClick={pauseDemo} 
                disabled={!isRunning}
                variant="outline"
              >
                <Pause className="w-4 h-4 mr-2" />
                Pause
              </Button>
              
              <Button 
                onClick={resetDemo}
                variant="outline"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
            </div>
            
            <Badge variant="outline" className="text-lg px-3 py-1">
              Step {currentStep + 1} of {demoSteps.length}
            </Badge>
          </div>

          {/* Current Step Display */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-gray-800">
                {currentStepData.title}
              </h3>
              {currentStepData.highlight && (
                <Badge className="bg-gradient-to-r from-blue-600 to-purple-600">
                  {currentStepData.highlight}
                </Badge>
              )}
            </div>
            
            <p className="text-gray-700 text-lg mb-4">
              {currentStepData.description}
            </p>
            
            <div className="flex items-center gap-3 mb-4">
              {isRunning ? (
                <Zap className="w-5 h-5 text-yellow-500 animate-pulse" />
              ) : (
                <CheckCircle className="w-5 h-5 text-green-500" />
              )}
              <span className="font-medium text-gray-800">
                {currentStepData.action}
              </span>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-blue-600 to-purple-600 h-3 rounded-full transition-all duration-100"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Demo Steps Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Demo Steps Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {demoSteps.map((step, index) => (
              <div 
                key={step.id}
                className={`flex items-center gap-4 p-3 rounded-lg border transition-all ${
                  index === currentStep 
                    ? 'bg-blue-50 border-blue-200' 
                    : completedSteps.has(index)
                    ? 'bg-green-50 border-green-200'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  completedSteps.has(index)
                    ? 'bg-green-500 text-white'
                    : index === currentStep
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-300 text-gray-600'
                }`}>
                  {completedSteps.has(index) ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <span className="text-sm font-bold">{index + 1}</span>
                  )}
                </div>
                
                <div className="flex-1">
                  <h4 className="font-semibold">{step.title}</h4>
                  <p className="text-sm text-gray-600">{step.description}</p>
                </div>
                
                {step.highlight && (
                  <Badge variant="outline" className="text-xs">
                    {step.highlight}
                  </Badge>
                )}
                
                {index === currentStep && isRunning && (
                  <ArrowRight className="w-5 h-5 text-blue-500 animate-pulse" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Demo Features Highlight */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50">
        <CardHeader>
          <CardTitle className="text-green-800">Key Features Demonstrated</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <Brain className="w-6 h-6 text-blue-600" />
              <div>
                <p className="font-semibold">AI OCR Technology</p>
                <p className="text-sm text-gray-600">95% accuracy rate</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-green-600" />
              <div>
                <p className="font-semibold">Bank-Level Security</p>
                <p className="text-sm text-gray-600">Encrypted storage</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Zap className="w-6 h-6 text-yellow-600" />
              <div>
                <p className="font-semibold">Smart Automation</p>
                <p className="text-sm text-gray-600">Intelligent reminders</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DemoMode;