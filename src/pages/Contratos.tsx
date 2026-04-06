import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, MoreHorizontal, Pencil, Trash2, Loader2, FileSignature, FileDown, Search, Filter, X, CheckCircle2, Clock, Ban, Wrench, FileCheck, Download } from "lucide-react";
import { useContracts, useDeleteContract, useUpdateContract, STATUS_META, type ContractRecord, type ContractWithRelations, type ContractStatus } from "@/hooks/useContracts";
import { generateContractPdf } from "@/utils/contractPdf";
import { formatCurrency, formatDate } from "@/utils/finance";
import { downloadCsv, downloadXlsx } from "@/utils/exportData";
import ContractFormDialog from "@/components/contracts/ContractFormDialog";
import { useToast } from "@/hooks/use-toast";

const STATUS_ICON: Record<string, React.ReactNode> = {
  active: <CheckCircle2 className="size-3.5 text-emerald-600" />,
  suspended: <Clock className="size-3.5 text-amber-600" />,
  cancelled: <Ban className="size-3.5 text-red-600" />,
  awaiting_installation: <Wrench className="size-3.5 text-blue-600" />,
  awaiting_signature: <FileCheck className="size-3.5 text-violet-600" />,
};

export default function Contratos() {
  const { data: contracts = [], isLoading, error } = useContracts();
  const deleteContract = useDeleteContract();
  const updateContract = useUpdateContract();
  const { toast } = useToast();

  const [formOpen, setFormOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<ContractRecord | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [planFilter, setPlanFilter] = useState<string>("all");

  const handleEdit = (contract: ContractRecord) => {
    setEditingContract(contract);
    setFormOpen(true);
  };

  const handleNew = () => {
    setEditingContract(null);
    setFormOpen(true);
  };

  const handleDuplicate = (contract: ContractWithRelations) => {
    const dup = { ...contract, id: undefined, status: "awaiting_installation" as ContractStatus } as any;
    setEditingContract(dup);
    setFormOpen(true);
  };

  const handleChangeStatus = (id: string, status: ContractStatus) => {
    updateContract.mutate({ id, data: { status } });
  };

  const uniquePlans = useMemo(() => {
    const map = new Map<string, string>();
    contracts.forEach((c) => {
      if (c.plans) map.set(c.plans.id, c.plans.name);
    });
    return Array.from(map, ([id, name]) => ({ id, name }));
  }, [contracts]);

  const filtered = useMemo(() => {
    let list = contracts;
    if (statusFilter !== "all") {
      list = list.filter((c) => c.status === statusFilter);
    }
    if (planFilter !== "all") {
      list = list.filter((c) => c.plans?.id === planFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.customers?.name?.toLowerCase().includes(q) ||
          c.plans?.name?.toLowerCase().includes(q) ||
          c.id.toLowerCase().includes(q)
      );
    }
    return list;
  }, [contracts, statusFilter, planFilter, search]);

  const activeContracts = contracts.filter((c) => c.status === "active").length;
  const suspendedContracts = contracts.filter((c) => c.status === "suspended").length;
  const awaitingContracts = contracts.filter((c) => c.status === "awaiting_installation" || c.status === "awaiting_signature").length;
  const hasFilters = statusFilter !== "all" || planFilter !== "all" || search.trim() !== "";

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setPlanFilter("all");
  };

  const handleExport = (format: "csv" | "xlsx") => {
    const rows = filtered.map((c) => ({
      Cliente: c.customers?.name ?? "",
      Plano: c.plans?.name ?? "",
      Valor: c.plans?.price ?? 0,
      Status: STATUS_META[c.status]?.label ?? c.status,
      Início: c.start_date ?? "",
      Fim: c.end_date ?? "",
      "Dia Vencimento": c.billing_day,
    }));
    const headers = ["Cliente", "Plano", "Valor", "Status", "Início", "Fim", "Dia Vencimento"];
    const data = rows.map((r) => [
      String(r.Cliente), String(r.Plano), String(r.Valor), String(r.Status),
      String(r.Início), String(r.Fim), String(r["Dia Vencimento"]),
    ]);
    if (format === "csv") downloadCsv("contratos.csv", headers, data);
    else downloadXlsx("contratos.xlsx", headers, data);
    toast({ title: `Exportado em ${format.toUpperCase()} com sucesso!` });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Contratos</h1>
          <p className="text-muted-foreground text-sm">
            {contracts.length} contrato{contracts.length !== 1 ? "s" : ""} · {activeContracts} ativo{activeContracts !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="mr-2 size-4" /> Exportar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport("csv")}>Exportar CSV</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("xlsx")}>Exportar XLSX</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={handleNew}>
            <Plus className="mr-2 size-4" /> Novo Contrato
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setStatusFilter("all")}>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-2xl font-bold">{contracts.length}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-emerald-500/50 transition-colors" onClick={() => setStatusFilter("active")}>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Ativos</p>
            <p className="text-2xl font-bold text-emerald-600">{activeContracts}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-amber-500/50 transition-colors" onClick={() => setStatusFilter("suspended")}>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Suspensos</p>
            <p className="text-2xl font-bold text-amber-600">{suspendedContracts}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-blue-500/50 transition-colors" onClick={() => setStatusFilter("awaiting_installation")}>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Aguardando</p>
            <p className="text-2xl font-bold text-blue-600">{awaitingContracts}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="size-4" /> Contratos
              {hasFilters && (
                <Badge variant="secondary" className="text-[10px]">{filtered.length} resultado{filtered.length !== 1 ? "s" : ""}</Badge>
              )}
            </CardTitle>
            {hasFilters && (
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={clearFilters}>
                <X className="size-3" /> Limpar filtros
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 mb-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por cliente, plano ou ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 w-full sm:w-[170px] text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">Todos os status</SelectItem>
                {Object.entries(STATUS_META).map(([key, meta]) => (
                  <SelectItem key={key} value={key} className="text-xs">{meta.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={planFilter} onValueChange={setPlanFilter}>
              <SelectTrigger className="h-9 w-full sm:w-[170px] text-xs">
                <SelectValue placeholder="Plano" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">Todos os planos</SelectItem>
                {uniquePlans.map((p) => (
                  <SelectItem key={p.id} value={p.id} className="text-xs">{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="py-12 text-center text-sm text-destructive">Não foi possível carregar os contratos.</div>
          ) : !contracts.length ? (
            <div className="py-12 text-center space-y-3">
              <FileSignature className="mx-auto size-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">Nenhum contrato cadastrado ainda.</p>
              <Button variant="outline" size="sm" onClick={handleNew}>
                <Plus className="mr-2 size-4" /> Cadastrar primeiro contrato
              </Button>
            </div>
          ) : !filtered.length ? (
            <div className="py-12 text-center space-y-3">
              <Search className="mx-auto size-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">Nenhum contrato encontrado com os filtros atuais.</p>
              <Button variant="outline" size="sm" onClick={clearFilters}>
                <X className="mr-2 size-4" /> Limpar filtros
              </Button>
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead className="hidden md:table-cell">Dia Venc.</TableHead>
                    <TableHead className="hidden lg:table-cell">Início</TableHead>
                    <TableHead className="hidden lg:table-cell">Fim</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((contract) => {
                    const meta = STATUS_META[contract.status];
                    return (
                      <TableRow key={contract.id} className="group">
                        <TableCell className="font-medium">
                          {contract.customers?.name ?? "Cliente removido"}
                        </TableCell>
                        <TableCell>{contract.plans?.name ?? "Plano removido"}</TableCell>
                        <TableCell className="font-semibold">
                          {contract.plans?.price ? formatCurrency(contract.plans.price) : "—"}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">
                          {contract.billing_day}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-muted-foreground">
                          {contract.start_date ? formatDate(contract.start_date) : "—"}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-muted-foreground">
                          {contract.end_date ? formatDate(contract.end_date) : "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`gap-1 ${meta.color}`}>
                            {STATUS_ICON[contract.status]}
                            {meta.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="size-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                <MoreHorizontal className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(contract)}>
                                <Pencil className="mr-2 size-3.5" /> Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDuplicate(contract as ContractWithRelations)}>
                                <Plus className="mr-2 size-3.5" /> Duplicar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => generateContractPdf(contract as ContractWithRelations)}>
                                <FileDown className="mr-2 size-3.5" /> Gerar PDF
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {contract.status !== "active" && (
                                <DropdownMenuItem onClick={() => handleChangeStatus(contract.id, "active")}>
                                  <CheckCircle2 className="mr-2 size-3.5 text-emerald-600" /> Ativar
                                </DropdownMenuItem>
                              )}
                              {contract.status !== "suspended" && contract.status === "active" && (
                                <DropdownMenuItem onClick={() => handleChangeStatus(contract.id, "suspended")}>
                                  <Clock className="mr-2 size-3.5 text-amber-600" /> Suspender
                                </DropdownMenuItem>
                              )}
                              {contract.status !== "cancelled" && (
                                <DropdownMenuItem onClick={() => handleChangeStatus(contract.id, "cancelled")}>
                                  <Ban className="mr-2 size-3.5 text-red-600" /> Cancelar
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(contract.id)}>
                                <Trash2 className="mr-2 size-3.5" /> Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <ContractFormDialog open={formOpen} onOpenChange={setFormOpen} editingContract={editingContract} />

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir contrato?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Faturas vinculadas a este contrato podem ser afetadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { if (deleteId) { deleteContract.mutate(deleteId); setDeleteId(null); } }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
