import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { LifeBuoy } from "lucide-react";

const TICKET_STATUS: Record<string, string> = {
  open: "Aberto",
  in_progress: "Em Andamento",
  waiting: "Aguardando",
  resolved: "Resolvido",
  closed: "Fechado",
};

export function SupportTab() {
  const { data: tickets, isLoading } = useQuery({
    queryKey: ["portal-tickets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tickets")
        .select("id, subject, description, priority, status, created_at, resolved_at, customers(name)")
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      return data ?? [];
    },
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");

  const createTicket = useMutation({
    mutationFn: async () => {
      const { data: profile } = await supabase.from("profiles").select("organization_id").maybeSingle();
      if (!profile?.organization_id) throw new Error("Organização não encontrada.");
      const { error } = await supabase.from("tickets").insert([{
        organization_id: profile.organization_id,
        subject,
        description: description || null,
        priority: "medium" as const,
        status: "open" as const,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portal-tickets"] });
      toast({ title: "Chamado aberto com sucesso!" });
      setSubject("");
      setDescription("");
      setShowForm(false);
    },
    onError: (e: Error) => {
      toast({ title: "Erro ao abrir chamado", description: e.message, variant: "destructive" });
    },
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base flex items-center gap-2">
            <LifeBuoy className="size-4" /> Chamados de Suporte
          </CardTitle>
          <Button size="sm" onClick={() => setShowForm(!showForm)}>
            {showForm ? "Cancelar" : "Abrir Chamado"}
          </Button>
        </CardHeader>
        <CardContent>
          {showForm && (
            <div className="space-y-3 mb-6 p-4 rounded-lg border bg-muted/30">
              <Input placeholder="Assunto do chamado" value={subject} onChange={(e) => setSubject(e.target.value)} />
              <Textarea placeholder="Descreva o problema..." value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
              <Button size="sm" disabled={!subject.trim() || createTicket.isPending} onClick={() => createTicket.mutate()}>
                {createTicket.isPending ? "Enviando..." : "Enviar Chamado"}
              </Button>
            </div>
          )}

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : !tickets?.length ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhum chamado encontrado.</p>
          ) : (
            <div className="overflow-x-auto -mx-6 px-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Assunto</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Prioridade</TableHead>
                    <TableHead>Aberto em</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tickets.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="text-sm font-medium">{t.subject}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{TICKET_STATUS[t.status] ?? t.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={t.priority === "urgent" || t.priority === "high" ? "destructive" : "secondary"}>
                          {t.priority === "low" ? "Baixa" : t.priority === "medium" ? "Média" : t.priority === "high" ? "Alta" : "Urgente"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(t.created_at).toLocaleDateString("pt-BR")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
