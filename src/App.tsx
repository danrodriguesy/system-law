import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/AppLayout";
import Auth from "./pages/Auth";
import Index from "./pages/Index";
import Clientes from "./pages/Clientes";
import Agenda from "./pages/Agenda";
import Varas from "./pages/Varas";
import Compromissos from "./pages/Compromissos";
import RespostasCompromisso from "./pages/RespostasCompromisso";
import NotFound from "./pages/NotFound";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) return <Navigate to="/auth" replace />;

  return <AppLayout>{children}</AppLayout>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) return null;
  if (session) return <Navigate to="/" replace />;
  return <>{children}</>;
}

const AppRoutes = () => (
  <Routes>
    <Route path="/auth" element={<PublicRoute><Auth /></PublicRoute>} />
    <Route path="/" element={<PrivateRoute><Index /></PrivateRoute>} />
    <Route path="/clientes" element={<PrivateRoute><Clientes /></PrivateRoute>} />
    <Route path="/agenda" element={<PrivateRoute><Agenda /></PrivateRoute>} />
    <Route path="/varas" element={<PrivateRoute><Varas /></PrivateRoute>} />
    <Route path="/compromissos" element={<PrivateRoute><Compromissos /></PrivateRoute>} />
    <Route path="/respostas" element={<PrivateRoute><RespostasCompromisso /></PrivateRoute>} />
    {/* Redirect old /juntas route to /varas */}
    <Route path="/juntas" element={<Navigate to="/varas" replace />} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
