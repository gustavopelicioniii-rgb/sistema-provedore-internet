import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import { MapPin } from "lucide-react";
import type { FtthNode } from "@/hooks/useFtthNodes";

const pickerIcon = L.divIcon({
  html: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="40" viewBox="0 0 28 40">
    <path d="M14 0C6.27 0 0 6.27 0 14c0 10.5 14 26 14 26s14-15.5 14-26C28 6.27 21.73 0 14 0z" fill="#6366f1" stroke="#fff" stroke-width="1.5"/>
    <circle cx="14" cy="14" r="6" fill="#fff"/>
    <text x="14" y="17" text-anchor="middle" font-size="9" font-weight="bold" fill="#6366f1">+</text>
  </svg>`,
  className: "",
  iconSize: [28, 40],
  iconAnchor: [14, 40],
});

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom());
  }, [lat, lng, map]);
  return null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  node?: FtthNode | null;
  onSubmit: (data: {
    name: string;
    node_type: "cto" | "ceo" | "splitter" | "pop";
    address: string;
    capacity: number;
    used: number;
    status: "active" | "full" | "inactive";
    lat: number;
    lng: number;
    notes: string;
  }) => Promise<void>;
  isPending: boolean;
}

export default function FtthNodeFormDialog({ open, onOpenChange, node, onSubmit, isPending }: Props) {
  const [name, setName] = useState("");
  const [nodeType, setNodeType] = useState<"cto" | "ceo" | "splitter" | "pop">("cto");
  const [address, setAddress] = useState("");
  const [capacity, setCapacity] = useState(16);
  const [used, setUsed] = useState(0);
  const [status, setStatus] = useState<"active" | "full" | "inactive">("active");
  const [lat, setLat] = useState(-23.55);
  const [lng, setLng] = useState(-46.63);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (node) {
      setName(node.name);
      setNodeType(node.node_type);
      setAddress(node.address ?? "");
      setCapacity(node.capacity);
      setUsed(node.used);
      setStatus(node.status);
      setLat(node.lat);
      setLng(node.lng);
      setNotes(node.notes ?? "");
    } else {
      setName("");
      setNodeType("cto");
      setAddress("");
      setCapacity(16);
      setUsed(0);
      setStatus("active");
      setLat(-23.55);
      setLng(-46.63);
      setNotes("");
    }
  }, [node, open]);

  const handlePick = useCallback((newLat: number, newLng: number) => {
    setLat(parseFloat(newLat.toFixed(6)));
    setLng(parseFloat(newLng.toFixed(6)));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({ name, node_type: nodeType, address, capacity, used, status, lat, lng, notes });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{node ? "Editar Ponto FTTH" : "Novo Ponto FTTH"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={nodeType} onValueChange={(v) => setNodeType(v as typeof nodeType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cto">CTO</SelectItem>
                  <SelectItem value="ceo">CEO</SelectItem>
                  <SelectItem value="splitter">Splitter</SelectItem>
                  <SelectItem value="pop">POP</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Endereço</Label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Capacidade</Label>
              <Input type="number" min={0} value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>Utilizadas</Label>
              <Input type="number" min={0} value={used} onChange={(e) => setUsed(Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="full">Lotado</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Mini-map picker */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <MapPin className="size-3.5" />
              Localização — clique no mapa para definir
            </Label>
            <div className="rounded-md overflow-hidden border border-border h-[200px]">
              <MapContainer
                center={[lat, lng]}
                zoom={14}
                scrollWheelZoom
                style={{ height: "100%", width: "100%" }}
                className="z-0"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <ClickHandler onPick={handlePick} />
                <RecenterMap lat={lat} lng={lng} />
                <Marker position={[lat, lng]} icon={pickerIcon} />
              </MapContainer>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Latitude *</Label>
              <Input type="number" step="any" value={lat} onChange={(e) => setLat(Number(e.target.value))} required />
            </div>
            <div className="space-y-2">
              <Label>Longitude *</Label>
              <Input type="number" step="any" value={lng} onChange={(e) => setLng(Number(e.target.value))} required />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Salvando..." : node ? "Salvar" : "Criar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
