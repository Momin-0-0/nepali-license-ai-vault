import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Presentation, Users, Award } from "lucide-react";
import DemoMode from "@/components/DemoMode";

const DemoPresentation = () => {
  const [showDemo, setShowDemo] = useState(false);
  const navigate = useNavigate();

  const handleDemoComplete = () => {
    setShowDemo(false);
  };

  if (showDemo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Button 
              variant="ghost" 
              onClick={() => setShowDemo(false)}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Setup
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">Live Demo Presentation</h1>
          </div>
          
          <DemoMode onDemoComplete={handleDemoComplete} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg overflow-hidden">
              <img 
                src="/Gemini_Generated_Image_w0veeiw0veeiw0ve 1.png" 
                alt="NepLife Logo"
                className="w-full h-full object-contain bg-white"
              />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              NepLife Demo
            </h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto text-center">
          {/* Hero Section */}
          <div className="mb-12">
            <div className="flex items-center justify-center gap-3 mb-6">
              <Presentation className="w-16 h-16 text-blue-600" />
              <Users className="w-12 h-12 text-purple-600" />
              <Award className="w-12 h-12 text-green-600" />
            </div>
            
            <h2 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 bg-clip-text text-transparent mb-6">
              College Presentation Mode
            </h2>
            
            <p className="text-xl text-gray-700 mb-8 max-w-3xl mx-auto leading-relaxed">
              Interactive demonstration of NepLife's AI-powered driving license management system. 
              Perfect for showcasing advanced technology and real-world applications.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-600">
                  <Presentation className="w-6 h-6" />
                  Interactive Demo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Step-by-step walkthrough of AI OCR technology, data extraction, 
                  and smart validation features.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-600">
                  <Users className="w-6 h-6" />
                  Audience Friendly
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Clear explanations, visual progress indicators, and engaging 
                  animations perfect for presentations.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <Award className="w-6 h-6" />
                  Professional
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Showcase real-world applications, technical capabilities, 
                  and practical benefits of the system.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Demo Features */}
          <Card className="mb-12 bg-gradient-to-r from-blue-50 to-purple-50">
            <CardHeader>
              <CardTitle className="text-2xl">What This Demo Covers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                <div>
                  <h4 className="font-semibold text-blue-800 mb-3">Technical Features</h4>
                  <ul className="space-y-2 text-gray-700">
                    <li>• AI-powered OCR with 95% accuracy</li>
                    <li>• Nepal license format recognition</li>
                    <li>• Automatic data validation</li>
                    <li>• Smart field extraction (13+ fields)</li>
                    <li>• Real-time processing visualization</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-purple-800 mb-3">Practical Applications</h4>
                  <ul className="space-y-2 text-gray-700">
                    <li>• Digital license management</li>
                    <li>• Secure sharing with authorities</li>
                    <li>• Automated expiry reminders</li>
                    <li>• Bank-level security encryption</li>
                    <li>• Cloud backup and sync</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Start Demo Button */}
          <div className="space-y-6">
            <Button 
              onClick={() => setShowDemo(true)}
              size="lg"
              className="text-xl px-12 py-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
            >
              <Presentation className="w-6 h-6 mr-3" />
              Start Interactive Demo
            </Button>
            
            <p className="text-gray-600">
              Duration: ~5 minutes • Perfect for college presentations and technical showcases
            </p>
          </div>

          {/* Additional Info */}
          <Card className="mt-12 bg-gradient-to-r from-green-50 to-blue-50">
            <CardContent className="pt-6">
              <h4 className="font-semibold text-green-800 mb-3">Perfect For</h4>
              <div className="flex flex-wrap justify-center gap-4 text-sm">
                <span className="bg-white px-3 py-1 rounded-full text-green-700">College Projects</span>
                <span className="bg-white px-3 py-1 rounded-full text-blue-700">Technical Presentations</span>
                <span className="bg-white px-3 py-1 rounded-full text-purple-700">AI Demonstrations</span>
                <span className="bg-white px-3 py-1 rounded-full text-orange-700">Product Showcases</span>
                <span className="bg-white px-3 py-1 rounded-full text-red-700">Innovation Fairs</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DemoPresentation;