import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateTicket, useUpdateTicket, type TicketFormData, type TicketRecord } from "@/hooks/useTickets";
import { useCustomers } from "@/hooks/useCustomers";
import { Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing?: TicketRecord | null;
}

const priorityOptions = [
  { value: "low", label: "Baixa" },
  { value: "medium", label: "Média" },
  { value: "high", label: "Alta" },
  { value: "urgent", label: "Urgente" },
];

const statusOptions = [
  { value: "open", label: "Aberto" },
  { value: "in_progress", label: "Em Andamento" },
  { value: "waiting", label: "Aguardando" },
  { value: "resolved", label: "Resolvido" },
  { value: "closed", label: "Fechado" },
];

export default function TicketFormDialog({ open, onOpenChange, editing }: Props) {
  const create = useCreateTicket();
  const update = useUpdateTicket();
  const { data: customers } = useCustomers();
  const isEditing = !!editing;

  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [status, setStatus] = useState("open");
  const [customerId, setCustomerId] = useState("");

  useEffect(() => {
    if (open && editing) {
      setSubject(editing.subject); setDescription(editing.description || "");
      setPriority(editing.priority); setStatus(editing.status);
      setCustomerId(editing.customer_id || "");
    } else if (open) {
      setSubject(""); setDescription(""); setPriority("medium"); setStatus("open"); setCustomerId("");
    }
  }, [open, editing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form: TicketFormData = {
      subject,
      description: description || undefined,
      priority: priority as TicketFormData["priority"],
      status: status as TicketFormData["status"],
      customer_id: customerId && customerId !== "none" ? customerId : undefined,
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
        <DialogHeader><DialogTitle>{isEditing ? "Editar Ticket" : "Novo Ticket"}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Assunto *</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} required placeholder="Assunto do ticket" />
          </div>
          <div className="space-y-2">
            <Label>Cliente</Label>
            <Select value={customerId} onValueChange={setCustomerId}>
              <SelectTrigger><SelectValue placeholder="Selecione um cliente (opcional)" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum</SelectItem>
                {customers?.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Prioridade</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{priorityOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
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
            <Label>Descrição</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Detalhes do ticket..." />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              {isEditing ? "Salvar" : "Criar Ticket"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
