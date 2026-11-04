import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { Switch, Route, useLocation } from "wouter";
import Home from "@/pages/Home";
import Dashboard from "@/pages/Dashboard";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import NotFound from "@/pages/not-found";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { LocaleProvider } from "@/lib/i18n";
import { InstallAppPrompt } from "@/components/InstallAppPrompt";
import { AppLaunchSplash } from "@/components/AppLaunchSplash";

function Router() {
  const { user, isLoading } = useAuth();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && user && (location === "/login" || location === "/signup")) {
      setLocation("/");
    }
  }, [user, isLoading, location, setLocation]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/dashboard">
        {user ? <Dashboard /> : <Home />}
      </Route>
      <Route path="/">
        {user ? <Dashboard /> : <Home />}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function VisitTracker() {
  useEffect(() => {
    const trackVisit = async () => {
      try {
        const sessionKey = 'visit_tracked';
        if (sessionStorage.getItem(sessionKey)) return;
        
        await fetch('/api/analytics/visit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });
        sessionStorage.setItem(sessionKey, 'true');
      } catch (error) {
        console.error('Failed to track visit:', error);
      }
    };
    trackVisit();
  }, []);
  
  return null;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light">
        <LocaleProvider>
          <TooltipProvider>
            <VisitTracker />
            <Router />
            <InstallAppPrompt />
            <AppLaunchSplash />
            <Toaster />
          </TooltipProvider>
        </LocaleProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
