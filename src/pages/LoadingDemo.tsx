import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, RotateCcw, ArrowLeft } from 'lucide-react';
import LoadingPage from '@/components/LoadingPage';

const LoadingDemo = () => {
  const [showLoading, setShowLoading] = useState(false);
  const navigate = useNavigate();

  const startDemo = () => {
    setShowLoading(true);
  };

  const handleLoadingComplete = () => {
    setShowLoading(false);
  };

  const resetDemo = () => {
    setShowLoading(false);
  };

  const goBack = () => {
    navigate('/');
  };

  if (showLoading) {
    return (
      <LoadingPage 
        onLoadingComplete={handleLoadingComplete}
        duration={4000} // 4 seconds for demo
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-red-50 flex items-center justify-center p-4">
      {/* Back Button */}
      <Button 
        onClick={goBack}
        variant="ghost" 
        className="absolute top-4 left-4 hover:bg-white/80"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Home
      </Button>

      <Card className="max-w-md w-full shadow-xl">
        <CardHeader className="text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg mx-auto mb-4 overflow-hidden">
            <img 
              src="/Gemini_Generated_Image_w0veeiw0veeiw0ve 1.png" 
              alt="NepLife Logo"
              className="w-full h-full object-contain bg-white"
            />
          </div>
          <CardTitle className="text-2xl bg-gradient-to-r from-blue-600 to-red-600 bg-clip-text text-transparent">
            NepLife Loading Demo
          </CardTitle>
          <CardDescription>
            Experience the beautiful loading animation for the NepLife application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center space-y-4">
            <p className="text-gray-600 text-sm">
              Click the button below to see the loading page in action. The animation includes:
            </p>
            <ul className="text-left text-sm text-gray-600 space-y-1">
              <li>• Animated progress ring with gradient</li>
              <li>• Step-by-step loading indicators</li>
              <li>• Smooth transitions and micro-interactions</li>
              <li>• Brand-consistent design</li>
            </ul>
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={startDemo} 
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Play className="w-4 h-4 mr-2" />
              Start Demo
            </Button>
            <Button 
              onClick={resetDemo} 
              variant="outline"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoadingDemo;