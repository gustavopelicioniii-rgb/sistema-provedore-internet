import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Activity, Info } from "lucide-react";
import { usePortalApi } from "@/hooks/usePortalApi";

function bytesToGB(bytes: number): number {
  return Math.round((bytes / (1024 * 1024 * 1024)) * 100) / 100;
}

function getMonthLabel(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }).replace(".", "");
}

interface TrafficData {
  period_start: string;
  download_bytes: number;
  upload_bytes: number;
}

export function UsageHistory() {
  const { portalFetch } = usePortalApi();

  const { data: usageData, isLoading } = useQuery({
    queryKey: ["portal-traffic-usage"],
    queryFn: () => portalFetch<TrafficData[]>("traffic"),
  });

  const chartData = (() => {
    if (!usageData?.length) return null;
    const byMonth: Record<string, { download: number; upload: number }> = {};
    for (const row of usageData) {
      const label = getMonthLabel(row.period_start);
      if (!byMonth[label]) byMonth[label] = { download: 0, upload: 0 };
      byMonth[label].download += row.download_bytes;
      byMonth[label].upload += row.upload_bytes;
    }
    return Object.entries(byMonth).map(([month, vals]) => ({
      month,
      download: bytesToGB(vals.download),
      upload: bytesToGB(vals.upload),
    }));
  })();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="size-4 text-primary" /> Histórico de Consumo
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">Carregando...</div>
        ) : !chartData ? (
          <div className="text-center py-8 space-y-2">
            <Info className="size-8 mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Sem dados de consumo disponíveis.</p>
            <p className="text-xs text-muted-foreground">Os dados de tráfego são coletados automaticamente.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="month" className="text-xs" />
              <YAxis className="text-xs" unit=" GB" />
              <Tooltip
                contentStyle={{ borderRadius: 8, fontSize: 12 }}
                formatter={(val: number, name: string) => [`${val} GB`, name === "download" ? "Download" : "Upload"]}
              />
              <Legend formatter={(val) => (val === "download" ? "Download" : "Upload")} />
              <Bar dataKey="download" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="upload" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
