import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import LoginForm from "./pages/LoginForm";
import Conductor from "./pages/Conductor";
import Driver from "./pages/Driver";
import Owner from "./pages/Owner";
import Sacco from "./pages/Sacco";
import Trips from "./pages/Trips";
import FareRules from "./pages/FareRules";
import MPesa from "./pages/MPesa";
import Matatus from "./pages/Matatus";
import RevenueAnalytics from "./pages/RevenueAnalytics";
import OwnerWithdrawals from "./pages/OwnerWithdrawals.new";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <div className="min-h-screen bg-background text-foreground">
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login/:role" element={<LoginForm />} />
          <Route
            path="/conductor"
            element={
              <ProtectedRoute requiredRole="conductor">
                <Conductor />
              </ProtectedRoute>
            }
          />
          <Route
            path="/driver"
            element={
              <ProtectedRoute requiredRole="driver">
                <Driver />
              </ProtectedRoute>
            }
          />
          <Route
            path="/owner"
            element={
              <ProtectedRoute requiredRole="owner">
                <Owner />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sacco"
            element={
              <ProtectedRoute requiredRole="sacco">
                <Sacco />
              </ProtectedRoute>
            }
          />
          <Route
            path="/trips"
            element={
              <ProtectedRoute>
                <Trips />
              </ProtectedRoute>
            }
          />
          <Route
            path="/fare-rules"
            element={
              <ProtectedRoute>
                <FareRules />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mpesa"
            element={
              <ProtectedRoute>
                <MPesa />
              </ProtectedRoute>
            }
          />
          <Route
            path="/matatus"
            element={
              <ProtectedRoute>
                <Matatus />
              </ProtectedRoute>
            }
          />
          <Route
            path="/revenue-analytics"
            element={
              <ProtectedRoute requiredRole="owner">
                <RevenueAnalytics />
              </ProtectedRoute>
            }
          />
          <Route
            path="/owner/withdrawals"
            element={
              <ProtectedRoute requiredRole="owner">
                <OwnerWithdrawals />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </div>
);

export default App;
