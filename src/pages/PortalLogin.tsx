import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSubscriberAuth } from "@/hooks/useSubscriberAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Wifi, Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import { formatCpfCnpj } from "@/utils/formatters";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface OrgBranding {
  id: string;
  name: string;
  logo_url: string | null;
}

export default function PortalLogin() {
  const { login, loading: authLoading } = useSubscriberAuth();
  const navigate = useNavigate();
  const [cpf, setCpf] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [org, setOrg] = useState<OrgBranding | null>(null);
  const [orgLoading, setOrgLoading] = useState(true);

  const params = new URLSearchParams(window.location.search);
  const orgSlug = params.get("org") || "";

  // Fetch organization branding via secure RPC
  useEffect(() => {
    async function fetchOrg() {
      if (!orgSlug) {
        setOrgLoading(false);
        return;
      }
      try {
        const { data } = await supabase
          .rpc("get_org_public_info", { p_slug: orgSlug });
        if (data && data.length > 0) setOrg(data[0] as OrgBranding);
      } catch {
        // silently fail
      }
      setOrgLoading(false);
    }
    fetchOrg();
  }, [orgSlug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cpf || !password) {
      toast.error("Preencha CPF e senha");
      return;
    }

    setLoading(true);
    const { error } = await login(cpf, password, orgSlug || window.location.hostname.split(".")[0]);
    setLoading(false);

    if (error) {
      toast.error(error);
    } else {
      navigate("/portal");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-background">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--primary)) 1px, transparent 0)`,
          backgroundSize: "32px 32px",
        }}
      />

      {/* Branding header */}
      <div className="relative z-10 flex flex-col items-center mb-8">
        {orgLoading ? (
          <div className="h-16 w-16 rounded-2xl bg-muted animate-pulse" />
        ) : org?.logo_url ? (
          <img
            src={org.logo_url}
            alt={`Logo ${org.name}`}
            className="h-16 w-16 rounded-2xl object-contain bg-card shadow-md border"
          />
        ) : (
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center shadow-md border border-primary/20">
            <Wifi className="size-8 text-primary" />
          </div>
        )}
        <h1 className="mt-4 text-xl font-bold text-foreground tracking-tight">
          {org?.name || "Portal do Assinante"}
        </h1>
      </div>

      {/* Login card */}
      <Card className="relative z-10 w-full max-w-sm shadow-xl border-border/60 backdrop-blur-sm bg-card/95">
        <CardHeader className="text-center pb-2 pt-6 px-6">
          <CardTitle className="text-lg font-semibold">Acesse sua conta</CardTitle>
          <CardDescription className="text-sm">
            Entre com seu CPF e senha para continuar
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="cpf" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                CPF
              </Label>
              <Input
                id="cpf"
                placeholder="000.000.000-00"
                value={cpf}
                onChange={(e) => setCpf(formatCpfCnpj(e.target.value))}
                maxLength={14}
                autoComplete="username"
                className="h-11 bg-muted/40 border-border/60 focus:bg-background transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Senha
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="h-11 bg-muted/40 border-border/60 focus:bg-background transition-colors pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent text-muted-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </Button>
              </div>
            </div>
            <Button
              type="submit"
              className="w-full h-11 font-semibold text-sm mt-2"
              disabled={loading || authLoading}
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                "Entrar"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="relative z-10 mt-6 flex items-center gap-1.5 text-xs text-muted-foreground/60">
        <ShieldCheck className="size-3.5" />
        <span>Conexão segura e criptografada</span>
      </div>
    </div>
  );
}
