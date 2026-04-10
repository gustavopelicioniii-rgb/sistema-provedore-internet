import { useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MapPin, Wifi, Search, Zap, Phone, Mail, User, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/utils/finance";
import { toast } from "sonner";

const markerColors: Record<string, string> = {
  cto: "#6366f1",
  ceo: "#10b981",
  splitter: "#f59e0b",
  pop: "#ef4444",
};

const coverageRadius: Record<string, number> = {
  cto: 300,
  ceo: 500,
  splitter: 200,
  pop: 1000,
};

function createIcon(type: string, status: string) {
  const color = status === "inactive" ? "#94a3b8" : (markerColors[type] ?? "#94a3b8");
  const letter = type === "pop" ? "P" : type === "ceo" ? "E" : type === "cto" ? "C" : "S";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="40" viewBox="0 0 28 40">
    <path d="M14 0C6.27 0 0 6.27 0 14c0 10.5 14 26 14 26s14-15.5 14-26C28 6.27 21.73 0 14 0z" fill="${color}" stroke="#fff" stroke-width="1.5"/>
    <circle cx="14" cy="14" r="6" fill="#fff"/>
    <text x="14" y="17" text-anchor="middle" font-size="9" font-weight="bold" fill="${color}">${letter}</text>
  </svg>`;
  return L.divIcon({ html: svg, className: "", iconSize: [28, 40], iconAnchor: [14, 40], popupAnchor: [0, -40] });
}

const typeLabels: Record<string, string> = {
  cto: "CTO",
  ceo: "CEO",
  splitter: "Splitter",
  pop: "POP",
};

const statusLabels: Record<string, string> = {
  active: "Ativo",
  full: "Lotado",
  inactive: "Inativo",
};

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Lead capture form component
function LeadCaptureForm({ orgId, orgName }: { orgId: string; orgName: string }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim() || !phone.trim()) {
      toast.error("Preencha nome e telefone.");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.rpc("create_public_lead", {
        p_org_id: orgId,
        p_name: name.trim(),
        p_phone: phone.trim(),
        p_email: email.trim() || null,
        p_notes: message.trim() || `Contato via mapa de cobertura - ${orgName}`,
      });
      if (error) throw error;
      setSubmitted(true);
      toast.success("Solicitação enviada com sucesso!");
    } catch {
      toast.error("Erro ao enviar. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Card className="border-emerald-500/30 bg-emerald-500/5">
        <CardContent className="p-6 text-center space-y-2">
          <div className="flex size-12 items-center justify-center rounded-full bg-emerald-500/10 mx-auto">
            <Send className="size-5 text-emerald-500" />
          </div>
          <p className="font-semibold text-emerald-700 dark:text-emerald-400">Solicitação enviada!</p>
          <p className="text-sm text-muted-foreground">Entraremos em contato em breve.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Phone className="size-4" /> Quero Contratar
        </CardTitle>
        <CardDescription>Preencha seus dados e entraremos em contato</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Nome *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome completo" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Telefone / WhatsApp *</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(00) 00000-0000" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">E-mail</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" type="email" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Mensagem (opcional)</Label>
          <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Gostaria de saber mais sobre..." rows={2} />
        </div>
        <Button onClick={handleSubmit} disabled={submitting} className="w-full">
          {submitting ? "Enviando..." : "Solicitar Contato"}
        </Button>
      </CardContent>
    </Card>
  );
}

export default function Cobertura() {
  const { slug } = useParams<{ slug: string }>();
  const [checkResult, setCheckResult] = useState<{ viable: boolean; distance: number; nodeName: string } | null>(null);
  const [searching, setSearching] = useState(false);
  const [addressInput, setAddressInput] = useState("");

  const { data: org, isLoading: orgLoading } = useQuery({
    queryKey: ["public-org", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc("get_org_public_info", { p_slug: slug! });
      if (error) throw error;
      if (!data || data.length === 0) throw new Error("Organização não encontrada");
      return data[0] as { id: string; name: string; logo_url: string | null };
    },
    enabled: !!slug,
  });

  const { data: nodes = [], isLoading: nodesLoading } = useQuery({
    queryKey: ["public-ftth-nodes", org?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc("get_coverage_nodes", { p_org_id: org!.id });
      if (error) throw error;
      // Filter active/full on client side
      return (data ?? []).filter((n: any) => n.status === "active" || n.status === "full");
    },
    enabled: !!org?.id,
  });

  // Fetch plans for this org (public)
  const { data: plans = [] } = useQuery({
    queryKey: ["public-plans", org?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc("get_public_plans", { p_org_id: org!.id });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!org?.id,
  });

  const center = useMemo<[number, number]>(() => {
    if (nodes.length === 0) return [-23.55, -46.63];
    const avgLat = nodes.reduce((s, n) => s + n.lat, 0) / nodes.length;
    const avgLng = nodes.reduce((s, n) => s + n.lng, 0) / nodes.length;
    return [avgLat, avgLng];
  }, [nodes]);

  const handleCheckViability = async () => {
    if (!addressInput.trim() || nodes.length === 0) return;
    setSearching(true);
    setCheckResult(null);

    try {
      const resp = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressInput)}&limit=1`
      );
      const results = await resp.json();

      if (!results.length) {
        setCheckResult({ viable: false, distance: -1, nodeName: "" });
        setSearching(false);
        return;
      }

      const lat = parseFloat(results[0].lat);
      const lng = parseFloat(results[0].lon);

      let minDist = Infinity;
      let closest = nodes[0];
      for (const node of nodes) {
        const d = haversineDistance(lat, lng, node.lat, node.lng);
        if (d < minDist) {
          minDist = d;
          closest = node;
        }
      }

      const distMeters = Math.round(minDist * 1000);
      setCheckResult({
        viable: distMeters <= 500,
        distance: distMeters,
        nodeName: closest.name,
      });
    } catch {
      setCheckResult({ viable: false, distance: -1, nodeName: "" });
    } finally {
      setSearching(false);
    }
  };

  if (orgLoading || nodesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Spinner className="size-8" />
      </div>
    );
  }

  if (!org) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
        <MapPin className="size-16 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold">Provedor não encontrado</h1>
        <p className="text-muted-foreground mt-2">Verifique o endereço e tente novamente.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b bg-card px-4 py-4">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          {org.logo_url && (
            <img src={org.logo_url} alt={org.name} className="h-10 w-10 rounded-lg object-cover" />
          )}
          <div>
            <h1 className="text-xl font-bold">{org.name}</h1>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Wifi className="size-3" /> Mapa de Cobertura
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 space-y-6">
        {/* Plans section */}
        {plans.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Zap className="size-4" /> Planos Disponíveis
            </h2>
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {plans.map((plan) => (
                <Card key={plan.id} className="relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-primary" />
                  <CardContent className="p-4 space-y-2">
                    <p className="font-bold text-base">{plan.name}</p>
                    <p className="text-2xl font-extrabold text-primary">
                      {formatCurrency(plan.price)}
                      <span className="text-xs font-normal text-muted-foreground">/mês</span>
                    </p>
                    <div className="text-xs text-muted-foreground space-y-0.5">
                      <p>⬇️ Download: <strong>{plan.download_speed} Mbps</strong></p>
                      <p>⬆️ Upload: <strong>{plan.upload_speed} Mbps</strong></p>
                      <p>📡 Tecnologia: <strong>{plan.technology === "fiber" ? "Fibra Óptica" : plan.technology}</strong></p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Viability check */}
        <Card>
          <CardContent className="p-4">
            <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
              <Search className="size-4" /> Verificar Viabilidade
            </h2>
            <div className="flex gap-2">
              <Input
                placeholder="Digite seu endereço completo..."
                value={addressInput}
                onChange={(e) => setAddressInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCheckViability()}
                className="flex-1"
              />
              <Button onClick={handleCheckViability} disabled={searching || !addressInput.trim()}>
                {searching ? "Buscando..." : "Verificar"}
              </Button>
            </div>

            {checkResult && (
              <div className="mt-3">
                {checkResult.distance === -1 ? (
                  <Badge variant="outline" className="bg-muted text-muted-foreground">
                    Endereço não encontrado. Tente ser mais específico.
                  </Badge>
                ) : checkResult.viable ? (
                  <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                      ✅ Viável! Ponto mais próximo: <strong>{checkResult.nodeName}</strong> ({checkResult.distance}m)
                    </p>
                  </div>
                ) : (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                    <p className="text-sm font-medium text-destructive">
                      ❌ Fora da área de cobertura. Distância ao ponto mais próximo: {checkResult.distance}m
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Map with coverage circles */}
        <Card>
          <CardContent className="p-0 overflow-hidden rounded-lg">
            <MapContainer center={center} zoom={14} scrollWheelZoom style={{ height: "500px", width: "100%" }} className="z-0">
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {nodes.map((node) => {
                const pct = node.capacity > 0 ? Math.round((node.used / node.capacity) * 100) : 0;
                const color = node.status === "inactive" ? "#94a3b8" : (markerColors[node.node_type] ?? "#94a3b8");
                const radius = coverageRadius[node.node_type] ?? 300;
                return (
                  <span key={node.id}>
                    <Circle
                      center={[node.lat, node.lng]}
                      radius={radius}
                      pathOptions={{
                        color,
                        fillColor: color,
                        fillOpacity: 0.08,
                        weight: 1,
                        opacity: 0.3,
                      }}
                    />
                    <Marker position={[node.lat, node.lng]} icon={createIcon(node.node_type, node.status)}>
                      <Popup>
                        <div className="min-w-[160px]">
                          <p className="font-bold text-sm mb-1">{node.name}</p>
                          {(node as any).address && <p className="text-xs text-gray-500 mb-2">{(node as any).address}</p>}
                          <div className="text-xs space-y-0.5">
                            <p><strong>Tipo:</strong> {typeLabels[node.node_type] ?? node.node_type}</p>
                            <p><strong>Status:</strong> {statusLabels[node.status] ?? node.status}</p>
                            <p><strong>Ocupação:</strong> {pct}%</p>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-gray-200 mt-2 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${pct >= 90 ? "bg-red-500" : pct >= 60 ? "bg-amber-500" : "bg-emerald-500"}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  </span>
                );
              })}
            </MapContainer>
          </CardContent>
        </Card>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 justify-center text-xs text-muted-foreground">
          {Object.entries(markerColors).map(([type, color]) => (
            <span key={type} className="flex items-center gap-1.5">
              <span className="inline-block size-3 rounded-full" style={{ backgroundColor: color }} />
              {typeLabels[type]}
            </span>
          ))}
        </div>

        {/* Lead Capture Form */}
        <LeadCaptureForm orgId={org.id} orgName={org.name} />

        <p className="text-center text-xs text-muted-foreground pb-4">
          © {new Date().getFullYear()} {org.name} — Mapa de cobertura
        </p>
      </main>
    </div>
  );
}
