import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
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
import PortalAssinante from "@/pages/PortalAssinante";
import Automacoes from "@/pages/Automacoes";
import Relatorios from "@/pages/Relatorios";
import Configuracoes from "@/pages/Configuracoes";
import PlaceholderPage from "@/pages/PlaceholderPage";
import Auth from "@/pages/Auth";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin size-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

const AppRoutes = () => (
  <Routes>
    <Route path="/auth" element={<Auth />} />
    <Route
      element={
        <ProtectedRoute>
          <AppLayout />
        </ProtectedRoute>
      }
    >
      <Route path="/" element={<Dashboard />} />
      <Route path="/clientes" element={<Clientes />} />
      <Route path="/crm" element={<CRM />} />
      <Route path="/atendimento" element={<Atendimento />} />
      <Route path="/rede" element={<PlaceholderPage title="Rede & NOC" description="Monitoramento de OLTs, concentradores e clientes" />} />
      <Route path="/mapa-ftth" element={<PlaceholderPage title="Mapa FTTH" description="Documentação visual da rede óptica" />} />
      <Route path="/ordens-servico" element={<OrdensServico />} />
      <Route path="/tecnicos" element={<Tecnicos />} />
      <Route path="/financeiro" element={<Financeiro />} />
      <Route path="/planos" element={<Planos />} />
      <Route path="/contratos" element={<Contratos />} />
      <Route path="/fiscal" element={<PlaceholderPage title="Fiscal / NF-e" description="Emissão de notas fiscais e obrigações fiscais" />} />
      <Route path="/estoque" element={<Estoque />} />
      <Route path="/frota" element={<PlaceholderPage title="Frota" description="Gestão de veículos, abastecimento e manutenção" />} />
      <Route path="/portal-assinante" element={<PortalAssinante />} />
      <Route path="/automacoes" element={<Automacoes />} />
      <Route path="/relatorios" element={<Relatorios />} />
      <Route path="/configuracoes" element={<Configuracoes />} />
    </Route>
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
