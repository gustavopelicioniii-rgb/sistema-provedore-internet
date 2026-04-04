import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Activity, Clock, Users, Percent } from "lucide-react";
import { MotionCard } from "@/components/motion/MotionInteractions";
import { formatCurrency } from "@/utils/finance";
import type { FinanceiroData } from "@/hooks/useFinanceiroData";

interface Props {
  data: FinanceiroData;
}

export function FinancialHealthKpis({ data }: Props) {
  const metrics = useMemo(() => {
    const totalInvoices = data.recentInvoices.length;
    const paidInvoices = data.recentInvoices.filter((i) => i.status === "paid");
    const overdueInvoices = data.recentInvoices.filter((i) => i.status === "overdue");
    const pendingInvoices = data.recentInvoices.filter((i) => i.status === "pending");

    // MRR approximation - average of last 3 months paid
    const mrr = paidInvoices.length > 0
      ? paidInvoices.reduce((t, i) => t + i.amount, 0) / Math.max(1, Math.ceil(paidInvoices.length / 30) || 1)
      : 0;

    // Default rate
    const defaultRate = totalInvoices > 0
      ? (overdueInvoices.length / totalInvoices) * 100
      : 0;

    // Collection rate
    const collectionRate = totalInvoices > 0
      ? (paidInvoices.length / totalInvoices) * 100
      : 0;

    // Aging buckets
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const aging = { current: 0, days30: 0, days60: 0, days90plus: 0 };
    overdueInvoices.forEach((inv) => {
      const due = new Date(inv.dueDate + "T00:00:00");
      const diff = Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
      if (diff <= 30) aging.days30 += inv.amount;
      else if (diff <= 60) aging.days60 += inv.amount;
      else aging.days90plus += inv.amount;
    });
    pendingInvoices.forEach((inv) => { aging.current += inv.amount; });

    const totalOverdue = overdueInvoices.reduce((t, i) => t + i.amount, 0);
    const uniqueDefaulting = new Set(overdueInvoices.map((i) => i.customerName)).size;
    const uniqueActive = new Set(data.recentInvoices.map((i) => i.customerName)).size;

    return { mrr: data.receivedThisMonth, defaultRate, collectionRate, totalOverdue, aging, uniqueDefaulting, uniqueActive };
  }, [data]);

  return (
    <div className="space-y-4">
      {/* Advanced KPIs row */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        <MotionCard>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Activity className="size-4 text-primary" />
                <span className="text-xs font-medium text-muted-foreground uppercase">MRR</span>
              </div>
              <p className="text-2xl font-bold">{formatCurrency(metrics.mrr)}</p>
              <p className="text-xs text-muted-foreground">Receita recorrente mensal</p>
            </CardContent>
          </Card>
        </MotionCard>

        <MotionCard>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Percent className="size-4 text-destructive" />
                <span className="text-xs font-medium text-muted-foreground uppercase">Inadimplência</span>
              </div>
              <p className="text-2xl font-bold">{metrics.defaultRate.toFixed(1)}%</p>
              <p className="text-xs text-muted-foreground">{metrics.uniqueDefaulting} de {metrics.uniqueActive} clientes</p>
            </CardContent>
          </Card>
        </MotionCard>

        <MotionCard>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="size-4 text-success" />
                <span className="text-xs font-medium text-muted-foreground uppercase">Arrecadação</span>
              </div>
              <p className="text-2xl font-bold">{metrics.collectionRate.toFixed(1)}%</p>
              <p className="text-xs text-muted-foreground">Taxa de recebimento</p>
            </CardContent>
          </Card>
        </MotionCard>

        <MotionCard>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="size-4 text-warning" />
                <span className="text-xs font-medium text-muted-foreground uppercase">Total Vencido</span>
              </div>
              <p className="text-2xl font-bold">{formatCurrency(metrics.totalOverdue)}</p>
              <p className="text-xs text-muted-foreground">Em atraso</p>
            </CardContent>
          </Card>
        </MotionCard>
      </div>

      {/* Aging card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Aging de Faturas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "A vencer", value: metrics.aging.current, color: "bg-primary/10 text-primary" },
              { label: "1-30 dias", value: metrics.aging.days30, color: "bg-warning/10 text-warning" },
              { label: "31-60 dias", value: metrics.aging.days60, color: "bg-orange-500/10 text-orange-500" },
              { label: "60+ dias", value: metrics.aging.days90plus, color: "bg-destructive/10 text-destructive" },
            ].map((bucket) => (
              <div key={bucket.label} className={`rounded-lg p-3 ${bucket.color}`}>
                <p className="text-xs font-medium opacity-80">{bucket.label}</p>
                <p className="text-lg font-bold mt-1">{formatCurrency(bucket.value)}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
