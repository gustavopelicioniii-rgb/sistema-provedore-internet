import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, AlertTriangle, CalendarClock, CheckCircle2 } from "lucide-react";

interface Notification {
  id: string;
  type: "warning" | "info" | "success";
  title: string;
  description: string;
  date: string;
}

export function PortalNotifications() {
  const { data: notifications = [] } = useQuery({
    queryKey: ["portal-notifications"],
    queryFn: async () => {
      const alerts: Notification[] = [];

      // Check for upcoming invoices (due in next 7 days)
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      const { data: upcomingInvoices } = await supabase
        .from("invoices")
        .select("id, amount, due_date")
        .eq("status", "pending")
        .lte("due_date", nextWeek.toISOString().slice(0, 10))
        .gte("due_date", new Date().toISOString().slice(0, 10))
        .order("due_date")
        .limit(5);

      upcomingInvoices?.forEach((inv) => {
        alerts.push({
          id: `inv-${inv.id}`,
          type: "warning",
          title: "Fatura próxima do vencimento",
          description: `Fatura de R$ ${inv.amount.toFixed(2)} vence em ${new Date(inv.due_date + "T12:00:00").toLocaleDateString("pt-BR")}`,
          date: inv.due_date,
        });
      });

      // Check for overdue invoices
      const { data: overdueInvoices } = await supabase
        .from("invoices")
        .select("id, amount, due_date")
        .eq("status", "overdue")
        .order("due_date", { ascending: false })
        .limit(3);

      overdueInvoices?.forEach((inv) => {
        alerts.push({
          id: `overdue-${inv.id}`,
          type: "warning",
          title: "Fatura vencida",
          description: `Fatura de R$ ${inv.amount.toFixed(2)} venceu em ${new Date(inv.due_date + "T12:00:00").toLocaleDateString("pt-BR")}`,
          date: inv.due_date,
        });
      });

      // Check for open service orders (planned maintenance proxy)
      const { data: serviceOrders } = await supabase
        .from("service_orders")
        .select("id, type, scheduled_date")
        .in("status", ["open", "in_progress"])
        .order("scheduled_date")
        .limit(3);

      serviceOrders?.forEach((so) => {
        alerts.push({
          id: `so-${so.id}`,
          type: "info",
          title: "Manutenção programada",
          description: `Ordem de serviço (${so.type === "maintenance" ? "Manutenção" : so.type === "installation" ? "Instalação" : "Visita técnica"}) ${so.scheduled_date ? `agendada para ${new Date(so.scheduled_date + "T12:00:00").toLocaleDateString("pt-BR")}` : "em aberto"}`,
          date: so.scheduled_date ?? new Date().toISOString().slice(0, 10),
        });
      });

      // Check for recently resolved tickets
      const { data: resolvedTickets } = await supabase
        .from("tickets")
        .select("id, subject, resolved_at")
        .eq("status", "resolved")
        .order("resolved_at", { ascending: false })
        .limit(2);

      resolvedTickets?.forEach((t) => {
        alerts.push({
          id: `ticket-${t.id}`,
          type: "success",
          title: "Chamado resolvido",
          description: t.subject,
          date: t.resolved_at ?? new Date().toISOString().slice(0, 10),
        });
      });

      return alerts;
    },
  });

  const iconMap = {
    warning: <AlertTriangle className="size-4 text-yellow-500" />,
    info: <CalendarClock className="size-4 text-blue-500" />,
    success: <CheckCircle2 className="size-4 text-green-500" />,
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Bell className="size-4 text-primary" /> Notificações
          {notifications.length > 0 && (
            <Badge variant="secondary" className="ml-auto text-xs">
              {notifications.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {notifications.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhuma notificação no momento.
          </p>
        ) : (
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {notifications.map((n) => (
              <div key={n.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="mt-0.5">{iconMap[n.type]}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-tight">{n.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{n.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
