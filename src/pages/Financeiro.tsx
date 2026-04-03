import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DollarSign, TrendingUp, AlertTriangle, CheckCircle, Loader2 } from "lucide-react";
import { useFinanceiroData } from "@/hooks/useFinanceiroData";
import { formatCurrency, formatDate, invoiceStatusClasses, invoiceStatusLabels } from "@/utils/finance";

export default function Financeiro() {
  const { data, isLoading, error } = useFinanceiroData();

  const kpis = [
    { title: "Faturamento Mensal", value: formatCurrency(data?.monthlyBilling ?? 0), icon: DollarSign, color: "text-primary" },
    { title: "Recebido", value: formatCurrency(data?.receivedThisMonth ?? 0), icon: CheckCircle, color: "text-success" },
    { title: "A Receber", value: formatCurrency(data?.receivable ?? 0), icon: TrendingUp, color: "text-warning" },
    { title: "Inadimplentes", value: `${data?.defaultingCustomers ?? 0} clientes`, icon: AlertTriangle, color: "text-destructive" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Financeiro</h1>
        <p className="text-muted-foreground text-sm">Faturamento, cobranças e fluxo de caixa</p>
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
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
