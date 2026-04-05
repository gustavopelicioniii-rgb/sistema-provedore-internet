import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Users,
  Headset,
  DollarSign,
  Settings,
  Zap,
  BarChart3,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Rocket,
  X,
  ClipboardList,
  Kanban,
  Radio,
  Map,
  Wrench,
  CalendarDays,
  FileText,
  Package,
  Car,
  Smartphone,
} from "lucide-react";

interface OnboardingStep {
  id: string;
  icon: React.ElementType;
  title: string;
  description: string;
  highlights: string[];
  targetPath: string;
  /** CSS selector to spotlight. If not found, falls back to bottom-right tooltip */
  spotlightSelector?: string;
  /** Tooltip placement relative to spotlight */
  placement?: "bottom" | "right" | "left" | "top";
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "welcome",
    icon: Rocket,
    title: "Bem-vindo ao sistema!",
    description: "Vamos fazer um tour rápido por cada módulo. Você verá cada tela enquanto explicamos.",
    highlights: [],
    targetPath: "/dashboard",
    placement: "bottom",
  },
  {
    id: "dashboard",
    icon: LayoutDashboard,
    title: "Dashboard",
    description: "Painel central com todos os KPIs em tempo real.",
    highlights: [
      "MRR, clientes ativos e inadimplência",
      "Gráficos de crescimento e receita",
      "Alertas consolidados",
    ],
    targetPath: "/dashboard",
    spotlightSelector: "[data-sidebar-item='Dashboard']",
    placement: "right",
  },
  {
    id: "clientes",
    icon: Users,
    title: "Gestão de Clientes",
    description: "Gerencie toda a base de assinantes.",
    highlights: [
      "Validação de CPF/CNPJ automática",
      "Importação em massa via CSV",
      "Filtros por status e score financeiro",
    ],
    targetPath: "/clientes",
    spotlightSelector: "[data-sidebar-item='Clientes']",
    placement: "right",
  },
  {
    id: "contratos",
    icon: ClipboardList,
    title: "Contratos",
    description: "Crie contratos vinculados a clientes e planos.",
    highlights: [
      "Geração de contrato em PDF",
      "Vínculo com plano e vencimento",
      "Dados de autenticação PPPoE",
    ],
    targetPath: "/contratos",
    spotlightSelector: "[data-sidebar-item='Contratos']",
    placement: "right",
  },
  {
    id: "crm",
    icon: Kanban,
    title: "CRM — Pipeline de Vendas",
    description: "Acompanhe leads em um quadro Kanban.",
    highlights: [
      "Drag & drop entre etapas",
      "Conversão de lead em cliente",
      "Atribuição a vendedores",
    ],
    targetPath: "/crm",
    spotlightSelector: "[data-sidebar-item='CRM']",
    placement: "right",
  },
  {
    id: "atendimento",
    icon: Headset,
    title: "Atendimento & Tickets",
    description: "Central de suporte omnichannel.",
    highlights: [
      "Tickets com SLA configurável",
      "Chat WhatsApp integrado",
      "Respostas rápidas pré-configuradas",
    ],
    targetPath: "/atendimento",
    spotlightSelector: "[data-sidebar-item='Atendimento']",
    placement: "right",
  },
  {
    id: "rede",
    icon: Radio,
    title: "Rede & NOC",
    description: "Monitore equipamentos de rede.",
    highlights: [
      "CPU, memória e uptime dos devices",
      "Alertas de queda automáticos",
      "Integração MikroTik e SNMP",
    ],
    targetPath: "/rede",
    spotlightSelector: "[data-sidebar-item='Rede & NOC']",
    placement: "right",
  },
  {
    id: "mapa-ftth",
    icon: Map,
    title: "Mapa FTTH",
    description: "Infraestrutura óptica no mapa.",
    highlights: [
      "OLT, CTO, CEO e splitters",
      "Capacidade e ocupação",
      "Raio de cobertura",
    ],
    targetPath: "/mapa-ftth",
    spotlightSelector: "[data-sidebar-item='Mapa FTTH']",
    placement: "right",
  },
  {
    id: "ordens-servico",
    icon: ClipboardList,
    title: "Ordens de Serviço",
    description: "Gerencie instalações e manutenções.",
    highlights: [
      "Instalação, reparo e mudança",
      "Atribuição a técnicos",
      "Status em tempo real",
    ],
    targetPath: "/ordens-servico",
    spotlightSelector: "[data-sidebar-item='Ordens de Serviço']",
    placement: "right",
  },
  {
    id: "tecnicos",
    icon: Wrench,
    title: "Técnicos",
    description: "Gerencie a equipe técnica.",
    highlights: [
      "Especialidade e região",
      "Disponibilidade por dia",
      "Histórico de ordens",
    ],
    targetPath: "/tecnicos",
    spotlightSelector: "[data-sidebar-item='Técnicos']",
    placement: "right",
  },
  {
    id: "agenda",
    icon: CalendarDays,
    title: "Agenda",
    description: "Organize a agenda da equipe.",
    highlights: [
      "Calendário visual por técnico",
      "Evita conflitos de horário",
      "Visão diária e semanal",
    ],
    targetPath: "/agenda",
    spotlightSelector: "[data-sidebar-item='Agenda']",
    placement: "right",
  },
  {
    id: "financeiro",
    icon: DollarSign,
    title: "Financeiro",
    description: "Controle completo das finanças.",
    highlights: [
      "Faturas automáticas por contrato",
      "Boleto e PIX com QR Code",
      "Conciliação bancária",
    ],
    targetPath: "/financeiro",
    spotlightSelector: "[data-sidebar-item='Financeiro']",
    placement: "right",
  },
  {
    id: "fiscal",
    icon: FileText,
    title: "Fiscal / NF-e",
    description: "Emita notas fiscais eletrônicas.",
    highlights: [
      "NF-e e NFS-e com SEFAZ",
      "Download XML e PDF",
      "Controle de status",
    ],
    targetPath: "/fiscal",
    spotlightSelector: "[data-sidebar-item='Fiscal / NF-e']",
    placement: "right",
  },
  {
    id: "estoque",
    icon: Package,
    title: "Estoque",
    description: "Materiais, equipamentos e movimentações.",
    highlights: [
      "Número de série e MAC",
      "Alerta de quantidade mínima",
      "Entrada, saída e transferência",
    ],
    targetPath: "/estoque",
    spotlightSelector: "[data-sidebar-item='Estoque']",
    placement: "right",
  },
  {
    id: "frota",
    icon: Car,
    title: "Frota",
    description: "Veículos e abastecimentos.",
    highlights: [
      "Cadastro com placa e modelo",
      "Custo por litro e km",
      "Histórico por veículo",
    ],
    targetPath: "/frota",
    spotlightSelector: "[data-sidebar-item='Frota']",
    placement: "right",
  },
  {
    id: "automacoes",
    icon: Zap,
    title: "Automações",
    description: "Motor de automação inteligente.",
    highlights: [
      "Régua de cobrança D-3 a D+15",
      "Templates prontos",
      "Webhooks e integração n8n",
    ],
    targetPath: "/automacoes",
    spotlightSelector: "[data-sidebar-item='Automações']",
    placement: "right",
  },
  {
    id: "relatorios",
    icon: BarChart3,
    title: "Relatórios & BI",
    description: "Analise dados e exporte relatórios.",
    highlights: [
      "Receita, inadimplência e churn",
      "Gráficos interativos",
      "Exportação para Excel",
    ],
    targetPath: "/relatorios",
    spotlightSelector: "[data-sidebar-item='Relatórios & BI']",
    placement: "right",
  },
  {
    id: "configuracoes",
    icon: Settings,
    title: "Configurações",
    description: "Personalize o sistema.",
    highlights: [
      "Dados da organização",
      "Permissões RBAC",
      "Integrações e SLAs",
    ],
    targetPath: "/configuracoes",
    spotlightSelector: "[data-sidebar-item='Configurações']",
    placement: "right",
  },
];

