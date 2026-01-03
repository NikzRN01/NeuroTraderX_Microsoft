
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Index from "./pages/Index";
import Portfolio from "./pages/Portfolio";
import Markets from "./pages/Markets";
import Insights from "./pages/Insights";
import AiChat from "./pages/AiChat";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import NewsPage from "./pages/NewsPage";
import AiRecommendation from "./pages/AiRecommendation";
import TaxOptimization from "./pages/TaxOptimization";
import Landing from "./pages/Landing";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import Onboarding from "./pages/Onboarding";

const queryClient = new QueryClient();

// Authentication wrapper component
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const isAuthenticated = localStorage.getItem("authenticated") === "true";
  const isNewUser = localStorage.getItem("isNewUser") === "true";
  
  if (!isAuthenticated) {
    return <Navigate to="/landing" replace />;
  }
  
  if (isAuthenticated && isNewUser) {
    return <Navigate to="/onboarding" replace />;
  }
  
  return children;
};

// Public routes that should redirect to dashboard if already authenticated
const PublicRoute = ({ children }: { children: JSX.Element }) => {
  const isAuthenticated = localStorage.getItem("authenticated") === "true";
  const isNewUser = localStorage.getItem("isNewUser") === "true";
  
  if (isAuthenticated && !isNewUser) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

const App = () => {
  const [isAppReady, setIsAppReady] = useState(false);
  
  useEffect(() => {
    // This ensures localStorage is available before rendering routes
    setIsAppReady(true);
  }, []);
  
  if (!isAppReady) {
    return null; // Or a loading spinner
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AnimatePresence mode="wait">
            <Routes>
              {/* Public Routes */}
              <Route 
                path="/landing" 
                element={
                  <PublicRoute>
                    <Landing />
                  </PublicRoute>
                } 
              />
              <Route 
                path="/signin" 
                element={
                  <PublicRoute>
                    <SignIn />
                  </PublicRoute>
                } 
              />
              <Route 
                path="/signup" 
                element={
                  <PublicRoute>
                    <SignUp />
                  </PublicRoute>
                } 
              />
              <Route 
                path="/onboarding" 
                element={
                  <Onboarding />
                } 
              />
              
              {/* Protected Routes with Navbar and Footer */}
              <Route 
                path="/" 
                element={
                  <ProtectedRoute>
                    <div className="min-h-screen bg-background flex flex-col">
                      <Navbar />
                      <div className="flex-1">
                        <Index />
                      </div>
                      <Footer />
                    </div>
                  </ProtectedRoute>
                }
              />
              <Route 
                path="/portfolio" 
                element={
                  <ProtectedRoute>
                    <div className="min-h-screen bg-background flex flex-col">
                      <Navbar />
                      <div className="flex-1">
                        <Portfolio />
                      </div>
                      <Footer />
                    </div>
                  </ProtectedRoute>
                }
              />
              <Route 
                path="/markets" 
                element={
                  <ProtectedRoute>
                    <div className="min-h-screen bg-background flex flex-col">
                      <Navbar />
                      <div className="flex-1">
                        <Markets />
                      </div>
                      <Footer />
                    </div>
                  </ProtectedRoute>
                }
              />
              <Route 
                path="/insights" 
                element={
                  <ProtectedRoute>
                    <div className="min-h-screen bg-background flex flex-col">
                      <Navbar />
                      <div className="flex-1">
                        <Insights />
                      </div>
                      <Footer />
                    </div>
                  </ProtectedRoute>
                }
              />
              <Route 
                path="/ai-chat" 
                element={
                  <ProtectedRoute>
                    <div className="min-h-screen bg-background flex flex-col">
                      <Navbar />
                      <div className="flex-1">
                        <AiChat />
                      </div>
                      <Footer />
                    </div>
                  </ProtectedRoute>
                }
              />
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute>
                    <div className="min-h-screen bg-background flex flex-col">
                      <Navbar />
                      <div className="flex-1">
                        <Profile />
                      </div>
                      <Footer />
                    </div>
                  </ProtectedRoute>
                }
              />
              <Route 
                path="/news" 
                element={
                  <ProtectedRoute>
                    <div className="min-h-screen bg-background flex flex-col">
                      <Navbar />
                      <div className="flex-1">
                        <NewsPage />
                      </div>
                      <Footer />
                    </div>
                  </ProtectedRoute>
                }
              />
              <Route 
                path="/ai-recommendation/:id" 
                element={
                  <ProtectedRoute>
                    <div className="min-h-screen bg-background flex flex-col">
                      <Navbar />
                      <div className="flex-1">
                        <AiRecommendation />
                      </div>
                      <Footer />
                    </div>
                  </ProtectedRoute>
                }
              />
              <Route 
                path="/tax-optimization" 
                element={
                  <ProtectedRoute>
                    <div className="min-h-screen bg-background flex flex-col">
                      <Navbar />
                      <div className="flex-1">
                        <TaxOptimization />
                      </div>
                      <Footer />
                    </div>
                  </ProtectedRoute>
                }
              />
              
              {/* Catch-all route */}
              <Route 
                path="*" 
                element={
                  <div className="min-h-screen bg-background flex flex-col">
                    <Navbar />
                    <div className="flex-1">
                      <NotFound />
                    </div>
                    <Footer />
                  </div>
                } 
              />
            </Routes>
          </AnimatePresence>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
