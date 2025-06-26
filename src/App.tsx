
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from '@/hooks/useAuth';
import { LoginForm } from '@/components/auth/LoginForm';
import { Layout } from '@/components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Wallets from './pages/Wallets';
import Payouts from './pages/Payouts';
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  if (!user) {
    return <LoginForm />;
  }
  
  return <Layout>{children}</Layout>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/wallets" element={
            <ProtectedRoute>
              <Wallets />
            </ProtectedRoute>
          } />
          <Route path="/payouts" element={
            <ProtectedRoute>
              <Payouts />
            </ProtectedRoute>
          } />
          <Route path="/instances" element={
            <ProtectedRoute>
              <div>Instances Page - Coming Soon</div>
            </ProtectedRoute>
          } />
          <Route path="/cardholders" element={
            <ProtectedRoute>
              <div>Cardholders Page - Coming Soon</div>
            </ProtectedRoute>
          } />
          <Route path="/transactions" element={
            <ProtectedRoute>
              <div>Transactions Page - Coming Soon</div>
            </ProtectedRoute>
          } />
          <Route path="/disputes" element={
            <ProtectedRoute>
              <div>Disputes Page - Coming Soon</div>
            </ProtectedRoute>
          } />
          <Route path="/reports" element={
            <ProtectedRoute>
              <div>Reports Page - Coming Soon</div>
            </ProtectedRoute>
          } />
          <Route path="/users" element={
            <ProtectedRoute>
              <div>Users Page - Coming Soon</div>
            </ProtectedRoute>
          } />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
