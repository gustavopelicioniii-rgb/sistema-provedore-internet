import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  LayoutDashboard,
  Users,
  Headset,
  DollarSign,
  Settings,
  Zap,
  BarChart3,
  ChevronRight,
  CheckCircle2,
  Rocket,
  X,
} from "lucide-react";

interface OnboardingStep {
  id: string;
  icon: React.ElementType;
  title: string;
  description: string;
  action: string;
  targetPath?: string;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "welcome",
    icon: Rocket,
    title: "Bem-vindo ao sistema!",
    description:
      "Este é o seu ERP completo para gestão de provedor de internet. Vamos conhecer as principais funcionalidades juntos. Clique em continuar para começar o tour.",
    action: "Continuar",
  },
  {
    id: "dashboard",
    icon: LayoutDashboard,
    title: "Dashboard",
    description:
      "Aqui você acompanha todos os KPIs do seu provedor em tempo real: MRR, clientes ativos, inadimplência e muito mais.",
    action: "Entendi",
    targetPath: "/dashboard",
  },
  {
    id: "clientes",
    icon: Users,
    title: "Gestão de Clientes",
    description:
      "Cadastre, edite e gerencie todos os seus clientes. Importe dados via CSV e acompanhe o status de cada assinante.",
    action: "Próximo",
    targetPath: "/clientes",
  },
  {
    id: "atendimento",
    icon: Headset,
    title: "Atendimento & Tickets",
    description:
      "Gerencie chamados de suporte, conversas via WhatsApp e chat em um só lugar. Controle SLAs e respostas rápidas.",
    action: "Próximo",
    targetPath: "/atendimento",
  },
  {
    id: "financeiro",
    icon: DollarSign,
    title: "Financeiro",
    description:
      "Controle faturas, cobranças automáticas, conciliação bancária e acompanhe a saúde financeira do seu provedor.",
    action: "Próximo",
    targetPath: "/financeiro",
  },
  {
    id: "automacoes",
    icon: Zap,
    title: "Automações",
    description:
      "Automatize cobranças, notificações e processos repetitivos. Use IA para criar automações inteligentes.",
    action: "Próximo",
    targetPath: "/automacoes",
  },
  {
    id: "relatorios",
    icon: BarChart3,
    title: "Relatórios & BI",
    description:
      "Analise dados com relatórios detalhados, gráficos interativos e exporte para Excel quando precisar.",
    action: "Próximo",
    targetPath: "/relatorios",
  },
  {
    id: "configuracoes",
    icon: Settings,
    title: "Configurações",
    description:
      "Configure sua organização, integrações, permissões de usuários e personalize o sistema às suas necessidades.",
    action: "Finalizar tour",
    targetPath: "/configuracoes",
  },
];

const STORAGE_KEY = "onboarding_completed";

export function OnboardingTour() {
  const [currentStep, setCurrentStep] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const completed = localStorage.getItem(STORAGE_KEY);
    if (!completed) {
      setVisible(true);
    }
  }, []);

  const handleNext = useCallback(() => {
    if (currentStep >= ONBOARDING_STEPS.length - 1) {
      localStorage.setItem(STORAGE_KEY, "true");
      setVisible(false);
    } else {
      setCurrentStep((s) => s + 1);
    }
  }, [currentStep]);

  const handleSkip = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, "true");
    setVisible(false);
  }, []);

  if (!visible) return null;

  const step = ONBOARDING_STEPS[currentStep];
  const Icon = step.icon;
  const progress = ((currentStep + 1) / ONBOARDING_STEPS.length) * 100;
  const isLast = currentStep === ONBOARDING_STEPS.length - 1;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            key={step.id}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md mx-4 rounded-2xl border bg-card p-8 shadow-2xl"
          >
            {/* Skip button */}
            <button
              onClick={handleSkip}
              className="absolute right-4 top-4 rounded-full p-1 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              aria-label="Pular tour"
            >
              <X className="size-4" />
            </button>

            {/* Step counter */}
            <div className="flex items-center justify-between mb-6">
              <span className="text-xs font-medium text-muted-foreground">
                Passo {currentStep + 1} de {ONBOARDING_STEPS.length}
              </span>
              <button
                onClick={handleSkip}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Pular tour
              </button>
            </div>

            {/* Progress bar */}
            <Progress value={progress} className="h-1.5 mb-8" />

            {/* Icon */}
            <div className="flex justify-center mb-6">
              <motion.div
                key={step.id + "-icon"}
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", damping: 15, stiffness: 200, delay: 0.1 }}
                className="flex items-center justify-center size-20 rounded-2xl bg-primary/10"
              >
                <Icon className="size-10 text-primary" />
              </motion.div>
            </div>

            {/* Content */}
            <motion.div
              key={step.id + "-content"}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="text-center space-y-3 mb-8"
            >
              <h2 className="text-xl font-bold tracking-tight">{step.title}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {step.description}
              </p>
            </motion.div>

            {/* Dots */}
            <div className="flex justify-center gap-1.5 mb-6">
              {ONBOARDING_STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === currentStep
                      ? "w-6 bg-primary"
                      : i < currentStep
                        ? "w-1.5 bg-primary/50"
                        : "w-1.5 bg-muted"
                  }`}
                />
              ))}
            </div>

            {/* Action button */}
            <Button
              onClick={handleNext}
              className="w-full gap-2"
              size="lg"
            >
              {isLast ? (
                <>
                  <CheckCircle2 className="size-4" />
                  {step.action}
                </>
              ) : (
                <>
                  {step.action}
                  <ChevronRight className="size-4" />
                </>
              )}
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Call this to reset onboarding (e.g., from settings) */
export function resetOnboarding() {
  localStorage.removeItem(STORAGE_KEY);
}
