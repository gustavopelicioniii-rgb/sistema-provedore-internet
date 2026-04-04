import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Shield, Plus, Trash2, UserCog } from "lucide-react";
import { useUserRoles, useAssignRole, useRemoveRole, type AppRole, type UserRole } from "@/hooks/useUserRoles";
import { useSlaConfigs, useUpsertSlaConfig, type SlaConfig } from "@/hooks/useSlaConfigs";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const roleLabels: Record<AppRole, { label: string; color: string }> = {
  admin: { label: "Administrador", color: "bg-destructive/10 text-destructive border-destructive/20" },
  manager: { label: "Gerente", color: "bg-primary/10 text-primary border-primary/20" },
  technician: { label: "Técnico", color: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  financial: { label: "Financeiro", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  support: { label: "Suporte", color: "bg-sky-500/10 text-sky-600 border-sky-500/20" },
};

const priorityLabels: Record<string, string> = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
  urgent: "Urgente",
};

function useOrgProfiles() {
  return useQuery({
    queryKey: ["org_profiles"],
    queryFn: async () => {
      const orgId = (await supabase.rpc("get_user_organization_id")).data;
      if (!orgId) return [];
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, role")
        .eq("organization_id", orgId);
      if (error) throw error;
      return data ?? [];
    },
  });
}

// --- RBAC Manager ---
export function RbacManager() {
  const { data: roles, isLoading: rolesLoading } = useUserRoles();
  const { data: profiles, isLoading: profilesLoading } = useOrgProfiles();
  const assignRole = useAssignRole();
  const removeRole = useRemoveRole();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedRole, setSelectedRole] = useState<AppRole>("support");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const isLoading = rolesLoading || profilesLoading;

  const roleWithProfile = useMemo(() => {
    if (!roles || !profiles) return [];
    return roles.map((r) => ({
      ...r,
      profile: profiles.find((p) => p.id === r.user_id),
    }));
  }, [roles, profiles]);

  const handleAssign = async () => {
    if (!selectedUser || !selectedRole) return;
    await assignRole.mutateAsync({ userId: selectedUser, role: selectedRole });
    setDialogOpen(false);
  };

  const handleRemove = async () => {
    if (!deleteId) return;
    await removeRole.mutateAsync(deleteId);
    setDeleteId(null);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="size-4" /> Permissões de Usuários
            </CardTitle>
            <CardDescription>Gerencie quem pode acessar cada área do sistema</CardDescription>
          </div>
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="size-4 mr-1.5" /> Atribuir Role
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : !roleWithProfile.length ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <UserCog className="size-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">Nenhuma role atribuída ainda</p>
            <p className="text-xs text-muted-foreground mt-1">O primeiro usuário é automaticamente admin</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="w-16" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {roleWithProfile.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.profile?.full_name || r.user_id.slice(0, 8)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={roleLabels[r.role]?.color}>
                      {roleLabels[r.role]?.label || r.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="size-7 text-destructive" onClick={() => setDeleteId(r.id)}>
                      <Trash2 className="size-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Atribuir Role</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Usuário</Label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger><SelectValue placeholder="Selecionar usuário" /></SelectTrigger>
                <SelectContent>
                  {profiles?.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.full_name || p.id.slice(0, 8)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as AppRole)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(roleLabels).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleAssign} disabled={assignRole.isPending || !selectedUser}>
              {assignRole.isPending && <Loader2 className="size-4 mr-1.5 animate-spin" />}
              Atribuir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(v) => !v && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover role?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação removerá a permissão do usuário.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemove}>Remover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

// --- SLA Config Manager ---
export function SlaConfigManager() {
  const { data: configs, isLoading } = useSlaConfigs();
  const upsert = useUpsertSlaConfig();

  const [editing, setEditing] = useState<{ priority: string; response: string; resolution: string } | null>(null);

  const priorities = ["low", "medium", "high", "urgent"];

  const getConfig = (priority: string) =>
    configs?.find((c) => c.priority === priority);

  const handleSave = async () => {
    if (!editing) return;
    await upsert.mutateAsync({
      priority: editing.priority,
      max_response_minutes: parseInt(editing.response) || 60,
      max_resolution_minutes: parseInt(editing.resolution) || 480,
    });
    setEditing(null);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Configuração de SLA</CardTitle>
        <CardDescription>Defina tempos máximos de resposta e resolução por prioridade</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Prioridade</TableHead>
                <TableHead>Tempo Resposta (min)</TableHead>
                <TableHead>Tempo Resolução (min)</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {priorities.map((p) => {
                const config = getConfig(p);
                const isEditing = editing?.priority === p;
                return (
                  <TableRow key={p}>
                    <TableCell>
                      <Badge variant="outline">{priorityLabels[p]}</Badge>
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Input
                          type="number"
                          value={editing.response}
                          onChange={(e) => setEditing({ ...editing, response: e.target.value })}
                          className="h-8 w-24"
                        />
                      ) : (
                        <span>{config?.max_response_minutes ?? "—"}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Input
                          type="number"
                          value={editing.resolution}
                          onChange={(e) => setEditing({ ...editing, resolution: e.target.value })}
                          className="h-8 w-24"
                        />
                      ) : (
                        <span>{config?.max_resolution_minutes ?? "—"}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <div className="flex gap-1">
                          <Button size="sm" variant="default" onClick={handleSave} disabled={upsert.isPending}>
                            Salvar
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>✕</Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditing({
                            priority: p,
                            response: (config?.max_response_minutes ?? 60).toString(),
                            resolution: (config?.max_resolution_minutes ?? 480).toString(),
                          })}
                        >
                          Editar
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
