import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSubscriberAuth } from "@/hooks/useSubscriberAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Wifi, Eye, EyeOff } from "lucide-react";
import { formatCpfCnpj } from "@/utils/formatters";
import { toast } from "sonner";

export default function PortalLogin() {
  const { login, loading: authLoading } = useSubscriberAuth();
  const navigate = useNavigate();
  const [cpf, setCpf] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Default org slug from URL or fallback
  const params = new URLSearchParams(window.location.search);
  const orgSlug = params.get("org") || "";

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-2">
            <div className="rounded-full bg-primary/10 p-3">
              <Wifi className="size-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Portal do Assinante</CardTitle>
          <CardDescription>
            Acesse com seu CPF e senha para gerenciar sua conta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cpf">CPF</Label>
              <Input
                id="cpf"
                placeholder="000.000.000-00"
                value={cpf}
                onChange={(e) => setCpf(formatCpfCnpj(e.target.value))}
                maxLength={14}
                autoComplete="username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </Button>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading || authLoading}>
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
