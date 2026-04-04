import { useState, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MapPin, Search, Cable, Boxes, CircleDot, Layers, Plus, Pencil, Trash2,
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useFtthNodes, type FtthNode } from "@/hooks/useFtthNodes";
import FtthNodeFormDialog from "@/components/ftth/FtthNodeFormDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Spinner } from "@/components/ui/spinner";

const markerColors: Record<string, string> = {
  cto: "#6366f1",
  ceo: "#10b981",
  splitter: "#f59e0b",
  pop: "#ef4444",
};

function createIcon(type: string, status: string) {
  const color = status === "inactive" ? "#94a3b8" : (markerColors[type] ?? "#94a3b8");
  const letter = type === "pop" ? "P" : type === "ceo" ? "E" : type === "cto" ? "C" : "S";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="40" viewBox="0 0 28 40">
    <path d="M14 0C6.27 0 0 6.27 0 14c0 10.5 14 26 14 26s14-15.5 14-26C28 6.27 21.73 0 14 0z" fill="${color}" stroke="#fff" stroke-width="1.5"/>
    <circle cx="14" cy="14" r="6" fill="#fff"/>
    <text x="14" y="17" text-anchor="middle" font-size="9" font-weight="bold" fill="${color}">${letter}</text>
  </svg>`;
  return L.divIcon({ html: svg, className: "", iconSize: [28, 40], iconAnchor: [14, 40], popupAnchor: [0, -40] });
}

const typeConfig = {
  cto: { label: "CTO", color: "bg-primary/10 text-primary border-primary/20", icon: Boxes },
  ceo: { label: "CEO", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", icon: Cable },
  splitter: { label: "Splitter", color: "bg-amber-500/10 text-amber-600 border-amber-500/20", icon: CircleDot },
  pop: { label: "POP", color: "bg-red-500/10 text-red-600 border-red-500/20", icon: Layers },
} as const;

const statusLabels: Record<string, { label: string; className: string }> = {
  active: { label: "Ativo", className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  full: { label: "Lotado", className: "bg-destructive/10 text-destructive border-destructive/20" },
  inactive: { label: "Inativo", className: "bg-muted text-muted-foreground border-muted" },
};

function FlyToNode({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  map.flyTo([lat, lng], 17, { duration: 0.8 });
  return null;
}

export default function MapaFtth() {
  const [search, setSearch] = useState("");
  const [flyTo, setFlyTo] = useState<{ lat: number; lng: number } | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("map");
  const [formOpen, setFormOpen] = useState(false);
  const [editingNode, setEditingNode] = useState<FtthNode | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { nodes, isLoading, createNode, updateNode, deleteNode, isCreating, isUpdating, isDeleting } = useFtthNodes();

  const filtered = nodes.filter((n) => {
    const matchesSearch =
      n.name.toLowerCase().includes(search.toLowerCase()) ||
      (n.address ?? "").toLowerCase().includes(search.toLowerCase());
    const matchesFilter = activeFilter === "all" || n.node_type === activeFilter;
    return matchesSearch && matchesFilter;
  });

  const mapNodes = activeFilter === "all" ? nodes : nodes.filter((n) => n.node_type === activeFilter);

  const totalCapacity = nodes.reduce((a, n) => a + n.capacity, 0);
  const totalUsed = nodes.reduce((a, n) => a + n.used, 0);
  const occupancy = totalCapacity > 0 ? ((totalUsed / totalCapacity) * 100).toFixed(1) : "0";

  const center = useMemo<[number, number]>(() => {
    if (nodes.length === 0) return [-23.55, -46.63];
    const avgLat = nodes.reduce((s, n) => s + n.lat, 0) / nodes.length;
    const avgLng = nodes.reduce((s, n) => s + n.lng, 0) / nodes.length;
    return [avgLat, avgLng];
  }, [nodes]);

  const handleFormSubmit = useCallback(
    async (data: Parameters<typeof createNode>[0]) => {
      if (editingNode) {
        await updateNode({ id: editingNode.id, ...data });
      } else {
        await createNode(data);
      }
      setEditingNode(null);
    },
    [editingNode, createNode, updateNode],
  );

  const handleConfirmDelete = useCallback(async () => {
    if (deleteId) {
      await deleteNode(deleteId);
      setDeleteId(null);
    }
  }, [deleteId, deleteNode]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner className="size-8" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mapa FTTH</h1>
          <p className="text-muted-foreground text-sm">Documentação visual e inventário da rede óptica</p>
        </div>
        <Button onClick={() => { setEditingNode(null); setFormOpen(true); }}>
          <Plus className="mr-2 size-4" /> Novo Ponto
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">Pontos Mapeados</p>
              <MapPin className="size-4 text-primary" />
            </div>
            <p className="mt-2 text-2xl font-bold">{nodes.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">CTOs</p>
              <Boxes className="size-4 text-primary" />
            </div>
            <p className="mt-2 text-2xl font-bold">{nodes.filter((n) => n.node_type === "cto").length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">Capacidade Total</p>
              <Cable className="size-4 text-emerald-600" />
            </div>
            <p className="mt-2 text-2xl font-bold">{totalCapacity}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">Ocupação Média</p>
              <CircleDot className="size-4 text-amber-500" />
            </div>
            <p className="mt-2 text-2xl font-bold">{occupancy}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter buttons */}
      <div className="flex flex-wrap gap-2">
        {(["all", "cto", "ceo", "splitter", "pop"] as const).map((t) => (
          <Button
            key={t}
            size="sm"
            variant={activeFilter === t ? "default" : "outline"}
            onClick={() => setActiveFilter(t)}
          >
            {t === "all" ? "Todos" : typeConfig[t].label}
          </Button>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
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
            <CardContent className="p-0 overflow-hidden rounded-lg">
              <MapContainer center={center} zoom={14} scrollWheelZoom style={{ height: "500px", width: "100%" }} className="z-0">
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {flyTo && <FlyToNode lat={flyTo.lat} lng={flyTo.lng} />}
                {mapNodes.map((node) => {
                  const pct = node.capacity > 0 ? Math.round((node.used / node.capacity) * 100) : 0;
                  const cfg = typeConfig[node.node_type];
                  const st = statusLabels[node.status];
                  return (
                    <Marker key={node.id} position={[node.lat, node.lng]} icon={createIcon(node.node_type, node.status)}>
                      <Popup>
                        <div className="min-w-[180px]">
                          <p className="font-bold text-sm mb-1">{node.name}</p>
                          <p className="text-xs text-gray-500 mb-2">{node.address}</p>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium">Tipo:</span>
                            <span className="text-xs">{cfg.label}</span>
                          </div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium">Status:</span>
                            <span className="text-xs">{st.label}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium">Ocupação:</span>
                            <span className="text-xs">{node.used}/{node.capacity} ({pct}%)</span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-gray-200 mt-2 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${pct >= 90 ? "bg-red-500" : pct >= 60 ? "bg-amber-500" : "bg-emerald-500"}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
              </MapContainer>
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
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((node) => {
                    const cfg = typeConfig[node.node_type];
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
                                className={`h-full rounded-full ${pct >= 90 ? "bg-destructive" : pct >= 60 ? "bg-amber-500" : "bg-emerald-500"}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground">{node.used}/{node.capacity}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={st.className}>{st.label}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="size-8" title="Ver no mapa"
                              onClick={() => { setFlyTo({ lat: node.lat, lng: node.lng }); setActiveTab("map"); }}>
                              <MapPin className="size-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="size-8" title="Editar"
                              onClick={() => { setEditingNode(node); setFormOpen(true); }}>
                              <Pencil className="size-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="size-8 text-destructive" title="Excluir"
                              onClick={() => setDeleteId(node.id)}>
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
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

      <FtthNodeFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        node={editingNode}
        onSubmit={handleFormSubmit}
        isPending={isCreating || isUpdating}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este ponto FTTH? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} disabled={isDeleting}>
              {isDeleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
