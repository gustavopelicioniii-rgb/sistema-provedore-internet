import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Spinner } from "@/components/ui/spinner";
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
} from "recharts";
import {
  Activity, Wifi, WifiOff, AlertTriangle, Server, RefreshCw,
  Signal, CheckCircle, Plus, Pencil, Trash2, Wrench, Search,
} from "lucide-react";
import { motion } from "framer-motion";
import { AnimatedCard, StaggerGrid } from "@/components/motion/AnimatedCard";
import { MotionCard } from "@/components/motion/MotionInteractions";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useNetworkDevices } from "@/hooks/useNetworkDevices";
import type { NetworkDevice, NetworkDeviceInsert } from "@/hooks/useNetworkDevices";
import NetworkDeviceFormDialog from "@/components/network/NetworkDeviceFormDialog";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { NocAlerts } from "@/components/network/NocAlerts";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const statusConfig = {
  online: { label: "Online", className: "bg-success/10 text-success border-success/20", icon: CheckCircle },
  offline: { label: "Offline", className: "bg-destructive/10 text-destructive border-destructive/20", icon: WifiOff },
  warning: { label: "Alerta", className: "bg-warning/10 text-warning border-warning/20", icon: AlertTriangle },
  maintenance: { label: "Manutenção", className: "bg-muted text-muted-foreground border-muted", icon: Wrench },
};

const CHART_COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))"];
const tooltipStyle = { backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "var(--radius)", color: "hsl(var(--card-foreground))" };

const typeLabels: Record<string, string> = {
  olt: "OLT", onu: "ONU", router: "Roteador", switch: "Switch",
  server: "Servidor", access_point: "AP", other: "Outro",
};

const manufacturerLabels: Record<string, string> = {
  mikrotik: "MikroTik", huawei: "Huawei", intelbras: "Intelbras",
  fiberhome: "FiberHome", zte: "ZTE", other: "Outro",
};

