import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, BookOpen } from "lucide-react";
import { formatCurrency } from "@/utils/finance";
import { useGenerateCarne } from "@/hooks/useEnterpriseBilling";
import { useCustomers } from "@/hooks/useCustomers";
import { useContracts } from "@/hooks/useContracts";

interface CarneDigitalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
}

export function CarneDigitalDialog({ open, onOpenChange, organizationId }: CarneDigitalDialogProps) {
  const { data: customers = [] } = useCustomers();
  const { data: contracts = [] } = useContracts();
  const generateCarne = useGenerateCarne();

  const [customerId, setCustomerId] = useState("");
  const [contractId, setContractId] = useState("");
  const [amount, setAmount] = useState("");
  const [months, setMonths] = useState("12");
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().slice(0, 10);
  });

  const selectedContracts = contracts.filter((c: any) => c.customer_id === customerId && c.status === "active");

  const handleSubmit = () => {
    if (!customerId || !amount) return;
    generateCarne.mutate(
      {
        customerId,
        contractId: contractId || undefined,
        amount: parseFloat(amount),
        months: parseInt(months),
        startDate,
        organizationId,
      },
      { onSuccess: () => onOpenChange(false) }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="size-5" /> Gerar Carnê Digital
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Cliente *</Label>
            <Select value={customerId} onValueChange={(v) => { setCustomerId(v); setContractId(""); }}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o cliente" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((c: any) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedContracts.length > 0 && (
            <div>
              <Label>Contrato (opcional)</Label>
              <Select value={contractId} onValueChange={setContractId}>
                <SelectTrigger>
                  <SelectValue placeholder="Vincular a contrato" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem vínculo</SelectItem>
                  {selectedContracts.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>Contrato #{c.id.slice(0, 8)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Valor mensal (R$) *</Label>
              <Input type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="199.90" />
            </div>
            <div>
              <Label>Meses</Label>
              <Select value={months} onValueChange={setMonths}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[3, 6, 12, 18, 24].map((n) => (
                    <SelectItem key={n} value={n.toString()}>{n} meses</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Data do 1º vencimento</Label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>

          {amount && (
            <div className="rounded-lg bg-muted/50 p-3 text-sm space-y-1">
              <p className="text-muted-foreground">Resumo</p>
              <p className="font-semibold">{months} faturas de {formatCurrency(parseFloat(amount) || 0)}</p>
              <p className="text-muted-foreground">Total: {formatCurrency((parseFloat(amount) || 0) * parseInt(months))}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={generateCarne.isPending || !customerId || !amount}>
            {generateCarne.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            Gerar Carnê
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
