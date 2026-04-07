import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { GlobalSearch } from "./GlobalSearch";
import { NotificationBell } from "./NotificationBell";
import { Separator } from "@/components/ui/separator";
import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { PageTransition } from "@/components/motion/PageTransition";
import { OnboardingTour } from "@/components/onboarding/OnboardingTour";
import AiChatWidget from "@/components/ai/AiChatWidget";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";

const routeNames: Record<string, string> = {
  "/": "Dashboard",
  "/clientes": "Clientes",
  "/crm": "CRM",
  "/atendimento": "Atendimento",
  "/rede": "Rede & NOC",
  "/mapa-ftth": "Mapa FTTH",
  "/ordens-servico": "Ordens de Serviço",
  "/tecnicos": "Técnicos",
  "/agenda": "Agenda de Técnicos",
  "/financeiro": "Financeiro",
  "/fiscal": "Fiscal / NF-e",
  "/estoque": "Estoque",
  "/frota": "Frota",
  "/portal-assinante": "Portal do Assinante",
  "/automacoes": "Automações",
  "/relatorios": "Relatórios & BI",
  "/configuracoes": "Configurações",
};

export function AppLayout() {
  const location = useLocation();
  const pageTitle = routeNames[location.pathname] || "Página";

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage className="text-sm font-medium">
                  {pageTitle}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="ml-auto flex items-center gap-2">
            <GlobalSearch />
            <NotificationBell />
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <AnimatePresence mode="wait">
            <PageTransition key={location.pathname}>
              <Outlet />
            </PageTransition>
          </AnimatePresence>
        </main>
        <OnboardingTour />
        <AiChatWidget />
      </SidebarInset>
    </SidebarProvider>
  );
}
