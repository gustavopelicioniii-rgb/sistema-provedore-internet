import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CalendarDays, Plus, Loader2, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useTechnicianSchedules, useCreateSchedule, useUpdateSchedule, useDeleteSchedule, type TechnicianSchedule, type ScheduleFormData } from "@/hooks/useTechnicianSchedules";
import { useTechnicians } from "@/hooks/useTechnicians";
import { useServiceOrders } from "@/hooks/useServiceOrders";
import { motion } from "framer-motion";

const statusColors: Record<string, string> = {
  scheduled: "bg-primary/10 text-primary border-primary/20",
  in_progress: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  completed: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  cancelled: "bg-muted text-muted-foreground border-muted",
};

const statusLabels: Record<string, string> = {
  scheduled: "Agendado",
  in_progress: "Em Andamento",
  completed: "Concluído",
  cancelled: "Cancelado",
};

export default function Agenda() {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedTechnician, setSelectedTechnician] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<TechnicianSchedule | null>(null);

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const { data: schedules, isLoading } = useTechnicianSchedules({
    start: format(weekStart, "yyyy-MM-dd"),
    end: format(weekEnd, "yyyy-MM-dd"),
  });
  const { data: technicians } = useTechnicians();
  const { data: serviceOrders } = useServiceOrders();
  const createSchedule = useCreateSchedule();
  const updateSchedule = useUpdateSchedule();
  const deleteSchedule = useDeleteSchedule();

  const [form, setForm] = useState<ScheduleFormData>({
    technician_id: "",
    date: format(new Date(), "yyyy-MM-dd"),
    start_time: "08:00",
    end_time: "12:00",
  });

  const filteredSchedules = useMemo(() => {
    if (!schedules) return [];
    if (selectedTechnician === "all") return schedules;
    return schedules.filter((s) => s.technician_id === selectedTechnician);
  }, [schedules, selectedTechnician]);

  const getSchedulesForDay = (day: Date) =>
    filteredSchedules.filter((s) => isSameDay(new Date(s.date + "T00:00:00"), day));

  const openNew = (day?: Date) => {
    setEditingSchedule(null);
    setForm({
      technician_id: selectedTechnician !== "all" ? selectedTechnician : "",
      date: day ? format(day, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
      start_time: "08:00",
      end_time: "12:00",
    });
    setDialogOpen(true);
  };

  const openEdit = (schedule: TechnicianSchedule) => {
    setEditingSchedule(schedule);
    setForm({
      technician_id: schedule.technician_id,
      date: schedule.date,
      start_time: schedule.start_time,
      end_time: schedule.end_time,
      title: schedule.title || "",
      service_order_id: schedule.service_order_id || "",
      status: schedule.status,
      notes: schedule.notes || "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.technician_id || !form.date) return;
    if (editingSchedule) {
      await updateSchedule.mutateAsync({ id: editingSchedule.id, data: form });
    } else {
      await createSchedule.mutateAsync(form);
    }
    setDialogOpen(false);
  };

  const handleDelete = async () => {
    if (!editingSchedule) return;
    await deleteSchedule.mutateAsync(editingSchedule.id);
    setDialogOpen(false);
  };

  const activeTechs = technicians?.filter((t) => t.status === "active") ?? [];
  const openOrders = serviceOrders?.filter((o) => o.status === "open" || o.status === "in_progress") ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Agenda de Técnicos</h1>
          <p className="text-muted-foreground text-sm">Visualize e gerencie agendamentos da equipe</p>
        </div>
        <Button onClick={() => openNew()}>
          <Plus className="size-4 mr-1.5" /> Novo Agendamento
        </Button>
      </div>

      {/* Week navigation */}
      <Card>
        <CardContent className="py-3 px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="size-8" onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}>
                <ChevronLeft className="size-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setCurrentWeek(new Date())}>Hoje</Button>
              <Button variant="outline" size="icon" className="size-8" onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}>
                <ChevronRight className="size-4" />
              </Button>
              <span className="text-sm font-medium ml-2">
                {format(weekStart, "dd MMM", { locale: ptBR })} — {format(weekEnd, "dd MMM yyyy", { locale: ptBR })}
              </span>
            </div>
            <Select value={selectedTechnician} onValueChange={setSelectedTechnician}>
              <SelectTrigger className="w-48 h-8 text-xs">
                <SelectValue placeholder="Todos os técnicos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os técnicos</SelectItem>
                {activeTechs.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Week grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-2">
          {days.map((day) => {
            const daySchedules = getSchedulesForDay(day);
            const isToday = isSameDay(day, new Date());
            return (
              <motion.div
                key={day.toISOString()}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className={`min-h-[200px] ${isToday ? "ring-2 ring-primary/50" : ""}`}>
                  <CardHeader className="p-2 pb-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] uppercase text-muted-foreground font-medium">
                          {format(day, "EEE", { locale: ptBR })}
                        </p>
                        <p className={`text-lg font-bold ${isToday ? "text-primary" : ""}`}>
                          {format(day, "dd")}
                        </p>
                      </div>
                      <Button variant="ghost" size="icon" className="size-6" onClick={() => openNew(day)}>
                        <Plus className="size-3" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-2 pt-0 space-y-1.5">
                    {daySchedules.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => openEdit(s)}
                        className={`w-full text-left rounded-md border p-1.5 text-[11px] transition-colors hover:bg-muted/50 ${statusColors[s.status]}`}
                      >
                        <div className="flex items-center gap-1 mb-0.5">
                          <Clock className="size-2.5" />
                          <span className="font-medium">{s.start_time?.slice(0, 5)} - {s.end_time?.slice(0, 5)}</span>
                        </div>
                        <p className="font-medium truncate">
                          {(s.technicians as any)?.name || "Técnico"}
                        </p>
                        {s.title && <p className="truncate text-[10px] opacity-80">{s.title}</p>}
                      </button>
                    ))}
                    {!daySchedules.length && (
                      <p className="text-[10px] text-muted-foreground text-center py-4">Livre</p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSchedule ? "Editar Agendamento" : "Novo Agendamento"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Técnico *</Label>
                <Select value={form.technician_id} onValueChange={(v) => setForm({ ...form, technician_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecionar técnico" /></SelectTrigger>
                  <SelectContent>
                    {activeTechs.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Data *</Label>
                <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Início</Label>
                <Input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Fim</Label>
                <Input type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Título</Label>
              <Input value={form.title || ""} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Descrição curta" />
            </div>
            <div className="space-y-2">
              <Label>Ordem de Serviço</Label>
              <Select value={form.service_order_id || "none"} onValueChange={(v) => setForm({ ...form, service_order_id: v === "none" ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="Vincular OS (opcional)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  {openOrders.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      OS #{o.id.slice(0, 8)} — {(o as any).customers?.name || "Cliente"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {editingSchedule && (
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status || "scheduled"} onValueChange={(v) => setForm({ ...form, status: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusLabels).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
            </div>
          </div>
          <DialogFooter className="flex justify-between">
            <div>
              {editingSchedule && (
                <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleteSchedule.isPending}>
                  Excluir
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={createSchedule.isPending || updateSchedule.isPending}>
                {(createSchedule.isPending || updateSchedule.isPending) && <Loader2 className="size-4 mr-1.5 animate-spin" />}
                {editingSchedule ? "Salvar" : "Criar"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
