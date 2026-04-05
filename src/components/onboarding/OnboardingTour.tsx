import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
  action: string;
  targetPath: string;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "welcome",
    icon: Rocket,
    title: "Bem-vindo ao sistema!",
    description:
      "Este é o seu ERP completo para gestão de provedor de internet. Vamos conhecer cada módulo — você será direcionado para cada tela enquanto explicamos como funciona.",
    highlights: [],
    action: "Começar o tour",
    targetPath: "/dashboard",
  },
  {
    id: "dashboard",
    icon: LayoutDashboard,
    title: "Dashboard",
    description:
      "Este é o painel central do seu provedor. Aqui você monitora tudo em tempo real.",
    highlights: [
      "KPIs de MRR, clientes ativos e inadimplência",
      "Gráficos de crescimento e receita",
      "Alertas consolidados (faturas, SLA, estoque)",
      "Visão geral de tickets e ordens de serviço",
    ],
    action: "Próximo módulo",
    targetPath: "/dashboard",
  },
  {
    id: "clientes",
    icon: Users,
    title: "Gestão de Clientes",
    description:
      "Gerencie toda a base de assinantes do seu provedor nesta tela.",
    highlights: [
      "Cadastro com validação de CPF/CNPJ automática",
      "Busca de endereço via CEP (ViaCEP)",
      "Importação em massa via arquivo CSV",
      "Filtros por status, tags e score financeiro",
    ],
    action: "Próximo módulo",
    targetPath: "/clientes",
  },
  {
    id: "contratos",
    icon: ClipboardList,
    title: "Contratos",
    description:
      "Crie e gerencie contratos vinculados a clientes e planos.",
    highlights: [
      "Geração automática de contrato em PDF",
      "Vínculo com plano e dia de vencimento",
      "Controle de vigência e status do contrato",
      "Dados de autenticação PPPoE integrados",
    ],
    action: "Próximo módulo",
    targetPath: "/contratos",
  },
  {
    id: "crm",
    icon: Kanban,
    title: "CRM — Pipeline de Vendas",
    description:
      "Acompanhe leads e oportunidades em um quadro Kanban visual.",
    highlights: [
      "Quadro Kanban com drag & drop",
      "Etapas: Novo Lead → Contato → Proposta → Fechado",
      "Atribuição a vendedores e valor estimado",
      "Conversão automática de lead em cliente",
    ],
    action: "Próximo módulo",
    targetPath: "/crm",
  },
  {
    id: "atendimento",
    icon: Headset,
    title: "Atendimento & Tickets",
    description:
      "Central de suporte com tickets, chat e integração WhatsApp.",
    highlights: [
      "Tickets com controle de SLA (resposta e resolução)",
      "Chat omnichannel (WhatsApp, webchat, interno)",
      "Respostas rápidas pré-configuradas",
      "Indicadores visuais de SLA em tempo real",
    ],
    action: "Próximo módulo",
    targetPath: "/atendimento",
  },
  {
    id: "rede",
    icon: Radio,
    title: "Rede & NOC",
    description:
      "Monitore todos os equipamentos de rede do seu provedor.",
    highlights: [
      "Cadastro de roteadores, OLTs, switches e APs",
      "Monitoramento de CPU, memória e uptime",
      "Alertas automáticos de queda e alta carga",
      "Integração com MikroTik e SNMP",
    ],
    action: "Próximo módulo",
    targetPath: "/rede",
  },
  {
    id: "mapa-ftth",
    icon: Map,
    title: "Mapa FTTH",
    description:
      "Visualize a infraestrutura óptica no mapa interativo.",
    highlights: [
      "Nós de OLT, CTO, CEO e splitters no mapa",
      "Capacidade e ocupação de cada nó",
      "Raio de cobertura visual",
      "Planejamento de expansão de rede",
    ],
    action: "Próximo módulo",
    targetPath: "/mapa-ftth",
  },
  {
    id: "ordens-servico",
    icon: ClipboardList,
    title: "Ordens de Serviço",
    description:
      "Gerencie instalações, manutenções e visitas técnicas.",
    highlights: [
      "Tipos: instalação, reparo, mudança de endereço",
      "Atribuição automática a técnicos disponíveis",
      "Acompanhamento de status em tempo real",
      "Endereço e detalhes do serviço integrados",
    ],
    action: "Próximo módulo",
    targetPath: "/ordens-servico",
  },
  {
    id: "tecnicos",
    icon: Wrench,
    title: "Técnicos",
    description:
      "Cadastre e gerencie a equipe técnica do provedor.",
    highlights: [
      "Cadastro com especialidade e região",
      "Controle de disponibilidade por dia da semana",
      "Histórico de ordens atribuídas",
      "Status ativo/inativo/férias",
    ],
    action: "Próximo módulo",
    targetPath: "/tecnicos",
  },
  {
    id: "agenda",
    icon: CalendarDays,
    title: "Agenda de Técnicos",
    description:
      "Visualize e organize a agenda de toda a equipe técnica.",
    highlights: [
      "Calendário visual por técnico e dia",
      "Agendamento vinculado a ordens de serviço",
      "Evita conflitos de horário automaticamente",
      "Visão diária, semanal e mensal",
    ],
    action: "Próximo módulo",
    targetPath: "/agenda",
  },
  {
    id: "financeiro",
    icon: DollarSign,
    title: "Financeiro",
    description:
      "Controle completo das finanças do seu provedor.",
    highlights: [
      "Faturas geradas automaticamente por contrato",
      "Cobranças via boleto e PIX com QR Code",
      "Conciliação bancária (importação OFX/CSV)",
      "Régua de cobrança multicanal automatizada",
    ],
    action: "Próximo módulo",
    targetPath: "/financeiro",
  },
  {
    id: "planos",
    icon: Radio,
    title: "Planos de Internet",
    description:
      "Configure os planos oferecidos pelo seu provedor.",
    highlights: [
      "Download/upload em Mbps configuráveis",
      "Preço, tecnologia (fibra, rádio, cabo)",
      "Fidelidade em meses (opcional)",
      "Ativar/desativar planos rapidamente",
    ],
    action: "Próximo módulo",
    targetPath: "/planos",
  },
  {
    id: "fiscal",
    icon: FileText,
    title: "Fiscal / NF-e",
    description:
      "Emita e gerencie notas fiscais eletrônicas.",
    highlights: [
      "Emissão de NF-e e NFS-e",
      "Integração com SEFAZ",
      "Download de XML e PDF da nota",
      "Controle de status: emitida, cancelada, rejeitada",
    ],
    action: "Próximo módulo",
    targetPath: "/fiscal",
  },
  {
    id: "estoque",
    icon: Package,
    title: "Estoque",
    description:
      "Gerencie materiais, equipamentos e movimentações.",
    highlights: [
      "Itens com número de série e MAC",
      "Controle de quantidade mínima com alerta",
      "Movimentações: entrada, saída, transferência",
      "Vínculo com cliente na saída de material",
    ],
    action: "Próximo módulo",
    targetPath: "/estoque",
  },
  {
    id: "frota",
    icon: Car,
    title: "Frota",
    description:
      "Controle veículos, abastecimentos e manutenções.",
    highlights: [
      "Cadastro de veículos com placa e modelo",
      "Registro de abastecimentos com custo/litro",
      "Controle de quilometragem",
      "Histórico completo por veículo",
    ],
    action: "Próximo módulo",
    targetPath: "/frota",
  },
  {
    id: "portal-assinante",
    icon: Smartphone,
    title: "Portal do Assinante",
    description:
      "Área exclusiva para seus clientes acessarem informações.",
    highlights: [
      "Login independente por CPF e senha",
      "Visualização de faturas e 2ª via de boleto",
      "Abertura de chamados de suporte",
      "Teste de velocidade e consumo de dados",
    ],
    action: "Próximo módulo",
    targetPath: "/portal-assinante",
  },
  {
    id: "automacoes",
    icon: Zap,
    title: "Automações",
    description:
      "Motor de automação inteligente para processos do provedor.",
    highlights: [
      "Régua de cobrança: D-3, D+1, D+7, D+15",
      "Templates prontos: boas-vindas, suspensão",
      "Integração com n8n e webhooks universais",
      "Assistente IA para criar automações por texto",
    ],
    action: "Próximo módulo",
    targetPath: "/automacoes",
  },
  {
    id: "relatorios",
    icon: BarChart3,
    title: "Relatórios & BI",
    description:
      "Analise o desempenho do seu provedor com dados precisos.",
    highlights: [
      "Relatórios de receita, inadimplência e churn",
      "Gráficos interativos com filtro de período",
      "Exportação para Excel (XLSX)",
      "Aging report de faturas em atraso",
    ],
    action: "Próximo módulo",
    targetPath: "/relatorios",
  },
  {
    id: "configuracoes",
    icon: Settings,
    title: "Configurações",
    description:
      "Personalize o sistema de acordo com suas necessidades.",
    highlights: [
      "Dados da organização e logo",
      "Permissões e papéis de usuários (RBAC)",
      "Configuração de SLAs por prioridade",
      "Status de integrações e chaves de API",
    ],
    action: "Finalizar tour 🎉",
    targetPath: "/configuracoes",
  },
];

