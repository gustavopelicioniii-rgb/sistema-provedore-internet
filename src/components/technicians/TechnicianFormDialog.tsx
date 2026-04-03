import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateTechnician, useUpdateTechnician, type TechnicianFormData, type TechnicianRecord } from "@/hooks/useTechnicians";
import { Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing?: TechnicianRecord | null;
}

const specialtyOptions = [
  { value: "general", label: "Geral" },
  { value: "installation", label: "Instalação" },
  { value: "maintenance", label: "Manutenção" },
  { value: "support", label: "Suporte" },
];

const statusOptions = [
  { value: "active", label: "Ativo" },
  { value: "inactive", label: "Inativo" },
  { value: "vacation", label: "Férias" },
];

export default function TechnicianFormDialog({ open, onOpenChange, editing }: Props) {
  const create = useCreateTechnician();
  const update = useUpdateTechnician();
  const isEditing = !!editing;

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [specialty, setSpecialty] = useState("general");
  const [status, setStatus] = useState("active");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (open && editing) {
      setName(editing.name); setPhone(editing.phone || ""); setEmail(editing.email || "");
      setSpecialty(editing.specialty); setStatus(editing.status); setNotes(editing.notes || "");
    } else if (open) {
      setName(""); setPhone(""); setEmail(""); setSpecialty("general"); setStatus("active"); setNotes("");
    }
  }, [open, editing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form: TechnicianFormData = {
      name, phone: phone || undefined, email: email || undefined,
      specialty: specialty as TechnicianFormData["specialty"],
      status: status as TechnicianFormData["status"],
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
        <DialogHeader><DialogTitle>{isEditing ? "Editar Técnico" : "Novo Técnico"}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Nome *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Nome do técnico" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(00) 00000-0000" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@exemplo.com" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Especialidade</Label>
              <Select value={specialty} onValueChange={setSpecialty}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{specialtyOptions.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{statusOptions.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Anotações..." />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              {isEditing ? "Salvar" : "Criar Técnico"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
