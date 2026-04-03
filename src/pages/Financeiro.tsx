import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DollarSign, TrendingUp, AlertTriangle, CheckCircle, Loader2, Zap } from "lucide-react";
import { useFinanceiroData } from "@/hooks/useFinanceiroData";
import { formatCurrency, formatDate, invoiceStatusClasses, invoiceStatusLabels } from "@/utils/finance";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function Financeiro() {
  const { data, isLoading, error } = useFinanceiroData();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [generating, setGenerating] = useState(false);
  const [payDialog, setPayDialog] = useState<{ id: string; name: string } | null>(null);
  const [paidDate, setPaidDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [paying, setPaying] = useState(false);

  const handleGenerateInvoices = async () => {
    setGenerating(true);
    try {
      const { data: result, error } = await supabase.functions.invoke("generate-invoices", {
        method: "POST",
      });
      if (error) throw error;
      toast({
        title: result.created > 0 ? "Faturas geradas!" : "Nenhuma fatura nova",
        description: result.message,
      });
      if (result.created > 0) {
        queryClient.invalidateQueries({ queryKey: ["financeiro-data"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard-data"] });
      }
    } catch (err: any) {
      toast({ title: "Erro ao gerar faturas", description: err.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const handleMarkPaid = async () => {
    if (!payDialog) return;
    setPaying(true);
    try {
      const { error } = await supabase
        .from("invoices")
        .update({ status: "paid" as any, paid_date: paidDate })
        .eq("id", payDialog.id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["financeiro-data"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-data"] });
      toast({ title: "Fatura marcada como paga!" });
      setPayDialog(null);
    } catch (err: any) {
      toast({ title: "Erro ao dar baixa", description: err.message, variant: "destructive" });
    } finally {
      setPaying(false);
    }
  };

  const kpis = [
    { title: "Faturamento Mensal", value: formatCurrency(data?.monthlyBilling ?? 0), icon: DollarSign, color: "text-primary" },
    { title: "Recebido", value: formatCurrency(data?.receivedThisMonth ?? 0), icon: CheckCircle, color: "text-success" },
    { title: "A Receber", value: formatCurrency(data?.receivable ?? 0), icon: TrendingUp, color: "text-warning" },
    { title: "Inadimplentes", value: `${data?.defaultingCustomers ?? 0} clientes`, icon: AlertTriangle, color: "text-destructive" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Financeiro</h1>
          <p className="text-muted-foreground text-sm">Faturamento, cobranças e fluxo de caixa</p>
        </div>
        <Button onClick={handleGenerateInvoices} disabled={generating}>
          {generating ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Zap className="mr-2 size-4" />}
          Gerar Faturas
        </Button>
      </div>

      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.title}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">{kpi.title}</p>
                <kpi.icon className={`size-4 ${kpi.color}`} />
              </div>
              <p className="mt-2 text-2xl font-bold">{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Faturas Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="py-12 text-center text-sm text-destructive">Não foi possível carregar os dados financeiros.</div>
          ) : !data?.recentInvoices.length ? (
            <div className="py-12 text-center text-sm text-muted-foreground">Nenhuma fatura cadastrada ainda.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-24">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recentInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.customerName}</TableCell>
                    <TableCell>{formatCurrency(invoice.amount)}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(invoice.dueDate)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={invoiceStatusClasses[invoice.status]}>
                        {invoiceStatusLabels[invoice.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {(invoice.status === "pending" || invoice.status === "overdue") && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-success hover:text-success"
                          onClick={() => {
                            setPaidDate(new Date().toISOString().slice(0, 10));
                            setPayDialog({ id: invoice.id, name: invoice.customerName });
                          }}
                        >
                          <CheckCircle className="mr-1 size-3.5" /> Baixa
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!payDialog} onOpenChange={(v) => !v && setPayDialog(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Dar baixa na fatura</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Confirmar pagamento de <strong>{payDialog?.name}</strong>?
            </p>
            <div className="space-y-1.5">
              <Label>Data do pagamento</Label>
              <Input type="date" value={paidDate} onChange={(e) => setPaidDate(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayDialog(null)}>Cancelar</Button>
            <Button onClick={handleMarkPaid} disabled={paying}>
              {paying ? <Loader2 className="mr-2 size-4 animate-spin" /> : <CheckCircle className="mr-2 size-4" />}
              Confirmar Pagamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
