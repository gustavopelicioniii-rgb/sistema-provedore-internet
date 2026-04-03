import { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Gauge, Download, Upload, Clock } from "lucide-react";

interface SpeedResult {
  download: number;
  upload: number;
  latency: number;
}

export function SpeedTest() {
  const [testing, setTesting] = useState(false);
  const [phase, setPhase] = useState<"idle" | "latency" | "download" | "upload" | "done">("idle");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<SpeedResult | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const runTest = useCallback(async () => {
    setTesting(true);
    setResult(null);
    abortRef.current = new AbortController();
    const signal = abortRef.current.signal;

    try {
      // Latency test
      setPhase("latency");
      setProgress(10);
      const latencies: number[] = [];
      for (let i = 0; i < 5; i++) {
        if (signal.aborted) return;
        const t0 = performance.now();
        await fetch("https://www.google.com/generate_204", { mode: "no-cors", signal });
        latencies.push(performance.now() - t0);
      }
      const latency = Math.round(latencies.sort((a, b) => a - b)[2]); // median

      // Download test (fetch random data)
      setPhase("download");
      setProgress(30);
      const dlSize = 5 * 1024 * 1024; // 5MB
      const dlStart = performance.now();
      const dlResp = await fetch(`https://speed.cloudflare.com/__down?bytes=${dlSize}`, { signal });
      const dlBlob = await dlResp.blob();
      const dlTime = (performance.now() - dlStart) / 1000;
      const downloadMbps = Math.round(((dlBlob.size * 8) / dlTime / 1_000_000) * 100) / 100;
      setProgress(60);

      // Upload test (send random data)
      setPhase("upload");
      setProgress(70);
      const ulSize = 2 * 1024 * 1024; // 2MB
      const ulData = new Blob([new ArrayBuffer(ulSize)]);
      const ulStart = performance.now();
      await fetch("https://speed.cloudflare.com/__up", {
        method: "POST",
        body: ulData,
        signal,
      });
      const ulTime = (performance.now() - ulStart) / 1000;
      const uploadMbps = Math.round(((ulSize * 8) / ulTime / 1_000_000) * 100) / 100;
      setProgress(100);

      setResult({ download: downloadMbps, upload: uploadMbps, latency });
      setPhase("done");
    } catch {
      // aborted or network error
    } finally {
      setTesting(false);
    }
  }, []);

  const cancel = () => {
    abortRef.current?.abort();
    setTesting(false);
    setPhase("idle");
    setProgress(0);
  };

  const phaseLabel: Record<string, string> = {
    latency: "Medindo latência...",
    download: "Testando download...",
    upload: "Testando upload...",
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Gauge className="size-4 text-primary" /> Teste de Velocidade
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {phase !== "idle" && phase !== "done" && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{phaseLabel[phase]}</p>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {result && (
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="space-y-1">
              <Download className="size-5 mx-auto text-green-500" />
              <p className="text-2xl font-bold">{result.download}</p>
              <p className="text-xs text-muted-foreground">Mbps ↓</p>
            </div>
            <div className="space-y-1">
              <Upload className="size-5 mx-auto text-blue-500" />
              <p className="text-2xl font-bold">{result.upload}</p>
              <p className="text-xs text-muted-foreground">Mbps ↑</p>
            </div>
            <div className="space-y-1">
              <Clock className="size-5 mx-auto text-orange-500" />
              <p className="text-2xl font-bold">{result.latency}</p>
              <p className="text-xs text-muted-foreground">ms</p>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button onClick={runTest} disabled={testing} className="flex-1">
            {testing ? "Testando..." : result ? "Testar Novamente" : "Iniciar Teste"}
          </Button>
          {testing && (
            <Button variant="outline" onClick={cancel}>
              Cancelar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
