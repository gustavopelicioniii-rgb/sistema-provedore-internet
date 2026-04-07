import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, TrendingUp, AlertTriangle, CheckCircle, Loader2, Zap, Download, FileText, Search, Sheet, Settings, SplitSquareVertical, BookOpen } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { motion } from "framer-motion";
import { AnimatedCard, StaggerGrid } from "@/components/motion/AnimatedCard";
import { MotionCard } from "@/components/motion/MotionInteractions";
import { useFinanceiroData } from "@/hooks/useFinanceiroData";
import { formatCurrency, formatDate, invoiceStatusClasses, invoiceStatusLabels, type InvoiceStatus } from "@/utils/finance";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { downloadCsv, downloadPdfTable, downloadXlsx } from "@/utils/exportData";
import { DateRangeFilter, useFilterState } from "@/components/filters/DateRangeFilter";
import { FinancialHealthKpis } from "@/components/billing/FinancialHealthKpis";
import { BillingRulesManager } from "@/components/billing/BillingRulesManager";
import { BankReconciliationTab } from "@/components/billing/BankReconciliationTab";
import { InstallmentDialog } from "@/components/billing/InstallmentDialog";
import { CarneDigitalDialog } from "@/components/billing/CarneDigitalDialog";

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
];

const tooltipStyle = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "var(--radius)",
  color: "hsl(var(--card-foreground))",
};

const statusOptions = [
  { value: "paid", label: "Pagas" },
  { value: "pending", label: "Pendentes" },
  { value: "overdue", label: "Vencidas" },
  { value: "cancelled", label: "Canceladas" },
];

function HeroKpi({ title, value, icon: Icon, color }: {
  title: string; value: string; icon: React.ElementType; color: string;
}) {
  return (
    <MotionCard>
      <Card className="relative overflow-hidden">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
              <p className="text-3xl font-extrabold tracking-tight">{value}</p>
            </div>
            <div className={`flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 ${color}`}>
              <Icon className="size-5" />
            </div>
          </div>
        </CardContent>
      </Card>
    </MotionCard>
  );
}

