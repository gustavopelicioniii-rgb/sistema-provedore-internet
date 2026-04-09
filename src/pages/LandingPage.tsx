import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users, DollarSign, BarChart3, Shield, Zap, Clock, HeadphonesIcon,
  Server, Map, FileText, Truck, CheckCircle, ArrowRight, Star, ChevronRight,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
};

const features = [
  { icon: Users, title: "Gestão de Clientes", desc: "Cadastro completo, CPF/CNPJ, tags, score financeiro e histórico unificado." },
  { icon: DollarSign, title: "Financeiro Completo", desc: "Faturamento automático, controle de inadimplência, Pix e boleto integrados." },
  { icon: Server, title: "NOC & Monitoramento", desc: "Monitore OLTs, roteadores e switches em tempo real com alertas inteligentes." },
  { icon: BarChart3, title: "Relatórios & BI", desc: "Dashboards visuais com KPIs, gráficos de tendência e exportação em PDF/CSV." },
  { icon: Map, title: "Mapa FTTH", desc: "Visualize sua rede de fibra óptica no mapa com CTOs, cabos e clientes." },
  { icon: Zap, title: "Automações", desc: "Reduza churn e inadimplência com fluxos automáticos de cobrança e retenção." },
  { icon: FileText, title: "Contratos & Fiscal", desc: "Contratos digitais com assinatura eletrônica e emissão de NF-e/NFCom." },
  { icon: Truck, title: "Frota & Estoque", desc: "Controle de veículos, abastecimentos, ONUs, cabos e materiais de campo." },
  { icon: HeadphonesIcon, title: "Atendimento", desc: "Tickets, ordens de serviço e CRM integrados num só lugar." },
];

const stats = [
  { value: "99.9%", label: "Uptime garantido" },
  { value: "<2s", label: "Tempo de resposta" },
  { value: "256-bit", label: "Criptografia" },
  { value: "24/7", label: "Suporte técnico" },
];

