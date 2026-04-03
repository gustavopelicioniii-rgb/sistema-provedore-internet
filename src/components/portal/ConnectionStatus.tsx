import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Wifi, WifiOff, Signal, Router, RefreshCw, Loader2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface OnuStatus {
  online: boolean;
  signal?: string;
  uptime?: string;
  error?: string;
}

export function ConnectionStatus() {
  const { toast } = useToast();
  const [onuStatus, setOnuStatus] = useState<OnuStatus | null>(null);
  const [checkingOnu, setCheckingOnu] = useState(false);

  const { data: contract } = useQuery({
    queryKey: ["portal-connection-status"],
    queryFn: async () => {
      const { data } = await supabase
        .from("contracts")
        .select("status, plans(name, download_speed, upload_speed), authentication")
        .eq("status", "active")
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  const isOnline = contract?.status === "active";
  const plan = contract?.plans as any;
  const auth = contract?.authentication as any;

  const handleCheckOnu = async () => {
    setCheckingOnu(true);
    try {
      // Find an OLT device to query
      const { data: devices } = await supabase
        .from("network_devices")
        .select("id")
        .eq("device_type", "olt")
        .eq("status", "online")
        .limit(1);

      if (!devices?.length) {
        setOnuStatus({ online: false, error: "Nenhuma OLT online encontrada" });
        return;
      }

      const { data: session } = await supabase.auth.getSession();
      const onuId = auth?.onu_id || auth?.serial_number;

      if (!onuId) {
        setOnuStatus({ online: false, error: "ONU não vinculada ao contrato" });
        return;
      }

      const resp = await supabase.functions.invoke("olt-api", {
        body: {
          action: "get_onu_signal",
          params: { device_id: devices[0].id, onu_id: onuId },
        },
        headers: { Authorization: `Bearer ${session.session?.access_token}` },
      });

      if (resp.error) {
        // OLT relay not configured - show helpful message
        setOnuStatus({ online: false, error: "Agente SNMP/TL1 não configurado" });
      } else {
        const signalData = resp.data?.data;
        setOnuStatus({
          online: true,
          signal: signalData?.rx_power || signalData?.signal || "OK",
          uptime: signalData?.uptime,
        });
      }
    } catch (e: any) {
      setOnuStatus({ online: false, error: e.message || "Erro ao consultar ONU" });
    } finally {
      setCheckingOnu(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Router className="size-4 text-primary" /> Status da Conexão
          </CardTitle>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs gap-1"
            onClick={handleCheckOnu}
            disabled={checkingOnu}
          >
            {checkingOnu ? <Loader2 className="size-3 animate-spin" /> : <RefreshCw className="size-3" />}
            Verificar ONU
          </Button>
        </div>
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

        {/* ONU Status Result */}
        {onuStatus && (
          <div className="rounded-lg border p-3 space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Status da ONU</p>
            {onuStatus.error ? (
              <p className="text-xs text-destructive">{onuStatus.error}</p>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <Badge variant={onuStatus.online ? "default" : "destructive"}>
                    {onuStatus.online ? "Online" : "Offline"}
                  </Badge>
                  {onuStatus.signal && (
                    <span className="text-xs text-muted-foreground">Sinal: {onuStatus.signal}</span>
                  )}
                </div>
                {onuStatus.uptime && (
                  <p className="text-xs text-muted-foreground">Uptime: {onuStatus.uptime}</p>
                )}
              </>
            )}
          </div>
        )}

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
