import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Loader2, ArrowDownUp } from "lucide-react";
import { useInventoryItems, useDeleteInventoryItem, useInventoryMovements, type InventoryItemRecord } from "@/hooks/useInventory";
import InventoryItemFormDialog from "@/components/inventory/InventoryItemFormDialog";
import MovementFormDialog from "@/components/inventory/MovementFormDialog";
import { format } from "date-fns";

const typeMap: Record<string, string> = {
  onu: "ONU", router: "Roteador", cable: "Cabo", splitter: "Splitter", connector: "Conector", other: "Outro",
};

const movementTypeMap: Record<string, string> = {
  in: "Entrada", out: "Saída", loan: "Comodato", return: "Devolução",
};

export default function Estoque() {
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [movementOpen, setMovementOpen] = useState(false);
  const [editing, setEditing] = useState<InventoryItemRecord | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: items, isLoading, error } = useInventoryItems(debounced);
  const { data: movements, isLoading: movLoading } = useInventoryMovements();
  const deleteMut = useDeleteInventoryItem();

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const handleEdit = (i: InventoryItemRecord) => { setEditing(i); setFormOpen(true); };
  const handleNew = () => { setEditing(null); setFormOpen(true); };
  const handleDelete = async () => { if (deleteId) { await deleteMut.mutateAsync(deleteId); setDeleteId(null); } };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Estoque</h1>
          <p className="text-muted-foreground text-sm">Controle de equipamentos, materiais e comodato</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setMovementOpen(true)}><ArrowDownUp className="mr-2 size-4" />Movimentação</Button>
          <Button onClick={handleNew}><Plus className="mr-2 size-4" />Novo Item</Button>
        </div>
      </div>

      <Tabs defaultValue="items">
        <TabsList>
          <TabsTrigger value="items">Itens</TabsTrigger>
          <TabsTrigger value="movements">Movimentações</TabsTrigger>
        </TabsList>

        <TabsContent value="items">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="text-base">
                  Todos os Itens
                  {items && <span className="ml-2 text-sm font-normal text-muted-foreground">({items.length})</span>}
                </CardTitle>
                <div className="relative flex-1 sm:w-64 sm:flex-initial">
                  <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                  <Input placeholder="Buscar por nome ou serial..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
              ) : error ? (
                <div className="py-12 text-center text-sm text-destructive">Não foi possível carregar o estoque.</div>
              ) : !items?.length ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <p className="text-muted-foreground">Nenhum item encontrado</p>
                  <Button variant="outline" className="mt-4" onClick={handleNew}><Plus className="mr-2 size-4" />Cadastrar primeiro item</Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Estoque</TableHead>
                      <TableHead className="hidden md:table-cell">Mínimo</TableHead>
                      <TableHead className="hidden md:table-cell">Serial</TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => {
                      const lowStock = item.quantity <= item.min_quantity && item.min_quantity > 0;
                      return (
                        <TableRow key={item.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleEdit(item)}>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell>{typeMap[item.item_type] || item.item_type}</TableCell>
                          <TableCell>
                            <span className={lowStock ? "text-destructive font-semibold" : ""}>{item.quantity}</span>
                            {lowStock && <Badge variant="outline" className="ml-2 bg-destructive/10 text-destructive border-destructive/20 text-xs">Baixo</Badge>}
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-muted-foreground">{item.min_quantity}</TableCell>
                          <TableCell className="hidden md:table-cell text-muted-foreground">{item.serial_number || "—"}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="icon" className="size-8"><MoreHorizontal className="size-4" /></Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEdit(item); }}><Pencil className="mr-2 size-4" />Editar</DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteId(item.id); }}><Trash2 className="mr-2 size-4" />Excluir</DropdownMenuItem>
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
        </TabsContent>

        <TabsContent value="movements">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Histórico de Movimentações</CardTitle>
            </CardHeader>
            <CardContent>
              {movLoading ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
              ) : !movements?.length ? (
                <div className="py-12 text-center text-sm text-muted-foreground">Nenhuma movimentação registrada.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Qtd</TableHead>
                      <TableHead className="hidden md:table-cell">Cliente</TableHead>
                      <TableHead className="hidden md:table-cell">Data</TableHead>
                      <TableHead className="hidden md:table-cell">Notas</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movements.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell className="font-medium">{(m.inventory_items as any)?.name || "—"}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={
                            m.movement_type === "in" || m.movement_type === "return"
                              ? "bg-success/10 text-success border-success/20"
                              : "bg-warning/10 text-warning border-warning/20"
                          }>
                            {movementTypeMap[m.movement_type]}
                          </Badge>
                        </TableCell>
                        <TableCell>{m.quantity}</TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">{(m.customers as any)?.name || "—"}</TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">{format(new Date(m.created_at), "dd/MM/yyyy HH:mm")}</TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground truncate max-w-[200px]">{m.notes || "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <InventoryItemFormDialog open={formOpen} onOpenChange={setFormOpen} editing={editing} />
      <MovementFormDialog open={movementOpen} onOpenChange={setMovementOpen} items={items ?? []} />

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir item?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita. Movimentações relacionadas também serão afetadas.</AlertDialogDescription>
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
