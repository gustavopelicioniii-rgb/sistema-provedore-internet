import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Activity,
  Wifi,
  WifiOff,
  AlertTriangle,
  Server,
  RefreshCw,
  Signal,
  ArrowUpDown,
  CheckCircle,
} from "lucide-react";

interface Device {
  id: string;
  name: string;
  type: "olt" | "switch" | "router" | "server";
  ip: string;
  status: "online" | "offline" | "warning";
  uptime: string;
  cpu: number;
  memory: number;
  clients: number;
}

const mockDevices: Device[] = [
  { id: "1", name: "OLT-01 Centro", type: "olt", ip: "10.0.0.1", status: "online", uptime: "45d 12h", cpu: 34, memory: 58, clients: 256 },
  { id: "2", name: "OLT-02 Norte", type: "olt", ip: "10.0.0.2", status: "online", uptime: "30d 8h", cpu: 42, memory: 65, clients: 189 },
  { id: "3", name: "OLT-03 Sul", type: "olt", ip: "10.0.0.3", status: "warning", uptime: "2d 4h", cpu: 78, memory: 82, clients: 312 },
  { id: "4", name: "SW-Core-01", type: "switch", ip: "10.0.1.1", status: "online", uptime: "90d 2h", cpu: 15, memory: 30, clients: 0 },
  { id: "5", name: "Router-BGP-01", type: "router", ip: "10.0.2.1", status: "online", uptime: "60d 18h", cpu: 22, memory: 45, clients: 0 },
  { id: "6", name: "OLT-04 Oeste", type: "olt", ip: "10.0.0.4", status: "offline", uptime: "—", cpu: 0, memory: 0, clients: 0 },
];

interface Alert {
  id: string;
  severity: "critical" | "warning" | "info";
  message: string;
  device: string;
  time: string;
}

const mockAlerts: Alert[] = [
  { id: "1", severity: "critical", message: "OLT-04 Oeste sem comunicação", device: "OLT-04", time: "há 5 min" },
  { id: "2", severity: "warning", message: "CPU acima de 75% na OLT-03 Sul", device: "OLT-03", time: "há 15 min" },
  { id: "3", severity: "warning", message: "Memória acima de 80% na OLT-03 Sul", device: "OLT-03", time: "há 15 min" },
  { id: "4", severity: "info", message: "OLT-02 Norte reiniciada com sucesso", device: "OLT-02", time: "há 30d" },
];

const statusConfig = {
  online: { label: "Online", className: "bg-success/10 text-success border-success/20", icon: CheckCircle },
  offline: { label: "Offline", className: "bg-destructive/10 text-destructive border-destructive/20", icon: WifiOff },
  warning: { label: "Alerta", className: "bg-warning/10 text-warning border-warning/20", icon: AlertTriangle },
};

const severityConfig = {
  critical: { label: "Crítico", className: "bg-destructive/10 text-destructive border-destructive/20" },
  warning: { label: "Alerta", className: "bg-warning/10 text-warning border-warning/20" },
  info: { label: "Info", className: "bg-primary/10 text-primary border-primary/20" },
};

function CpuMemBar({ value, label }: { value: number; label: string }) {
  const color = value > 80 ? "bg-destructive" : value > 60 ? "bg-warning" : "bg-success";
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export default function RedeNoc() {
  const [refreshing, setRefreshing] = useState(false);

  const onlineCount = mockDevices.filter((d) => d.status === "online").length;
  const offlineCount = mockDevices.filter((d) => d.status === "offline").length;
  const warningCount = mockDevices.filter((d) => d.status === "warning").length;
  const totalClients = mockDevices.reduce((acc, d) => acc + d.clients, 0);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Rede & NOC</h1>
          <p className="text-muted-foreground text-sm">Monitoramento de equipamentos e status da rede</p>
        </div>
        <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={`mr-2 size-4 ${refreshing ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">Equipamentos Online</p>
              <Wifi className="size-4 text-success" />
            </div>
            <p className="mt-2 text-2xl font-bold">{onlineCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">Offline</p>
              <WifiOff className="size-4 text-destructive" />
            </div>
            <p className="mt-2 text-2xl font-bold">{offlineCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">Em Alerta</p>
              <AlertTriangle className="size-4 text-warning" />
            </div>
            <p className="mt-2 text-2xl font-bold">{warningCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">Clientes Conectados</p>
              <Signal className="size-4 text-primary" />
            </div>
            <p className="mt-2 text-2xl font-bold">{totalClients.toLocaleString("pt-BR")}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="devices">
        <TabsList>
          <TabsTrigger value="devices">
            <Server className="mr-2 size-4" /> Equipamentos
          </TabsTrigger>
          <TabsTrigger value="alerts">
            <Activity className="mr-2 size-4" /> Alertas
            {mockAlerts.filter((a) => a.severity === "critical").length > 0 && (
              <Badge variant="destructive" className="ml-2 size-5 p-0 text-[10px] justify-center">
                {mockAlerts.filter((a) => a.severity === "critical").length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="devices" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Equipamento</TableHead>
                    <TableHead>IP</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Uptime</TableHead>
                    <TableHead className="w-32">CPU / Memória</TableHead>
                    <TableHead className="text-right">Clientes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockDevices.map((device) => {
                    const st = statusConfig[device.status];
                    return (
                      <TableRow key={device.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Server className="size-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium">{device.name}</p>
                              <p className="text-xs text-muted-foreground capitalize">{device.type}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm text-muted-foreground">{device.ip}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={st.className}>
                            <st.icon className="mr-1 size-3" />
                            {st.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{device.uptime}</TableCell>
                        <TableCell>
                          {device.status !== "offline" ? (
                            <div className="space-y-1.5">
                              <CpuMemBar value={device.cpu} label="CPU" />
                              <CpuMemBar value={device.memory} label="MEM" />
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {device.clients > 0 ? device.clients.toLocaleString("pt-BR") : "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Severidade</TableHead>
                    <TableHead>Mensagem</TableHead>
                    <TableHead>Equipamento</TableHead>
                    <TableHead className="text-right">Quando</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockAlerts.map((alert) => {
                    const sev = severityConfig[alert.severity];
                    return (
                      <TableRow key={alert.id}>
                        <TableCell>
                          <Badge variant="outline" className={sev.className}>{sev.label}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">{alert.message}</TableCell>
                        <TableCell className="text-muted-foreground">{alert.device}</TableCell>
                        <TableCell className="text-right text-muted-foreground">{alert.time}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
