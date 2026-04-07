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

// Use multiple parallel streams to saturate the connection, like speedtest.net
const PARALLEL_STREAMS = 6;
const TEST_DURATION_MS = 8000; // 8 seconds per phase

async function measureLatency(signal: AbortSignal): Promise<number> {
  const pings: number[] = [];
  for (let i = 0; i < 10; i++) {
    if (signal.aborted) throw new DOMException("Aborted", "AbortError");
    const t0 = performance.now();
    await fetch(`https://speed.cloudflare.com/__down?bytes=0&r=${Math.random()}`, {
      signal,
      cache: "no-store",
    });
    pings.push(performance.now() - t0);
  }
  pings.sort((a, b) => a - b);
  // Use median of middle values for stability
  return Math.round(pings[Math.floor(pings.length / 2)]);
}

async function measureDownload(
  signal: AbortSignal,
  onProgress: (mbps: number) => void
): Promise<number> {
  let totalBytes = 0;
  const startTime = performance.now();
  const chunkSize = 25 * 1024 * 1024; // 25MB chunks
  let running = true;

  const downloadStream = async () => {
    while (running && !signal.aborted) {
      try {
        const resp = await fetch(
          `https://speed.cloudflare.com/__down?bytes=${chunkSize}&r=${Math.random()}`,
          { signal, cache: "no-store" }
        );
        const reader = resp.body?.getReader();
        if (!reader) break;
        while (running) {
          const { done, value } = await reader.read();
          if (done) break;
          totalBytes += value.byteLength;
          const elapsed = (performance.now() - startTime) / 1000;
          if (elapsed > 0.5) {
            onProgress(Math.round(((totalBytes * 8) / elapsed / 1_000_000) * 100) / 100);
          }
          if (performance.now() - startTime > TEST_DURATION_MS) {
            running = false;
            reader.cancel();
            break;
          }
        }
      } catch {
        if (signal.aborted) break;
      }
    }
  };

  const streams = Array.from({ length: PARALLEL_STREAMS }, () => downloadStream());
  await Promise.allSettled(streams);

  const elapsed = (performance.now() - startTime) / 1000;
  return Math.round(((totalBytes * 8) / elapsed / 1_000_000) * 100) / 100;
}

async function measureUpload(
  signal: AbortSignal,
  onProgress: (mbps: number) => void
): Promise<number> {
  let totalBytes = 0;
  const startTime = performance.now();
  const chunkSize = 2 * 1024 * 1024; // 2MB per request
  let running = true;

  // Pre-generate upload payload (reused across streams)
  const payload = new Uint8Array(chunkSize);

  const uploadStream = async () => {
    while (running && !signal.aborted) {
      try {
        await fetch(`https://speed.cloudflare.com/__up?r=${Math.random()}`, {
          method: "POST",
          body: payload,
          signal,
        });
        totalBytes += chunkSize;
        const elapsed = (performance.now() - startTime) / 1000;
        if (elapsed > 0.5) {
          onProgress(Math.round(((totalBytes * 8) / elapsed / 1_000_000) * 100) / 100);
        }
        if (performance.now() - startTime > TEST_DURATION_MS) {
          running = false;
          break;
        }
      } catch {
        if (signal.aborted) break;
      }
    }
  };

  const streams = Array.from({ length: PARALLEL_STREAMS }, () => uploadStream());
  await Promise.allSettled(streams);

  const elapsed = (performance.now() - startTime) / 1000;
  return Math.round(((totalBytes * 8) / elapsed / 1_000_000) * 100) / 100;
}

export function SpeedTest() {
  const [testing, setTesting] = useState(false);
  const [phase, setPhase] = useState<"idle" | "latency" | "download" | "upload" | "done">("idle");
  const [progress, setProgress] = useState(0);
  const [liveSpeed, setLiveSpeed] = useState(0);
  const [result, setResult] = useState<SpeedResult | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const runTest = useCallback(async () => {
    setTesting(true);
    setResult(null);
    setLiveSpeed(0);
    abortRef.current = new AbortController();
    const signal = abortRef.current.signal;

    try {
      // Latency
      setPhase("latency");
      setProgress(5);
      const latency = await measureLatency(signal);
      setProgress(15);

      // Download
      setPhase("download");
      setLiveSpeed(0);
      const dlStart = Date.now();
      const downloadMbps = await measureDownload(signal, (mbps) => {
        setLiveSpeed(mbps);
        const elapsed = Date.now() - dlStart;
        setProgress(15 + Math.min(40, (elapsed / TEST_DURATION_MS) * 40));
      });
      setProgress(55);

      // Upload
      setPhase("upload");
      setLiveSpeed(0);
      const ulStart = Date.now();
      const uploadMbps = await measureUpload(signal, (mbps) => {
        setLiveSpeed(mbps);
        const elapsed = Date.now() - ulStart;
        setProgress(55 + Math.min(40, (elapsed / TEST_DURATION_MS) * 40));
      });
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
    setLiveSpeed(0);
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
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{phaseLabel[phase]}</p>
              {(phase === "download" || phase === "upload") && liveSpeed > 0 && (
                <p className="text-sm font-semibold text-primary">{liveSpeed} Mbps</p>
              )}
            </div>
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
