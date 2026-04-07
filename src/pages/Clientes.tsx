import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Loader2, Upload, ChevronLeft, ChevronRight, Download, FileText, BarChart3 } from "lucide-react";
import CsvImportDialog from "@/components/customers/CsvImportDialog";
import { useCustomers, useDeleteCustomer, type CustomerAddress, type CustomerRecord } from "@/hooks/useCustomers";
import { formatCpfCnpj } from "@/utils/formatters";
import CustomerFormDialog from "@/components/customers/CustomerFormDialog";
import { downloadCsv, downloadPdfTable } from "@/utils/exportData";
import { CreditAnalysisDialog } from "@/components/billing/CreditAnalysisDialog";
import { supabase } from "@/integrations/supabase/client";

const statusMap: Record<string, { label: string; className: string }> = {
  active: { label: "Ativo", className: "bg-success/10 text-success border-success/20" },
  suspended: { label: "Suspenso", className: "bg-warning/10 text-warning border-warning/20" },
  defaulting: { label: "Inadimplente", className: "bg-destructive/10 text-destructive border-destructive/20" },
  cancelled: { label: "Cancelado", className: "bg-muted text-muted-foreground border-muted" },
};

export default function Clientes() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerRecord | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [csvOpen, setCsvOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [creditCustomer, setCreditCustomer] = useState<any>(null);
  const pageSize = 20;

  const { data: customers, isLoading, error } = useCustomers(debouncedSearch);
  const deleteCustomer = useDeleteCustomer();

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(search);
      setPage(0);
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [search]);

  const totalPages = customers ? Math.ceil(customers.length / pageSize) : 0;
  const paginatedCustomers = customers?.slice(page * pageSize, (page + 1) * pageSize);

  const handleEdit = (customer: CustomerRecord) => {
    setEditingCustomer(customer);
    setFormOpen(true);
  };

  const handleNew = () => {
    setEditingCustomer(null);
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteCustomer.mutateAsync(deleteId);
    setDeleteId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground text-sm">Gerencie seus assinantes e contratos</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" disabled={!customers?.length} onClick={() => {
            if (!customers) return;
            const headers = ["Nome", "CPF/CNPJ", "Email", "Telefone", "Status"];
            const rows = customers.map((c) => [c.name, c.cpf_cnpj, c.email ?? "", c.phone ?? "", statusMap[c.status]?.label ?? c.status]);
            downloadCsv("clientes.csv", headers, rows);
          }}>
            <Download className="mr-2 size-4" /> CSV
          </Button>
          <Button variant="outline" size="sm" disabled={!customers?.length} onClick={() => {
            if (!customers) return;
            const headers = ["Nome", "CPF/CNPJ", "Email", "Telefone", "Status"];
            const rows = customers.map((c) => [c.name, c.cpf_cnpj, c.email ?? "", c.phone ?? "", statusMap[c.status]?.label ?? c.status]);
            downloadPdfTable("Clientes", "clientes.pdf", headers, rows);
          }}>
            <FileText className="mr-2 size-4" /> PDF
          </Button>
          <Button variant="outline" onClick={() => setCsvOpen(true)}>
            <Upload className="mr-2 size-4" /> Importar CSV
          </Button>
          <Button onClick={handleNew}>
            <Plus className="mr-2 size-4" /> Novo Cliente
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base">
              Todos os Clientes
              {customers && <span className="ml-2 text-sm font-normal text-muted-foreground">({customers.length})</span>}
            </CardTitle>
            <div className="relative flex-1 sm:w-64 sm:flex-initial">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input placeholder="Buscar por nome ou CPF..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="py-12 text-center text-sm text-destructive">Não foi possível carregar os clientes.</div>
          ) : !customers?.length ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground">Nenhum cliente encontrado</p>
              <Button variant="outline" className="mt-4" onClick={handleNew}>
                <Plus className="mr-2 size-4" />
                Cadastrar primeiro cliente
              </Button>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>CPF/CNPJ</TableHead>
                    <TableHead className="hidden md:table-cell">Cidade</TableHead>
                    <TableHead className="hidden md:table-cell">WhatsApp</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedCustomers?.map((customer) => {
                    const address = customer.address as CustomerAddress | null;
                    const status = statusMap[customer.status] || statusMap.active;
                    const score = customer.financial_score ?? 5;
                    return (
                      <TableRow key={customer.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleEdit(customer)}>
                        <TableCell className="font-medium">{customer.name}</TableCell>
                        <TableCell className="text-muted-foreground">{formatCpfCnpj(customer.cpf_cnpj)}</TableCell>
                        <TableCell className="hidden md:table-cell">{address?.city || "—"}</TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">{customer.whatsapp || "—"}</TableCell>
                        <TableCell>
                          <span className={`font-semibold ${score >= 7 ? "text-success" : score >= 4 ? "text-warning" : "text-destructive"}`}>
                            {score.toFixed(1)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={status.className}>{status.label}</Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon" className="size-8"><MoreHorizontal className="size-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEdit(customer); }}>
                                <Pencil className="mr-2 size-4" /> Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={async (e) => {
                                e.stopPropagation();
                                const { data: p } = await supabase.from("profiles").select("organization_id").maybeSingle();
                                setCreditCustomer({
                                  id: customer.id,
                                  name: customer.name,
                                  cpf_cnpj: customer.cpf_cnpj,
                                  financial_score: customer.financial_score,
                                  organizationId: p?.organization_id ?? "",
                                });
                              }}>
                                <BarChart3 className="mr-2 size-4" /> Análise de Crédito
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteId(customer.id); }}>
                                <Trash2 className="mr-2 size-4" /> Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <p className="text-xs text-muted-foreground">
                    Mostrando {page * pageSize + 1} - {Math.min((page + 1) * pageSize, customers.length)} de {customers.length}
                  </p>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="icon" className="size-8" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                      <ChevronLeft className="size-4" />
                    </Button>
                    <span className="text-xs px-2">{page + 1} / {totalPages}</span>
                    <Button variant="outline" size="icon" className="size-8" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <CustomerFormDialog open={formOpen} onOpenChange={setFormOpen} editingCustomer={editingCustomer} />
      <CsvImportDialog open={csvOpen} onOpenChange={setCsvOpen} />
      <CreditAnalysisDialog
        open={!!creditCustomer}
        onOpenChange={(v) => !v && setCreditCustomer(null)}
        customer={creditCustomer}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Todos os dados do cliente serão removidos permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
