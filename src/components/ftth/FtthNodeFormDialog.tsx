import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { FtthNode } from "@/hooks/useFtthNodes";

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