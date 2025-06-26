
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Payouts from "./pages/Payouts";
import Transactions from "./pages/Transactions";
import Cardholders from "./pages/Cardholders";
import Instances from "./pages/Instances";
import Wallets from "./pages/Wallets";
import FraudDashboard from "./pages/FraudDashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
          <Route path="/payouts" element={<Layout><Payouts /></Layout>} />
          <Route path="/transactions" element={<Layout><Transactions /></Layout>} />
          <Route path="/cardholders" element={<Layout><Cardholders /></Layout>} />
          <Route path="/instances" element={<Layout><Instances /></Layout>} />
          <Route path="/wallets" element={<Layout><Wallets /></Layout>} />
          <Route path="/fraud" element={<Layout><FraudDashboard /></Layout>} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