const plans = [
  {
    name: "Starter",
    price: "R$ 197",
    period: "/mês",
    desc: "Para provedores com até 500 clientes",
    features: ["Até 500 clientes", "Financeiro completo", "NOC básico", "Suporte por email"],
    highlight: false,
  },
  {
    name: "Pro",
    price: "R$ 397",
    period: "/mês",
    desc: "Para provedores em crescimento",
    features: ["Até 2.000 clientes", "Tudo do Starter", "Automações", "CRM completo", "Mapa FTTH", "Suporte prioritário"],
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "Sob consulta",
    period: "",
    desc: "Para grandes operações",
    features: ["Clientes ilimitados", "Tudo do Pro", "API dedicada", "SLA customizado", "Onboarding dedicado"],
    highlight: false,
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground font-display font-bold text-xs">
              NP
            </div>
            <span className="text-xl font-display font-bold tracking-tight">NetPulse</span>
          </div>
          <div className="hidden items-center gap-6 md:flex">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Recursos</a>
            <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Planos</a>
            <Link to="/portal/login">
              <Button size="sm">Portal do Assinante <ArrowRight className="ml-1 size-3.5" /></Button>
            </Link>
          </div>
          <Link to="/portal/login" className="md:hidden">
            <Button size="sm">Portal do Assinante</Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.08),transparent_70%)]" />
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="relative mx-auto max-w-4xl px-4 pb-20 pt-24 text-center md:pt-32"
        >
          <motion.div variants={fadeUp} transition={{ duration: 0.5 }}>
            <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-xs font-medium">
              <Star className="mr-1.5 size-3 fill-warning text-warning" /> Plataforma #1 para ISPs brasileiros
            </Badge>
          </motion.div>
          <motion.h1
            variants={fadeUp}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="font-display text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl"
          >
            Gerencie seu provedor{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              com inteligência
            </span>
          </motion.h1>
          <motion.p
            variants={fadeUp}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground"
          >
            ERP, CRM, NOC e automações inteligentes num único sistema.
            Reduza churn, controle inadimplência e escale seu provedor com confiança.
          </motion.p>
          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center"
          >
            <Link to="/portal/login">
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                <Button size="lg" className="px-8 text-base">
                  Acessar Portal do Assinante <ArrowRight className="ml-2 size-4" />
                </Button>
              </motion.div>
            </Link>
            <a href="#features">
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                <Button variant="outline" size="lg" className="px-8 text-base">
                  Conhecer Recursos
                </Button>
              </motion.div>
            </a>
          </motion.div>

          {/* Stats */}
          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mx-auto mt-16 grid max-w-lg grid-cols-2 gap-6 sm:grid-cols-4 sm:max-w-2xl"
          >
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-2xl font-extrabold text-primary">{s.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* Features */}
      <section id="features" className="border-t bg-muted/30 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeUp}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <Badge variant="outline" className="mb-4">Recursos</Badge>
            <h2 className="font-display text-3xl font-bold tracking-tight">Tudo que seu provedor precisa</h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Do cadastro de clientes ao monitoramento da rede, o NetPulse cobre toda a operação.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={stagger}
            className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {features.map((f) => (
              <motion.div
                key={f.title}
                variants={fadeUp}
                transition={{ duration: 0.4 }}
                whileHover={{ y: -6, transition: { duration: 0.25, ease: "easeOut" } }}
              >
                <Card className="group h-full transition-all duration-300 hover:shadow-lg hover:shadow-primary/8 border-transparent hover:border-primary/20">
                  <CardContent className="p-6">
                    <motion.div
                      className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-primary-foreground"
                      whileHover={{ rotate: [0, -8, 8, 0], transition: { duration: 0.5 } }}
                    >
                      <f.icon className="size-5" />
                    </motion.div>
                    <h3 className="mt-4 font-semibold">{f.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                    <div className="mt-4 flex items-center gap-1 text-xs font-medium text-primary opacity-0 translate-x-[-4px] transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0">
                      Saiba mais <ArrowRight className="size-3" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20">
        <div className="mx-auto max-w-5xl px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeUp}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <Badge variant="outline" className="mb-4">Planos</Badge>
            <h2 className="font-display text-3xl font-bold tracking-tight">Escolha o plano ideal</h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Comece com 14 dias grátis. Sem cartão de crédito.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={stagger}
            className="mt-12 grid gap-6 md:grid-cols-3"
          >
            {plans.map((plan) => (
              <motion.div
                key={plan.name}
                variants={fadeUp}
                transition={{ duration: 0.4 }}
                whileHover={{ y: -8, transition: { duration: 0.25, ease: "easeOut" } }}
              >
                <Card className={`relative h-full flex flex-col transition-all duration-300 hover:shadow-xl ${plan.highlight ? "border-primary shadow-lg shadow-primary/10 ring-1 ring-primary" : "hover:border-primary/20 hover:shadow-primary/8"}`}>
                  {plan.highlight && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground shadow-sm">Mais Popular</Badge>
                    </div>
                  )}
                  <CardContent className="flex flex-1 flex-col p-6 pt-8">
                    <h3 className="text-lg font-semibold">{plan.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{plan.desc}</p>
                    <div className="mt-5 flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold">{plan.price}</span>
                      {plan.period && <span className="text-sm text-muted-foreground">{plan.period}</span>}
                    </div>
                    <ul className="mt-6 flex-1 space-y-3">
                      {plan.features.map((feat) => (
                        <li key={feat} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="mt-0.5 size-4 shrink-0 text-success" />
                          {feat}
                        </li>
                      ))}
                    </ul>
                    <Link to="/portal/login" className="mt-8 block">
                      <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                        <Button className="w-full" variant={plan.highlight ? "default" : "outline"}>
                          Fale Conosco <ChevronRight className="ml-1 size-4" />
                        </Button>
                      </motion.div>
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t bg-primary/5 py-20">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl px-4 text-center"
        >
          <h2 className="font-display text-3xl font-bold tracking-tight">Pronto para transformar seu provedor?</h2>
          <p className="mt-4 text-muted-foreground">
            Junte-se a centenas de ISPs que já automatizam sua operação com o NetPulse.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Entre em contato com nossa equipe comercial para obter suas credenciais de acesso.
          </p>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 text-center sm:flex-row sm:justify-between sm:text-left">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground font-display font-bold text-[10px]">
              NP
            </div>
            <span className="text-sm font-display font-semibold">NetPulse</span>
          </div>
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} NetPulse. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
