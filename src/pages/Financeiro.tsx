import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DollarSign, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";

const kpis = [
  { title: "Faturamento Mensal", value: "R$ 342.960", icon: DollarSign, color: "text-primary" },
  { title: "Recebido", value: "R$ 298.400", icon: CheckCircle, color: "text-success" },
  { title: "A Receber", value: "R$ 44.560", icon: TrendingUp, color: "text-warning" },
  { title: "Inadimplentes", value: "267 clientes", icon: AlertTriangle, color: "text-destructive" },
];

const faturas = [
  { id: 1, cliente: "João Silva", valor: "R$ 99,90", vencimento: "10/01/2026", status: "Pago" },
  { id: 2, cliente: "Maria Souza", valor: "R$ 79,90", vencimento: "10/01/2026", status: "Pago" },
  { id: 3, cliente: "Pedro Oliveira", valor: "R$ 59,90", vencimento: "05/01/2026", status: "Vencido" },
  { id: 4, cliente: "Ana Costa", valor: "R$ 149,90", vencimento: "15/01/2026", status: "Pendente" },
  { id: 5, cliente: "Carlos Lima", valor: "R$ 59,90", vencimento: "20/12/2025", status: "Vencido" },
];

const statusColor: Record<string, string> = {
  Pago: "bg-success/10 text-success border-success/20",
  Pendente: "bg-warning/10 text-warning border-warning/20",
  Vencido: "bg-destructive/10 text-destructive border-destructive/20",
};

export default function Financeiro() {
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
              {faturas.map((f) => (
                <TableRow key={f.id}>
                  <TableCell className="font-medium">{f.cliente}</TableCell>
                  <TableCell>{f.valor}</TableCell>
                  <TableCell className="text-muted-foreground">{f.vencimento}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusColor[f.status]}>{f.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
