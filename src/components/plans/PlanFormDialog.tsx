import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useCreatePlan, useUpdatePlan, TECH_LABELS, type PlanFormData, type PlanRecord, type PlanTechnology } from "@/hooks/usePlans";
import { Loader2 } from "lucide-react";

interface PlanFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingPlan?: PlanRecord | null;
}

const techOptions: { value: PlanTechnology; label: string }[] = [
  { value: "fiber", label: "Fibra Óptica" },
  { value: "radio", label: "Rádio" },
  { value: "cable", label: "Cabo" },
  { value: "other", label: "Outro" },
];

export default function PlanFormDialog({ open, onOpenChange, editingPlan }: PlanFormDialogProps) {
  const createPlan = useCreatePlan();
  const updatePlan = useUpdatePlan();
  const isEditing = !!editingPlan;

  const [name, setName] = useState("");
  const [download, setDownload] = useState("");
  const [upload, setUpload] = useState("");
  const [price, setPrice] = useState("");
  const [technology, setTechnology] = useState<PlanTechnology>("fiber");
  const [loyalty, setLoyalty] = useState("");
  const [active, setActive] = useState(true);
  const [earlyDiscount, setEarlyDiscount] = useState("");

  useEffect(() => {
    if (open) {
      if (editingPlan) {
        setName(editingPlan.name);
        setDownload(editingPlan.download_speed.toString());
        setUpload(editingPlan.upload_speed.toString());
        setPrice(editingPlan.price.toString());
        setTechnology(editingPlan.technology);
        setLoyalty((editingPlan.loyalty_months ?? 0).toString());
        setActive(editingPlan.active);
        setEarlyDiscount(((editingPlan as any).early_payment_discount ?? 0).toString());
      } else {
        setName("");
        setDownload("");
        setUpload("");
        setPrice("");
        setTechnology("fiber");
        setLoyalty("0");
        setActive(true);
        setEarlyDiscount("0");
      }
    }
  }, [open, editingPlan]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !download || !upload || !price) return;

    const formData: PlanFormData = {
      name: name.trim(),
      download_speed: parseInt(download),
      upload_speed: parseInt(upload),
      price: parseFloat(price),
      technology,
      loyalty_months: parseInt(loyalty) || 0,
      active,
      early_payment_discount: parseFloat(earlyDiscount) || 0,
    };

    if (isEditing) {
      await updatePlan.mutateAsync({ id: editingPlan.id, data: formData });
    } else {
      await createPlan.mutateAsync(formData);
    }
    onOpenChange(false);
  };

  const isPending = createPlan.isPending || updatePlan.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Plano" : "Novo Plano"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Nome do plano *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Fibra 300 Mega" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Download (Mbps) *</Label>
              <Input type="number" min="1" value={download} onChange={(e) => setDownload(e.target.value)} placeholder="300" required />
            </div>
            <div>
              <Label>Upload (Mbps) *</Label>
              <Input type="number" min="1" value={upload} onChange={(e) => setUpload(e.target.value)} placeholder="150" required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Preço (R$) *</Label>
              <Input type="number" step="0.01" min="0" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="99.90" required />
            </div>
            <div>
              <Label>Fidelidade (meses)</Label>
              <Input type="number" min="0" value={loyalty} onChange={(e) => setLoyalty(e.target.value)} placeholder="12" />
            </div>
          </div>

          <div>
            <Label>Tecnologia</Label>
            <Select value={technology} onValueChange={(v) => setTechnology(v as PlanTechnology)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {techOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Desconto antecipação (%)</Label>
            <Input type="number" step="0.1" min="0" max="100" value={earlyDiscount} onChange={(e) => setEarlyDiscount(e.target.value)} placeholder="5" />
            <p className="text-xs text-muted-foreground mt-1">Desconto para pagamento antes do vencimento</p>
          </div>

          <div className="flex items-center gap-3">
            <Switch checked={active} onCheckedChange={setActive} id="plan-active" />
            <Label htmlFor="plan-active">Plano ativo</Label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={isPending || !name.trim()}>
              {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              {isEditing ? "Salvar" : "Criar Plano"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
