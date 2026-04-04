import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Clock, AlertTriangle, CheckCircle } from "lucide-react";
import { useSlaConfigs, type SlaConfig } from "@/hooks/useSlaConfigs";

interface SlaIndicatorProps {
  priority: string;
  createdAt: string;
  firstResponseAt?: string | null;
  resolvedAt?: string | null;
  slaBreach?: boolean;
}

export function SlaIndicator({ priority, createdAt, firstResponseAt, resolvedAt, slaBreach }: SlaIndicatorProps) {
  const { data: configs } = useSlaConfigs();

  const slaStatus = useMemo(() => {
    if (!configs?.length) return null;
    const config = configs.find((c) => c.priority === priority);
    if (!config) return null;

    const created = new Date(createdAt).getTime();
    const now = Date.now();
    const elapsedMin = (now - created) / 60000;

    const responseElapsed = firstResponseAt
      ? (new Date(firstResponseAt).getTime() - created) / 60000
      : elapsedMin;

    const resolutionElapsed = resolvedAt
      ? (new Date(resolvedAt).getTime() - created) / 60000
      : elapsedMin;

    const responsePct = (responseElapsed / config.max_response_minutes) * 100;
    const resolutionPct = (resolutionElapsed / config.max_resolution_minutes) * 100;

    const isResponseBreached = responseElapsed > config.max_response_minutes && !firstResponseAt;
    const isResolutionBreached = resolutionElapsed > config.max_resolution_minutes && !resolvedAt;
    const isWarning = !isResponseBreached && !isResolutionBreached && (responsePct > 75 || resolutionPct > 75);

    return {
      isResponseBreached,
      isResolutionBreached,
      isBreach: isResponseBreached || isResolutionBreached || slaBreach,
      isWarning,
      responseRemaining: Math.max(0, config.max_response_minutes - responseElapsed),
      resolutionRemaining: Math.max(0, config.max_resolution_minutes - resolutionElapsed),
      config,
    };
  }, [configs, priority, createdAt, firstResponseAt, resolvedAt, slaBreach]);

  if (!slaStatus) return null;

  const formatMinutes = (min: number) => {
    if (min < 60) return `${Math.round(min)}min`;
    const h = Math.floor(min / 60);
    const m = Math.round(min % 60);
    return m > 0 ? `${h}h${m}min` : `${h}h`;
  };

  if (resolvedAt && !slaStatus.isBreach) {
    return (
      <Tooltip>
        <TooltipTrigger>
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] gap-1">
            <CheckCircle className="size-2.5" /> SLA OK
          </Badge>
        </TooltipTrigger>
        <TooltipContent>Resolvido dentro do SLA</TooltipContent>
      </Tooltip>
    );
  }

  if (slaStatus.isBreach) {
    return (
      <Tooltip>
        <TooltipTrigger>
          <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 text-[10px] gap-1 animate-pulse">
            <AlertTriangle className="size-2.5" /> SLA Estourado
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          {slaStatus.isResponseBreached && <p>Resposta: limite de {slaStatus.config.max_response_minutes}min excedido</p>}
          {slaStatus.isResolutionBreached && <p>Resolução: limite de {slaStatus.config.max_resolution_minutes}min excedido</p>}
        </TooltipContent>
      </Tooltip>
    );
  }

  if (slaStatus.isWarning) {
    return (
      <Tooltip>
        <TooltipTrigger>
          <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px] gap-1">
            <Clock className="size-2.5" /> {formatMinutes(Math.min(slaStatus.responseRemaining, slaStatus.resolutionRemaining))}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>Resposta: {formatMinutes(slaStatus.responseRemaining)} restantes</p>
          <p>Resolução: {formatMinutes(slaStatus.resolutionRemaining)} restantes</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger>
        <Badge variant="outline" className="bg-muted text-muted-foreground text-[10px] gap-1">
          <Clock className="size-2.5" /> {formatMinutes(Math.min(slaStatus.responseRemaining, slaStatus.resolutionRemaining))}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        <p>Resposta: {formatMinutes(slaStatus.responseRemaining)} restantes</p>
        <p>Resolução: {formatMinutes(slaStatus.resolutionRemaining)} restantes</p>
      </TooltipContent>
    </Tooltip>
  );
}
