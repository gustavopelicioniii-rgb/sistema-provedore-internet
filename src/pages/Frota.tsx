import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Car,
  Fuel,
  Wrench,
  AlertTriangle,
  Plus,
  MapPin,
  Calendar,
  CheckCircle,
  Clock,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/utils/finance";

interface Vehicle {
  id: string;
  plate: string;
  model: string;
  year: number;
  km: number;
  status: "available" | "in_use" | "maintenance";
  assignedTo?: string;
  nextMaintenance: string;
  fuelLevel: number;
}

const mockVehicles: Vehicle[] = [
  { id: "1", plate: "ABC-1234", model: "Fiat Strada", year: 2023, km: 45230, status: "in_use", assignedTo: "Carlos Técnico", nextMaintenance: "2026-05-15", fuelLevel: 65 },
  { id: "2", plate: "DEF-5678", model: "VW Saveiro", year: 2022, km: 62100, status: "available", nextMaintenance: "2026-04-20", fuelLevel: 90 },
  { id: "3", plate: "GHI-9012", model: "Renault Kangoo", year: 2024, km: 18500, status: "in_use", assignedTo: "Ana Instaladora", nextMaintenance: "2026-06-01", fuelLevel: 40 },
  { id: "4", plate: "JKL-3456", model: "Fiat Fiorino", year: 2021, km: 89000, status: "maintenance", nextMaintenance: "2026-04-05", fuelLevel: 20 },
];

interface FuelLog {
  id: string;
  vehiclePlate: string;
  date: string;
  liters: number;
  cost: number;
  km: number;
  type: "gasoline" | "ethanol" | "diesel";
}

const mockFuelLogs: FuelLog[] = [
  { id: "1", vehiclePlate: "ABC-1234", date: "2026-04-02", liters: 45, cost: 292.50, km: 45230, type: "gasoline" },
  { id: "2", vehiclePlate: "GHI-9012", date: "2026-04-01", liters: 38, cost: 247.00, km: 18500, type: "gasoline" },
  { id: "3", vehiclePlate: "DEF-5678", date: "2026-03-28", liters: 50, cost: 325.00, km: 62100, type: "gasoline" },
  { id: "4", vehiclePlate: "JKL-3456", date: "2026-03-25", liters: 42, cost: 273.00, km: 88500, type: "gasoline" },
];

const vehicleStatus: Record<string, { label: string; className: string }> = {
  available: { label: "Disponível", className: "bg-success/10 text-success border-success/20" },
  in_use: { label: "Em uso", className: "bg-primary/10 text-primary border-primary/20" },
  maintenance: { label: "Manutenção", className: "bg-warning/10 text-warning border-warning/20" },
};

const fuelTypes: Record<string, string> = {
  gasoline: "Gasolina",
  ethanol: "Etanol",
  diesel: "Diesel",
};

export default function Frota() {
  const available = mockVehicles.filter((v) => v.status === "available").length;
  const inUse = mockVehicles.filter((v) => v.status === "in_use").length;
  const inMaintenance = mockVehicles.filter((v) => v.status === "maintenance").length;
  const totalFuelCost = mockFuelLogs.reduce((a, l) => a + l.cost, 0);

  const maintenanceSoon = mockVehicles.filter((v) => {
    const d = new Date(v.nextMaintenance);
    const now = new Date();
    const diff = (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diff <= 30 && diff >= 0;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Frota</h1>
          <p className="text-muted-foreground text-sm">Gestão de veículos, abastecimento e manutenção</p>
        </div>
        <Button>
          <Plus className="mr-2 size-4" /> Novo Veículo
        </Button>
      </div>

      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">Disponíveis</p>
              <CheckCircle className="size-4 text-success" />
            </div>
            <p className="mt-2 text-2xl font-bold">{available}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">Em Uso</p>
              <Car className="size-4 text-primary" />
            </div>
            <p className="mt-2 text-2xl font-bold">{inUse}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">Em Manutenção</p>
              <Wrench className="size-4 text-warning" />
            </div>
            <p className="mt-2 text-2xl font-bold">{inMaintenance}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">Gasto Combustível</p>
              <Fuel className="size-4 text-destructive" />
            </div>
            <p className="mt-2 text-2xl font-bold">{formatCurrency(totalFuelCost)}</p>
          </CardContent>
        </Card>
      </div>

      {maintenanceSoon.length > 0 && (
        <Card className="border-warning/30 bg-warning/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="size-5 text-warning shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Manutenções Próximas</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {maintenanceSoon.map((v) => `${v.model} (${v.plate}) — ${formatDate(v.nextMaintenance)}`).join(" · ")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="vehicles">
        <TabsList>
          <TabsTrigger value="vehicles">
            <Car className="mr-2 size-4" /> Veículos
          </TabsTrigger>
          <TabsTrigger value="fuel">
            <Fuel className="mr-2 size-4" /> Abastecimentos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="vehicles" className="mt-4">
          <Card>
            <CardContent className="p-0">
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockVehicles.map((vehicle) => {
                    const st = vehicleStatus[vehicle.status];
                    return (
                      <TableRow key={vehicle.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{vehicle.model}</p>
                            <p className="text-xs text-muted-foreground">{vehicle.year}</p>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono">{vehicle.plate}</TableCell>
                        <TableCell className="text-muted-foreground">{vehicle.km.toLocaleString("pt-BR")} km</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-12 rounded-full bg-muted overflow-hidden">
                              <div
                                className={`h-full rounded-full ${vehicle.fuelLevel > 50 ? "bg-success" : vehicle.fuelLevel > 25 ? "bg-warning" : "bg-destructive"}`}
                                style={{ width: `${vehicle.fuelLevel}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground">{vehicle.fuelLevel}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{vehicle.assignedTo ?? "—"}</TableCell>
                        <TableCell className="text-muted-foreground">{formatDate(vehicle.nextMaintenance)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={st.className}>{st.label}</Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fuel" className="mt-4">
          <Card>
            <CardContent className="p-0">
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
                  {mockFuelLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono">{log.vehiclePlate}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(log.date)}</TableCell>
                      <TableCell>{log.liters}L</TableCell>
                      <TableCell className="text-muted-foreground">{fuelTypes[log.type]}</TableCell>
                      <TableCell className="font-semibold">{formatCurrency(log.cost)}</TableCell>
                      <TableCell className="text-muted-foreground">{log.km.toLocaleString("pt-BR")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