const STORAGE_KEY = "onboarding_completed";

export function OnboardingTour() {
  const [currentStep, setCurrentStep] = useState(0);
  const [visible, setVisible] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const completed = localStorage.getItem(STORAGE_KEY);
    if (!completed) {
      setVisible(true);
    }
  }, []);

  // Navigate to the step's target page when step changes
  useEffect(() => {
    if (!visible) return;
    const step = ONBOARDING_STEPS[currentStep];
    if (step.targetPath && location.pathname !== step.targetPath) {
      navigate(step.targetPath);
    }
  }, [currentStep, visible, navigate, location.pathname]);

  const handleNext = useCallback(() => {
    if (currentStep >= ONBOARDING_STEPS.length - 1) {
      localStorage.setItem(STORAGE_KEY, "true");
      setVisible(false);
      navigate("/dashboard");
    } else {
      setCurrentStep((s) => s + 1);
    }
  }, [currentStep, navigate]);

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
            className="relative w-full max-w-lg mx-4 rounded-2xl border bg-card p-8 shadow-2xl"
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
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-medium text-muted-foreground">
                {currentStep + 1} de {ONBOARDING_STEPS.length}
              </span>
              <button
                onClick={handleSkip}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Pular tour
              </button>
            </div>

            {/* Progress bar */}
            <Progress value={progress} className="h-1.5 mb-6" />

            {/* Icon + Title row */}
            <div className="flex items-center gap-4 mb-4">
              <motion.div
                key={step.id + "-icon"}
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", damping: 15, stiffness: 200, delay: 0.1 }}
                className="flex items-center justify-center size-14 rounded-xl bg-primary/10 shrink-0"
              >
                <Icon className="size-7 text-primary" />
              </motion.div>
              <div>
                <h2 className="text-lg font-bold tracking-tight">{step.title}</h2>
                <p className="text-xs text-muted-foreground">
                  {step.targetPath && step.targetPath !== "/dashboard" && (
                    <span className="font-mono bg-muted px-1.5 py-0.5 rounded">{step.targetPath}</span>
                  )}
                </p>
              </div>
            </div>

            {/* Description */}
            <motion.div
              key={step.id + "-content"}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="space-y-4 mb-6"
            >
              <p className="text-sm text-muted-foreground leading-relaxed">
                {step.description}
              </p>

              {/* Feature highlights */}
              {step.highlights.length > 0 && (
                <ul className="space-y-2">
                  {step.highlights.map((h, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + i * 0.07 }}
                      className="flex items-start gap-2 text-sm"
                    >
                      <CheckCircle2 className="size-4 text-primary mt-0.5 shrink-0" />
                      <span className="text-foreground">{h}</span>
                    </motion.li>
                  ))}
                </ul>
              )}
            </motion.div>

            {/* Dots */}
            <div className="flex justify-center gap-1 mb-5 flex-wrap">
              {ONBOARDING_STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === currentStep
                      ? "w-5 bg-primary"
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
