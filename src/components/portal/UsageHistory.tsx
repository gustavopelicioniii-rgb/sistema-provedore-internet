import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Activity, Info } from "lucide-react";

function bytesToGB(bytes: number): number {
  return Math.round((bytes / (1024 * 1024 * 1024)) * 100) / 100;
}

function getMonthLabel(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }).replace(".", "");
}

export function UsageHistory() {
  const { data: usageData, isLoading } = useQuery({
    queryKey: ["portal-traffic-usage"],
    queryFn: async () => {
      // Query real traffic data from last 6 months
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      sixMonthsAgo.setDate(1);
      sixMonthsAgo.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from("traffic_usage")
        .select("period_start, download_bytes, upload_bytes")
        .gte("period_start", sixMonthsAgo.toISOString())
        .order("period_start", { ascending: true });

      if (error) throw error;
      return data ?? [];
    },
  });

  // Aggregate by month
  const chartData = (() => {
    if (!usageData?.length) return null;

    const monthMap = new Map<string, { download: number; upload: number }>();

    usageData.forEach((row) => {
      const key = getMonthLabel(row.period_start);
      const existing = monthMap.get(key) || { download: 0, upload: 0 };
      existing.download += row.download_bytes;
      existing.upload += row.upload_bytes;
      monthMap.set(key, existing);
    });

    return Array.from(monthMap.entries()).map(([month, vals]) => ({
      month,
      download: bytesToGB(vals.download),
      upload: bytesToGB(vals.upload),
    }));
  })();

  // Fallback simulated data when no real data exists
  const fallbackData = (() => {
    const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"];
    return months.map((month) => ({
      month,
      download: Math.round(50 + Math.random() * 200),
      upload: Math.round(10 + Math.random() * 60),
    }));
  })();

  const displayData = chartData ?? fallbackData;
  const isRealData = !!chartData;

  const totalDownload = displayData.reduce((s, d) => s + d.download, 0);
  const totalUpload = displayData.reduce((s, d) => s + d.upload, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="size-4 text-primary" /> Histórico de Consumo
          </CardTitle>
          {!isRealData && (
            <Badge variant="outline" className="text-xs gap-1">
              <Info className="size-3" /> Dados simulados
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border p-3 text-center">
            <p className="text-xs text-muted-foreground">Total Download</p>
            <p className="text-lg font-bold">{totalDownload.toFixed(1)} GB</p>
          </div>
          <div className="rounded-lg border p-3 text-center">
            <p className="text-xs text-muted-foreground">Total Upload</p>
            <p className="text-lg font-bold">{totalUpload.toFixed(1)} GB</p>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Tráfego mensal {isRealData ? "(RADIUS/NetFlow)" : "estimado"} (GB)
        </p>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={displayData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="month"
                className="text-xs"
                tick={{ fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis
                className="text-xs"
                tick={{ fill: "hsl(var(--muted-foreground))" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  color: "hsl(var(--foreground))",
                }}
                formatter={(value: number, name: string) => [
                  `${value.toFixed(2)} GB`,
                  name === "download" ? "Download" : "Upload",
                ]}
              />
              <Legend formatter={(v) => (v === "download" ? "Download" : "Upload")} />
              <Bar dataKey="download" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="upload" fill="hsl(var(--primary) / 0.5)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {!isRealData && (
          <p className="text-xs text-muted-foreground text-center italic">
            Os dados reais serão exibidos quando houver coleta via RADIUS ou NetFlow configurada.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
