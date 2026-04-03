import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, ClipboardList, LifeBuoy, Gauge, User, Bell, Activity, Router } from "lucide-react";
import { InvoicesTab } from "@/components/portal/InvoicesTab";
import { ContractsTab } from "@/components/portal/ContractsTab";
import { SupportTab } from "@/components/portal/SupportTab";
import { SpeedTest } from "@/components/portal/SpeedTest";
import { UsageHistory } from "@/components/portal/UsageHistory";
import { ConnectionStatus } from "@/components/portal/ConnectionStatus";
import { PortalNotifications } from "@/components/portal/PortalNotifications";
import { ProfileEditor } from "@/components/portal/ProfileEditor";

export default function PortalAssinante() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Portal do Assinante</h1>
        <p className="text-muted-foreground text-sm">
          Gerencie faturas, contratos, suporte e muito mais
        </p>
      </div>

      {/* Quick status cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <ConnectionStatus />
        <PortalNotifications />
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
    </div>
  );
}
