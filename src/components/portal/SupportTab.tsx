import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { usePortalApi } from "@/hooks/usePortalApi";
import { LifeBuoy } from "lucide-react";

const TICKET_STATUS: Record<string, string> = {
  open: "Aberto",
  in_progress: "Em Andamento",
  waiting: "Aguardando",
  resolved: "Resolvido",
  closed: "Fechado",
};

interface PortalTicket {
  id: string;
  subject: string;
  description: string | null;
  priority: string;
  status: string;
  created_at: string;
  resolved_at: string | null;
}

export function SupportTab() {
  const { portalFetch } = usePortalApi();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");

  const { data: tickets, isLoading } = useQuery({
    queryKey: ["portal-tickets"],
    queryFn: () => portalFetch<PortalTicket[]>("tickets"),
  });

  const createTicket = useMutation({
    mutationFn: async () => {
      await portalFetch("create-ticket", {
        method: "POST",
        body: { subject, description: description || null },
      });
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
