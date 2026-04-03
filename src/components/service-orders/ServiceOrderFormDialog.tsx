import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateServiceOrder, useUpdateServiceOrder, type ServiceOrderFormData, type ServiceOrderRecord } from "@/hooks/useServiceOrders";
import { useCustomers } from "@/hooks/useCustomers";
import { useTechnicians } from "@/hooks/useTechnicians";
import { Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing?: ServiceOrderRecord | null;
}

const typeOptions = [
  { value: "installation", label: "Instalação" },
  { value: "maintenance", label: "Manutenção" },
  { value: "technical_visit", label: "Visita Técnica" },
  { value: "repair", label: "Reparo" },
];

const statusOptions = [
  { value: "open", label: "Aberta" },
  { value: "in_progress", label: "Em Andamento" },
  { value: "completed", label: "Concluída" },
  { value: "cancelled", label: "Cancelada" },
];

export default function ServiceOrderFormDialog({ open, onOpenChange, editing }: Props) {
  const create = useCreateServiceOrder();
  const update = useUpdateServiceOrder();
  const { data: customers } = useCustomers();
  const { data: technicians } = useTechnicians();
  const isEditing = !!editing;

  const [customerId, setCustomerId] = useState("");
  const [technicianId, setTechnicianId] = useState("");
  const [type, setType] = useState("installation");
  const [status, setStatus] = useState("open");
  const [description, setDescription] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (open && editing) {
      setCustomerId(editing.customer_id);
      setTechnicianId(editing.technician_id || "none");
      setType(editing.type);
      setStatus(editing.status);
      setDescription(editing.description || "");
      setScheduledDate(editing.scheduled_date ? editing.scheduled_date.slice(0, 16) : "");
      setNotes(editing.notes || "");
    } else if (open) {
      setCustomerId(""); setTechnicianId("none"); setType("installation"); setStatus("open");
      setDescription(""); setScheduledDate(""); setNotes("");
    }
  }, [open, editing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form: ServiceOrderFormData = {
      customer_id: customerId,
      technician_id: technicianId === "none" ? undefined : technicianId || undefined,
      type: type as ServiceOrderFormData["type"],
      status: status as ServiceOrderFormData["status"],
      description: description || undefined,
      scheduled_date: scheduledDate ? new Date(scheduledDate).toISOString() : undefined,
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
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{isEditing ? "Editar OS" : "Nova Ordem de Serviço"}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Cliente *</Label>
            <Select value={customerId} onValueChange={setCustomerId} required>
              <SelectTrigger><SelectValue placeholder="Selecione um cliente" /></SelectTrigger>
              <SelectContent>
                {customers?.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Técnico</Label>
            <Select value={technicianId} onValueChange={setTechnicianId}>
              <SelectTrigger><SelectValue placeholder="Selecione um técnico" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum</SelectItem>
                {technicians?.filter((t) => t.status === "active").map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{typeOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{statusOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Data Agendada</Label>
            <Input type="datetime-local" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Descrição do serviço..." />
          </div>
          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Anotações..." />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={isPending || !customerId}>
              {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              {isEditing ? "Salvar" : "Criar OS"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