function CpuMemBar({ value, label }: { value: number; label: string }) {
  const color = value > 80 ? "bg-destructive" : value > 60 ? "bg-warning" : "bg-success";
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>{label}</span><span>{value}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export default function RedeNoc() {
  const { devices, isLoading, createDevice, updateDevice, deleteDevice } = useNetworkDevices();
  const [formOpen, setFormOpen] = useState(false);
  const [editDevice, setEditDevice] = useState<NetworkDevice | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const filteredDevices = devices.filter((d) => {
    const matchesSearch = search === "" ||
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      (d.ip_address ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (d.location ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (d.model ?? "").toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || d.status === statusFilter;
    const matchesType = typeFilter === "all" || d.device_type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const onlineCount = devices.filter((d) => d.status === "online").length;
  const offlineCount = devices.filter((d) => d.status === "offline").length;
  const warningCount = devices.filter((d) => d.status === "warning").length;
  const totalClients = devices.reduce((acc, d) => acc + (d.connected_clients ?? 0), 0);

  const handleCreate = () => { setEditDevice(null); setFormOpen(true); };
  const handleEdit = (d: NetworkDevice) => { setEditDevice(d); setFormOpen(true); };

  const handleSubmit = async (data: Omit<NetworkDeviceInsert, "organization_id">) => {
    const { data: profile } = await supabase.from("profiles").select("organization_id").single();
    const orgId = profile?.organization_id;
    if (!orgId) return;

    if (editDevice) {
      await updateDevice.mutateAsync({ id: editDevice.id, ...data });
    } else {
      await createDevice.mutateAsync({ ...data, organization_id: orgId } as NetworkDeviceInsert);
    }
    setFormOpen(false);
  };

  const confirmDelete = async () => {
    if (deleteId) {
      await deleteDevice.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Rede & NOC</h1>
          <p className="text-muted-foreground text-sm">Monitoramento de equipamentos e status da rede</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 size-4" /> Novo Equipamento
        </Button>
      </div>

      {/* Summary cards */}
      <StaggerGrid className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <AnimatedCard index={0}><MotionCard><Card><CardContent className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">Online</p>
            <Wifi className="size-4 text-success" />
          </div>
          <p className="mt-2 text-2xl font-bold">{onlineCount}</p>
        </CardContent></Card></MotionCard></AnimatedCard>
        <AnimatedCard index={1}><MotionCard><Card><CardContent className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">Offline</p>
            <WifiOff className="size-4 text-destructive" />
          </div>
          <p className="mt-2 text-2xl font-bold">{offlineCount}</p>
        </CardContent></Card></MotionCard></AnimatedCard>
        <AnimatedCard index={2}><MotionCard><Card><CardContent className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">Em Alerta</p>
            <AlertTriangle className="size-4 text-warning" />
          </div>
          <p className="mt-2 text-2xl font-bold">{warningCount}</p>
        </CardContent></Card></MotionCard></AnimatedCard>
        <AnimatedCard index={3}><MotionCard><Card><CardContent className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">Clientes Conectados</p>
            <Signal className="size-4 text-primary" />
          </div>
          <p className="mt-2 text-2xl font-bold">{totalClients.toLocaleString("pt-BR")}</p>
        </CardContent></Card></MotionCard></AnimatedCard>
      </StaggerGrid>

      {/* Charts */}
      {devices.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.4 }} className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Equipamentos por Status</CardTitle></CardHeader>
            <CardContent>
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Online", value: onlineCount },
                        { name: "Offline", value: offlineCount },
                        { name: "Alerta", value: warningCount },
                        { name: "Manutenção", value: devices.filter((d) => d.status === "maintenance").length },
                      ].filter((d) => d.value > 0)}
                      cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3}
                      dataKey="value" nameKey="name"
                      label={({ name, value }) => `${name}: ${value}`} labelLine={false}
                    >
                      {[0, 1, 2, 3].map((i) => <Cell key={i} fill={CHART_COLORS[i]} />)}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Equipamentos por Tipo</CardTitle></CardHeader>
            <CardContent>
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={
                    Object.entries(typeLabels).map(([key, label]) => ({
                      tipo: label,
                      qtd: devices.filter((d) => d.device_type === key).length,
                    })).filter((d) => d.qtd > 0)
                  } layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                    <YAxis dataKey="tipo" type="category" width={80} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="qtd" name="Quantidade" fill="hsl(var(--chart-1))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Recent NOC Alerts */}
      <NocAlerts />

      {/* Filters + Devices table */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input placeholder="Buscar por nome, IP, modelo ou local..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos status</SelectItem>
              <SelectItem value="online">Online</SelectItem>
              <SelectItem value="offline">Offline</SelectItem>
              <SelectItem value="warning">Alerta</SelectItem>
              <SelectItem value="maintenance">Manutenção</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Tipo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos tipos</SelectItem>
              <SelectItem value="olt">OLT</SelectItem>
              <SelectItem value="onu">ONU</SelectItem>
              <SelectItem value="router">Roteador</SelectItem>
              <SelectItem value="switch">Switch</SelectItem>
              <SelectItem value="server">Servidor</SelectItem>
              <SelectItem value="access_point">AP</SelectItem>
              <SelectItem value="other">Outro</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Card>
          <CardContent className="p-0">
            {filteredDevices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Server className="size-10 mb-3 opacity-40" />
                <p className="text-sm">{devices.length === 0 ? "Nenhum equipamento cadastrado." : "Nenhum equipamento encontrado."}</p>
                {devices.length === 0 && <Button variant="link" className="mt-1" onClick={handleCreate}>Cadastrar primeiro equipamento</Button>}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Equipamento</TableHead>
                    <TableHead>IP</TableHead>
                    <TableHead>Fabricante</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Uptime</TableHead>
                    <TableHead className="w-32">CPU / Memória</TableHead>
                    <TableHead className="text-right">Clientes</TableHead>
                    <TableHead className="w-20" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDevices.map((device) => {
                    const st = statusConfig[device.status] ?? statusConfig.offline;
                    return (
                    <TableRow key={device.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Server className="size-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{device.name}</p>
                            <p className="text-xs text-muted-foreground">{typeLabels[device.device_type] ?? device.device_type}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm text-muted-foreground">{device.ip_address ?? "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{manufacturerLabels[device.manufacturer] ?? device.manufacturer}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={st.className}>
                          <st.icon className="mr-1 size-3" />{st.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{device.uptime ?? "—"}</TableCell>
                      <TableCell>
                        {device.status !== "offline" ? (
                          <div className="space-y-1.5">
                            <CpuMemBar value={device.cpu_usage ?? 0} label="CPU" />
                            <CpuMemBar value={device.memory_usage ?? 0} label="MEM" />
                          </div>
                        ) : <span className="text-xs text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {(device.connected_clients ?? 0) > 0 ? device.connected_clients!.toLocaleString("pt-BR") : "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" onClick={() => handleEdit(device)}>
                            <Pencil className="size-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="text-destructive" onClick={() => setDeleteId(device.id)}>
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
          </CardContent>
        </Card>
      </div>

      {/* Form dialog */}
      <NetworkDeviceFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        device={editDevice}
        onSubmit={handleSubmit}
        isLoading={createDevice.isPending || updateDevice.isPending}
      />

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover equipamento?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">Remover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
