import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateMovement, type MovementFormData, type InventoryItemRecord } from "@/hooks/useInventory";
import { useCustomers } from "@/hooks/useCustomers";
import { Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: InventoryItemRecord[];
}

const movementOptions = [
  { value: "in", label: "Entrada" },
  { value: "out", label: "Saída" },
  { value: "loan", label: "Comodato" },
  { value: "return", label: "Devolução" },
];

export default function MovementFormDialog({ open, onOpenChange, items }: Props) {
  const create = useCreateMovement();
  const { data: customers } = useCustomers();

  const [itemId, setItemId] = useState("");
  const [movementType, setMovementType] = useState("in");
  const [quantity, setQuantity] = useState("1");
  const [customerId, setCustomerId] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form: MovementFormData = {
      item_id: itemId,
      movement_type: movementType as MovementFormData["movement_type"],
      quantity: parseInt(quantity) || 1,
      customer_id: customerId || undefined,
      notes: notes || undefined,
    };
    try {
      await create.mutateAsync(form);
      onOpenChange(false);
      setItemId(""); setMovementType("in"); setQuantity("1"); setCustomerId(""); setNotes("");
    } catch {}
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Nova Movimentação</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Item *</Label>
            <Select value={itemId} onValueChange={setItemId} required>
              <SelectTrigger><SelectValue placeholder="Selecione um item" /></SelectTrigger>
              <SelectContent>
                {items.map((i) => <SelectItem key={i.id} value={i.id}>{i.name} (estoque: {i.quantity})</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo *</Label>
              <Select value={movementType} onValueChange={setMovementType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{movementOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Quantidade *</Label>
              <Input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} min="1" required />
            </div>
          </div>
          {(movementType === "loan" || movementType === "return") && (
            <div className="space-y-2">
              <Label>Cliente</Label>
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger><SelectValue placeholder="Selecione o cliente" /></SelectTrigger>
                <SelectContent>
                  {customers?.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Anotações..." />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={create.isPending || !itemId}>
              {create.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Registrar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
