import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, MoreHorizontal, Pencil, Trash2, Loader2, Wifi, ArrowDown, ArrowUp, Search, Signal, Zap, Cable, Radio, Eye, EyeOff, Package, Percent } from "lucide-react";
import { usePlans, useDeletePlan, useTogglePlanActive, usePlanContractsCount, TECH_LABELS, type PlanRecord, type PlanTechnology } from "@/hooks/usePlans";
import { formatCurrency } from "@/utils/finance";
import PlanFormDialog from "@/components/plans/PlanFormDialog";
import { AnimatePresence, motion } from "framer-motion";

const techIcons: Record<PlanTechnology, React.ReactNode> = {
  fiber: <Zap className="size-3.5" />,
  radio: <Radio className="size-3.5" />,
  cable: <Cable className="size-3.5" />,
  other: <Signal className="size-3.5" />,
};

const techColors: Record<PlanTechnology, string> = {
  fiber: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  radio: "bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20",
  cable: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  other: "bg-muted text-muted-foreground border-border",
};

export default function Planos() {
  const { data: plans = [], isLoading, error } = usePlans();
  const deletePlan = useDeletePlan();
  const togglePlanActive = useTogglePlanActive();

  const [formOpen, setFormOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PlanRecord | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [togglePlan, setTogglePlan] = useState<PlanRecord | null>(null);
  const [search, setSearch] = useState("");
  const [techFilter, setTechFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: affectedContracts = 0 } = usePlanContractsCount(togglePlan?.id ?? null);

  const handleEdit = (plan: PlanRecord) => {
    setEditingPlan(plan);
    setFormOpen(true);
  };

  const handleNew = () => {
    setEditingPlan(null);
    setFormOpen(true);
  };

  const handleToggleActive = (plan: PlanRecord) => {
    if (plan.active) {
      setTogglePlan(plan);
    } else {
      togglePlanActive.mutate({ plan, suspendContracts: false });
    }
  };

  const confirmToggle = (suspendContracts: boolean) => {
    if (togglePlan) {
      togglePlanActive.mutate({ plan: togglePlan, suspendContracts });
      setTogglePlan(null);
    }
  };

  const filtered = plans.filter((p) => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (techFilter !== "all" && p.technology !== techFilter) return false;
    if (statusFilter === "active" && !p.active) return false;
    if (statusFilter === "inactive" && p.active) return false;
    return true;
  });

  const activePlans = plans.filter((p) => p.active).length;
  const avgPrice = plans.length ? plans.reduce((s, p) => s + p.price, 0) / plans.length : 0;
  const maxSpeed = plans.length ? Math.max(...plans.map((p) => p.download_speed)) : 0;

  const stats = [
    { label: "Total de Planos", value: plans.length, icon: Package, color: "text-primary" },
    { label: "Planos Ativos", value: activePlans, icon: Zap, color: "text-emerald-600 dark:text-emerald-400" },
    { label: "Ticket Médio", value: formatCurrency(avgPrice), icon: Signal, color: "text-amber-600 dark:text-amber-400" },
    { label: "Maior Velocidade", value: `${maxSpeed} Mbps`, icon: ArrowDown, color: "text-sky-600 dark:text-sky-400" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-heading">Planos de Internet</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Gerencie os planos oferecidos aos seus clientes
          </p>
        </div>
        <Button onClick={handleNew} className="shrink-0">
          <Plus className="mr-2 size-4" /> Novo Plano
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label} className="overflow-hidden">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`rounded-lg bg-muted p-2.5 ${s.color}`}>
                <s.icon className="size-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground truncate">{s.label}</p>
                <p className="text-lg font-bold tracking-tight">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Buscar plano por nome..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={techFilter} onValueChange={setTechFilter}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="Tecnologia" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="fiber">Fibra Óptica</SelectItem>
                <SelectItem value="radio">Rádio</SelectItem>
                <SelectItem value="cable">Cabo</SelectItem>
                <SelectItem value="other">Outro</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="py-16 text-center text-sm text-destructive">Não foi possível carregar os planos.</div>
          ) : !filtered.length ? (
            <div className="py-16 text-center space-y-3">
              <Wifi className="mx-auto size-12 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">
                {plans.length ? "Nenhum plano encontrado com os filtros atuais." : "Nenhum plano cadastrado ainda."}
              </p>
              {!plans.length && (
                <Button variant="outline" size="sm" onClick={handleNew}>
                  <Plus className="mr-2 size-4" /> Cadastrar primeiro plano
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Plano</TableHead>
                    <TableHead>Download</TableHead>
                    <TableHead>Upload</TableHead>
                    <TableHead>Tecnologia</TableHead>
                     <TableHead>Fidelidade</TableHead>
                     <TableHead>Desc. Antecipação</TableHead>
                     <TableHead className="text-right">Preço</TableHead>
                     <TableHead className="text-center">Status</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence mode="popLayout">
                    {filtered.map((plan) => (
                      <motion.tr
                        key={plan.id}
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2 }}
                        className="border-b transition-colors data-[state=selected]:bg-muted hover:bg-muted/50"
                      >
                        <TableCell className="font-semibold">{plan.name}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-sm">
                            <ArrowDown className="size-3.5 text-emerald-500" />
                            <span className="font-medium">{plan.download_speed}</span>
                            <span className="text-muted-foreground text-xs">Mbps</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-sm">
                            <ArrowUp className="size-3.5 text-sky-500" />
                            <span className="font-medium">{plan.upload_speed}</span>
                            <span className="text-muted-foreground text-xs">Mbps</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`gap-1 text-xs font-medium ${techColors[plan.technology]}`}>
                            {techIcons[plan.technology]}
                            {TECH_LABELS[plan.technology]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {(plan.loyalty_months ?? 0) > 0 ? (
                            <span>{plan.loyalty_months} meses</span>
                          ) : (
                            <span className="text-muted-foreground/50">Sem fidelidade</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {((plan as any).early_payment_discount ?? 0) > 0 ? (
                            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 gap-1">
                              <Percent className="size-3" />
                              {(plan as any).early_payment_discount}%
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground/50">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="text-base font-bold">{formatCurrency(plan.price)}</span>
                          <span className="text-muted-foreground text-xs block">/mês</span>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={plan.active ? "default" : "outline"}
                            className={
                              plan.active
                                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700"
                                : "text-muted-foreground"
                            }
                          >
                            {plan.active ? "Ativo" : "Inativo"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="size-8">
                                <MoreHorizontal className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(plan)}>
                                <Pencil className="mr-2 size-3.5" /> Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleToggleActive(plan)}>
                                {plan.active ? (
                                  <><EyeOff className="mr-2 size-3.5" /> Desativar</>
                                ) : (
                                  <><Eye className="mr-2 size-3.5" /> Ativar</>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(plan.id)}>
                                <Trash2 className="mr-2 size-3.5" /> Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Footer summary */}
      {filtered.length > 0 && (
        <p className="text-xs text-muted-foreground text-center">
          Exibindo {filtered.length} de {plans.length} plano{plans.length !== 1 ? "s" : ""}
        </p>
      )}

      <PlanFormDialog open={formOpen} onOpenChange={setFormOpen} editingPlan={editingPlan} />

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir plano?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Contratos vinculados a este plano podem ser afetados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { if (deleteId) { deletePlan.mutate(deleteId); setDeleteId(null); } }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Toggle plan active confirmation */}
      <AlertDialog open={!!togglePlan} onOpenChange={(open) => !open && setTogglePlan(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desativar plano "{togglePlan?.name}"?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              {affectedContracts > 0 ? (
                <>
                  <p>
                    Este plano possui <strong>{affectedContracts}</strong> contrato{affectedContracts !== 1 ? "s" : ""} ativo{affectedContracts !== 1 ? "s" : ""}.
                  </p>
                  <p>Deseja suspender automaticamente os contratos vinculados?</p>
                </>
              ) : (
                <p>Nenhum contrato ativo vinculado a este plano.</p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            {affectedContracts > 0 && (
              <AlertDialogAction
                onClick={() => confirmToggle(false)}
                className="bg-secondary text-secondary-foreground hover:bg-secondary/80"
              >
                Desativar sem suspender contratos
              </AlertDialogAction>
            )}
            <AlertDialogAction
              onClick={() => confirmToggle(affectedContracts > 0)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {affectedContracts > 0 ? "Desativar e suspender contratos" : "Desativar plano"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
