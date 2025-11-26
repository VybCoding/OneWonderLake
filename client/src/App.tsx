import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/home";
import TaxEstimatorPage from "@/pages/tax-estimator";
import MoreInfoPage from "@/pages/more-info";
import AdminPage from "@/pages/admin";
import UnsubscribePage from "@/pages/unsubscribe";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/tax-estimator" component={TaxEstimatorPage} />
      <Route path="/more-info" component={MoreInfoPage} />
      <Route path="/admin" component={AdminPage} />
      <Route path="/unsubscribe" component={UnsubscribePage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
