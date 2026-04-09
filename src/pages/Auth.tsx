import { useState, useEffect } from "react";
import { FullPageSpinner } from "@/components/ui/spinner";
import { Navigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, Shield, Zap, BarChart3, Users, Server,
  CheckCircle, Star, Globe,
} from "lucide-react";
import { motion } from "framer-motion";
import { ForgotPasswordDialog } from "@/components/ForgotPasswordDialog";

const benefits = [
  { icon: Zap, title: "Automações Inteligentes", text: "Reduza churn em até 40% com fluxos automáticos de cobrança e retenção" },
  { icon: Shield, title: "Segurança Total", text: "Dados protegidos com criptografia AES-256 e backups automáticos" },
  { icon: BarChart3, title: "BI em Tempo Real", text: "Dashboards visuais com KPIs, tendências e alertas instantâneos" },
  { icon: Server, title: "NOC Integrado", text: "Monitore OLTs, roteadores e switches com status ao vivo" },
];

const socialProof = [
  { value: "500+", label: "Provedores" },
  { value: "2M+", label: "Clientes gerenciados" },
  { value: "99.9%", label: "Uptime" },
];

export default function Auth() {
  const { user, loading, signIn, signUp } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");


  if (loading) return <FullPageSpinner />;
  if (user) return <Navigate to="/dashboard" replace />;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const { error } = await signIn(loginEmail, loginPassword);
    if (error) toast({ title: "Erro ao entrar", description: error.message, variant: "destructive" });
    setIsSubmitting(false);
  };


  return (
    <div className="flex min-h-screen">
      {/* Left panel — rich branding */}
      <div className="hidden w-[55%] relative overflow-hidden lg:flex">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary/80" />
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-white/5 rounded-full translate-y-1/3 -translate-x-1/4" />
        <div className="absolute top-1/2 right-1/4 w-40 h-40 bg-white/3 rounded-full" />
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `radial-gradient(circle, white 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }} />

        <div className="relative z-10 flex flex-col justify-between p-10 text-primary-foreground w-full">
          {/* Top */}
          <div>
            <Link to="/" className="inline-flex items-center gap-2 text-primary-foreground/60 hover:text-primary-foreground transition-colors text-sm group">
              <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" /> Voltar ao site
            </Link>
          </div>

          {/* Center content */}
          <div className="flex-1 flex flex-col justify-center max-w-lg">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex items-center gap-3">
                <div className="flex size-14 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm border border-white/10 shadow-lg font-display font-bold text-lg">
                  NP
                </div>
                <div>
                  <span className="text-3xl font-display font-bold tracking-tight">NetPulse</span>
                  <p className="text-xs text-primary-foreground/50 font-medium tracking-wider uppercase">ISP Management</p>
                </div>
              </div>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mt-10 text-3xl font-display font-bold leading-tight"
            >
              Gerencie seu provedor<br />
              com{" "}
              <span className="relative">
                inteligência
                <svg className="absolute -bottom-1 left-0 w-full" viewBox="0 0 200 8" fill="none">
                  <path d="M2 6C50 2 150 2 198 6" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-white/30" />
                </svg>
              </span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="mt-4 text-base text-primary-foreground/70 leading-relaxed"
            >
              ERP, CRM, NOC e automações num único sistema feito para ISPs brasileiros.
            </motion.p>

            {/* Benefits */}
            <div className="mt-10 space-y-4">
              {benefits.map((b, i) => (
                <motion.div
                  key={b.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.25 + i * 0.1 }}
                  className="flex items-start gap-4 group"
                >
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 transition-colors group-hover:bg-white/20">
                    <b.icon className="size-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{b.title}</p>
                    <p className="text-xs text-primary-foreground/60 leading-relaxed mt-0.5">{b.text}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Bottom — social proof */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.7 }}
          >
            <div className="flex items-center gap-8 pt-6 border-t border-white/10">
              {socialProof.map((s) => (
                <div key={s.label}>
                  <p className="text-xl font-bold">{s.value}</p>
                  <p className="text-[11px] text-primary-foreground/50 font-medium">{s.label}</p>
                </div>
              ))}
            </div>
            <p className="mt-6 text-[11px] text-primary-foreground/30">
              © {new Date().getFullYear()} NetPulse · Todos os direitos reservados
            </p>
          </motion.div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-10 bg-background">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="w-full max-w-[420px] space-y-8"
        >
          {/* Mobile logo */}
          <div className="flex flex-col items-center gap-3 text-center lg:hidden">
            <div className="flex items-center gap-2">
              <div className="flex size-10 items-center justify-center rounded-md bg-primary text-primary-foreground font-display font-bold text-xs">
                NP
              </div>
              <span className="text-2xl font-display font-bold tracking-tight">NetPulse</span>
            </div>
            <p className="text-sm text-muted-foreground">Sistema de Gestão para Provedores</p>
          </div>

          {/* Header */}
          <div className="lg:text-left text-center">
            <h1 className="text-2xl font-display font-bold tracking-tight">
              Bem-vindo de volta 👋
            </h1>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              Entre com suas credenciais para acessar o painel
            </p>
          </div>

          <Card className="border-border/60">
            <CardContent className="pt-6">
              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="login-email" className="text-sm font-medium">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="seu@provedor.com.br"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="login-password" className="text-sm font-medium">Senha</Label>
                    <button type="button" onClick={() => setForgotOpen(true)} className="text-xs text-primary hover:underline">Esqueceu a senha?</button>
                  </div>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    className="h-11"
                  />
                </div>
                <Button type="submit" className="w-full h-11 text-sm font-semibold" disabled={isSubmitting}>
                  {isSubmitting ? "Entrando..." : "Entrar no Painel"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <p className="text-center text-xs text-muted-foreground">
            Credenciais fornecidas pela equipe NetPulse.
          </p>

          <p className="text-center text-xs text-muted-foreground lg:hidden">
            <Link to="/" className="text-primary hover:underline">← Voltar ao site</Link>
          </p>
        </motion.div>
      </div>

      <ForgotPasswordDialog open={forgotOpen} onOpenChange={setForgotOpen} />
    </div>
  );
}
