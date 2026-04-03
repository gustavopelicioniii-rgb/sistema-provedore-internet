import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import KanbanBoard from "@/components/crm/KanbanBoard";
import LeadFormDialog from "@/components/crm/LeadFormDialog";

export default function CRM() {
  const [formOpen, setFormOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">CRM</h1>
          <p className="text-muted-foreground text-sm">Pipeline de vendas e gestão de leads</p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="mr-2 size-4" /> Novo Lead
        </Button>
      </div>

      <KanbanBoard />

      <LeadFormDialog open={formOpen} onOpenChange={setFormOpen} />
    </div>
  );
}
