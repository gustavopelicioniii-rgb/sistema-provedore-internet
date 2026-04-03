import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart3, TrendingUp, Users, DollarSign, Download, Calendar, PieChart, Activity } from "lucide-react";
import { useDashboardData } from "@/hooks/useDashboardData";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RePieChart, Pie, Cell, LineChart, Line } from "recharts";
import { motion } from "framer-motion";
import { AnimatedCard, StaggerGrid } from "@/components/motion/AnimatedCard";
import { MotionCard } from "@/components/motion/MotionInteractions";

const monthlyData = [
  { month: "Jan", receita: 45000, despesa: 32000 },
  { month: "Fev", receita: 48000, despesa: 33000 },
  { month: "Mar", receita: 52000, despesa: 31000 },
  { month: "Abr", receita: 55000, despesa: 34000 },
  { month: "Mai", receita: 58000, despesa: 35000 },
  { month: "Jun", receita: 62000, despesa: 36000 },
];

const clientsByPlan = [
  { name: "100 Mbps", value: 120, color: "hsl(var(--primary))" },
  { name: "200 Mbps", value: 85, color: "hsl(var(--accent))" },
  { name: "500 Mbps", value: 45, color: "hsl(var(--warning))" },
  { name: "1 Gbps", value: 20, color: "hsl(var(--success))" },
];

const ticketTrend = [
  { month: "Jan", tickets: 42 },
  { month: "Fev", tickets: 38 },
  { month: "Mar", tickets: 35 },
  { month: "Abr", tickets: 40 },
  { month: "Mai", tickets: 33 },
  { month: "Jun", tickets: 28 },
];

const reports = [
  { title: "Relatório Financeiro Mensal", desc: "Receitas, despesas e inadimplência", icon: DollarSign, type: "PDF" },
  { title: "Base de Clientes", desc: "Listagem completa com status e planos", icon: Users, type: "CSV" },
  { title: "Análise de Churn", desc: "Taxa de cancelamento e motivos", icon: TrendingUp, type: "PDF" },
  { title: "Performance Técnica", desc: "Tempo médio de atendimento e SLA", icon: Activity, type: "PDF" },
];

export default function Relatorios() {
  const { data } = useDashboardData();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Relatórios & BI</h1>
          <p className="text-muted-foreground text-sm">Analytics avançado e relatórios customizados</p>
        </div>
        <Button variant="outline"><Calendar className="mr-2 size-4" />Período</Button>
      </div>

      <StaggerGrid className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AnimatedCard index={0}><MotionCard>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10"><Users className="size-5 text-primary" /></div>
              <div><p className="text-2xl font-bold">{data?.totalCustomers ?? 0}</p><p className="text-xs text-muted-foreground">Clientes ativos</p></div>
            </div>
          </CardContent>
        </Card>
        </AnimatedCard>
        <AnimatedCard index={1}>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-success/10"><DollarSign className="size-5 text-success" /></div>
              <div><p className="text-2xl font-bold">R$ {(data?.estimatedMRR ?? 0).toLocaleString("pt-BR")}</p><p className="text-xs text-muted-foreground">MRR</p></div>
            </div>
          </CardContent>
        </Card>
        </AnimatedCard>
        <AnimatedCard index={2}>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-warning/10"><TrendingUp className="size-5 text-warning" /></div>
              <div><p className="text-2xl font-bold">{data?.overdueRate?.toFixed(1) ?? 0}%</p><p className="text-xs text-muted-foreground">Inadimplência</p></div>
            </div>
          </CardContent>
        </Card>
        </AnimatedCard>
        <AnimatedCard index={3}>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-accent"><BarChart3 className="size-5 text-accent-foreground" /></div>
              <div><p className="text-2xl font-bold">{data?.activeContracts ?? 0}</p><p className="text-xs text-muted-foreground">Contratos ativos</p></div>
            </div>
          </CardContent>
        </Card>
        </AnimatedCard>
      </StaggerGrid>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.4 }} className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Receita vs Despesa</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip />
                <Bar dataKey="receita" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="despesa" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Clientes por Plano</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <RePieChart>
                <Pie data={clientsByPlan} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {clientsByPlan.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip />
              </RePieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      <Card>
        <CardHeader><CardTitle className="text-base">Tendência de Tickets</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={ticketTrend}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="month" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip />
              <Line type="monotone" dataKey="tickets" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Relatórios Disponíveis</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {reports.map((r) => (
              <div key={r.title} className="flex items-center gap-3 rounded-lg border p-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <r.icon className="size-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{r.title}</p>
                  <p className="text-xs text-muted-foreground">{r.desc}</p>
                </div>
                <Button variant="ghost" size="sm"><Download className="size-4 mr-1" />{r.type}</Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
