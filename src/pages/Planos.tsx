import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, MoreHorizontal, Pencil, Trash2, Loader2, Wifi, ArrowDown, ArrowUp } from "lucide-react";
import { usePlans, useDeletePlan, TECH_LABELS, type PlanRecord } from "@/hooks/usePlans";
import { formatCurrency } from "@/utils/finance";
import PlanFormDialog from "@/components/plans/PlanFormDialog";

export default function Planos() {
  const { data: plans = [], isLoading, error } = usePlans();
  const deletePlan = useDeletePlan();

  const [formOpen, setFormOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PlanRecord | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleEdit = (plan: PlanRecord) => {
    setEditingPlan(plan);
    setFormOpen(true);
  };

  const handleNew = () => {
    setEditingPlan(null);
    setFormOpen(true);
  };

  const activePlans = plans.filter((p) => p.active).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Planos</h1>
          <p className="text-muted-foreground text-sm">
            {plans.length} plano{plans.length !== 1 ? "s" : ""} cadastrado{plans.length !== 1 ? "s" : ""} · {activePlans} ativo{activePlans !== 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={handleNew}>
          <Plus className="mr-2 size-4" /> Novo Plano
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Todos os Planos</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="py-12 text-center text-sm text-destructive">Não foi possível carregar os planos.</div>
          ) : !plans.length ? (
            <div className="py-12 text-center space-y-3">
              <Wifi className="mx-auto size-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">Nenhum plano cadastrado ainda.</p>
              <Button variant="outline" size="sm" onClick={handleNew}>
                <Plus className="mr-2 size-4" /> Cadastrar primeiro plano
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plano</TableHead>
                  <TableHead>Velocidade</TableHead>
                  <TableHead>Tecnologia</TableHead>
                  <TableHead>Fidelidade</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell className="font-medium">{plan.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <ArrowDown className="size-3 text-emerald-500" />
                          {plan.download_speed} Mbps
                        </span>
                        <span className="flex items-center gap-1">
                          <ArrowUp className="size-3 text-blue-500" />
                          {plan.upload_speed} Mbps
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">{TECH_LABELS[plan.technology]}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {(plan.loyalty_months ?? 0) > 0 ? `${plan.loyalty_months} meses` : "—"}
                    </TableCell>
                    <TableCell className="font-semibold">{formatCurrency(plan.price)}</TableCell>
                    <TableCell>
                      <Badge variant={plan.active ? "default" : "outline"} className={plan.active ? "bg-emerald-500/15 text-emerald-700 border-emerald-300" : "text-muted-foreground"}>
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
                          <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(plan.id)}>
                            <Trash2 className="mr-2 size-3.5" /> Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <PlanFormDialog open={formOpen} onOpenChange={setFormOpen} editingPlan={editingPlan} />

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
    </div>
  );
}
