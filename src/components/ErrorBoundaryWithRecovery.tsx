
import React, { Component, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  retryCount: number;
}

class ErrorBoundaryWithRecovery extends Component<Props, State> {
  private maxRetries = 3;
  
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    };
  }
  
  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    };
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });
    
    this.props.onError?.(error, errorInfo);
    
    // Log to console for debugging
    console.error('Error Boundary caught an error:', error, errorInfo);
  }
  
  handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: this.state.retryCount + 1
      });
    }
  };
  
  handleGoHome = () => {
    window.location.href = '/';
  };
  
  render() {
    if (this.state.hasError && this.props.fallback) {
      return this.props.fallback;
    }
    
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="w-5 h-5" />
                Something went wrong
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                We encountered an unexpected error. This might be temporary.
              </p>
              
              {this.state.error && (
                <details className="bg-gray-100 rounded p-3 text-sm">
                  <summary className="cursor-pointer font-medium">
                    Technical Details
                  </summary>
                  <pre className="mt-2 whitespace-pre-wrap text-xs">
                    {this.state.error.message}
                  </pre>
                </details>
              )}
              
              <div className="flex gap-2">
                {this.state.retryCount < this.maxRetries && (
                  <Button
                    onClick={this.handleRetry}
                    className="flex-1"
                    variant="outline"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again ({this.maxRetries - this.state.retryCount} left)
                  </Button>
                )}
                
                <Button
                  onClick={this.handleGoHome}
                  className="flex-1"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Go Home
                </Button>
              </div>
              
              {this.state.retryCount >= this.maxRetries && (
                <p className="text-sm text-gray-500 text-center">
                  If the problem persists, please refresh the page or contact support.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }
    
    return this.props.children;
  }
}

export default ErrorBoundaryWithRecovery;
