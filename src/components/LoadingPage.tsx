import React, { useState, useEffect } from 'react';
import { Shield, FileText, Bell, Share2, CheckCircle } from 'lucide-react';

interface LoadingPageProps {
  onLoadingComplete?: () => void;
  duration?: number;
}

const LoadingPage: React.FC<LoadingPageProps> = ({ 
  onLoadingComplete, 
  duration = 3000 
}) => {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const loadingSteps = [
    { icon: Shield, text: "Initializing secure vault...", color: "text-blue-600" },
    { icon: FileText, text: "Loading license management...", color: "text-green-600" },
    { icon: Bell, text: "Setting up notifications...", color: "text-orange-600" },
    { icon: Share2, text: "Preparing sharing features...", color: "text-purple-600" },
    { icon: CheckCircle, text: "Ready to go!", color: "text-emerald-600" }
  ];

  useEffect(() => {
    const stepDuration = duration / loadingSteps.length;
    const progressInterval = 50; // Update every 50ms for smooth animation
    const progressIncrement = 100 / (duration / progressInterval);

    const progressTimer = setInterval(() => {
      setProgress(prev => {
        const newProgress = Math.min(prev + progressIncrement, 100);
        
        // Update current step based on progress
        const newStep = Math.min(
          Math.floor((newProgress / 100) * loadingSteps.length),
          loadingSteps.length - 1
        );
        setCurrentStep(newStep);

        if (newProgress >= 100) {
          setIsComplete(true);
          clearInterval(progressTimer);
          
          // Call completion callback after a brief delay
          setTimeout(() => {
            onLoadingComplete?.();
          }, 500);
        }

        return newProgress;
      });
    }, progressInterval);

    return () => clearInterval(progressTimer);
  }, [duration, onLoadingComplete, loadingSteps.length]);

  const CurrentIcon = loadingSteps[currentStep]?.icon || Shield;

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-blue-50 via-white to-red-50 flex items-center justify-center">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="relative z-10 text-center max-w-md mx-auto px-6">
        {/* Logo and Brand */}
        <div className="mb-12">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl overflow-hidden transform hover:scale-105 transition-transform duration-300">
              <img 
                src="/Gemini_Generated_Image_w0veeiw0veeiw0ve 1.png" 
                alt="NepLife Logo"
                className="w-full h-full object-contain bg-white"
              />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-red-600 bg-clip-text text-transparent">
                NepLife
              </h1>
              <p className="text-gray-600 text-sm font-medium">Smart License Management</p>
            </div>
          </div>
        </div>

        {/* Loading Animation */}
        <div className="mb-8">
          <div className="relative w-24 h-24 mx-auto mb-6">
            {/* Outer Ring */}
            <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
            
            {/* Progress Ring */}
            <svg className="absolute inset-0 w-24 h-24 transform -rotate-90" viewBox="0 0 96 96">
              <circle
                cx="48"
                cy="48"
                r="44"
                fill="none"
                stroke="url(#gradient)"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 44}`}
                strokeDashoffset={`${2 * Math.PI * 44 * (1 - progress / 100)}`}
                className="transition-all duration-300 ease-out"
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3B82F6" />
                  <stop offset="50%" stopColor="#8B5CF6" />
                  <stop offset="100%" stopColor="#EF4444" />
                </linearGradient>
              </defs>
            </svg>

            {/* Center Icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className={`w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center transform transition-all duration-500 ${
                isComplete ? 'scale-110' : 'scale-100'
              }`}>
                <CurrentIcon className={`w-6 h-6 ${loadingSteps[currentStep]?.color || 'text-blue-600'} transition-colors duration-300`} />
              </div>
            </div>
          </div>

          {/* Progress Percentage */}
          <div className="text-3xl font-bold text-gray-800 mb-2">
            {Math.round(progress)}%
          </div>
        </div>

        {/* Loading Steps */}
        <div className="space-y-3 mb-8">
          {loadingSteps.map((step, index) => {
            const StepIcon = step.icon;
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;
            
            return (
              <div
                key={index}
                className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 ${
                  isActive 
                    ? 'bg-white shadow-md scale-105' 
                    : isCompleted 
                    ? 'bg-green-50' 
                    : 'bg-gray-50 opacity-60'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-300 ${
                  isCompleted 
                    ? 'bg-green-100' 
                    : isActive 
                    ? 'bg-blue-100' 
                    : 'bg-gray-100'
                }`}>
                  {isCompleted ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <StepIcon className={`w-5 h-5 ${
                      isActive ? step.color : 'text-gray-400'
                    }`} />
                  )}
                </div>
                <span className={`text-sm font-medium transition-colors duration-300 ${
                  isActive 
                    ? 'text-gray-900' 
                    : isCompleted 
                    ? 'text-green-700' 
                    : 'text-gray-500'
                }`}>
                  {step.text}
                </span>
              </div>
            );
          })}
        </div>

        {/* Loading Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-600 via-purple-600 to-red-600 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Tagline */}
        <p className="text-gray-600 text-sm mt-6 animate-pulse">
          Securing your digital identity...
        </p>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-20 left-20 w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
      <div className="absolute top-32 right-32 w-3 h-3 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.5s' }} />
      <div className="absolute bottom-32 left-32 w-2 h-2 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: '1s' }} />
      <div className="absolute bottom-20 right-20 w-3 h-3 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '1.5s' }} />
    </div>
  );
};

export default LoadingPage;