import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Loader2 } from "lucide-react";
import { useServiceOrders, useDeleteServiceOrder, type ServiceOrderRecord } from "@/hooks/useServiceOrders";
import ServiceOrderFormDialog from "@/components/service-orders/ServiceOrderFormDialog";
import { format } from "date-fns";

const statusMap: Record<string, { label: string; className: string }> = {
  open: { label: "Aberta", className: "bg-primary/10 text-primary border-primary/20" },
  in_progress: { label: "Em Andamento", className: "bg-warning/10 text-warning border-warning/20" },
  completed: { label: "Concluída", className: "bg-success/10 text-success border-success/20" },
  cancelled: { label: "Cancelada", className: "bg-muted text-muted-foreground border-muted" },
};

const typeMap: Record<string, string> = {
  installation: "Instalação", maintenance: "Manutenção", technical_visit: "Visita Técnica", repair: "Reparo",
};

export default function OrdensServico() {
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ServiceOrderRecord | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: orders, isLoading, error } = useServiceOrders(debounced);
  const deleteMut = useDeleteServiceOrder();

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const handleEdit = (o: ServiceOrderRecord) => { setEditing(o); setFormOpen(true); };
  const handleNew = () => { setEditing(null); setFormOpen(true); };
  const handleDelete = async () => { if (deleteId) { await deleteMut.mutateAsync(deleteId); setDeleteId(null); } };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ordens de Serviço</h1>
          <p className="text-muted-foreground text-sm">Gestão de instalações, manutenções e visitas técnicas</p>
        </div>
        <Button onClick={handleNew}><Plus className="mr-2 size-4" />Nova OS</Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base">
              Todas as Ordens
              {orders && <span className="ml-2 text-sm font-normal text-muted-foreground">({orders.length})</span>}
            </CardTitle>
            <div className="relative flex-1 sm:w-64 sm:flex-initial">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input placeholder="Buscar por descrição..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
          ) : error ? (
            <div className="py-12 text-center text-sm text-destructive">Não foi possível carregar as ordens de serviço.</div>
          ) : !orders?.length ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground">Nenhuma ordem de serviço encontrada</p>
              <Button variant="outline" className="mt-4" onClick={handleNew}><Plus className="mr-2 size-4" />Criar primeira OS</Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="hidden md:table-cell">Técnico</TableHead>
                  <TableHead className="hidden md:table-cell">Agendamento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((o) => {
                  const st = statusMap[o.status] || statusMap.open;
                  return (
                    <TableRow key={o.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleEdit(o)}>
                      <TableCell className="font-medium">{(o.customers as any)?.name || "—"}</TableCell>
                      <TableCell>{typeMap[o.type] || o.type}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">{(o.technicians as any)?.name || "Não atribuído"}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">
                        {o.scheduled_date ? format(new Date(o.scheduled_date), "dd/MM/yyyy HH:mm") : "—"}
                      </TableCell>
                      <TableCell><Badge variant="outline" className={st.className}>{st.label}</Badge></TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="size-8"><MoreHorizontal className="size-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEdit(o); }}><Pencil className="mr-2 size-4" />Editar</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteId(o.id); }}><Trash2 className="mr-2 size-4" />Excluir</DropdownMenuItem>
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

      <ServiceOrderFormDialog open={formOpen} onOpenChange={setFormOpen} editing={editing} />

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir ordem de serviço?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
