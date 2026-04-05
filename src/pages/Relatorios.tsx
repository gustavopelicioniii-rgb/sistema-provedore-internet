import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart3, TrendingUp, Users, DollarSign, Download, FileText, Wrench, Loader2, AlertTriangle, Sheet,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area,
} from "recharts";
import { motion } from "framer-motion";
import { AnimatedCard, StaggerGrid } from "@/components/motion/AnimatedCard";
import { MotionCard } from "@/components/motion/MotionInteractions";
import { useReportsData } from "@/hooks/useReportsData";
import { formatCurrency } from "@/utils/finance";
import { downloadCsv, downloadPdfTable, downloadXlsx } from "@/utils/exportData";
import { toast } from "sonner";
import { DateRangeFilter, useFilterState } from "@/components/filters/DateRangeFilter";

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--primary))",
  "hsl(var(--success))",
];

const tooltipStyle = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "var(--radius)",
  color: "hsl(var(--card-foreground))",
};

export default function Relatorios() {
  const { data, isLoading } = useReportsData();
  const [filters, setFilters] = useFilterState(6);

  // Filter monthly data by date range
  const filteredRevenue = useMemo(() => {
    if (!data) return [];
    return data.monthlyRevenue;
  }, [data]);

  const filteredOverdue = useMemo(() => {
    if (!data) return [];
    return data.overdueByMonth;
  }, [data]);

  const exportRevenuePdf = () => {
    if (!data) return;
    downloadPdfTable(
      "Relatorio de Receita Mensal",
      "receita-mensal.pdf",
      ["Mes", "Faturado", "Recebido", "Inadimplente"],
      filteredRevenue.map((r) => [r.month, formatCurrency(r.faturado), formatCurrency(r.recebido), formatCurrency(r.inadimplente)])
    );
    toast.success("PDF exportado com sucesso!");
  };

  const exportRevenueCsv = () => {
    if (!data) return;
    downloadCsv(
      "receita-mensal.csv",
      ["Mês", "Faturado", "Recebido", "Inadimplente"],
      filteredRevenue.map((r) => [r.month, r.faturado.toString(), r.recebido.toString(), r.inadimplente.toString()])
    );
    toast.success("CSV exportado com sucesso!");
  };

  const exportCustomersCsv = () => {
    if (!data) return;
    downloadCsv(
      "clientes.csv",
      ["Nome", "CPF/CNPJ", "Status", "Telefone", "Email"],
      data.customerExport.map((c) => [c.name, c.cpf_cnpj, c.status, c.phone, c.email])
    );
    toast.success("CSV de clientes exportado!");
  };

  const exportTechPdf = () => {
    if (!data) return;
    downloadPdfTable(
      "Produtividade de Tecnicos",
      "produtividade-tecnicos.pdf",
      ["Tecnico", "OS Concluidas", "OS Pendentes", "Tempo Medio (dias)"],
      data.techProductivity.map((t) => [t.name, t.completed.toString(), t.pending.toString(), t.avgDays.toString()])
    );
    toast.success("PDF exportado com sucesso!");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-7 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const totalFaturado = filteredRevenue.reduce((s, m) => s + m.faturado, 0);
  const totalRecebido = filteredRevenue.reduce((s, m) => s + m.recebido, 0);
  const totalInadimplente = filteredRevenue.reduce((s, m) => s + m.inadimplente, 0);
  const totalOsCompleted = data?.techProductivity.reduce((s, t) => s + t.completed, 0) ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Relatórios & BI</h1>
          <p className="text-muted-foreground text-sm">Analytics com dados reais do sistema</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-3 px-4">
          <DateRangeFilter value={filters} onChange={setFilters} />
        </CardContent>
      </Card>

      {/* Summary KPIs */}
      <StaggerGrid className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <AnimatedCard index={0}>
          <MotionCard>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                    <DollarSign className="size-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xl font-bold">{formatCurrency(totalFaturado)}</p>
                    <p className="text-xs text-muted-foreground">Faturado no período</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </MotionCard>
        </AnimatedCard>
        <AnimatedCard index={1}>
          <MotionCard>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-success/10">
                    <TrendingUp className="size-5 text-success" />
                  </div>
                  <div>
                    <p className="text-xl font-bold">{formatCurrency(totalRecebido)}</p>
                    <p className="text-xs text-muted-foreground">Recebido no período</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </MotionCard>
        </AnimatedCard>
        <AnimatedCard index={2}>
          <MotionCard>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-destructive/10">
                    <AlertTriangle className="size-5 text-destructive" />
                  </div>
                  <div>
                    <p className="text-xl font-bold">{formatCurrency(totalInadimplente)}</p>
                    <p className="text-xs text-muted-foreground">Inadimplente no período</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </MotionCard>
        </AnimatedCard>
        <AnimatedCard index={3}>
          <MotionCard>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                    <Wrench className="size-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xl font-bold">{totalOsCompleted}</p>
                    <p className="text-xs text-muted-foreground">OS concluídas</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </MotionCard>
        </AnimatedCard>
      </StaggerGrid>

      <Tabs defaultValue="receita" className="space-y-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="receita">Receita</TabsTrigger>
          <TabsTrigger value="inadimplencia">Inadimplência</TabsTrigger>
          <TabsTrigger value="aging">Aging Report</TabsTrigger>
          <TabsTrigger value="tecnicos">Técnicos</TabsTrigger>
          <TabsTrigger value="planos">Planos</TabsTrigger>
          <TabsTrigger value="exportar">Exportar</TabsTrigger>
        </TabsList>

        {/* Receita Tab */}
        <TabsContent value="receita">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base">Receita Mensal</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={exportRevenueCsv}><Download className="size-3.5 mr-1" />CSV</Button>
                  <Button variant="outline" size="sm" onClick={exportRevenuePdf}><FileText className="size-3.5 mr-1" />PDF</Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={filteredRevenue}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                      <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                      <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatCurrency(v)} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="faturado" name="Faturado" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="recebido" name="Recebido" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="inadimplente" name="Inadimplente" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Inadimplência Tab */}
        <TabsContent value="inadimplencia">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Taxa de Inadimplência por Mês</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={filteredOverdue}>
                      <defs>
                        <linearGradient id="gradOverdue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                      <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} tickFormatter={(v) => `${v}%`} />
                      <Tooltip contentStyle={tooltipStyle} formatter={(v: number, name: string) => [name === "rate" ? `${v}%` : v, name === "rate" ? "Taxa" : "Qtd"]} />
                      <Area type="monotone" dataKey="rate" name="Taxa (%)" stroke="hsl(var(--destructive))" fill="url(#gradOverdue)" strokeWidth={2} />
                      <Line type="monotone" dataKey="count" name="Faturas vencidas" stroke="hsl(var(--chart-4))" strokeWidth={2} dot={{ r: 4 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Aging Report Tab */}
        <TabsContent value="aging">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Aging Report — Inadimplência por Faixa de Atraso</CardTitle>
              </CardHeader>
              <CardContent>
                {data?.agingReport && data.agingReport.some((b) => b.count > 0) ? (
                  <>
                    <div className="h-[300px] mb-6">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.agingReport}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="label" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                          <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                          <Tooltip contentStyle={tooltipStyle} formatter={(v: number, name: string) => [
                            name === "amount" ? formatCurrency(v) : v,
                            name === "amount" ? "Valor" : "Qtd Faturas",
                          ]} />
                          <Legend wrapperStyle={{ fontSize: 12 }} />
                          <Bar dataKey="count" name="Faturas" fill="hsl(var(--chart-4))" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="amount" name="Valor (R$)" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Faixa de Atraso</TableHead>
                          <TableHead className="text-center">Faturas</TableHead>
                          <TableHead className="text-right">Valor Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.agingReport.map((bucket) => (
                          <TableRow key={bucket.label}>
                            <TableCell className="font-medium">{bucket.label}</TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline" className={bucket.count > 0 ? "bg-destructive/10 text-destructive border-destructive/20" : ""}>
                                {bucket.count}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-mono">{formatCurrency(bucket.amount)}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="font-bold">
                          <TableCell>Total</TableCell>
                          <TableCell className="text-center">{data.agingReport.reduce((s, b) => s + b.count, 0)}</TableCell>
                          <TableCell className="text-right font-mono">{formatCurrency(data.agingReport.reduce((s, b) => s + b.amount, 0))}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </>
                ) : (
                  <p className="py-8 text-center text-sm text-muted-foreground">Nenhuma fatura vencida encontrada. Ótima notícia! ✅</p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Técnicos Tab */}
        <TabsContent value="tecnicos">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base">Produtividade dos Técnicos</CardTitle>
                <Button variant="outline" size="sm" onClick={exportTechPdf}><FileText className="size-3.5 mr-1" />PDF</Button>
              </CardHeader>
              <CardContent>
                {data?.techProductivity.length ? (
                  <>
                    <div className="h-[300px] mb-6">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.techProductivity} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis type="number" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                          <YAxis type="category" dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} width={120} />
                          <Tooltip contentStyle={tooltipStyle} />
                          <Legend wrapperStyle={{ fontSize: 12 }} />
                          <Bar dataKey="completed" name="Concluídas" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} />
                          <Bar dataKey="pending" name="Pendentes" fill="hsl(var(--chart-4))" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Técnico</TableHead>
                          <TableHead className="text-center">Concluídas</TableHead>
                          <TableHead className="text-center">Pendentes</TableHead>
                          <TableHead className="text-center">Tempo Médio</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.techProductivity.map((t) => (
                          <TableRow key={t.name}>
                            <TableCell className="font-medium">{t.name}</TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline" className="bg-success/10 text-success border-success/20">{t.completed}</Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">{t.pending}</Badge>
                            </TableCell>
                            <TableCell className="text-center">{t.avgDays > 0 ? `${t.avgDays} dias` : "—"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </>
                ) : (
                  <p className="py-8 text-center text-sm text-muted-foreground">Cadastre técnicos e ordens de serviço para ver a produtividade.</p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Planos Tab */}
        <TabsContent value="planos">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Distribuição de Contratos por Plano</CardTitle>
              </CardHeader>
              <CardContent>
                {data?.planDistribution.length ? (
                  <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data.planDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={70}
                          outerRadius={110}
                          paddingAngle={3}
                          dataKey="count"
                          nameKey="name"
                          label={({ name, count }) => `${name}: ${count}`}
                          labelLine={false}
                        >
                          {data.planDistribution.map((_, i) => (
                            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={tooltipStyle} />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="py-8 text-center text-sm text-muted-foreground">Cadastre contratos para ver a distribuição por plano.</p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Exportar Tab */}
        <TabsContent value="exportar">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Relatórios Disponíveis para Exportação</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2">
                  <ExportCard
                    icon={DollarSign}
                    title="Receita Mensal"
                    desc="Faturado, recebido e inadimplente do período selecionado"
                    onPdf={exportRevenuePdf}
                    onCsv={exportRevenueCsv}
                    onXlsx={() => {
                      if (!data) return;
                      downloadXlsx("receita-mensal.xlsx", ["Mês", "Faturado", "Recebido", "Inadimplente"],
                        filteredRevenue.map((r) => [r.month, r.faturado.toString(), r.recebido.toString(), r.inadimplente.toString()]), "Receita");
                      toast.success("Excel exportado!");
                    }}
                  />
                  <ExportCard
                    icon={Users}
                    title="Base de Clientes"
                    desc="Listagem completa com CPF/CNPJ, status e contato"
                    onCsv={exportCustomersCsv}
                    onXlsx={() => {
                      if (!data) return;
                      downloadXlsx("clientes.xlsx", ["Nome", "CPF/CNPJ", "Status", "Telefone", "Email"],
                        data.customerExport.map((c) => [c.name, c.cpf_cnpj, c.status, c.phone, c.email]), "Clientes");
                      toast.success("Excel exportado!");
                    }}
                  />
                  <ExportCard
                    icon={Wrench}
                    title="Produtividade de Técnicos"
                    desc="OS concluídas, pendentes e tempo médio"
                    onPdf={exportTechPdf}
                    onXlsx={() => {
                      if (!data) return;
                      downloadXlsx("produtividade-tecnicos.xlsx", ["Técnico", "Concluídas", "Pendentes", "Tempo Médio (dias)"],
                        data.techProductivity.map((t) => [t.name, t.completed.toString(), t.pending.toString(), t.avgDays.toString()]), "Técnicos");
                      toast.success("Excel exportado!");
                    }}
                  />
                  <ExportCard
                    icon={AlertTriangle}
                    title="Inadimplência"
                    desc="Taxa e volume de faturas vencidas por mês"
                    onPdf={() => {
                      if (!data) return;
                      downloadPdfTable("Relatorio de Inadimplencia", "inadimplencia.pdf",
                        ["Mes", "Taxa (%)", "Faturas Vencidas"],
                        filteredOverdue.map((m) => [m.month, `${m.rate}%`, m.count.toString()]));
                      toast.success("PDF exportado!");
                    }}
                    onXlsx={() => {
                      if (!data) return;
                      downloadXlsx("inadimplencia.xlsx", ["Mês", "Taxa (%)", "Faturas Vencidas"],
                        filteredOverdue.map((m) => [m.month, `${m.rate}%`, m.count.toString()]), "Inadimplência");
                      toast.success("Excel exportado!");
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ExportCard({ icon: Icon, title, desc, onPdf, onCsv, onXlsx }: {
  icon: React.ElementType; title: string; desc: string; onPdf?: () => void; onCsv?: () => void; onXlsx?: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border p-4">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
        <Icon className="size-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <div className="flex gap-1.5">
        {onPdf && (
          <Button variant="outline" size="sm" onClick={onPdf}>
            <FileText className="size-3.5 mr-1" />PDF
          </Button>
        )}
        {onXlsx && (
          <Button variant="outline" size="sm" onClick={onXlsx}>
            <Sheet className="size-3.5 mr-1" />Excel
          </Button>
        )}
        {onCsv && (
          <Button variant="outline" size="sm" onClick={onCsv}>
            <Download className="size-3.5 mr-1" />CSV
          </Button>
        )}
      </div>
    </div>
  );
}
