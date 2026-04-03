import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wifi, WifiOff, Signal, Router } from "lucide-react";

export function ConnectionStatus() {
  // In production this would poll OLT/RADIUS for real ONU status
  // For now we show contract/plan info as a proxy
  const { data: contract } = useQuery({
    queryKey: ["portal-connection-status"],
    queryFn: async () => {
      const { data } = await supabase
        .from("contracts")
        .select("status, plans(name, download_speed, upload_speed)")
        .eq("status", "active")
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  const isOnline = contract?.status === "active";
  const plan = contract?.plans as any;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Router className="size-4 text-primary" /> Status da Conexão
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          {isOnline ? (
            <div className="size-12 rounded-full bg-green-500/10 flex items-center justify-center">
              <Wifi className="size-6 text-green-500" />
            </div>
          ) : (
            <div className="size-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <WifiOff className="size-6 text-destructive" />
            </div>
          )}
          <div>
            <p className="font-semibold text-sm">
              {isOnline ? "Online" : "Offline / Sem contrato ativo"}
            </p>
            <Badge variant={isOnline ? "default" : "destructive"} className="mt-1">
              {isOnline ? "Conectado" : "Desconectado"}
            </Badge>
          </div>
        </div>

        {plan && (
          <div className="grid grid-cols-2 gap-3 pt-2 border-t">
            <div className="flex items-center gap-2">
              <Signal className="size-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Plano</p>
                <p className="text-sm font-medium">{plan.name}</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Velocidade</p>
              <p className="text-sm font-medium">
                {plan.download_speed}↓ / {plan.upload_speed}↑ Mbps
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
