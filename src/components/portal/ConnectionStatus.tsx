import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Wifi, WifiOff, Signal, Router, RefreshCw, Loader2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { usePortalApi } from "@/hooks/usePortalApi";

interface OnuStatus {
  online: boolean;
  signal?: string;
  uptime?: string;
  error?: string;
}

interface ConnectionData {
  status: string;
  authentication: Record<string, string> | null;
  plans: { name: string; download_speed: number; upload_speed: number } | null;
}

export function ConnectionStatus() {
  const { toast } = useToast();
  const { portalFetch } = usePortalApi();
  const [onuStatus, setOnuStatus] = useState<OnuStatus | null>(null);
  const [checkingOnu, setCheckingOnu] = useState(false);

  const { data: contract } = useQuery({
    queryKey: ["portal-connection-status"],
    queryFn: () => portalFetch<ConnectionData | null>("connection"),
  });

  const isOnline = contract?.status === "active";
  const plan = contract?.plans;
  const auth = contract?.authentication;

  const handleCheckOnu = async () => {
    setCheckingOnu(true);
    try {
      const onuId = auth?.onu_id || auth?.serial_number;
      if (!onuId) {
        setOnuStatus({ online: false, error: "ONU não vinculada ao contrato" });
        return;
      }
      // ONU check would require a dedicated portal endpoint
      setOnuStatus({ online: false, error: "Verificação de ONU via portal em implementação" });
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
