import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, DollarSign, TrendingDown, AlertTriangle, Ticket, ClipboardList, Wifi, Star } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

const kpis = [
  { title: "Assinantes Ativos", value: "4.287", change: "+3.2%", icon: Users, color: "text-primary" },
  { title: "MRR", value: "R$ 342.960", change: "+5.1%", icon: DollarSign, color: "text-success" },
  { title: "Churn Mensal", value: "1.8%", change: "-0.3%", icon: TrendingDown, color: "text-warning" },
  { title: "Inadimplência", value: "6.2%", change: "-1.1%", icon: AlertTriangle, color: "text-destructive" },
  { title: "Tickets Abertos", value: "23", change: "-12%", icon: Ticket, color: "text-info" },
  { title: "OS Pendentes", value: "15", change: "+2", icon: ClipboardList, color: "text-warning" },
  { title: "Uptime Rede", value: "99.7%", change: "+0.1%", icon: Wifi, color: "text-success" },
  { title: "NPS", value: "72", change: "+4", icon: Star, color: "text-primary" },
];

const revenueData = [
  { month: "Jan", assinantes: 3820, receita: 305600 },
  { month: "Fev", assinantes: 3890, receita: 311200 },
  { month: "Mar", assinantes: 3950, receita: 316000 },
  { month: "Abr", assinantes: 4020, receita: 321600 },
  { month: "Mai", assinantes: 4080, receita: 326400 },
  { month: "Jun", assinantes: 4100, receita: 328000 },
  { month: "Jul", assinantes: 4120, receita: 329600 },
  { month: "Ago", assinantes: 4150, receita: 332000 },
  { month: "Set", assinantes: 4180, receita: 334400 },
  { month: "Out", assinantes: 4210, receita: 336800 },
  { month: "Nov", assinantes: 4250, receita: 340000 },
  { month: "Dez", assinantes: 4287, receita: 342960 },
];

const ticketsByCategory = [
  { category: "Conexão", count: 45 },
  { category: "Financeiro", count: 28 },
  { category: "Lentidão", count: 22 },
  { category: "Instalação", count: 18 },
  { category: "Cancelamento", count: 8 },
  { category: "Outros", count: 12 },
];

const recentActivities = [
  { text: "Novo contrato: João Silva — Fibra 300MB", time: "há 5 min", type: "success" as const },
  { text: "Pagamento recebido: Maria Souza — R$ 89,90", time: "há 12 min", type: "success" as const },
  { text: "Ticket #4521 escalado — SLA crítico", time: "há 18 min", type: "warning" as const },
  { text: "OLT Bairro Centro — Alerta de temperatura", time: "há 25 min", type: "destructive" as const },
  { text: "OS #892 finalizada — Técnico Carlos", time: "há 32 min", type: "success" as const },
  { text: "Cancelamento: Pedro Oliveira — Mudança de cidade", time: "há 1h", type: "destructive" as const },
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 }).format(value);

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Visão geral do seu provedor em tempo real</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.title}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">{kpi.title}</p>
                <kpi.icon className={`size-4 ${kpi.color}`} />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <p className="text-2xl font-bold">{kpi.value}</p>
                <span className={`text-xs font-medium ${
                  kpi.change.startsWith("+") && kpi.title !== "Churn Mensal" && kpi.title !== "Inadimplência"
                    ? "text-success"
                    : kpi.change.startsWith("-") && (kpi.title === "Churn Mensal" || kpi.title === "Inadimplência")
                    ? "text-success"
                    : "text-muted-foreground"
                }`}>
                  {kpi.change}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-7">
        <Card className="md:col-span-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Evolução de Assinantes & Receita</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="colorAssinantes" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)",
                      color: "hsl(var(--card-foreground))",
                    }}
                    formatter={(value: number, name: string) => [
                      name === "receita" ? formatCurrency(value) : value.toLocaleString("pt-BR"),
                      name === "receita" ? "Receita" : "Assinantes",
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="assinantes"
                    stroke="hsl(var(--chart-1))"
                    fill="url(#colorAssinantes)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Tickets por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ticketsByCategory} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                  <YAxis dataKey="category" type="category" width={85} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)",
                      color: "hsl(var(--card-foreground))",
                    }}
                  />
                  <Bar dataKey="count" fill="hsl(var(--chart-1))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Atividades Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentActivities.map((activity, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <div className={`size-2 rounded-full shrink-0 ${
                  activity.type === "success" ? "bg-success" :
                  activity.type === "warning" ? "bg-warning" :
                  "bg-destructive"
                }`} />
                <span className="flex-1">{activity.text}</span>
                <span className="text-xs text-muted-foreground whitespace-nowrap">{activity.time}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
