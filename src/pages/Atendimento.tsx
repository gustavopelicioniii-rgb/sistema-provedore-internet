import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Loader2 } from "lucide-react";
import { useTickets, useDeleteTicket, type TicketRecord } from "@/hooks/useTickets";
import TicketFormDialog from "@/components/tickets/TicketFormDialog";
import { format } from "date-fns";

const statusMap: Record<string, { label: string; className: string }> = {
  open: { label: "Aberto", className: "bg-primary/10 text-primary border-primary/20" },
  in_progress: { label: "Em Andamento", className: "bg-warning/10 text-warning border-warning/20" },
  waiting: { label: "Aguardando", className: "bg-muted text-muted-foreground border-muted" },
  resolved: { label: "Resolvido", className: "bg-success/10 text-success border-success/20" },
  closed: { label: "Fechado", className: "bg-muted text-muted-foreground border-muted" },
};

const priorityMap: Record<string, { label: string; className: string }> = {
  low: { label: "Baixa", className: "bg-muted text-muted-foreground border-muted" },
  medium: { label: "Média", className: "bg-primary/10 text-primary border-primary/20" },
  high: { label: "Alta", className: "bg-warning/10 text-warning border-warning/20" },
  urgent: { label: "Urgente", className: "bg-destructive/10 text-destructive border-destructive/20" },
};

export default function Atendimento() {
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TicketRecord | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: tickets, isLoading, error } = useTickets(debounced);
  const deleteMut = useDeleteTicket();

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const handleEdit = (t: TicketRecord) => { setEditing(t); setFormOpen(true); };
  const handleNew = () => { setEditing(null); setFormOpen(true); };
  const handleDelete = async () => { if (deleteId) { await deleteMut.mutateAsync(deleteId); setDeleteId(null); } };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Atendimento</h1>
          <p className="text-muted-foreground text-sm">Tickets e service desk unificado</p>
        </div>
        <Button onClick={handleNew}><Plus className="mr-2 size-4" />Novo Ticket</Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base">
              Todos os Tickets
              {tickets && <span className="ml-2 text-sm font-normal text-muted-foreground">({tickets.length})</span>}
            </CardTitle>
            <div className="relative flex-1 sm:w-64 sm:flex-initial">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input placeholder="Buscar por assunto..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
          ) : error ? (
            <div className="py-12 text-center text-sm text-destructive">Não foi possível carregar os tickets.</div>
          ) : !tickets?.length ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground">Nenhum ticket encontrado</p>
              <Button variant="outline" className="mt-4" onClick={handleNew}><Plus className="mr-2 size-4" />Criar primeiro ticket</Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Assunto</TableHead>
                  <TableHead className="hidden md:table-cell">Cliente</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Criado em</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map((t) => {
                  const st = statusMap[t.status] || statusMap.open;
                  const pr = priorityMap[t.priority] || priorityMap.medium;
                  return (
                    <TableRow key={t.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleEdit(t)}>
                      <TableCell className="font-medium">{t.subject}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">{(t.customers as any)?.name || "—"}</TableCell>
                      <TableCell><Badge variant="outline" className={pr.className}>{pr.label}</Badge></TableCell>
                      <TableCell><Badge variant="outline" className={st.className}>{st.label}</Badge></TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">{format(new Date(t.created_at), "dd/MM/yyyy")}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="size-8"><MoreHorizontal className="size-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEdit(t); }}><Pencil className="mr-2 size-4" />Editar</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteId(t.id); }}><Trash2 className="mr-2 size-4" />Excluir</DropdownMenuItem>
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

      <TicketFormDialog open={formOpen} onOpenChange={setFormOpen} editing={editing} />

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir ticket?</AlertDialogTitle>
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
