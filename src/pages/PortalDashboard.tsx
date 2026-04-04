import { Navigate } from "react-router-dom";
import { useSubscriberAuth } from "@/hooks/useSubscriberAuth";
import { FullPageSpinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, ClipboardList, LifeBuoy, Activity, User, LogOut, Wifi } from "lucide-react";
import { InvoicesTab } from "@/components/portal/InvoicesTab";
import { ContractsTab } from "@/components/portal/ContractsTab";
import { SupportTab } from "@/components/portal/SupportTab";
import { SpeedTest } from "@/components/portal/SpeedTest";
import { UsageHistory } from "@/components/portal/UsageHistory";
import { ConnectionStatus } from "@/components/portal/ConnectionStatus";
import { ProfileEditor } from "@/components/portal/ProfileEditor";

export default function PortalDashboard() {
  const { customer, organization, loading, isAuthenticated, logout } = useSubscriberAuth();

  if (loading) return <FullPageSpinner />;
  if (!isAuthenticated) return <Navigate to="/portal/login" replace />;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Wifi className="size-5 text-primary" />
            <span className="font-semibold text-sm">
              {organization?.name || "Portal do Assinante"}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:inline">
              {customer?.name}
            </span>
            <Button variant="ghost" size="sm" onClick={logout} className="gap-1.5">
              <LogOut className="size-4" /> Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto p-4 md:p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Olá, {customer?.name?.split(" ")[0]}!
          </h1>
          <p className="text-muted-foreground text-sm">
            Gerencie faturas, contratos, suporte e muito mais
          </p>
        </div>

        {/* Quick status cards */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <ConnectionStatus />
          <SpeedTest />
        </div>

        {/* Main tabs */}
        <Tabs defaultValue="faturas" className="space-y-4">
          <TabsList className="flex flex-wrap h-auto gap-1">
            <TabsTrigger value="faturas" className="gap-1.5 text-xs sm:text-sm">
              <FileText className="size-4" /> Faturas
            </TabsTrigger>
            <TabsTrigger value="contratos" className="gap-1.5 text-xs sm:text-sm">
              <ClipboardList className="size-4" /> Contratos
            </TabsTrigger>
            <TabsTrigger value="suporte" className="gap-1.5 text-xs sm:text-sm">
              <LifeBuoy className="size-4" /> Suporte
            </TabsTrigger>
            <TabsTrigger value="consumo" className="gap-1.5 text-xs sm:text-sm">
              <Activity className="size-4" /> Consumo
            </TabsTrigger>
            <TabsTrigger value="perfil" className="gap-1.5 text-xs sm:text-sm">
              <User className="size-4" /> Perfil
            </TabsTrigger>
          </TabsList>

          <TabsContent value="faturas">
            <InvoicesTab />
          </TabsContent>
          <TabsContent value="contratos">
            <ContractsTab />
          </TabsContent>
          <TabsContent value="suporte">
            <SupportTab />
          </TabsContent>
          <TabsContent value="consumo">
            <UsageHistory />
          </TabsContent>
          <TabsContent value="perfil">
            <div className="max-w-lg">
              <ProfileEditor />
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
