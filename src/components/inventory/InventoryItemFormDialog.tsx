import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateInventoryItem, useUpdateInventoryItem, type InventoryItemFormData, type InventoryItemRecord } from "@/hooks/useInventory";
import { Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing?: InventoryItemRecord | null;
}

const typeOptions = [
  { value: "onu", label: "ONU" },
  { value: "router", label: "Roteador" },
  { value: "cable", label: "Cabo" },
  { value: "splitter", label: "Splitter" },
  { value: "connector", label: "Conector" },
  { value: "other", label: "Outro" },
];

export default function InventoryItemFormDialog({ open, onOpenChange, editing }: Props) {
  const create = useCreateInventoryItem();
  const update = useUpdateInventoryItem();
  const isEditing = !!editing;

  const [name, setName] = useState("");
  const [itemType, setItemType] = useState("other");
  const [quantity, setQuantity] = useState("0");
  const [minQuantity, setMinQuantity] = useState("0");
  const [serialNumber, setSerialNumber] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (open && editing) {
      setName(editing.name); setItemType(editing.item_type);
      setQuantity(String(editing.quantity)); setMinQuantity(String(editing.min_quantity));
      setSerialNumber(editing.serial_number || ""); setNotes(editing.notes || "");
    } else if (open) {
      setName(""); setItemType("other"); setQuantity("0"); setMinQuantity("0"); setSerialNumber(""); setNotes("");
    }
  }, [open, editing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form: InventoryItemFormData = {
      name,
      item_type: itemType as InventoryItemFormData["item_type"],
      quantity: parseInt(quantity) || 0,
      min_quantity: parseInt(minQuantity) || 0,
      serial_number: serialNumber || undefined,
      notes: notes || undefined,
    };
    try {
      if (isEditing && editing) await update.mutateAsync({ id: editing.id, data: form });
      else await create.mutateAsync(form);
      onOpenChange(false);
    } catch {}
  };

  const isPending = create.isPending || update.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{isEditing ? "Editar Item" : "Novo Item"}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Nome *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Nome do equipamento" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={itemType} onValueChange={setItemType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{typeOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Nº Série</Label>
              <Input value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} placeholder="Serial" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Quantidade</Label>
              <Input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} min="0" />
            </div>
            <div className="space-y-2">
              <Label>Qtd. Mínima</Label>
              <Input type="number" value={minQuantity} onChange={(e) => setMinQuantity(e.target.value)} min="0" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Anotações..." />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              {isEditing ? "Salvar" : "Criar Item"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
