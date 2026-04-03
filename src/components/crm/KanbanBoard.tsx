import { useMemo, useState } from "react";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, GripVertical, Mail, Phone, Building2, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useLeads, useUpdateLead, useDeleteLead, STAGE_META, SOURCE_LABELS, PIPELINE_STAGES, type LeadRecord, type LeadStage } from "@/hooks/useLeads";
import { formatCurrency } from "@/utils/finance";
import LeadFormDialog from "./LeadFormDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";

export default function KanbanBoard() {
  const { data: leads = [], isLoading, error } = useLeads();
  const updateLead = useUpdateLead();
  const deleteLead = useDeleteLead();

  const [formOpen, setFormOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<LeadRecord | null>(null);
  const [defaultStage, setDefaultStage] = useState<LeadStage>("new");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const columns = useMemo(() => {
    const map: Record<LeadStage, LeadRecord[]> = {
      new: [], qualified: [], proposal: [], negotiation: [], won: [], lost: [],
    };
    leads.forEach((lead) => {
      map[lead.stage]?.push(lead);
    });
    // Sort by position within each column
    Object.values(map).forEach((col) => col.sort((a, b) => a.position - b.position));
    return map;
  }, [leads]);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const sourceStage = result.source.droppableId as LeadStage;
    const destStage = result.destination.droppableId as LeadStage;
    const sourceIdx = result.source.index;
    const destIdx = result.destination.index;

    if (sourceStage === destStage && sourceIdx === destIdx) return;

    const leadId = result.draggableId;

    // Calculate new position
    const destColumn = [...columns[destStage]];
    if (sourceStage === destStage) {
      destColumn.splice(sourceIdx, 1);
    }

    let newPosition: number;
    if (destColumn.length === 0) {
      newPosition = 0;
    } else if (destIdx === 0) {
      newPosition = (destColumn[0]?.position ?? 0) - 1;
    } else if (destIdx >= destColumn.length) {
      newPosition = (destColumn[destColumn.length - 1]?.position ?? 0) + 1;
    } else {
      const before = destColumn[destIdx - 1]?.position ?? 0;
      const after = destColumn[destIdx]?.position ?? before + 2;
      newPosition = Math.round((before + after) / 2);
      // If collision, offset
      if (newPosition === before || newPosition === after) {
        newPosition = after + 1;
      }
    }

    updateLead.mutate({ id: leadId, data: { stage: destStage, position: newPosition } });
  };

  const handleAdd = (stage: LeadStage) => {
    setEditingLead(null);
    setDefaultStage(stage);
    setFormOpen(true);
  };

  const handleEdit = (lead: LeadRecord) => {
    setEditingLead(lead);
    setFormOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return <div className="py-12 text-center text-sm text-destructive">Erro ao carregar o pipeline.</div>;
  }

  return (
    <>
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: "calc(100vh - 220px)" }}>
          {PIPELINE_STAGES.map((stage) => {
            const meta = STAGE_META[stage];
            const items = columns[stage];
            const totalValue = items.reduce((sum, l) => sum + (l.value ?? 0), 0);

            return (
              <div key={stage} className="flex-shrink-0 w-[280px] flex flex-col">
                {/* Column header */}
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={meta.color}>{meta.label}</Badge>
                    <span className="text-xs text-muted-foreground font-medium">{items.length}</span>
                  </div>
                  <Button variant="ghost" size="icon" className="size-7" onClick={() => handleAdd(stage)}>
                    <Plus className="size-4" />
                  </Button>
                </div>

                {totalValue > 0 && (
                  <p className="text-xs text-muted-foreground mb-2">{formatCurrency(totalValue)}</p>
                )}

                {/* Droppable column */}
                <Droppable droppableId={stage}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 space-y-2 rounded-lg p-2 transition-colors ${
                        snapshot.isDraggingOver ? "bg-accent/50" : "bg-muted/30"
                      }`}
                    >
                      {items.map((lead, index) => (
                        <Draggable key={lead.id} draggableId={lead.id} index={index}>
                          {(provided, snapshot) => (
                            <Card
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`p-3 cursor-grab active:cursor-grabbing transition-shadow ${
                                snapshot.isDragging ? "shadow-lg ring-2 ring-primary/20" : ""
                              }`}
                            >
                              <div className="flex items-start gap-2">
                                <div {...provided.dragHandleProps} className="mt-0.5 text-muted-foreground/50">
                                  <GripVertical className="size-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium truncate">{lead.name}</p>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="size-6 -mr-1">
                                          <MoreHorizontal className="size-3.5" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => handleEdit(lead)}>
                                          <Pencil className="mr-2 size-3.5" /> Editar
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(lead.id)}>
                                          <Trash2 className="mr-2 size-3.5" /> Excluir
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>

                                  {lead.company && (
                                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                                      <Building2 className="size-3" /> {lead.company}
                                    </div>
                                  )}

                                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                    {lead.email && (
                                      <span className="flex items-center gap-1 truncate">
                                        <Mail className="size-3" />
                                      </span>
                                    )}
                                    {lead.phone && (
                                      <span className="flex items-center gap-1">
                                        <Phone className="size-3" />
                                      </span>
                                    )}
                                    {(lead.value ?? 0) > 0 && (
                                      <span className="ml-auto font-medium text-foreground">
                                        {formatCurrency(lead.value ?? 0)}
                                      </span>
                                    )}
                                  </div>

                                  {lead.source && (
                                    <Badge variant="secondary" className="mt-2 text-[10px] h-5">
                                      {SOURCE_LABELS[lead.source]}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </Card>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}

                      {items.length === 0 && !snapshot.isDraggingOver && (
                        <button
                          onClick={() => handleAdd(stage)}
                          className="w-full rounded-lg border-2 border-dashed border-muted-foreground/20 p-4 text-xs text-muted-foreground hover:border-primary/30 hover:text-primary transition-colors"
                        >
                          + Adicionar lead
                        </button>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      <LeadFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editingLead={editingLead}
        defaultStage={defaultStage}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir lead?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { if (deleteId) { deleteLead.mutate(deleteId); setDeleteId(null); } }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
