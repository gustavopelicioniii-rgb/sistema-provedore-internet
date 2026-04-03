import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MapPin,
  Search,
  Cable,
  Boxes,
  CircleDot,
  Layers,
  Plus,
} from "lucide-react";

interface FtthNode {
  id: string;
  name: string;
  type: "cto" | "ceo" | "splitter" | "pop";
  address: string;
  capacity: number;
  used: number;
  status: "active" | "full" | "inactive";
  lat: number;
  lng: number;
}

const mockNodes: FtthNode[] = [
  { id: "1", name: "CTO-001 Centro", type: "cto", address: "Rua Principal, 100", capacity: 16, used: 12, status: "active", lat: -23.55, lng: -46.63 },
  { id: "2", name: "CTO-002 Centro", type: "cto", address: "Rua Principal, 250", capacity: 16, used: 16, status: "full", lat: -23.551, lng: -46.631 },
  { id: "3", name: "CEO-001 Norte", type: "ceo", address: "Av. Norte, 500", capacity: 144, used: 89, status: "active", lat: -23.54, lng: -46.62 },
  { id: "4", name: "CTO-003 Norte", type: "cto", address: "Rua das Flores, 30", capacity: 8, used: 5, status: "active", lat: -23.541, lng: -46.621 },
  { id: "5", name: "POP-01 Central", type: "pop", address: "Datacenter Central", capacity: 576, used: 312, status: "active", lat: -23.549, lng: -46.629 },
  { id: "6", name: "Splitter-01 Sul", type: "splitter", address: "Rua Sul, 80", capacity: 32, used: 0, status: "inactive", lat: -23.56, lng: -46.64 },
];

const typeConfig = {
  cto: { label: "CTO", color: "bg-primary/10 text-primary border-primary/20", icon: Boxes },
  ceo: { label: "CEO", color: "bg-chart-2/10 text-chart-2 border-chart-2/20", icon: Cable },
  splitter: { label: "Splitter", color: "bg-warning/10 text-warning border-warning/20", icon: CircleDot },
  pop: { label: "POP", color: "bg-success/10 text-success border-success/20", icon: Layers },
};

const statusLabels: Record<string, { label: string; className: string }> = {
  active: { label: "Ativo", className: "bg-success/10 text-success border-success/20" },
  full: { label: "Lotado", className: "bg-destructive/10 text-destructive border-destructive/20" },
  inactive: { label: "Inativo", className: "bg-muted text-muted-foreground border-muted" },
};

export default function MapaFtth() {
  const [search, setSearch] = useState("");

  const filtered = mockNodes.filter((n) =>
    n.name.toLowerCase().includes(search.toLowerCase()) ||
    n.address.toLowerCase().includes(search.toLowerCase())
  );

  const totalCapacity = mockNodes.reduce((a, n) => a + n.capacity, 0);
  const totalUsed = mockNodes.reduce((a, n) => a + n.used, 0);
  const occupancy = totalCapacity > 0 ? ((totalUsed / totalCapacity) * 100).toFixed(1) : "0";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mapa FTTH</h1>
          <p className="text-muted-foreground text-sm">Documentação visual e inventário da rede óptica</p>
        </div>
        <Button>
          <Plus className="mr-2 size-4" /> Novo Ponto
        </Button>
      </div>

      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">Pontos Mapeados</p>
              <MapPin className="size-4 text-primary" />
            </div>
            <p className="mt-2 text-2xl font-bold">{mockNodes.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">CTOs</p>
              <Boxes className="size-4 text-primary" />
            </div>
            <p className="mt-2 text-2xl font-bold">{mockNodes.filter((n) => n.type === "cto").length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">Capacidade Total</p>
              <Cable className="size-4 text-success" />
            </div>
            <p className="mt-2 text-2xl font-bold">{totalCapacity}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">Ocupação Média</p>
              <CircleDot className="size-4 text-warning" />
            </div>
            <p className="mt-2 text-2xl font-bold">{occupancy}%</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="map">
        <TabsList>
          <TabsTrigger value="map">
            <MapPin className="mr-2 size-4" /> Visualização
          </TabsTrigger>
          <TabsTrigger value="list">
            <Layers className="mr-2 size-4" /> Lista
          </TabsTrigger>
        </TabsList>

        <TabsContent value="map" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <div className="flex items-center justify-center h-[450px] bg-muted/30 rounded-lg">
                <div className="text-center space-y-3">
                  <MapPin className="mx-auto size-12 text-muted-foreground/30" />
                  <div>
                    <p className="font-medium text-muted-foreground">Mapa Interativo</p>
                    <p className="text-sm text-muted-foreground/70">
                      Integre com Leaflet ou Google Maps para visualização georreferenciada dos pontos de rede.
                    </p>
                  </div>
                  <div className="flex flex-wrap justify-center gap-2 pt-2">
                    {mockNodes.map((node) => {
                      const cfg = typeConfig[node.type];
                      return (
                        <Badge key={node.id} variant="outline" className={cfg.color}>
                          <cfg.icon className="mr-1 size-3" />
                          {node.name}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="list" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Inventário de Pontos</CardTitle>
                <div className="relative w-64">
                  <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                  <Input placeholder="Buscar ponto..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Endereço</TableHead>
                    <TableHead>Ocupação</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((node) => {
                    const cfg = typeConfig[node.type];
                    const st = statusLabels[node.status];
                    const pct = node.capacity > 0 ? Math.round((node.used / node.capacity) * 100) : 0;
                    return (
                      <TableRow key={node.id}>
                        <TableCell className="font-medium">{node.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cfg.color}>
                            <cfg.icon className="mr-1 size-3" /> {cfg.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{node.address}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
                              <div
                                className={`h-full rounded-full ${pct >= 90 ? "bg-destructive" : pct >= 60 ? "bg-warning" : "bg-success"}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground">{node.used}/{node.capacity}</span>
                          </div>
                        </TableCell>
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
      </Tabs>
    </div>
  );
}
