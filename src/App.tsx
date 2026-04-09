import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { FullPageSpinner } from "@/components/ui/spinner";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/layout/AppLayout";
import Dashboard from "@/pages/Dashboard";
import Clientes from "@/pages/Clientes";
import Financeiro from "@/pages/Financeiro";
import CRM from "@/pages/CRM";
import Planos from "@/pages/Planos";
import Contratos from "@/pages/Contratos";
import Tecnicos from "@/pages/Tecnicos";
import OrdensServico from "@/pages/OrdensServico";
import Atendimento from "@/pages/Atendimento";
import Estoque from "@/pages/Estoque";
import RedeNoc from "@/pages/RedeNoc";
import MapaFtth from "@/pages/MapaFtth";
import Fiscal from "@/pages/Fiscal";
import Frota from "@/pages/Frota";
import PortalAssinante from "@/pages/PortalAssinante";
import Automacoes from "@/pages/Automacoes";
import Relatorios from "@/pages/Relatorios";
import Configuracoes from "@/pages/Configuracoes";
import Agenda from "@/pages/Agenda";
import Auth from "@/pages/Auth";
import ResetPassword from "@/pages/ResetPassword";
import LandingPage from "@/pages/LandingPage";
import PortalLogin from "@/pages/PortalLogin";
import PortalDashboard from "@/pages/PortalDashboard";
import NotFound from "@/pages/NotFound";
import Cobertura from "@/pages/Cobertura";
import { SubscriberAuthProvider } from "@/hooks/useSubscriberAuth";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <FullPageSpinner />;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

function PublicHome() {
  const { user, loading } = useAuth();
  if (loading) return <FullPageSpinner />;
  if (user) return <Navigate to="/dashboard" replace />;
  return <LandingPage />;
}

const AppRoutes = React.forwardRef<HTMLDivElement>(function AppRoutes(_props, _ref) {
  return (
    <Routes>
      <Route path="/" element={<PublicHome />} />
      <Route path="/landing" element={<LandingPage />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/portal/login" element={<SubscriberAuthProvider><PortalLogin /></SubscriberAuthProvider>} />
      <Route path="/portal" element={<SubscriberAuthProvider><PortalDashboard /></SubscriberAuthProvider>} />
      <Route path="/cobertura/:slug" element={<Cobertura />} />
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/clientes" element={<Clientes />} />
        <Route path="/crm" element={<CRM />} />
        <Route path="/atendimento" element={<Atendimento />} />
        <Route path="/rede" element={<RedeNoc />} />
        <Route path="/mapa-ftth" element={<MapaFtth />} />
        <Route path="/ordens-servico" element={<OrdensServico />} />
        <Route path="/tecnicos" element={<Tecnicos />} />
        <Route path="/agenda" element={<Agenda />} />
        <Route path="/financeiro" element={<Financeiro />} />
        <Route path="/planos" element={<Planos />} />
        <Route path="/contratos" element={<Contratos />} />
        <Route path="/fiscal" element={<Fiscal />} />
        <Route path="/estoque" element={<Estoque />} />
        <Route path="/frota" element={<Frota />} />
        <Route path="/portal-assinante" element={<SubscriberAuthProvider><PortalAssinante /></SubscriberAuthProvider>} />
        <Route path="/automacoes" element={<Automacoes />} />
        <Route path="/relatorios" element={<Relatorios />} />
        <Route path="/configuracoes" element={<Configuracoes />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
});

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
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
  </ThemeProvider>
);

export default App;
