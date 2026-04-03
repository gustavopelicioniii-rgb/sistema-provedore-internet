import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, MoreHorizontal, Pencil, Trash2, Loader2, FileSignature, FileDown } from "lucide-react";
import { useContracts, useDeleteContract, STATUS_META, type ContractRecord, type ContractWithRelations } from "@/hooks/useContracts";
import { generateContractPdf } from "@/utils/contractPdf";
import { formatCurrency, formatDate } from "@/utils/finance";
import ContractFormDialog from "@/components/contracts/ContractFormDialog";

export default function Contratos() {
  const { data: contracts = [], isLoading, error } = useContracts();
  const deleteContract = useDeleteContract();

  const [formOpen, setFormOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<ContractRecord | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleEdit = (contract: ContractRecord) => {
    setEditingContract(contract);
    setFormOpen(true);
  };

  const handleNew = () => {
    setEditingContract(null);
    setFormOpen(true);
  };

  const activeContracts = contracts.filter((c) => c.status === "active").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Contratos</h1>
          <p className="text-muted-foreground text-sm">
            {contracts.length} contrato{contracts.length !== 1 ? "s" : ""} · {activeContracts} ativo{activeContracts !== 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={handleNew}>
          <Plus className="mr-2 size-4" /> Novo Contrato
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Todos os Contratos</CardTitle>
        </CardHeader>
        <CardContent>
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
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Início</TableHead>
                  <TableHead>Fim</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {contracts.map((contract) => {
                  const meta = STATUS_META[contract.status];
                  return (
                    <TableRow key={contract.id}>
                      <TableCell className="font-medium">
                        {contract.customers?.name ?? "Cliente removido"}
                      </TableCell>
                      <TableCell>{contract.plans?.name ?? "Plano removido"}</TableCell>
                      <TableCell className="font-semibold">
                        {contract.plans?.price ? formatCurrency(contract.plans.price) : "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {contract.start_date ? formatDate(contract.start_date) : "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {contract.end_date ? formatDate(contract.end_date) : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={meta.color}>{meta.label}</Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-8">
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(contract)}>
                              <Pencil className="mr-2 size-3.5" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => generateContractPdf(contract as ContractWithRelations)}>
                              <FileDown className="mr-2 size-3.5" /> Gerar PDF
                            </DropdownMenuItem>
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