const STORAGE_KEY = "onboarding_completed";

function getElementRect(selector?: string): DOMRect | null {
  if (!selector) return null;
  const el = document.querySelector(selector);
  if (!el) return null;
  return el.getBoundingClientRect();
}

export function OnboardingTour() {
  const [currentStep, setCurrentStep] = useState(0);
  const [visible, setVisible] = useState(false);
  const [spotlightRect, setSpotlightRect] = useState<DOMRect | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const rafRef = useRef<number>();

  useEffect(() => {
    const completed = localStorage.getItem(STORAGE_KEY);
    if (!completed) {
      setVisible(true);
    }
  }, []);

  // Navigate to step's page
  useEffect(() => {
    if (!visible) return;
    const step = ONBOARDING_STEPS[currentStep];
    if (step.targetPath && location.pathname !== step.targetPath) {
      navigate(step.targetPath);
    }
  }, [currentStep, visible, navigate, location.pathname]);

  // Track spotlight element position
  useEffect(() => {
    if (!visible) return;
    const step = ONBOARDING_STEPS[currentStep];

    const updateRect = () => {
      const rect = getElementRect(step.spotlightSelector);
      setSpotlightRect(rect);
      rafRef.current = requestAnimationFrame(updateRect);
    };

    // Small delay to let navigation settle
    const timeout = setTimeout(() => {
      updateRect();
    }, 300);

    return () => {
      clearTimeout(timeout);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [currentStep, visible]);

  const handleNext = useCallback(() => {
    if (currentStep >= ONBOARDING_STEPS.length - 1) {
      localStorage.setItem(STORAGE_KEY, "true");
      setVisible(false);
      navigate("/dashboard");
    } else {
      setCurrentStep((s) => s + 1);
    }
  }, [currentStep, navigate]);

  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
    }
  }, [currentStep]);

  const handleSkip = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, "true");
    setVisible(false);
  }, []);

  if (!visible) return null;

  const step = ONBOARDING_STEPS[currentStep];
  const Icon = step.icon;
  const isLast = currentStep === ONBOARDING_STEPS.length - 1;
  const isFirst = currentStep === 0;
  const pad = 6;

  // Tooltip position based on spotlight
  const getTooltipStyle = (): React.CSSProperties => {
    if (!spotlightRect) {
      // Center fallback
      return {
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      };
    }

    const placement = step.placement || "right";

    switch (placement) {
      case "right":
        return {
          top: Math.max(16, spotlightRect.top - 20),
          left: spotlightRect.right + 16,
        };
      case "left":
        return {
          top: Math.max(16, spotlightRect.top - 20),
          right: window.innerWidth - spotlightRect.left + 16,
        };
      case "bottom":
        return {
          top: spotlightRect.bottom + 16,
          left: Math.max(16, spotlightRect.left),
        };
      case "top":
        return {
          bottom: window.innerHeight - spotlightRect.top + 16,
          left: Math.max(16, spotlightRect.left),
        };
      default:
        return {
          top: spotlightRect.bottom + 16,
          left: spotlightRect.left,
        };
    }
  };

  return (
    <>
      {/* Overlay with spotlight cutout using CSS clip-path */}
      <div
        className="fixed inset-0 z-[100] pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "rgba(0,0,0,0.55)",
          clipPath: spotlightRect
            ? `polygon(
                0% 0%, 0% 100%, 
                ${spotlightRect.left - pad}px 100%, 
                ${spotlightRect.left - pad}px ${spotlightRect.top - pad}px, 
                ${spotlightRect.right + pad}px ${spotlightRect.top - pad}px, 
                ${spotlightRect.right + pad}px ${spotlightRect.bottom + pad}px, 
                ${spotlightRect.left - pad}px ${spotlightRect.bottom + pad}px, 
                ${spotlightRect.left - pad}px 100%, 
                100% 100%, 100% 0%
              )`
            : undefined,
          transition: "clip-path 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      />

      {/* Spotlight border glow */}
      {spotlightRect && (
        <div
          className="fixed z-[101] rounded-lg border-2 border-primary shadow-[0_0_20px_hsl(var(--primary)/0.4)] pointer-events-none"
          style={{
            top: spotlightRect.top - pad,
            left: spotlightRect.left - pad,
            width: spotlightRect.width + pad * 2,
            height: spotlightRect.height + pad * 2,
            transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />
      )}

      {/* Tooltip card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step.id}
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.25 }}
          className="fixed z-[102] w-80 rounded-xl border bg-card p-5 shadow-2xl"
          style={getTooltipStyle()}
        >
          {/* Close */}
          <button
            onClick={handleSkip}
            className="absolute right-3 top-3 rounded-full p-1 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <X className="size-3.5" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center justify-center size-10 rounded-lg bg-primary/10 shrink-0">
              <Icon className="size-5 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-bold leading-tight">{step.title}</h3>
              <span className="text-[10px] text-muted-foreground">
                {currentStep + 1}/{ONBOARDING_STEPS.length}
              </span>
            </div>
          </div>

          {/* Description */}
          <p className="text-xs text-muted-foreground leading-relaxed mb-3">
            {step.description}
          </p>

          {/* Highlights */}
          {step.highlights.length > 0 && (
            <ul className="space-y-1.5 mb-4">
              {step.highlights.map((h, i) => (
                <li key={i} className="flex items-start gap-1.5 text-xs">
                  <CheckCircle2 className="size-3.5 text-primary mt-0.5 shrink-0" />
                  <span className="text-foreground/90">{h}</span>
                </li>
              ))}
            </ul>
          )}

          {/* Progress dots */}
          <div className="flex gap-0.5 mb-3 flex-wrap">
            {ONBOARDING_STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1 rounded-full transition-all duration-300 ${
                  i === currentStep
                    ? "w-4 bg-primary"
                    : i < currentStep
                      ? "w-1 bg-primary/40"
                      : "w-1 bg-muted"
                }`}
              />
            ))}
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-2">
            {!isFirst && (
              <Button variant="ghost" size="sm" onClick={handlePrev} className="gap-1 text-xs h-8 px-2">
                <ChevronLeft className="size-3" /> Voltar
              </Button>
            )}
            <div className="flex-1" />
            <button
              onClick={handleSkip}
              className="text-[10px] text-muted-foreground hover:text-foreground mr-1"
            >
              Pular
            </button>
            <Button size="sm" onClick={handleNext} className="gap-1 text-xs h-8">
              {isLast ? (
                <>
                  <CheckCircle2 className="size-3" /> Concluir
                </>
              ) : (
                <>
                  Próximo <ChevronRight className="size-3" />
                </>
              )}
            </Button>
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  );
}

export function resetOnboarding() {
  localStorage.removeItem(STORAGE_KEY);
}