export default function Financeiro() {
  const { data, isLoading, error } = useFinanceiroData();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [generating, setGenerating] = useState(false);
  const [payDialog, setPayDialog] = useState<{ id: string; name: string } | null>(null);
  const [paidDate, setPaidDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [paying, setPaying] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useFilterState(6);
  const [installmentInvoice, setInstallmentInvoice] = useState<any>(null);
  const [carneOpen, setCarneOpen] = useState(false);
  const [orgId, setOrgId] = useState("");

  const filteredInvoices = useMemo(() => {
    if (!data) return [];
    return data.recentInvoices.filter((inv) => {
      const dueDate = new Date(`${inv.dueDate}T00:00:00`);
      if (dueDate < filters.dateRange.from || dueDate > filters.dateRange.to) return false;
      if (filters.status && inv.status !== filters.status) return false;
      if (searchTerm && !inv.customerName.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    });
  }, [data, filters, searchTerm]);

  const filteredKpis = useMemo(() => {
    const billing = filteredInvoices.reduce((t, i) => t + i.amount, 0);
    const received = filteredInvoices.filter((i) => i.status === "paid").reduce((t, i) => t + i.amount, 0);
    const receivable = filteredInvoices.filter((i) => i.status === "pending" || i.status === "overdue").reduce((t, i) => t + i.amount, 0);
    const defaulting = new Set(filteredInvoices.filter((i) => i.status === "overdue").map((i) => i.customerName)).size;
    return { billing, received, receivable, defaulting };
  }, [filteredInvoices]);

  const handleGenerateInvoices = async () => {
    setGenerating(true);
    try {
      const { data: result, error } = await supabase.functions.invoke("generate-invoices", { method: "POST" });
      if (error) throw error;
      toast({ title: result.created > 0 ? "Faturas geradas!" : "Nenhuma fatura nova", description: result.message });
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
      const { error } = await supabase.from("invoices").update({ status: "paid" as any, paid_date: paidDate }).eq("id", payDialog.id);
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Financeiro</h1>
          <p className="text-muted-foreground text-sm">Faturamento, cobranças e fluxo de caixa</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" disabled={!filteredInvoices.length} onClick={() => {
            const headers = ["Cliente", "Valor", "Vencimento", "Status"];
            const rows = filteredInvoices.map((i) => [i.customerName, formatCurrency(i.amount), formatDate(i.dueDate), invoiceStatusLabels[i.status]]);
            downloadCsv("faturas.csv", headers, rows);
          }}>
            <Download className="mr-2 size-4" /> CSV
          </Button>
          <Button variant="outline" size="sm" disabled={!filteredInvoices.length} onClick={() => {
            const headers = ["Cliente", "Valor", "Vencimento", "Status"];
            const rows = filteredInvoices.map((i) => [i.customerName, formatCurrency(i.amount), formatDate(i.dueDate), invoiceStatusLabels[i.status]]);
            downloadXlsx("faturas.xlsx", headers, rows, "Faturas");
          }}>
            <Sheet className="mr-2 size-4" /> Excel
          </Button>
          <Button variant="outline" size="sm" disabled={!filteredInvoices.length} onClick={() => {
            const headers = ["Cliente", "Valor", "Vencimento", "Status"];
            const rows = filteredInvoices.map((i) => [i.customerName, formatCurrency(i.amount), formatDate(i.dueDate), invoiceStatusLabels[i.status]]);
            downloadPdfTable("Faturas", "faturas.pdf", headers, rows);
          }}>
            <FileText className="mr-2 size-4" /> PDF
          </Button>
          <Button onClick={handleGenerateInvoices} disabled={generating}>
            {generating ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Zap className="mr-2 size-4" />}
            Gerar Faturas
          </Button>
          <Button variant="outline" onClick={async () => {
            const { data: p } = await supabase.from("profiles").select("organization_id").maybeSingle();
            if (p?.organization_id) { setOrgId(p.organization_id); setCarneOpen(true); }
          }}>
            <BookOpen className="mr-2 size-4" /> Carnê Digital
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="health">Saúde Financeira</TabsTrigger>
          <TabsTrigger value="billing-rules">
            <Settings className="mr-1 size-3.5" /> Régua de Cobrança
          </TabsTrigger>
          <TabsTrigger value="bank">
            <FileText className="mr-1 size-3.5" /> Conciliação Bancária
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="py-3 px-4">
              <div className="flex flex-wrap items-center gap-3">
                <DateRangeFilter value={filters} onChange={setFilters} statusOptions={statusOptions} />
                <div className="relative ml-auto">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                  <Input placeholder="Buscar cliente..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-8 w-48 pl-8 text-xs" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Hero KPIs */}
          <StaggerGrid className="grid gap-4 grid-cols-2 md:grid-cols-4">
            <AnimatedCard index={0}><HeroKpi title="Faturamento" value={formatCurrency(filteredKpis.billing)} icon={DollarSign} color="text-primary" /></AnimatedCard>
            <AnimatedCard index={1}><HeroKpi title="Recebido" value={formatCurrency(filteredKpis.received)} icon={CheckCircle} color="text-success" /></AnimatedCard>
            <AnimatedCard index={2}><HeroKpi title="A Receber" value={formatCurrency(filteredKpis.receivable)} icon={TrendingUp} color="text-warning" /></AnimatedCard>
            <AnimatedCard index={3}><HeroKpi title="Inadimplentes" value={`${filteredKpis.defaulting} clientes`} icon={AlertTriangle} color="text-destructive" /></AnimatedCard>
          </StaggerGrid>

          {/* Charts */}
          {!isLoading && !error && data && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.4 }} className="grid gap-4 md:grid-cols-7">
              <Card className="md:col-span-4">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Faturado vs Recebido (6 meses)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.monthlyTrend}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                        <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                          tickFormatter={(v: number) => `R$${(v / 1000).toFixed(0)}k`} />
                        <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => formatCurrency(value)} />
                        <Bar dataKey="faturado" name="Faturado" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="recebido" name="Recebido" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="md:col-span-3">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Faturas por Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={data.statusBreakdown.filter((d) => d.count > 0)} cx="50%" cy="50%"
                          innerRadius={55} outerRadius={85} paddingAngle={3}
                          dataKey="count" nameKey="category"
                          label={({ category, count }) => `${category}: ${count}`}
                          labelLine={false}
                        >
                          {data.statusBreakdown.filter((d) => d.count > 0).map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={tooltipStyle} />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Invoices table */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Faturas</CardTitle>
                <Badge variant="secondary" className="text-xs">{filteredInvoices.length} resultados</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="size-6 animate-spin text-muted-foreground" />
                </div>
              ) : error ? (
                <div className="py-12 text-center text-sm text-destructive">Não foi possível carregar os dados financeiros.</div>
              ) : !filteredInvoices.length ? (
                <div className="py-12 text-center text-sm text-muted-foreground">Nenhuma fatura encontrada com os filtros selecionados.</div>
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
                    {filteredInvoices.map((invoice) => (
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
                          <div className="flex gap-1">
                            {(invoice.status === "pending" || invoice.status === "overdue") && (
                              <>
                                <Button variant="ghost" size="sm" className="text-success hover:text-success"
                                  onClick={() => { setPaidDate(new Date().toISOString().slice(0, 10)); setPayDialog({ id: invoice.id, name: invoice.customerName }); }}>
                                  <CheckCircle className="mr-1 size-3.5" /> Baixa
                                </Button>
                                <Button variant="ghost" size="sm"
                                  onClick={async () => {
                                    const { data: p } = await supabase.from("profiles").select("organization_id").maybeSingle();
                                    setInstallmentInvoice({
                                      id: invoice.id,
                                      amount: invoice.amount,
                                      dueDate: invoice.dueDate,
                                      customerName: invoice.customerName,
                                      organizationId: p?.organization_id ?? "",
                                    });
                                  }}>
                                  <SplitSquareVertical className="mr-1 size-3.5" /> Parcelar
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="health" className="space-y-4">
          {!isLoading && !error && data ? (
            <FinancialHealthKpis data={data} />
          ) : isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="py-12 text-center text-sm text-destructive">Erro ao carregar dados.</div>
          )}
        </TabsContent>

        <TabsContent value="billing-rules">
          <BillingRulesManager />
        </TabsContent>

        <TabsContent value="bank">
          <BankReconciliationTab />
        </TabsContent>
      </Tabs>

      {/* Pay dialog */}
      <Dialog open={!!payDialog} onOpenChange={(v) => !v && setPayDialog(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Dar baixa na fatura</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Confirmar pagamento de <strong>{payDialog?.name}</strong>?</p>
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

      {/* Installment dialog */}
      <InstallmentDialog
        open={!!installmentInvoice}
        onOpenChange={(v) => !v && setInstallmentInvoice(null)}
        invoice={installmentInvoice}
      />

      {/* Carnê digital dialog */}
      <CarneDigitalDialog
        open={carneOpen}
        onOpenChange={setCarneOpen}
        organizationId={orgId}
      />
    </div>
  );
}
