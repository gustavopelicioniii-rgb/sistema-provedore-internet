import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Spinner } from "@/components/ui/spinner";
import {
  Car, Fuel, Wrench, AlertTriangle, Plus, CheckCircle, Pencil, Trash2, Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { formatCurrency, formatDate } from "@/utils/finance";
import { useFleet } from "@/hooks/useFleet";
import type { Vehicle, VehicleInsert, FuelLogInsert } from "@/hooks/useFleet";
import VehicleFormDialog from "@/components/fleet/VehicleFormDialog";
import FuelLogFormDialog from "@/components/fleet/FuelLogFormDialog";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const vehicleStatus: Record<string, { label: string; className: string }> = {
  available: { label: "Disponível", className: "bg-success/10 text-success border-success/20" },
  in_use: { label: "Em uso", className: "bg-primary/10 text-primary border-primary/20" },
  maintenance: { label: "Manutenção", className: "bg-warning/10 text-warning border-warning/20" },
  decommissioned: { label: "Desativado", className: "bg-muted text-muted-foreground border-muted" },
};

const fuelTypes: Record<string, string> = {
  gasoline: "Gasolina",
  ethanol: "Etanol",
  diesel: "Diesel",
  flex: "Flex",
};

export default function Frota() {
  const { vehicles, fuelLogs, isLoading, createVehicle, updateVehicle, deleteVehicle, createFuelLog } = useFleet();
  const [formOpen, setFormOpen] = useState(false);
  const [editVehicle, setEditVehicle] = useState<Vehicle | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [fuelFormOpen, setFuelFormOpen] = useState(false);

  const filteredVehicles = vehicles.filter((v) => {
    const matchesSearch = search === "" || 
      v.model.toLowerCase().includes(search.toLowerCase()) ||
      v.plate.toLowerCase().includes(search.toLowerCase()) ||
      (v.assigned_to ?? "").toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || v.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredFuelLogs = fuelLogs.filter((log: any) => {
    if (search === "") return true;
    return (log.vehicles?.plate ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (log.vehicles?.model ?? "").toLowerCase().includes(search.toLowerCase());
  });

  const available = vehicles.filter((v) => v.status === "available").length;
  const inUse = vehicles.filter((v) => v.status === "in_use").length;
  const inMaintenance = vehicles.filter((v) => v.status === "maintenance").length;
  const totalFuelCost = fuelLogs.reduce((a, l) => a + Number(l.cost), 0);

  const maintenanceSoon = vehicles.filter((v) => {
    if (!v.next_maintenance_date) return false;
    const d = new Date(v.next_maintenance_date);
    const now = new Date();
    const diff = (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diff <= 30 && diff >= 0;
  });

  const handleCreate = () => { setEditVehicle(null); setFormOpen(true); };
  const handleEdit = (v: Vehicle) => { setEditVehicle(v); setFormOpen(true); };

  const handleSubmit = async (data: Omit<VehicleInsert, "organization_id">) => {
    const { data: profile } = await supabase.from("profiles").select("organization_id").single();
    const orgId = profile?.organization_id;
    if (!orgId) return;

    if (editVehicle) {
      await updateVehicle.mutateAsync({ id: editVehicle.id, ...data });
    } else {
      await createVehicle.mutateAsync({ ...data, organization_id: orgId } as VehicleInsert);
    }
    setFormOpen(false);
  };

  const handleFuelSubmit = async (data: Omit<FuelLogInsert, "organization_id">) => {
    const { data: profile } = await supabase.from("profiles").select("organization_id").single();
    const orgId = profile?.organization_id;
    if (!orgId) return;
    await createFuelLog.mutateAsync({ ...data, organization_id: orgId } as FuelLogInsert);
    setFuelFormOpen(false);
  };

  const confirmDelete = async () => {
    if (deleteId) {
      await deleteVehicle.mutateAsync(deleteId);
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
          <h1 className="text-2xl font-bold tracking-tight">Frota</h1>
          <p className="text-muted-foreground text-sm">Gestão de veículos, abastecimento e manutenção</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 size-4" /> Novo Veículo
        </Button>
      </div>

      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card><CardContent className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">Disponíveis</p>
            <CheckCircle className="size-4 text-success" />
          </div>
          <p className="mt-2 text-2xl font-bold">{available}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">Em Uso</p>
            <Car className="size-4 text-primary" />
          </div>
          <p className="mt-2 text-2xl font-bold">{inUse}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">Em Manutenção</p>
            <Wrench className="size-4 text-warning" />
          </div>
          <p className="mt-2 text-2xl font-bold">{inMaintenance}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">Gasto Combustível</p>
            <Fuel className="size-4 text-destructive" />
          </div>
          <p className="mt-2 text-2xl font-bold">{formatCurrency(totalFuelCost)}</p>
        </CardContent></Card>
      </div>

      {maintenanceSoon.length > 0 && (
        <Card className="border-warning/30 bg-warning/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="size-5 text-warning shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Manutenções Próximas</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {maintenanceSoon.map((v) => `${v.model} (${v.plate}) — ${formatDate(v.next_maintenance_date!)}`).join(" · ")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="vehicles">
        <TabsList>
          <TabsTrigger value="vehicles"><Car className="mr-2 size-4" /> Veículos</TabsTrigger>
          <TabsTrigger value="fuel"><Fuel className="mr-2 size-4" /> Abastecimentos</TabsTrigger>
        </TabsList>

        <TabsContent value="vehicles" className="mt-4 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input placeholder="Buscar por modelo, placa ou responsável..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="available">Disponível</SelectItem>
                <SelectItem value="in_use">Em uso</SelectItem>
                <SelectItem value="maintenance">Manutenção</SelectItem>
                <SelectItem value="decommissioned">Desativado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Card>
            <CardContent className="p-0">
              {filteredVehicles.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <Car className="size-10 mb-3 opacity-40" />
                  <p className="text-sm">{vehicles.length === 0 ? "Nenhum veículo cadastrado." : "Nenhum veículo encontrado."}</p>
                  {vehicles.length === 0 && <Button variant="link" className="mt-1" onClick={handleCreate}>Cadastrar primeiro veículo</Button>}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Veículo</TableHead>
                      <TableHead>Placa</TableHead>
                      <TableHead>KM Atual</TableHead>
                      <TableHead>Combustível</TableHead>
                      <TableHead>Responsável</TableHead>
                      <TableHead>Próx. Manutenção</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-20" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVehicles.map((vehicle) => {
                      const st = vehicleStatus[vehicle.status] ?? vehicleStatus.available;
                      const fuelLevel = vehicle.fuel_level ?? 0;
                      return (
                        <TableRow key={vehicle.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{vehicle.model}</p>
                              <p className="text-xs text-muted-foreground">{vehicle.year}</p>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono">{vehicle.plate}</TableCell>
                          <TableCell className="text-muted-foreground">{(vehicle.km ?? 0).toLocaleString("pt-BR")} km</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="h-1.5 w-12 rounded-full bg-muted overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${fuelLevel > 50 ? "bg-success" : fuelLevel > 25 ? "bg-warning" : "bg-destructive"}`}
                                  style={{ width: `${fuelLevel}%` }}
                                />
                              </div>
                              <span className="text-xs text-muted-foreground">{fuelLevel}%</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{vehicle.assigned_to ?? "—"}</TableCell>
                          <TableCell className="text-muted-foreground">{vehicle.next_maintenance_date ? formatDate(vehicle.next_maintenance_date) : "—"}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={st.className}>{st.label}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button size="icon" variant="ghost" onClick={() => handleEdit(vehicle)}>
                                <Pencil className="size-4" />
                              </Button>
                              <Button size="icon" variant="ghost" className="text-destructive" onClick={() => setDeleteId(vehicle.id)}>
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
        </TabsContent>

        <TabsContent value="fuel" className="mt-4 space-y-3">
          <div className="flex justify-end">
            <Button onClick={() => setFuelFormOpen(true)}>
              <Plus className="mr-2 size-4" /> Novo Abastecimento
            </Button>
          </div>
          <Card>
            <CardContent className="p-0">
              {filteredFuelLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <Fuel className="size-10 mb-3 opacity-40" />
                  <p className="text-sm">Nenhum abastecimento registrado.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Veículo</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Litros</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>KM</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFuelLogs.map((log: any) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-mono">{log.vehicles?.plate ?? "—"}</TableCell>
                        <TableCell className="text-muted-foreground">{formatDate(log.date)}</TableCell>
                        <TableCell>{Number(log.liters)}L</TableCell>
                        <TableCell className="text-muted-foreground">{fuelTypes[log.fuel_type] ?? log.fuel_type}</TableCell>
                        <TableCell className="font-semibold">{formatCurrency(Number(log.cost))}</TableCell>
                        <TableCell className="text-muted-foreground">{log.km ? log.km.toLocaleString("pt-BR") : "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <VehicleFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        vehicle={editVehicle}
        onSubmit={handleSubmit}
        isLoading={createVehicle.isPending || updateVehicle.isPending}
      />

      <FuelLogFormDialog
        open={fuelFormOpen}
        onOpenChange={setFuelFormOpen}
        vehicles={vehicles}
        onSubmit={handleFuelSubmit}
        isLoading={createFuelLog.isPending}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover veículo?</AlertDialogTitle>
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
