import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, DollarSign, TrendingDown, TrendingUp, AlertTriangle, ClipboardList, Wifi, Star, Loader2, Package, ArrowUpRight, ArrowDownRight, Minus, Bell, Ticket, UserX, Wrench } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from "recharts";
import { motion } from "framer-motion";
import { AnimatedCard, StaggerGrid } from "@/components/motion/AnimatedCard";
import { MotionCard } from "@/components/motion/MotionInteractions";
import { useDashboardData, type AlertItem } from "@/hooks/useDashboardData";
import { formatCurrency } from "@/utils/finance";
import { Badge } from "@/components/ui/badge";

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
];

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  const chartData = data.map((v, i) => ({ v, i }));
  return (
    <div className="w-20 h-8">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <Line type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function TrendBadge({ value }: { value: number }) {
  if (Math.abs(value) < 0.5) {
    return (
      <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-muted-foreground">
        <Minus className="size-3" /> 0%
      </span>
    );
  }
  const isPositive = value > 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold ${isPositive ? "text-success" : "text-destructive"}`}>
      {isPositive ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
      {Math.abs(value).toFixed(1)}%
    </span>
  );
}

function HeroKpi({ title, value, subtitle, icon: Icon, color, sparkline, trend }: {
  title: string; value: string; subtitle?: string; icon: React.ElementType; color: string;
  sparkline?: number[]; trend?: number;
}) {
  return (
    <MotionCard>
      <Card className="relative overflow-hidden">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className="space-y-1 flex-1 min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
              <div className="flex items-center gap-2">
                <p className="text-3xl font-extrabold tracking-tight">{value}</p>
                {trend !== undefined && <TrendBadge value={trend} />}
              </div>
              {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              <div className={`flex size-11 items-center justify-center rounded-xl bg-primary/10 ${color}`}>
                <Icon className="size-5" />
              </div>
              {sparkline && sparkline.length > 1 && (
                <MiniSparkline data={sparkline} color={color.includes("destructive") ? "hsl(var(--destructive))" : "hsl(var(--primary))"} />
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </MotionCard>
  );
}

function StatRing({ label, value, percent, color }: {
  label: string; value: string; percent: number; color: string;
}) {
  const r = 38;
  const c = 2 * Math.PI * r;
  const offset = c - (percent / 100) * c;
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="90" height="90" viewBox="0 0 90 90" className="-rotate-90">
        <circle cx="45" cy="45" r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="7" />
        <circle cx="45" cy="45" r={r} fill="none" stroke={color} strokeWidth="7"
          strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
      <p className="text-lg font-bold -mt-[62px]">{value}</p>
      <p className="mt-8 text-[10px] font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
    </div>
  );
}

function AlertIcon({ type }: { type: AlertItem["type"] }) {
  switch (type) {
    case "overdue": return <DollarSign className="size-4 text-destructive" />;
    case "low_stock": return <Package className="size-4 text-warning" />;
    case "pending_os": return <ClipboardList className="size-4 text-warning" />;
  }
}

function AlertsWidget({ alerts }: { alerts: AlertItem[] }) {
  if (alerts.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="size-4" /> Alertas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground py-4">Nenhum alerta no momento. Tudo sob controle! ✅</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Bell className="size-4" />
          Alertas
          <Badge variant="destructive" className="ml-auto text-[10px] px-1.5 py-0">
            {alerts.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {alerts.map((alert, i) => (
            <motion.div
              key={`${alert.type}-${i}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className={`flex items-start gap-3 rounded-lg border p-3 ${
                alert.severity === "destructive"
                  ? "border-destructive/30 bg-destructive/5"
                  : "border-warning/30 bg-warning/5"
              }`}
            >
              <AlertIcon type={alert.type} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{alert.title}</p>
                <p className="text-xs text-muted-foreground">{alert.detail}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

const tooltipStyle = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "var(--radius)",
  color: "hsl(var(--card-foreground))",
};

export default function Dashboard() {
  const { data, isLoading, error } = useDashboardData();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-7 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-destructive">
          Não foi possível carregar os indicadores do dashboard.
        </CardContent>
      </Card>
    );
  }

  if (!data?.hasData) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm">Visão geral do seu provedor em tempo real</p>
        </div>
        <Card>
          <CardContent className="py-12 text-center space-y-2">
            <p className="font-medium">Seu dashboard ainda está vazio.</p>
            <p className="text-sm text-muted-foreground">Cadastre clientes, contratos, planos e faturas para ver os indicadores reais aqui.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const overduePercent = data.totalCustomers > 0
    ? Math.round((data.defaultingCustomers / data.totalCustomers) * 100)
    : 0;
  const activePercent = data.totalCustomers > 0
    ? Math.round((data.activeCustomers / data.totalCustomers) * 100)
    : 0;
  const collectionPercent = data.monthlyBilling > 0
    ? Math.round((data.receivedThisMonth / data.monthlyBilling) * 100)
    : 0;

  const pieData = data.invoiceStatusData.filter((d) => d.count > 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Visão geral do seu provedor em tempo real</p>
      </div>

      {/* Hero KPIs with sparklines & trends */}
      <StaggerGrid className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <AnimatedCard index={0}>
          <HeroKpi title="Assinantes Ativos" value={data.activeCustomers.toLocaleString("pt-BR")}
            subtitle={`${data.totalCustomers} clientes no total`} icon={Users} color="text-primary"
            sparkline={data.customerSparkline} trend={data.customerTrend} />
        </AnimatedCard>
        <AnimatedCard index={1}>
          <HeroKpi title="MRR Estimado" value={formatCurrency(data.estimatedMRR)}
            subtitle={`${data.activeContracts} contratos ativos`} icon={DollarSign} color="text-success"
            sparkline={data.revenueSparkline} trend={data.revenueTrend} />
        </AnimatedCard>
        <AnimatedCard index={2}>
          <HeroKpi title="Faturamento Mensal" value={formatCurrency(data.monthlyBilling)}
            subtitle={`Recebido ${formatCurrency(data.receivedThisMonth)}`} icon={Star} color="text-primary" />
        </AnimatedCard>
        <AnimatedCard index={3}>
          <HeroKpi title="Inadimplência" value={`${data.overdueRate.toFixed(1)}%`}
            subtitle={`${data.defaultingCustomers} clientes em atraso`} icon={AlertTriangle} color="text-destructive" />
        </AnimatedCard>
      </StaggerGrid>

      {/* Secondary KPIs row */}
      <div className="grid gap-4 grid-cols-3">
        <MotionCard>
          <Card>
            <CardContent className="p-5 flex items-center gap-4">
              <div className="flex size-11 items-center justify-center rounded-xl bg-warning/10">
                <UserX className="size-5 text-warning" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Churn Rate</p>
                <p className="text-2xl font-extrabold">{data.churnRate.toFixed(1)}%</p>
              </div>
            </CardContent>
          </Card>
        </MotionCard>
        <MotionCard>
          <Card>
            <CardContent className="p-5 flex items-center gap-4">
              <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10">
                <Ticket className="size-5 text-primary" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tickets Abertos</p>
                <p className="text-2xl font-extrabold">{data.openTickets}</p>
              </div>
            </CardContent>
          </Card>
        </MotionCard>
        <MotionCard>
          <Card>
            <CardContent className="p-5 flex items-center gap-4">
              <div className="flex size-11 items-center justify-center rounded-xl bg-warning/10">
                <Wrench className="size-5 text-warning" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">OS Pendentes</p>
                <p className="text-2xl font-extrabold">{data.pendingServiceOrders}</p>
              </div>
            </CardContent>
          </Card>
        </MotionCard>
      </div>

      {/* Rings row */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardContent className="flex items-center justify-center py-5">
            <StatRing label="Clientes Ativos" value={`${activePercent}%`} percent={activePercent} color="hsl(var(--chart-1))" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-center py-5">
            <StatRing label="Inadimplência" value={`${overduePercent}%`} percent={overduePercent} color="hsl(var(--destructive))" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-center py-5">
            <StatRing label="Arrecadação" value={`${collectionPercent}%`} percent={collectionPercent} color="hsl(var(--chart-2))" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex flex-col items-center justify-center gap-2">
            <div className="grid grid-cols-2 gap-3 w-full">
              <div className="text-center">
                <p className="text-xl font-bold">{data.activePlans}</p>
                <p className="text-[10px] text-muted-foreground uppercase">Planos</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold">{data.activeContracts}</p>
                <p className="text-[10px] text-muted-foreground uppercase">Contratos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts + Alerts */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.4 }} className="grid gap-4 md:grid-cols-7">
        <Card className="md:col-span-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Evolução de Clientes & Receita</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.revenueData}>
                  <defs>
                    <linearGradient id="colorClientes" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                  <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                    tickFormatter={(v: number) => `R$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={tooltipStyle}
                    formatter={(value: number, name: string) => [
                      name === "receita" ? formatCurrency(value) : value.toLocaleString("pt-BR"),
                      name === "receita" ? "Receita" : "Clientes",
                    ]}
                  />
                  <Area type="monotone" dataKey="clientes" stroke="hsl(var(--chart-1))" fill="url(#colorClientes)" strokeWidth={2} />
                  <Area type="monotone" dataKey="receita" stroke="hsl(var(--chart-2))" fill="none" strokeWidth={2} strokeDasharray="5 3" yAxisId="right" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Faturas por Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90}
                    paddingAngle={3} dataKey="count" nameKey="category"
                    label={({ category, count }) => `${category}: ${count}`}
                    labelLine={false}
                  >
                    {pieData.map((_, i) => (
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

      {/* Alerts + Recent Activities */}
      <div className="grid gap-4 md:grid-cols-2">
        <AlertsWidget alerts={data.alerts} />

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Atividades Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            {data.recentActivities.length ? (
              <div className="space-y-3">
                {data.recentActivities.map((activity, index) => (
                  <div key={`${activity.text}-${index}`} className="flex items-center gap-3 text-sm">
                    <div className={`size-2 rounded-full shrink-0 ${
                      activity.type === "success" ? "bg-success"
                      : activity.type === "warning" ? "bg-warning"
                      : "bg-destructive"
                    }`} />
                    <span className="flex-1">{activity.text}</span>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{activity.time}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-sm text-muted-foreground">Ainda não há atividades recentes registradas.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}