import {
  LayoutDashboard,
  Users,
  Kanban,
  Headset,
  Radio,
  Map,
  ClipboardList,
  DollarSign,
  FileText,
  Package,
  Car,
  Wrench,
  Smartphone,
  Zap,
  BarChart3,
  Settings,
  LogOut,
  CalendarDays,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { NavLink, useLocation } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarSeparator,
} from "@/components/ui/sidebar";

const mainNav = [
  { title: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { title: "Clientes", icon: Users, path: "/clientes" },
  { title: "Contratos", icon: ClipboardList, path: "/contratos" },
  { title: "CRM", icon: Kanban, path: "/crm" },
  { title: "Atendimento", icon: Headset, path: "/atendimento" },
];

const operationalNav = [
  { title: "Rede & NOC", icon: Radio, path: "/rede" },
  { title: "Mapa FTTH", icon: Map, path: "/mapa-ftth" },
  { title: "Ordens de Serviço", icon: ClipboardList, path: "/ordens-servico" },
  { title: "Técnicos", icon: Wrench, path: "/tecnicos" },
  { title: "Agenda", icon: CalendarDays, path: "/agenda" },
];

const financeNav = [
  { title: "Financeiro", icon: DollarSign, path: "/financeiro" },
  { title: "Planos", icon: Radio, path: "/planos" },
  { title: "Fiscal / NF-e", icon: FileText, path: "/fiscal" },
  { title: "Estoque", icon: Package, path: "/estoque" },
  { title: "Frota", icon: Car, path: "/frota" },
];

const advancedNav = [
  { title: "Portal Assinante", icon: Smartphone, path: "/portal-assinante" },
  { title: "Automações", icon: Zap, path: "/automacoes" },
  { title: "Relatórios & BI", icon: BarChart3, path: "/relatorios" },
  { title: "Configurações", icon: Settings, path: "/configuracoes" },
];

function NavGroup({ label, items, badgeMap }: { label: string; items: typeof mainNav; badgeMap?: Record<string, number> }) {
  const location = useLocation();

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const badge = badgeMap?.[item.path] || 0;
            return (
              <SidebarMenuItem key={item.path}>
                <SidebarMenuButton
                  asChild
                  isActive={location.pathname === item.path}
                  tooltip={item.title}
                >
                  <NavLink to={item.path} className="relative" data-sidebar-item={item.title}>
                    <item.icon className="size-4" />
                    <span>{item.title}</span>
                    {badge > 0 && (
                      <span className="ml-auto flex size-5 shrink-0 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground animate-pulse">
                        {badge > 99 ? "99+" : badge}
                      </span>
                    )}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function AppSidebar() {
  const { data: unread } = useUnreadMessages();
  const badgeMap: Record<string, number> = {};
  if (unread && unread.total > 0) {
    badgeMap["/atendimento"] = unread.total;
  }

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
          <div className="flex size-8 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground font-display font-bold text-sm">
            NP
          </div>
          <span className="text-lg font-display font-bold text-sidebar-accent-foreground group-data-[collapsible=icon]:hidden tracking-tight">
            NetPulse
          </span>
        </div>
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent className="scrollbar-thin">
        <NavGroup label="Principal" items={mainNav} badgeMap={badgeMap} />
        <NavGroup label="Operacional" items={operationalNav} />
        <NavGroup label="Financeiro" items={financeNav} />
        <NavGroup label="Avançado" items={advancedNav} />
      </SidebarContent>
      <SidebarFooter className="p-3 group-data-[collapsible=icon]:p-2">
        <UserFooter />
      </SidebarFooter>
    </Sidebar>
  );
}

function UserFooter() {
  const { user, signOut } = useAuth();
  const initials = (user?.user_metadata?.full_name || user?.email || "U")
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const name = user?.user_metadata?.full_name || "Usuário";
  const email = user?.email || "";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-2 group-data-[collapsible=icon]:justify-center">
        <ThemeToggle />
      </div>
      <div className="flex items-center gap-2 rounded-lg bg-sidebar-accent p-2 group-data-[collapsible=icon]:justify-center">
        <div className="flex size-8 items-center justify-center rounded-full bg-sidebar-primary text-sidebar-primary-foreground text-xs font-semibold">
          {initials}
        </div>
        <div className="flex flex-col group-data-[collapsible=icon]:hidden">
          <span className="text-xs font-medium text-sidebar-accent-foreground">{name}</span>
          <span className="text-[10px] text-sidebar-foreground truncate max-w-[140px]">{email}</span>
        </div>
      </div>
      <button
        onClick={signOut}
        className="flex w-full items-center gap-2 rounded-lg p-2 text-xs text-sidebar-foreground hover:bg-sidebar-accent transition-colors group-data-[collapsible=icon]:justify-center"
      >
        <LogOut className="size-4" />
        <span className="group-data-[collapsible=icon]:hidden">Sair</span>
      </button>
    </div>
  );
}
