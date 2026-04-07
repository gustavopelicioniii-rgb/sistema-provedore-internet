import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, SplitSquareVertical } from "lucide-react";
import { formatCurrency, formatDate } from "@/utils/finance";
import { useCreateInstallments } from "@/hooks/useEnterpriseBilling";

interface InstallmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: {
    id: string;
    amount: number;
    dueDate: string;
    customerName: string;
    organizationId: string;
  } | null;
}

export function InstallmentDialog({ open, onOpenChange, invoice }: InstallmentDialogProps) {
  const [numInstallments, setNumInstallments] = useState("2");
  const createInstallments = useCreateInstallments();

  if (!invoice) return null;

  const count = parseInt(numInstallments) || 2;
  const installmentAmount = Math.round((invoice.amount / count) * 100) / 100;

  const preview = Array.from({ length: count }, (_, i) => {
    const dueDate = new Date(invoice.dueDate);
    dueDate.setMonth(dueDate.getMonth() + i);
    return {
      number: i + 1,
      amount: i === 0 ? invoice.amount - installmentAmount * (count - 1) : installmentAmount,
      dueDate: dueDate.toISOString().slice(0, 10),
    };
  });

  const handleSubmit = () => {
    createInstallments.mutate(
      {
        invoiceId: invoice.id,
        totalAmount: invoice.amount,
        numInstallments: count,
        firstDueDate: invoice.dueDate,
        organizationId: invoice.organizationId,
      },
      { onSuccess: () => onOpenChange(false) }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SplitSquareVertical className="size-5" /> Parcelar Fatura
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg bg-muted/50 p-3 space-y-1">
            <p className="text-sm font-medium">{invoice.customerName}</p>
            <p className="text-2xl font-bold">{formatCurrency(invoice.amount)}</p>
            <p className="text-xs text-muted-foreground">Vencimento original: {formatDate(invoice.dueDate)}</p>
          </div>

          <div>
            <Label>Número de parcelas</Label>
            <Select value={numInstallments} onValueChange={setNumInstallments}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[2, 3, 4, 5, 6, 8, 10, 12].map((n) => (
                  <SelectItem key={n} value={n.toString()}>
                    {n}x de {formatCurrency(Math.round((invoice.amount / n) * 100) / 100)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Prévia das parcelas</p>
            {preview.map((p) => (
              <div key={p.number} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">{p.number}/{count}</Badge>
                  <span className="text-muted-foreground">{formatDate(p.dueDate)}</span>
                </div>
                <span className="font-semibold">{formatCurrency(p.amount)}</span>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={createInstallments.isPending}>
            {createInstallments.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            Confirmar Parcelamento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
