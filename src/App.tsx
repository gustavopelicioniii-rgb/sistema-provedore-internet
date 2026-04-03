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
      <Route path="/atendimento" element={<PlaceholderPage title="Atendimento" description="Tickets e service desk unificado" />} />
      <Route path="/rede" element={<PlaceholderPage title="Rede & NOC" description="Monitoramento de OLTs, concentradores e clientes" />} />
      <Route path="/mapa-ftth" element={<PlaceholderPage title="Mapa FTTH" description="Documentação visual da rede óptica" />} />
      <Route path="/ordens-servico" element={<PlaceholderPage title="Ordens de Serviço" description="Gestão de instalações, manutenções e visitas técnicas" />} />
      <Route path="/tecnicos" element={<PlaceholderPage title="Técnicos" description="Gestão da equipe técnica e produtividade" />} />
      <Route path="/financeiro" element={<Financeiro />} />
      <Route path="/planos" element={<Planos />} />
      <Route path="/fiscal" element={<PlaceholderPage title="Fiscal / NF-e" description="Emissão de notas fiscais e obrigações fiscais" />} />
      <Route path="/estoque" element={<PlaceholderPage title="Estoque" description="Controle de equipamentos, materiais e comodato" />} />
      <Route path="/frota" element={<PlaceholderPage title="Frota" description="Gestão de veículos, abastecimento e manutenção" />} />
      <Route path="/portal-assinante" element={<PlaceholderPage title="Portal do Assinante" description="App e portal web para clientes" />} />
      <Route path="/automacoes" element={<PlaceholderPage title="Automações" description="Motor de automações inteligentes — o grande diferencial" />} />
      <Route path="/relatorios" element={<PlaceholderPage title="Relatórios & BI" description="Analytics avançado e relatórios customizados" />} />
      <Route path="/configuracoes" element={<PlaceholderPage title="Configurações" description="Configurações gerais do sistema e da organização" />} />
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
