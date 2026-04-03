import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateCustomer, useUpdateCustomer, fetchViaCep, type CustomerFormData, type CustomerAddress, type CustomerRecord } from "@/hooks/useCustomers";
import { formatCpfCnpj, formatPhone, formatCep, validateCpfCnpj } from "@/utils/formatters";
import { Loader2 } from "lucide-react";

interface CustomerFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingCustomer?: CustomerRecord | null;
}

const statusOptions = [
  { value: "active", label: "Ativo" },
  { value: "suspended", label: "Suspenso" },
  { value: "defaulting", label: "Inadimplente" },
  { value: "cancelled", label: "Cancelado" },
];

export default function CustomerFormDialog({ open, onOpenChange, editingCustomer }: CustomerFormDialogProps) {
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();
  const isEditing = !!editingCustomer;

  const [name, setName] = useState("");
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [rg, setRg] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [cep, setCep] = useState("");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [complement, setComplement] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<string>("active");
  const [cpfError, setCpfError] = useState("");
  const [cepLoading, setCepLoading] = useState(false);

  useEffect(() => {
    if (open && editingCustomer) {
      setName(editingCustomer.name || "");
      setCpfCnpj(formatCpfCnpj(editingCustomer.cpf_cnpj || ""));
      setRg(editingCustomer.rg || "");
      setBirthDate(editingCustomer.birth_date || "");
      setEmail(editingCustomer.email || "");
      setPhone(editingCustomer.phone ? formatPhone(editingCustomer.phone) : "");
      setWhatsapp(editingCustomer.whatsapp ? formatPhone(editingCustomer.whatsapp) : "");
      const addr = editingCustomer.address as CustomerAddress | null;
      setCep(addr?.cep ? formatCep(addr.cep) : "");
      setStreet(addr?.street || "");
      setNumber(addr?.number || "");
      setComplement(addr?.complement || "");
      setNeighborhood(addr?.neighborhood || "");
      setCity(addr?.city || "");
      setState(addr?.state || "");
      setNotes(editingCustomer.notes || "");
      setStatus(editingCustomer.status || "active");
    } else if (open) {
      resetForm();
    }
  }, [open, editingCustomer]);

  const resetForm = () => {
    setName(""); setCpfCnpj(""); setRg(""); setBirthDate("");
    setEmail(""); setPhone(""); setWhatsapp("");
    setCep(""); setStreet(""); setNumber(""); setComplement("");
    setNeighborhood(""); setCity(""); setState("");
    setNotes(""); setStatus("active"); setCpfError("");
  };

  const handleCepBlur = useCallback(async () => {
    const cleanCep = cep.replace(/\D/g, "");
    if (cleanCep.length !== 8) return;
    setCepLoading(true);
    const addr = await fetchViaCep(cleanCep);
    if (addr) {
      setStreet(addr.street || "");
      setNeighborhood(addr.neighborhood || "");
      setCity(addr.city || "");
      setState(addr.state || "");
    }
    setCepLoading(false);
  }, [cep]);

  const handleCpfChange = (value: string) => {
    const formatted = formatCpfCnpj(value);
    setCpfCnpj(formatted);
    setCpfError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateCpfCnpj(cpfCnpj)) {
      setCpfError("CPF/CNPJ inválido");
      return;
    }

    const formData: CustomerFormData = {
      name,
      cpf_cnpj: cpfCnpj,
      rg: rg || undefined,
      birth_date: birthDate || undefined,
      email: email || undefined,
      phone: phone.replace(/\D/g, "") || undefined,
      whatsapp: whatsapp.replace(/\D/g, "") || undefined,
      address: {
        cep: cep.replace(/\D/g, ""),
        street,
        number,
        complement,
        neighborhood,
        city,
        state,
      },
      notes: notes || undefined,
      status: status as CustomerFormData["status"],
    };

    try {
      if (isEditing && editingCustomer) {
        await updateCustomer.mutateAsync({ id: editingCustomer.id, data: formData });
      } else {
        await createCustomer.mutateAsync(formData);
      }
      onOpenChange(false);
    } catch {
      // Error handled by mutation
    }
  };

  const isPending = createCustomer.isPending || updateCustomer.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Cliente" : "Novo Cliente"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dados Pessoais */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Dados Pessoais</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="name">Nome Completo *</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Nome do cliente" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cpf_cnpj">CPF/CNPJ *</Label>
                <Input
                  id="cpf_cnpj"
                  value={cpfCnpj}
                  onChange={(e) => handleCpfChange(e.target.value)}
                  required
                  maxLength={18}
                  placeholder="000.000.000-00"
                  className={cpfError ? "border-destructive" : ""}
                />
                {cpfError && <p className="text-xs text-destructive">{cpfError}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="rg">RG</Label>
                <Input id="rg" value={rg} onChange={(e) => setRg(e.target.value)} placeholder="RG" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="birth_date">Data de Nascimento</Label>
                <Input id="birth_date" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Contato */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Contato</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@exemplo.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input id="phone" value={phone} onChange={(e) => setPhone(formatPhone(e.target.value))} maxLength={15} placeholder="(00) 0000-0000" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input id="whatsapp" value={whatsapp} onChange={(e) => setWhatsapp(formatPhone(e.target.value))} maxLength={15} placeholder="(00) 00000-0000" />
              </div>
            </div>
          </div>

          {/* Endereço */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Endereço</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cep">CEP</Label>
                <div className="relative">
                  <Input
                    id="cep"
                    value={cep}
                    onChange={(e) => setCep(formatCep(e.target.value))}
                    onBlur={handleCepBlur}
                    maxLength={9}
                    placeholder="00000-000"
                  />
                  {cepLoading && <Loader2 className="absolute right-2.5 top-2.5 size-4 animate-spin text-muted-foreground" />}
                </div>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="street">Rua</Label>
                <Input id="street" value={street} onChange={(e) => setStreet(e.target.value)} placeholder="Logradouro" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="number">Número</Label>
                <Input id="number" value={number} onChange={(e) => setNumber(e.target.value)} placeholder="Nº" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="complement">Complemento</Label>
                <Input id="complement" value={complement} onChange={(e) => setComplement(e.target.value)} placeholder="Apto, Bloco..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="neighborhood">Bairro</Label>
                <Input id="neighborhood" value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} placeholder="Bairro" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">Cidade</Label>
                <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Cidade" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">UF</Label>
                <Input id="state" value={state} onChange={(e) => setState(e.target.value)} maxLength={2} placeholder="UF" />
              </div>
            </div>
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anotações sobre o cliente..." rows={3} />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              {isEditing ? "Salvar" : "Criar Cliente"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
