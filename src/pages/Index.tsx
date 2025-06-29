import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, FileText, Bell, Share2, Smartphone, Cloud, Menu, X, ChevronRight, Star, Users, CheckCircle } from "lucide-react";

const Index = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('');

  // Handle smooth scrolling and active section tracking
  useEffect(() => {
    const handleScroll = () => {
      const sections = ['features', 'pricing', 'contact'];
      const scrollPosition = window.scrollY + 100;

      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const offsetTop = element.offsetTop;
          const offsetHeight = element.offsetHeight;
          
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const offsetTop = element.offsetTop - 80; // Account for fixed header
      window.scrollTo({
        top: offsetTop,
        behavior: 'smooth'
      });
    }
    setMobileMenuOpen(false);
  };

  const navItems = [
    { id: 'features', label: 'Features' },
    { id: 'pricing', label: 'Pricing' },
    { id: 'contact', label: 'Contact' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-red-50">
      {/* Header */}
      <header className="border-b bg-white/95 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105 overflow-hidden">
              <img 
                src="/Gemini_Generated_Image_w0veeiw0veeiw0ve 1.png" 
                alt="NepLife Logo"
                className="w-full h-full object-contain bg-white"
              />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-red-600 bg-clip-text text-transparent">
              NepLife
            </h1>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className={`text-gray-600 hover:text-blue-600 transition-colors font-medium relative py-2 ${
                  activeSection === item.id ? 'text-blue-600' : ''
                }`}
              >
                {item.label}
                {activeSection === item.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full" />
                )}
              </button>
            ))}
            <Link to="/login" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">
              Login
            </Link>
            <Link to="/signup">
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300">
                Get Started
              </Button>
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t bg-white/95 backdrop-blur-md">
            <nav className="container mx-auto px-4 py-4 flex flex-col gap-4">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className={`text-left text-gray-600 hover:text-blue-600 transition-colors font-medium py-2 ${
                    activeSection === item.id ? 'text-blue-600' : ''
                  }`}
                >
                  {item.label}
                </button>
              ))}
              <Link to="/login" className="text-gray-600 hover:text-blue-600 transition-colors font-medium py-2">
                Login
              </Link>
              <Link to="/signup" className="mt-2">
                <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  Get Started
                </Button>
              </Link>
            </nav>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 lg:py-32 text-center">
        <div className="max-w-5xl mx-auto">
          {/* Trust Badge */}
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-blue-200 rounded-full px-4 py-2 mb-8 shadow-sm">
            <Star className="w-4 h-4 text-yellow-500 fill-current" />
            <span className="text-sm font-medium text-gray-700">Trusted by 10,000+ drivers</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>

          <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-8 bg-gradient-to-r from-blue-600 via-purple-600 to-red-600 bg-clip-text text-transparent leading-tight">
            Smart Driving License Management for Nepal
          </h2>
          <p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
            Digitize, manage, and share your driving license with AI-powered OCR technology. 
            Never miss an expiry date again with intelligent reminders.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
            <Link to="/signup">
              <Button size="lg" className="text-lg px-10 py-7 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 rounded-xl font-semibold">
                Start Managing Your License
                <ChevronRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link to="/loading-demo">
              <Button variant="outline" size="lg" className="text-lg px-10 py-7 border-2 hover:bg-gray-50 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl font-semibold">
                Watch Demo
              </Button>
            </Link>
          </div>

          {/* Trust Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            <div className="flex items-center justify-center gap-3 text-gray-600">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="font-medium">Bank-Level Security</span>
            </div>
            <div className="flex items-center justify-center gap-3 text-gray-600">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="font-medium">Government Approved</span>
            </div>
            <div className="flex items-center justify-center gap-3 text-gray-600">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="font-medium">24/7 Support</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-20 lg:py-32">
        <div className="text-center mb-20">
          <h3 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
            Powerful Features
          </h3>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Everything you need to manage your driving license digitally and securely
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
          <Card className="group hover:shadow-2xl transition-all duration-500 border-0 bg-white/80 backdrop-blur-sm hover:scale-105 hover:bg-white">
            <CardHeader className="pb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
              <CardTitle className="text-2xl mb-4">AI-Powered OCR</CardTitle>
              <CardDescription className="text-lg leading-relaxed">
                Automatically extract license details from photos using advanced OCR technology with 99% accuracy
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="group hover:shadow-2xl transition-all duration-500 border-0 bg-white/80 backdrop-blur-sm hover:scale-105 hover:bg-white">
            <CardHeader className="pb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-red-100 to-red-200 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Bell className="w-8 h-8 text-red-600" />
              </div>
              <CardTitle className="text-2xl mb-4">Smart Reminders</CardTitle>
              <CardDescription className="text-lg leading-relaxed">
                Get notified before your license expires with intelligent reminder system and renewal guides
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="group hover:shadow-2xl transition-all duration-500 border-0 bg-white/80 backdrop-blur-sm hover:scale-105 hover:bg-white">
            <CardHeader className="pb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Share2 className="w-8 h-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl mb-4">Secure Sharing</CardTitle>
              <CardDescription className="text-lg leading-relaxed">
                Share your license with authorities using encrypted, time-limited links with QR codes
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="group hover:shadow-2xl transition-all duration-500 border-0 bg-white/80 backdrop-blur-sm hover:scale-105 hover:bg-white">
            <CardHeader className="pb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Smartphone className="w-8 h-8 text-purple-600" />
              </div>
              <CardTitle className="text-2xl mb-4">Mobile Friendly</CardTitle>
              <CardDescription className="text-lg leading-relaxed">
                Access your licenses anywhere with our responsive mobile design and offline support
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="group hover:shadow-2xl transition-all duration-500 border-0 bg-white/80 backdrop-blur-sm hover:scale-105 hover:bg-white">
            <CardHeader className="pb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Shield className="w-8 h-8 text-yellow-600" />
              </div>
              <CardTitle className="text-2xl mb-4">Bank-Level Security</CardTitle>
              <CardDescription className="text-lg leading-relaxed">
                Your documents are protected with enterprise-grade encryption and secure cloud storage
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="group hover:shadow-2xl transition-all duration-500 border-0 bg-white/80 backdrop-blur-sm hover:scale-105 hover:bg-white">
            <CardHeader className="pb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Cloud className="w-8 h-8 text-indigo-600" />
              </div>
              <CardTitle className="text-2xl mb-4">Cloud Backup</CardTitle>
              <CardDescription className="text-lg leading-relaxed">
                Never lose your documents with automatic cloud synchronization and data recovery
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="container mx-auto px-4 py-20 lg:py-32 bg-gray-50">
        <div className="text-center mb-20">
          <h3 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
            Simple Pricing
          </h3>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Choose the plan that works best for you
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <Card className="border-2 hover:shadow-xl transition-all duration-300">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Basic</CardTitle>
              <div className="text-4xl font-bold text-blue-600">Free</div>
              <CardDescription>Perfect for individual users</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Up to 3 licenses
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Basic OCR scanning
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Expiry reminders
                </li>
              </ul>
              <Button className="w-full mt-6" variant="outline">Get Started</Button>
            </CardContent>
          </Card>

          <Card className="border-2 border-blue-500 hover:shadow-xl transition-all duration-300 relative">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">Popular</span>
            </div>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Pro</CardTitle>
              <div className="text-4xl font-bold text-blue-600">$9.99<span className="text-lg text-gray-500">/mo</span></div>
              <CardDescription>For power users and families</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Unlimited licenses
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Advanced OCR with 99% accuracy
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Smart reminders & notifications
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Secure sharing with QR codes
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Cloud backup & sync
                </li>
              </ul>
              <Button className="w-full mt-6 bg-gradient-to-r from-blue-600 to-purple-600">Get Started</Button>
            </CardContent>
          </Card>

          <Card className="border-2 hover:shadow-xl transition-all duration-300">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Enterprise</CardTitle>
              <div className="text-4xl font-bold text-blue-600">Custom</div>
              <CardDescription>For organizations and fleets</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Everything in Pro
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Bulk license management
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  API access
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Priority support
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Custom integrations
                </li>
              </ul>
              <Button className="w-full mt-6" variant="outline">Contact Sales</Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="container mx-auto px-4 py-20 lg:py-32">
        <div className="text-center mb-20">
          <h3 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
            Get in Touch
          </h3>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Have questions? We're here to help you get started with NepLife
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <Card className="shadow-xl">
            <CardContent className="p-8">
              <form className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                    <input type="text" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                    <input type="text" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input type="email" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                  <textarea rows={4} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"></textarea>
                </div>
                <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  Send Message
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 via-purple-600 to-red-600 text-white py-20 lg:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <h3 className="text-4xl md:text-5xl font-bold mb-6">Ready to Digitize Your License?</h3>
          <p className="text-xl md:text-2xl mb-12 opacity-90 max-w-2xl mx-auto leading-relaxed">
            Join thousands of Nepali drivers who trust NepLife with their documents
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link to="/signup">
              <Button size="lg" variant="secondary" className="text-lg px-10 py-7 bg-white text-gray-900 hover:bg-gray-100 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 rounded-xl font-semibold">
                Create Your Account
                <ChevronRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link to="/loading-demo">
              <Button size="lg" variant="outline" className="text-lg px-10 py-7 border-2 border-white text-white hover:bg-white hover:text-gray-900 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-xl font-semibold">
                Watch Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16 lg:py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg overflow-hidden">
                  <img 
                    src="/Gemini_Generated_Image_w0veeiw0veeiw0ve 1.png" 
                    alt="NepLife Logo"
                    className="w-full h-full object-contain bg-white"
                  />
                </div>
                <h4 className="text-2xl font-bold">NepLife</h4>
              </div>
              <p className="text-gray-400 leading-relaxed mb-6">
                The smart way to manage your driving license in Nepal with cutting-edge technology.
              </p>
              <div className="flex gap-4">
                {/* Social media icons placeholder */}
                <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors cursor-pointer">
                  <span className="text-sm">f</span>
                </div>
                <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors cursor-pointer">
                  <span className="text-sm">t</span>
                </div>
                <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors cursor-pointer">
                  <span className="text-sm">in</span>
                </div>
              </div>
            </div>
            <div>
              <h5 className="font-bold text-lg mb-6">Product</h5>
              <ul className="space-y-4 text-gray-400">
                <li><button onClick={() => scrollToSection('features')} className="hover:text-white transition-colors">Features</button></li>
                <li><button onClick={() => scrollToSection('pricing')} className="hover:text-white transition-colors">Pricing</button></li>
                <li><Link to="/loading-demo" className="hover:text-white transition-colors">Demo</Link></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
              </ul>
            </div>
            <div>
              <h5 className="font-bold text-lg mb-6">Support</h5>
              <ul className="space-y-4 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><button onClick={() => scrollToSection('contact')} className="hover:text-white transition-colors">Contact</button></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
              </ul>
            </div>
            <div>
              <h5 className="font-bold text-lg mb-6">Company</h5>
              <ul className="space-y-4 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Press</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
            <p>&copy; 2024 NepLife. All rights reserved. Made with ❤️ for Nepal.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;