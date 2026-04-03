import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateLead, useUpdateLead, STAGE_META, SOURCE_LABELS, PIPELINE_STAGES, type LeadFormData, type LeadRecord, type LeadStage, type LeadSource } from "@/hooks/useLeads";
import { Loader2 } from "lucide-react";

interface LeadFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingLead?: LeadRecord | null;
  defaultStage?: LeadStage;
}

const sourceOptions: { value: LeadSource; label: string }[] = [
  { value: "referral", label: "Indicação" },
  { value: "website", label: "Site" },
  { value: "social_media", label: "Redes Sociais" },
  { value: "cold_call", label: "Prospecção" },
  { value: "event", label: "Evento" },
  { value: "other", label: "Outro" },
];

export default function LeadFormDialog({ open, onOpenChange, editingLead, defaultStage }: LeadFormDialogProps) {
  const createLead = useCreateLead();
  const updateLead = useUpdateLead();
  const isEditing = !!editingLead;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [company, setCompany] = useState("");
  const [stage, setStage] = useState<LeadStage>("new");
  const [value, setValue] = useState("");
  const [source, setSource] = useState<LeadSource>("other");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (open) {
      if (editingLead) {
        setName(editingLead.name);
        setEmail(editingLead.email ?? "");
        setPhone(editingLead.phone ?? "");
        setWhatsapp(editingLead.whatsapp ?? "");
        setCompany(editingLead.company ?? "");
        setStage(editingLead.stage);
        setValue(editingLead.value?.toString() ?? "");
        setSource(editingLead.source ?? "other");
        setNotes(editingLead.notes ?? "");
      } else {
        setName("");
        setEmail("");
        setPhone("");
        setWhatsapp("");
        setCompany("");
        setStage(defaultStage ?? "new");
        setValue("");
        setSource("other");
        setNotes("");
      }
    }
  }, [open, editingLead, defaultStage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const formData: LeadFormData = {
      name: name.trim(),
      email: email || undefined,
      phone: phone || undefined,
      whatsapp: whatsapp || undefined,
      company: company || undefined,
      stage,
      value: value ? parseFloat(value) : 0,
      source,
      notes: notes || undefined,
    };

    if (isEditing) {
      await updateLead.mutateAsync({ id: editingLead.id, data: formData });
    } else {
      await createLead.mutateAsync(formData);
    }
    onOpenChange(false);
  };

  const isPending = createLead.isPending || updateLead.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Lead" : "Novo Lead"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Nome *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome do lead" required />
            </div>
            <div>
              <Label>Empresa</Label>
              <Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Empresa" />
            </div>
            <div>
              <Label>Valor estimado (R$)</Label>
              <Input type="number" step="0.01" value={value} onChange={(e) => setValue(e.target.value)} placeholder="0,00" />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@exemplo.com" />
            </div>
            <div>
              <Label>Telefone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(00) 0000-0000" />
            </div>
            <div>
              <Label>WhatsApp</Label>
              <Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="(00) 00000-0000" />
            </div>
            <div>
              <Label>Etapa</Label>
              <Select value={stage} onValueChange={(v) => setStage(v as LeadStage)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PIPELINE_STAGES.map((s) => (
                    <SelectItem key={s} value={s}>{STAGE_META[s].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Origem</Label>
              <Select value={source} onValueChange={(v) => setSource(v as LeadSource)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {sourceOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Observações</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Notas sobre o lead..." />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={isPending || !name.trim()}>
              {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              {isEditing ? "Salvar" : "Criar Lead"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
