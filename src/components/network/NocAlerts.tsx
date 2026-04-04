import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, WifiOff, AlertTriangle, CheckCircle, Clock } from "lucide-react";

const typeIcons: Record<string, React.ElementType> = {
  device_offline: WifiOff,
  billing_rule: AlertTriangle,
  billing_rule_suspend: AlertTriangle,
  invoice_due: Clock,
};

const typeColors: Record<string, string> = {
  error: "text-destructive",
  warning: "text-warning",
  info: "text-primary",
};

export function NocAlerts() {
  const { data: alerts } = useQuery({
    queryKey: ["noc-alerts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notification_alerts")
        .select("id, title, description, type, reference_type, created_at, read")
        .in("reference_type", ["device_offline", "device_warning", "billing_rule_suspend"])
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data ?? [];
    },
    refetchInterval: 30000, // Refresh every 30s
  });

  if (!alerts?.length) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="size-4" /> Alertas Recentes
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            {alerts.filter((a) => !a.read).length} não lidos
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[200px]">
          <div className="space-y-2">
            {alerts.map((alert) => {
              const Icon = typeIcons[alert.reference_type || ""] || AlertTriangle;
              const color = typeColors[alert.type] || "text-muted-foreground";
              return (
                <div key={alert.id} className={`flex items-start gap-3 p-2 rounded-lg border ${!alert.read ? "bg-muted/50" : ""}`}>
                  <Icon className={`size-4 mt-0.5 shrink-0 ${color}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{alert.title}</p>
                    {alert.description && (
                      <p className="text-xs text-muted-foreground truncate">{alert.description}</p>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                    {new Date(alert.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
