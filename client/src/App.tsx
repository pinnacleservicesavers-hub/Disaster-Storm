import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { WebSocketProvider } from "@/contexts/WebSocketContext";
import Dashboard from "@/pages/dashboard";
import Weather from "@/pages/weather";
import Claims from "@/pages/claims";
import MarketComparables from "@/pages/market-comparables";
import DataWarehouse from "@/pages/data-warehouse";
import LegalCompliance from "@/pages/legal-compliance";
import DroneIntegration from "@/pages/drone-integration";
import AIAssistant from "@/pages/ai-assistant";
import FieldReports from "@/pages/field-reports";
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/weather" component={Weather} />
      <Route path="/claims" component={Claims} />
      <Route path="/market-comparables" component={MarketComparables} />
      <Route path="/data-warehouse" component={DataWarehouse} />
      <Route path="/legal-compliance" component={LegalCompliance} />
      <Route path="/drone-integration" component={DroneIntegration} />
      <Route path="/ai-assistant" component={AIAssistant} />
      <Route path="/field-reports" component={FieldReports} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <LanguageProvider>
          <WebSocketProvider>
            <Toaster />
            <Router />
          </WebSocketProvider>
        </LanguageProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
