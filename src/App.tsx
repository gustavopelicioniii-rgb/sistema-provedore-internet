import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/layout/AppLayout";
import Dashboard from "@/pages/Dashboard";
import Clientes from "@/pages/Clientes";
import Financeiro from "@/pages/Financeiro";
import PlaceholderPage from "@/pages/PlaceholderPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/clientes" element={<Clientes />} />
            <Route path="/crm" element={<PlaceholderPage title="CRM" description="Pipeline de vendas e gestão de leads" />} />
            <Route path="/atendimento" element={<PlaceholderPage title="Atendimento" description="Tickets e service desk unificado" />} />
            <Route path="/rede" element={<PlaceholderPage title="Rede & NOC" description="Monitoramento de OLTs, concentradores e clientes" />} />
            <Route path="/mapa-ftth" element={<PlaceholderPage title="Mapa FTTH" description="Documentação visual da rede óptica" />} />
            <Route path="/ordens-servico" element={<PlaceholderPage title="Ordens de Serviço" description="Gestão de instalações, manutenções e visitas técnicas" />} />
            <Route path="/tecnicos" element={<PlaceholderPage title="Técnicos" description="Gestão da equipe técnica e produtividade" />} />
            <Route path="/financeiro" element={<Financeiro />} />
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
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
