import { useState, useEffect } from "react";
import { format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateContract, useUpdateContract, STATUS_META, type ContractFormData, type ContractRecord, type ContractStatus } from "@/hooks/useContracts";
import { useCustomers } from "@/hooks/useCustomers";
import { usePlans } from "@/hooks/usePlans";

interface ContractFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingContract?: ContractRecord | null;
}

const statusOptions: { value: ContractStatus; label: string }[] = [
  { value: "awaiting_signature", label: "Aguardando Assinatura" },
  { value: "awaiting_installation", label: "Aguardando Instalação" },
  { value: "active", label: "Ativo" },
  { value: "suspended", label: "Suspenso" },
  { value: "cancelled", label: "Cancelado" },
];

export default function ContractFormDialog({ open, onOpenChange, editingContract }: ContractFormDialogProps) {
  const createContract = useCreateContract();
  const updateContract = useUpdateContract();
  const { data: customers = [] } = useCustomers();
  const { data: plans = [] } = usePlans();
  const isEditing = !!editingContract;

  const [customerId, setCustomerId] = useState("");
  const [planId, setPlanId] = useState("");
  const [status, setStatus] = useState<ContractStatus>("awaiting_installation");
  const [billingDay, setBillingDay] = useState(10);
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();

  useEffect(() => {
    if (open) {
      if (editingContract) {
        setCustomerId(editingContract.customer_id);
        setPlanId(editingContract.plan_id);
        setStatus(editingContract.status);
        setBillingDay((editingContract as any).billing_day ?? 10);
        setStartDate(editingContract.start_date ? new Date(editingContract.start_date + "T00:00:00") : undefined);
        setEndDate(editingContract.end_date ? new Date(editingContract.end_date + "T00:00:00") : undefined);
      } else {
        setCustomerId("");
        setPlanId("");
        setStatus("awaiting_installation");
        setBillingDay(10);
        setStartDate(undefined);
        setEndDate(undefined);
      }
    }
  }, [open, editingContract]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId || !planId) return;

    const formData: ContractFormData = {
      customer_id: customerId,
      plan_id: planId,
      status,
      billing_day: billingDay,
      start_date: startDate ? format(startDate, "yyyy-MM-dd") : undefined,
      end_date: endDate ? format(endDate, "yyyy-MM-dd") : undefined,
    };

    if (isEditing) {
      await updateContract.mutateAsync({ id: editingContract.id, data: formData });
    } else {
      await createContract.mutateAsync(formData);
    }
    onOpenChange(false);
  };

  const isPending = createContract.isPending || updateContract.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Contrato" : "Novo Contrato"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Cliente *</Label>
            <Select value={customerId} onValueChange={setCustomerId}>
              <SelectTrigger><SelectValue placeholder="Selecione o cliente" /></SelectTrigger>
              <SelectContent>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Plano *</Label>
            <Select value={planId} onValueChange={setPlanId}>
              <SelectTrigger><SelectValue placeholder="Selecione o plano" /></SelectTrigger>
              <SelectContent>
                {plans.filter((p) => p.active).map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} — R$ {p.price.toFixed(2)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as ContractStatus)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {statusOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Dia de Vencimento</Label>
            <Input type="number" min={1} max={31} value={billingDay}
              onChange={(e) => setBillingDay(Math.min(31, Math.max(1, parseInt(e.target.value) || 10)))} />
            <p className="text-xs text-muted-foreground mt-1">Dia do mês para vencimento das faturas (1-31)</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Data início</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("justify-start text-left font-normal", !startDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 size-4" />
                    {startDate ? format(startDate, "dd/MM/yyyy") : "Selecionar"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Data fim</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("justify-start text-left font-normal", !endDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 size-4" />
                    {endDate ? format(endDate, "dd/MM/yyyy") : "Selecionar"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={isPending || !customerId || !planId}>
              {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              {isEditing ? "Salvar" : "Criar Contrato"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
