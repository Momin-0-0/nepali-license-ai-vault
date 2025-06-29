import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from 'react-helmet-async';
import ErrorBoundary from "@/components/ErrorBoundary";
import { AccessibilityProvider } from "@/components/AccessibilityProvider";
import OfflineIndicator from "@/components/OfflineIndicator";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Upload from "./pages/Upload";
import SharedLinks from "./pages/SharedLinks";
import SharedLicense from "./pages/SharedLicense";
import AllLicenses from "./pages/AllLicenses";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Analytics from "./pages/Analytics";
import LoadingDemo from "./pages/LoadingDemo";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        return failureCount < 3;
      },
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <HelmetProvider>
      <AccessibilityProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <OfflineIndicator />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/upload" element={<Upload />} />
                <Route path="/shared-links" element={<SharedLinks />} />
                <Route path="/shared/:shareToken" element={<SharedLicense />} />
                <Route path="/all-licenses" element={<AllLicenses />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/loading-demo" element={<LoadingDemo />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </QueryClientProvider>
      </AccessibilityProvider>
    </HelmetProvider>
  </ErrorBoundary>
);

export default App;