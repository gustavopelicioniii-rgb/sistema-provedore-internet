import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, DollarSign, TrendingDown, AlertTriangle, ClipboardList, Wifi, Star, Loader2 } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { useDashboardData } from "@/hooks/useDashboardData";
import { formatCurrency } from "@/utils/finance";

export default function Dashboard() {
  const { data, isLoading, error } = useDashboardData();

  const kpis = [
    { title: "Assinantes Ativos", value: (data?.activeCustomers ?? 0).toLocaleString("pt-BR"), helper: `${data?.totalCustomers ?? 0} clientes no total`, icon: Users, color: "text-primary" },
    { title: "MRR Estimado", value: formatCurrency(data?.estimatedMRR ?? 0), helper: `${data?.activeContracts ?? 0} contratos ativos`, icon: DollarSign, color: "text-success" },
    { title: "Inadimplência", value: `${(data?.overdueRate ?? 0).toFixed(1)}%`, helper: `${data?.defaultingCustomers ?? 0} clientes em atraso`, icon: TrendingDown, color: "text-warning" },
    { title: "Faturamento do Mês", value: formatCurrency(data?.monthlyBilling ?? 0), helper: `Recebido ${formatCurrency(data?.receivedThisMonth ?? 0)}`, icon: AlertTriangle, color: "text-destructive" },
    { title: "Planos Ativos", value: (data?.activePlans ?? 0).toLocaleString("pt-BR"), helper: "Planos disponíveis para venda", icon: ClipboardList, color: "text-warning" },
    { title: "Contratos Ativos", value: (data?.activeContracts ?? 0).toLocaleString("pt-BR"), helper: "Base contratual atual", icon: Wifi, color: "text-success" },
    { title: "Recebido no Mês", value: formatCurrency(data?.receivedThisMonth ?? 0), helper: "Pagamentos confirmados", icon: Star, color: "text-primary" },
    { title: "Clientes em Atraso", value: (data?.defaultingCustomers ?? 0).toLocaleString("pt-BR"), helper: "Requer acompanhamento", icon: AlertTriangle, color: "text-destructive" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Visão geral do seu provedor em tempo real</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="size-7 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-destructive">
            Não foi possível carregar os indicadores do dashboard.
          </CardContent>
        </Card>
      ) : !data?.hasData ? (
        <Card>
          <CardContent className="py-12 text-center space-y-2">
            <p className="font-medium">Seu dashboard ainda está vazio.</p>
            <p className="text-sm text-muted-foreground">Cadastre clientes, contratos, planos e faturas para ver os indicadores reais aqui.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
            {kpis.map((kpi) => (
              <Card key={kpi.title}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-muted-foreground">{kpi.title}</p>
                    <kpi.icon className={`size-4 ${kpi.color}`} />
                  </div>
                  <div className="mt-2 space-y-1">
                    <p className="text-2xl font-bold">{kpi.value}</p>
                    <span className="text-xs font-medium text-muted-foreground">{kpi.helper}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-7">
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
                          name === "receita" ? "Receita" : "Clientes",
                        ]}
                      />
                      <Area type="monotone" dataKey="clientes" stroke="hsl(var(--chart-1))" fill="url(#colorClientes)" strokeWidth={2} />
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
                    <BarChart data={data.invoiceStatusData} layout="vertical">
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

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Atividades Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              {data.recentActivities.length ? (
                <div className="space-y-3">
                  {data.recentActivities.map((activity, index) => (
                    <div key={`${activity.text}-${index}`} className="flex items-center gap-3 text-sm">
                      <div
                        className={`size-2 rounded-full shrink-0 ${
                          activity.type === "success"
                            ? "bg-success"
                            : activity.type === "warning"
                              ? "bg-warning"
                              : "bg-destructive"
                        }`}
                      />
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
        </>
      )}
    </div>
  );
}
