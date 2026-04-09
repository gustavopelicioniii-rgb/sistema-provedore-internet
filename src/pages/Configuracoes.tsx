import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Building2, Bell, CreditCard, Shield, Palette, MessageSquare, Phone, Instagram, Facebook, Globe, Send, Mail, Loader2, Eye, EyeOff, Plus, Pencil, Trash2, Zap, RefreshCw, QrCode, Power, PowerOff, Wifi, WifiOff, CheckCircle2, XCircle, Smartphone, Activity, ScrollText, Server, Plug } from "lucide-react";
import { RbacManager, SlaConfigManager } from "@/components/settings/RbacAndSlaManagers";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "next-themes";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  useCannedResponses, useCreateCannedResponse, useUpdateCannedResponse, useDeleteCannedResponse,
  type CannedResponse,
} from "@/hooks/useChat";
import { useAuditLogs } from "@/hooks/useAuditLogs";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface OrgSettings {
  due_day?: string;
  suspension_days?: string;
  late_fee?: string;
  daily_interest?: string;
  auto_invoices?: boolean;
  send_boleto_email?: boolean;
  notifications?: {
    email?: boolean;
    whatsapp?: boolean;
    sms?: boolean;
    push?: boolean;
  };
}

function useOrganization() {
  return useQuery({
    queryKey: ["organization"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organizations")
        .select("*")
        .single();
      if (error) throw error;
      return data;
    },
  });
}

function useUpdateOrganization() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (updates: any) => {
      const { data: org } = await supabase.from("organizations").select("id").single();
      if (!org) throw new Error("Organização não encontrada");
      const { error } = await supabase.from("organizations").update(updates as any).eq("id", org.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization"] });
      toast({ title: "Configurações salvas com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao salvar", variant: "destructive" });
    },
  });
}

// --- Channel Config types and hooks ---
type ChatChannel = "whatsapp" | "instagram" | "facebook" | "website" | "telegram" | "email";

interface ChannelConfigRow {
  id: string;
  organization_id: string;
  channel: ChatChannel;
  enabled: boolean;
  config: Record<string, string> | null;
}

const channelMeta: Record<ChatChannel, { label: string; icon: React.ElementType; color: string; fields: { key: string; label: string; placeholder: string; secret?: boolean }[] }> = {
  whatsapp: {
    label: "WhatsApp",
    icon: Phone,
    color: "text-emerald-500",
    fields: [
      { key: "api_url", label: "URL da Evolution API", placeholder: "https://api.evolution.example.com" },
      { key: "api_key", label: "API Key", placeholder: "Chave de autenticação", secret: true },
      { key: "instance", label: "Instância", placeholder: "Nome da instância" },
      { key: "webhook_secret", label: "Webhook Secret (opcional)", placeholder: "Secret para validar webhooks", secret: true },
    ],
  },
  instagram: {
    label: "Instagram",
    icon: Instagram,
    color: "text-pink-500",
    fields: [
      { key: "page_id", label: "Page ID", placeholder: "ID da página do Instagram" },
      { key: "access_token", label: "Access Token", placeholder: "Token de acesso da Graph API", secret: true },
      { key: "app_secret", label: "App Secret", placeholder: "Secret do App do Facebook", secret: true },
      { key: "webhook_verify_token", label: "Webhook Verify Token", placeholder: "Token de verificação" },
    ],
  },
  facebook: {
    label: "Facebook Messenger",
    icon: Facebook,
    color: "text-blue-600",
    fields: [
      { key: "page_id", label: "Page ID", placeholder: "ID da página do Facebook" },
      { key: "access_token", label: "Page Access Token", placeholder: "Token de acesso da página", secret: true },
      { key: "app_secret", label: "App Secret", placeholder: "Secret do App", secret: true },
      { key: "webhook_verify_token", label: "Webhook Verify Token", placeholder: "Token de verificação" },
    ],
  },
  website: {
    label: "Chat do Site",
    icon: Globe,
    color: "text-primary",
    fields: [
      { key: "widget_color", label: "Cor do Widget", placeholder: "#3B82F6" },
      { key: "welcome_message", label: "Mensagem de Boas-vindas", placeholder: "Olá! Como posso ajudar?" },
      { key: "allowed_domains", label: "Domínios Permitidos", placeholder: "meusite.com.br, outro.com" },
    ],
  },
  telegram: {
    label: "Telegram",
    icon: Send,
    color: "text-sky-500",
    fields: [
      { key: "bot_token", label: "Bot Token", placeholder: "Token do bot (@BotFather)", secret: true },
      { key: "bot_username", label: "Username do Bot", placeholder: "@meubot" },
    ],
  },
  email: {
    label: "E-mail",
    icon: Mail,
    color: "text-amber-600",
    fields: [
      { key: "smtp_host", label: "Servidor SMTP", placeholder: "smtp.gmail.com" },
      { key: "smtp_port", label: "Porta SMTP", placeholder: "587" },
      { key: "smtp_user", label: "Usuário SMTP", placeholder: "email@provedor.com" },
      { key: "smtp_password", label: "Senha SMTP", placeholder: "Senha do e-mail", secret: true },
      { key: "imap_host", label: "Servidor IMAP", placeholder: "imap.gmail.com" },
    ],
  },
};

function useChannelConfigs() {
  return useQuery({
    queryKey: ["channel-configs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("channel_configs")
        .select("*")
        .order("channel");
      if (error) throw error;
      return (data ?? []) as unknown as ChannelConfigRow[];
    },
  });
}

function useUpsertChannelConfig() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ channel, enabled, config }: { channel: ChatChannel; enabled: boolean; config: Record<string, string> }) => {
      const orgId = (await supabase.rpc("get_user_organization_id")).data;
      if (!orgId) throw new Error("Organização não encontrada");

      // Check if config exists
      const { data: existing } = await supabase
        .from("channel_configs")
        .select("id")
        .eq("organization_id", orgId)
        .eq("channel", channel)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("channel_configs")
          .update({ enabled, config: config as any, updated_at: new Date().toISOString() })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("channel_configs")
          .insert({ organization_id: orgId, channel: channel as any, enabled, config: config as any });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["channel-configs"] });
      toast({ title: "Canal atualizado com sucesso!" });
    },
    onError: (e: Error) => {
      toast({ title: "Erro ao salvar canal", description: e.message, variant: "destructive" });
    },
  });
}

// --- Channel Config Card ---
function ChannelConfigCard({ channel, existing }: { channel: ChatChannel; existing?: ChannelConfigRow }) {
  const meta = channelMeta[channel];
  const Icon = meta.icon;
  const upsert = useUpsertChannelConfig();

  const [enabled, setEnabled] = useState(existing?.enabled ?? false);
  const [fields, setFields] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    meta.fields.forEach((f) => { init[f.key] = (existing?.config as any)?.[f.key] || ""; });
    return init;
  });
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (existing) {
      setEnabled(existing.enabled);
      const updated: Record<string, string> = {};
      meta.fields.forEach((f) => { updated[f.key] = (existing.config as any)?.[f.key] || ""; });
      setFields(updated);
    }
  }, [existing]);

  const handleSave = () => {
    upsert.mutate({ channel, enabled, config: fields });
  };

  const toggleSecret = (key: string) => {
    setShowSecrets((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const hasRequiredFields = meta.fields.some((f) => fields[f.key]?.trim());

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`flex size-9 items-center justify-center rounded-lg bg-muted ${meta.color}`}>
              <Icon className="size-4" />
            </div>
            <div>
              <CardTitle className="text-base">{meta.label}</CardTitle>
              <CardDescription className="text-xs">
                {enabled && hasRequiredFields ? "Configurado" : "Não configurado"}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {enabled && hasRequiredFields && (
              <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]">Ativo</Badge>
            )}
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>
        </div>
      </CardHeader>
      {enabled && (
        <CardContent className="space-y-3 pt-0">
          <Separator />
          <div className="grid gap-3 sm:grid-cols-2">
            {meta.fields.map((f) => (
              <div key={f.key} className="space-y-1.5">
                <Label className="text-xs">{f.label}</Label>
                <div className="relative">
                  <Input
                    type={f.secret && !showSecrets[f.key] ? "password" : "text"}
                    value={fields[f.key]}
                    onChange={(e) => setFields((prev) => ({ ...prev, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    className="text-sm pr-9"
                  />
                  {f.secret && (
                    <button
                      type="button"
                      onClick={() => toggleSecret(f.key)}
                      className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                    >
                      {showSecrets[f.key] ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end pt-1">
            <Button size="sm" onClick={handleSave} disabled={upsert.isPending}>
              {upsert.isPending ? <><Loader2 className="size-3 animate-spin mr-1.5" />Salvando...</> : "Salvar"}
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

// --- Respostas Rápidas Tab ---
function RespostasRapidasTab() {
  const { data: responses, isLoading } = useCannedResponses();
  const createMut = useCreateCannedResponse();
  const updateMut = useUpdateCannedResponse();
  const deleteMut = useDeleteCannedResponse();
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CannedResponse | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [shortcut, setShortcut] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const openNew = () => {
    setEditing(null);
    setShortcut("");
    setTitle("");
    setContent("");
    setDialogOpen(true);
  };

  const openEdit = (r: CannedResponse) => {
    setEditing(r);
    setShortcut(r.shortcut);
    setTitle(r.title);
    setContent(r.content);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!shortcut.trim() || !title.trim() || !content.trim()) {
      toast({ title: "Preencha todos os campos", variant: "destructive" });
      return;
    }
    if (editing) {
      await updateMut.mutateAsync({ id: editing.id, shortcut: shortcut.trim(), title: title.trim(), content: content.trim() });
    } else {
      await createMut.mutateAsync({ shortcut: shortcut.trim(), title: title.trim(), content: content.trim() });
    }
    toast({ title: editing ? "Resposta atualizada!" : "Resposta criada!" });
    setDialogOpen(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteMut.mutateAsync(deleteId);
    toast({ title: "Resposta excluída!" });
    setDeleteId(null);
  };

  const isSaving = createMut.isPending || updateMut.isPending;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Respostas Rápidas</CardTitle>
              <CardDescription>
                Crie atalhos para mensagens frequentes. No chat, digite <code className="bg-muted px-1.5 py-0.5 rounded text-[11px]">/atalho</code> para usar.
              </CardDescription>
            </div>
            <Button size="sm" onClick={openNew}>
              <Plus className="size-4 mr-1.5" />Nova Resposta
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : !responses?.length ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Zap className="size-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">Nenhuma resposta rápida cadastrada</p>
              <Button variant="outline" className="mt-4" onClick={openNew}>
                <Plus className="size-4 mr-1.5" />Criar primeira resposta
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-32">Atalho</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead className="hidden md:table-cell">Conteúdo</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {responses.map((r) => (
                  <TableRow key={r.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openEdit(r)}>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">/{r.shortcut}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{r.title}</TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground text-sm truncate max-w-xs">
                      {r.content}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="size-7" onClick={(e) => { e.stopPropagation(); openEdit(r); }}>
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="size-7 text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteId(r.id); }}>
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Resposta Rápida" : "Nova Resposta Rápida"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Atalho</Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">/</span>
                  <Input value={shortcut} onChange={(e) => setShortcut(e.target.value.replace(/\s/g, ""))} placeholder="saudacao" className="pl-7" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Título</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Saudação padrão" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Conteúdo da mensagem</Label>
              <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Olá! Obrigado por entrar em contato..." rows={4} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? <><Loader2 className="size-3 animate-spin mr-1.5" />Salvando...</> : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir resposta rápida?</AlertDialogTitle>
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


// ── WhatsApp Instance Manager (Evolution API v2) ──
function WhatsAppInstanceManager() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [instanceData, setInstanceData] = useState<any>(null);
  const [qrDialog, setQrDialog] = useState(false);
  const [qrData, setQrData] = useState<any>(null);
  const [createDialog, setCreateDialog] = useState(false);
  const [newInstanceName, setNewInstanceName] = useState("");
  const [newInstanceNumber, setNewInstanceNumber] = useState("");
  const { toast } = useToast();

  const callWhatsAppApi = useCallback(async (action: string, params: Record<string, unknown> = {}) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Not authenticated");

    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/whatsapp-api`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ action, params }),
      }
    );
    const data = await res.json();
    if (!res.ok || data.error) {
      throw new Error(data.error || "API error");
    }
    return data.data;
  }, []);

  const checkStatus = useCallback(async () => {
    setLoading(true);
    try {
      const result = await callWhatsAppApi("instance_connection_state");
      setStatus(result?.instance?.state || result?.state || "unknown");
      setInstanceData(result);
    } catch (e: any) {
      setStatus("error");
      toast({ title: "Erro ao verificar status", description: e.message, variant: "destructive" });
    }
    setLoading(false);
  }, [callWhatsAppApi, toast]);

  const handleConnect = async () => {
    setLoading(true);
    try {
      const result = await callWhatsAppApi("instance_connect");
      setQrData(result);
      setQrDialog(true);
    } catch (e: any) {
      toast({ title: "Erro ao conectar", description: e.message, variant: "destructive" });
    }
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!newInstanceName.trim()) {
      toast({ title: "Informe o nome da instância", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const webhookUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/whatsapp-webhook`;
      const params: Record<string, unknown> = {
        instanceName: newInstanceName.trim(),
        webhookUrl,
      };
      if (newInstanceNumber.trim()) {
        params.number = newInstanceNumber.trim();
      }
      const result = await callWhatsAppApi("instance_create", params);
      toast({ title: "Instância criada com sucesso!" });
      setCreateDialog(false);
      setNewInstanceName("");
      setNewInstanceNumber("");

      // If QR code returned, show it
      if (result?.qrcode || result?.pairingCode) {
        setQrData(result);
        setQrDialog(true);
      }
    } catch (e: any) {
      toast({ title: "Erro ao criar instância", description: e.message, variant: "destructive" });
    }
    setLoading(false);
  };

  const handleRestart = async () => {
    setLoading(true);
    try {
      await callWhatsAppApi("instance_restart");
      toast({ title: "Instância reiniciada!" });
      setTimeout(checkStatus, 2000);
    } catch (e: any) {
      toast({ title: "Erro ao reiniciar", description: e.message, variant: "destructive" });
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await callWhatsAppApi("instance_logout");
      toast({ title: "Desconectado do WhatsApp" });
      setStatus("close");
    } catch (e: any) {
      toast({ title: "Erro ao desconectar", description: e.message, variant: "destructive" });
    }
    setLoading(false);
  };

  const handleFetchInstances = async () => {
    setLoading(true);
    try {
      const result = await callWhatsAppApi("instance_fetch");
      setInstanceData(result);
      toast({ title: `${Array.isArray(result) ? result.length : 0} instância(s) encontrada(s)` });
    } catch (e: any) {
      toast({ title: "Erro ao buscar instâncias", description: e.message, variant: "destructive" });
    }
    setLoading(false);
  };

  const statusColor = status === "open" ? "text-emerald-500" : status === "close" ? "text-destructive" : "text-muted-foreground";
  const statusLabel = status === "open" ? "Conectado" : status === "close" ? "Desconectado" : status === "error" ? "Erro" : status || "—";
  const StatusIcon = status === "open" ? CheckCircle2 : status === "close" ? XCircle : WifiOff;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
              <Smartphone className="size-4" />
            </div>
            <div>
              <CardTitle className="text-base">Gerenciamento da Instância</CardTitle>
              <CardDescription className="text-xs">
                Controle sua conexão WhatsApp via Evolution API v2
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusIcon className={`size-4 ${statusColor}`} />
            <span className={`text-xs font-medium ${statusColor}`}>{statusLabel}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <Separator />
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={checkStatus} disabled={loading}>
            {loading ? <Loader2 className="size-3 animate-spin mr-1.5" /> : <Wifi className="size-3 mr-1.5" />}
            Verificar Status
          </Button>
          <Button size="sm" variant="outline" onClick={handleConnect} disabled={loading}>
            <QrCode className="size-3 mr-1.5" />QR Code / Parear
          </Button>
          <Button size="sm" variant="outline" onClick={() => setCreateDialog(true)} disabled={loading}>
            <Plus className="size-3 mr-1.5" />Nova Instância
          </Button>
          <Button size="sm" variant="outline" onClick={handleFetchInstances} disabled={loading}>
            <RefreshCw className="size-3 mr-1.5" />Listar Instâncias
          </Button>
          <Button size="sm" variant="outline" onClick={handleRestart} disabled={loading}>
            <Power className="size-3 mr-1.5" />Reiniciar
          </Button>
          <Button size="sm" variant="outline" onClick={handleLogout} disabled={loading} className="text-destructive hover:text-destructive">
            <PowerOff className="size-3 mr-1.5" />Desconectar
          </Button>
        </div>

        {/* Instance list display */}
        {instanceData && Array.isArray(instanceData) && instanceData.length > 0 && (
          <div className="mt-3 space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Instâncias encontradas:</p>
            <div className="grid gap-2">
              {instanceData.map((inst: any, i: number) => (
                <div key={i} className="flex items-center justify-between rounded-md border p-2.5 text-sm">
                  <div className="flex items-center gap-2">
                    <Smartphone className="size-3.5 text-muted-foreground" />
                    <span className="font-medium">{inst.instance?.instanceName || inst.instanceName || `Instância ${i + 1}`}</span>
                  </div>
                  <Badge variant="outline" className="text-[10px]">
                    {inst.instance?.status || inst.status || "unknown"}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>

      {/* QR Code / Pairing Dialog */}
      <Dialog open={qrDialog} onOpenChange={setQrDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><QrCode className="size-5" />Conectar WhatsApp</DialogTitle>
            <DialogDescription>Escaneie o QR Code ou use o código de pareamento no WhatsApp</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            {qrData?.base64 && (
              <img
                src={qrData.base64.startsWith("data:") ? qrData.base64 : `data:image/png;base64,${qrData.base64}`}
                alt="QR Code WhatsApp"
                className="w-64 h-64 rounded-lg border"
              />
            )}
            {qrData?.pairingCode && (
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Código de Pareamento:</p>
                <code className="text-2xl font-bold tracking-widest text-primary">{qrData.pairingCode}</code>
              </div>
            )}
            {qrData?.code && !qrData?.base64 && !qrData?.pairingCode && (
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Código:</p>
                <code className="text-sm break-all bg-muted p-2 rounded">{qrData.code}</code>
              </div>
            )}
            {!qrData?.base64 && !qrData?.pairingCode && !qrData?.code && (
              <p className="text-sm text-muted-foreground">Nenhum QR Code disponível. Verifique se a instância foi criada.</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setQrDialog(false); checkStatus(); }}>
              Fechar e Verificar Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Instance Dialog */}
      <Dialog open={createDialog} onOpenChange={setCreateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Criar Nova Instância</DialogTitle>
            <DialogDescription>Crie uma instância da Evolution API para conectar o WhatsApp</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nome da Instância</Label>
              <Input
                value={newInstanceName}
                onChange={(e) => setNewInstanceName(e.target.value)}
                placeholder="minha-instancia"
              />
            </div>
            <div className="space-y-2">
              <Label>Número do WhatsApp (opcional)</Label>
              <Input
                value={newInstanceNumber}
                onChange={(e) => setNewInstanceNumber(e.target.value)}
                placeholder="5511999999999"
              />
              <p className="text-[11px] text-muted-foreground">
                Se informado, usa pareamento por código em vez de QR Code.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialog(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={loading}>
              {loading ? <><Loader2 className="size-3 animate-spin mr-1.5" />Criando...</> : "Criar Instância"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function CanaisTab() {
  const { data: configs, isLoading } = useChannelConfigs();
  const channels: ChatChannel[] = ["whatsapp", "instagram", "facebook", "website", "telegram", "email"];
  const whatsappConfig = configs?.find((c) => c.channel === "whatsapp");
  const hasWhatsappConfigured = whatsappConfig?.enabled && (whatsappConfig.config as any)?.api_url;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Canais de Atendimento</CardTitle>
          <CardDescription>
            Configure as credenciais de API para cada canal de comunicação. As mensagens recebidas serão centralizadas na aba de Atendimento.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {channels.map((ch) => {
          const existing = configs?.find((c) => c.channel === ch);
          return <ChannelConfigCard key={ch} channel={ch} existing={existing} />;
        })}
      </div>

      {/* WhatsApp Instance Manager — only shows when WhatsApp is configured */}
      {hasWhatsappConfigured && <WhatsAppInstanceManager />}

      <Card>
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground">
            <strong>WhatsApp:</strong> Configure a URL do webhook na Evolution API como:{" "}
            <code className="bg-muted px-1.5 py-0.5 rounded text-[11px]">
              {import.meta.env.VITE_SUPABASE_URL}/functions/v1/whatsapp-webhook
            </code>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// --- Integrations Status Panel ---
function IntegrationsPanel() {
  const { data: configs, isLoading } = useChannelConfigs();

  const integrations = [
    {
      name: "WhatsApp (Evolution API)",
      icon: Phone,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
      check: () => {
        const waCfg = configs?.find((c) => c.channel === "whatsapp");
        return waCfg?.enabled && (waCfg.config as any)?.api_url;
      },
    },
    {
      name: "Gateway de Pagamento",
      icon: CreditCard,
      color: "text-primary",
      bgColor: "bg-primary/10",
      check: () => false, // No gateway config table yet
    },
    {
      name: "MikroTik (RouterOS)",
      icon: Server,
      color: "text-sky-500",
      bgColor: "bg-sky-500/10",
      check: () => false, // Depends on network_devices having mikrotik
    },
    {
      name: "E-mail (SMTP)",
      icon: Mail,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
      check: () => {
        const emailCfg = configs?.find((c) => c.channel === "email");
        return emailCfg?.enabled && (emailCfg.config as any)?.smtp_host;
      },
    },
    {
      name: "Telegram Bot",
      icon: Send,
      color: "text-sky-500",
      bgColor: "bg-sky-500/10",
      check: () => {
        const tgCfg = configs?.find((c) => c.channel === "telegram");
        return tgCfg?.enabled && (tgCfg.config as any)?.bot_token;
      },
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Plug className="size-4" /> Status das Integrações
          </CardTitle>
          <CardDescription>Visão geral de todas as integrações configuradas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {integrations.map((integ) => {
              const active = integ.check();
              return (
                <div key={integ.name} className="flex items-center gap-3 rounded-lg border p-3">
                  <div className={`flex size-9 items-center justify-center rounded-lg ${integ.bgColor} ${integ.color}`}>
                    <integ.icon className="size-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{integ.name}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {active ? (
                      <>
                        <CheckCircle2 className="size-4 text-emerald-500" />
                        <span className="text-xs font-medium text-emerald-500">Ativo</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="size-4 text-muted-foreground" />
                        <span className="text-xs font-medium text-muted-foreground">Inativo</span>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground">
            Configure as chaves de API e credenciais na aba <strong>Canais</strong>. As integrações de pagamento e rede são configuradas via funções de backend.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// --- Audit Log Viewer ---
function AuditLogViewer() {
  const { data: logs, isLoading } = useAuditLogs(100);

  const actionLabels: Record<string, string> = {
    create: "Criou",
    update: "Atualizou",
    delete: "Excluiu",
    login: "Fez login",
    export: "Exportou",
  };

  const entityLabels: Record<string, string> = {
    customer: "Cliente",
    contract: "Contrato",
    invoice: "Fatura",
    plan: "Plano",
    technician: "Técnico",
    service_order: "Ordem de Serviço",
    ticket: "Ticket",
    settings: "Configurações",
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ScrollText className="size-4" /> Logs de Auditoria
          </CardTitle>
          <CardDescription>Registro imutável de ações críticas no sistema</CardDescription>
        </CardHeader>
        <CardContent>
          {!logs?.length ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ScrollText className="size-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">Nenhum log de auditoria registrado ainda.</p>
            </div>
          ) : (
            <div className="max-h-[500px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Quando</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Ação</TableHead>
                    <TableHead>Entidade</TableHead>
                    <TableHead className="hidden md:table-cell">Detalhes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: ptBR })}
                      </TableCell>
                      <TableCell className="text-sm font-medium">{log.user_name || "Sistema"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {actionLabels[log.action] || log.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {entityLabels[log.entity_type] || log.entity_type}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-xs text-muted-foreground max-w-xs truncate">
                        {log.details && Object.keys(log.details).length > 0
                          ? JSON.stringify(log.details).slice(0, 80)
                          : "—"}
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

export default function Configuracoes() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const { data: org, isLoading } = useOrganization();
  const updateOrg = useUpdateOrganization();

  const [companyName, setCompanyName] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const settings = (org?.settings as OrgSettings) || {};
  const [dueDay, setDueDay] = useState("10");
  const [suspensionDays, setSuspensionDays] = useState("15");
  const [lateFee, setLateFee] = useState("2");
  const [dailyInterest, setDailyInterest] = useState("0.033");
  const [autoInvoices, setAutoInvoices] = useState(true);
  const [sendBoleto, setSendBoleto] = useState(true);

  const [notifEmail, setNotifEmail] = useState(true);
  const [notifWhatsapp, setNotifWhatsapp] = useState(true);
  const [notifSms, setNotifSms] = useState(false);
  const [notifPush, setNotifPush] = useState(false);

  useEffect(() => {
    if (!org) return;
    setCompanyName(org.name || "");
    setCnpj(org.cnpj || "");
    const addr = org.address as Record<string, string> | null;
    setAddress(addr?.full || "");
    setContactEmail(user?.email || "");

    if (settings.due_day) setDueDay(settings.due_day);
    if (settings.suspension_days) setSuspensionDays(settings.suspension_days);
    if (settings.late_fee) setLateFee(settings.late_fee);
    if (settings.daily_interest) setDailyInterest(settings.daily_interest);
    if (settings.auto_invoices !== undefined) setAutoInvoices(settings.auto_invoices);
    if (settings.send_boleto_email !== undefined) setSendBoleto(settings.send_boleto_email);
    if (settings.notifications) {
      setNotifEmail(settings.notifications.email ?? true);
      setNotifWhatsapp(settings.notifications.whatsapp ?? true);
      setNotifSms(settings.notifications.sms ?? false);
      setNotifPush(settings.notifications.push ?? false);
    }
  }, [org, user]);

  const saveCompany = () => {
    updateOrg.mutate({
      name: companyName,
      cnpj,
      address: { full: address },
    });
  };

  const saveFinanceiro = () => {
    updateOrg.mutate({
      settings: {
        ...settings,
        due_day: dueDay,
        suspension_days: suspensionDays,
        late_fee: lateFee,
        daily_interest: dailyInterest,
        auto_invoices: autoInvoices,
        send_boleto_email: sendBoleto,
      },
    });
  };

  const saveNotificacoes = () => {
    updateOrg.mutate({
      settings: {
        ...settings,
        notifications: {
          email: notifEmail,
          whatsapp: notifWhatsapp,
          sms: notifSms,
          push: notifPush,
        },
      },
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground text-sm">Configurações gerais do sistema e da organização</p>
      </div>

      <Tabs defaultValue="empresa" className="space-y-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="empresa"><Building2 className="size-4 mr-1.5" />Empresa</TabsTrigger>
          <TabsTrigger value="canais"><MessageSquare className="size-4 mr-1.5" />Canais</TabsTrigger>
          <TabsTrigger value="financeiro"><CreditCard className="size-4 mr-1.5" />Financeiro</TabsTrigger>
          <TabsTrigger value="notificacoes"><Bell className="size-4 mr-1.5" />Notificações</TabsTrigger>
          <TabsTrigger value="respostas"><Zap className="size-4 mr-1.5" />Respostas Rápidas</TabsTrigger>
          <TabsTrigger value="integracoes"><Plug className="size-4 mr-1.5" />Integrações</TabsTrigger>
          <TabsTrigger value="aparencia"><Palette className="size-4 mr-1.5" />Aparência</TabsTrigger>
          <TabsTrigger value="permissoes"><Shield className="size-4 mr-1.5" />Permissões</TabsTrigger>
          <TabsTrigger value="sla">SLA</TabsTrigger>
          <TabsTrigger value="auditoria"><ScrollText className="size-4 mr-1.5" />Auditoria</TabsTrigger>
        </TabsList>

        <TabsContent value="empresa" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Dados da Empresa</CardTitle>
              <CardDescription>Informações básicas da sua organização</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Nome da Empresa</Label>
                  <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>CNPJ</Label>
                  <Input value={cnpj} onChange={(e) => setCnpj(e.target.value)} placeholder="00.000.000/0000-00" />
                </div>
                <div className="space-y-2">
                  <Label>E-mail de contato</Label>
                  <Input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(00) 0000-0000" />
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Endereço</Label>
                <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Rua, número, bairro, cidade - UF" />
              </div>
              <Button onClick={saveCompany} disabled={updateOrg.isPending}>
                {updateOrg.isPending ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><Shield className="size-4" />Segurança</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div><p className="text-sm font-medium">Autenticação de dois fatores</p><p className="text-xs text-muted-foreground">Adiciona uma camada extra de segurança</p></div>
                <Switch />
              </div>
              <div className="flex items-center justify-between">
                <div><p className="text-sm font-medium">Sessão única</p><p className="text-xs text-muted-foreground">Permitir apenas uma sessão ativa por usuário</p></div>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="canais" className="space-y-4">
          <CanaisTab />
        </TabsContent>

        <TabsContent value="respostas" className="space-y-4">
          <RespostasRapidasTab />
        </TabsContent>

        <TabsContent value="financeiro" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Configurações Financeiras</CardTitle>
              <CardDescription>Parâmetros de cobrança e faturamento</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Dia de vencimento padrão</Label>
                  <Select value={dueDay} onValueChange={setDueDay}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[5, 10, 15, 20, 25].map((d) => (
                        <SelectItem key={d} value={String(d)}>Dia {d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Dias para suspensão</Label>
                  <Input type="number" value={suspensionDays} onChange={(e) => setSuspensionDays(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Multa por atraso (%)</Label>
                  <Input type="number" value={lateFee} onChange={(e) => setLateFee(e.target.value)} step="0.1" />
                </div>
                <div className="space-y-2">
                  <Label>Juros diário (%)</Label>
                  <Input type="number" value={dailyInterest} onChange={(e) => setDailyInterest(e.target.value)} step="0.001" />
                </div>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div><p className="text-sm font-medium">Gerar faturas automaticamente</p><p className="text-xs text-muted-foreground">Cria faturas com base nos contratos ativos</p></div>
                <Switch checked={autoInvoices} onCheckedChange={setAutoInvoices} />
              </div>
              <div className="flex items-center justify-between">
                <div><p className="text-sm font-medium">Enviar boleto por e-mail</p><p className="text-xs text-muted-foreground">Envia automaticamente após geração da fatura</p></div>
                <Switch checked={sendBoleto} onCheckedChange={setSendBoleto} />
              </div>
              <Button onClick={saveFinanceiro} disabled={updateOrg.isPending}>
                {updateOrg.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notificacoes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Canais de Notificação</CardTitle>
              <CardDescription>Configure como e quando seus clientes são notificados</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div><p className="text-sm font-medium">E-mail</p><p className="text-xs text-muted-foreground">Envio de faturas, avisos e comunicados</p></div>
                <Switch checked={notifEmail} onCheckedChange={setNotifEmail} />
              </div>
              <div className="flex items-center justify-between">
                <div><p className="text-sm font-medium">WhatsApp</p><p className="text-xs text-muted-foreground">Lembretes de vencimento e confirmações</p></div>
                <Switch checked={notifWhatsapp} onCheckedChange={setNotifWhatsapp} />
              </div>
              <div className="flex items-center justify-between">
                <div><p className="text-sm font-medium">SMS</p><p className="text-xs text-muted-foreground">Alertas urgentes e códigos de verificação</p></div>
                <Switch checked={notifSms} onCheckedChange={setNotifSms} />
              </div>
              <div className="flex items-center justify-between">
                <div><p className="text-sm font-medium">Push (App)</p><p className="text-xs text-muted-foreground">Notificações no aplicativo do assinante</p></div>
                <Switch checked={notifPush} onCheckedChange={setNotifPush} />
              </div>
              <Separator />
              <Button onClick={saveNotificacoes} disabled={updateOrg.isPending}>
                {updateOrg.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="aparencia" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><Palette className="size-4" />Personalização Visual</CardTitle>
              <CardDescription>Customize a aparência do sistema</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Tema</Label>
                  <Select value={theme} onValueChange={setTheme}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Claro</SelectItem>
                      <SelectItem value="dark">Escuro</SelectItem>
                      <SelectItem value="system">Automático</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Idioma</Label>
                  <Select defaultValue="pt-BR">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pt-BR">Português (BR)</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissoes" className="space-y-4">
          <RbacManager />
        </TabsContent>

        <TabsContent value="sla" className="space-y-4">
          <SlaConfigManager />
        </TabsContent>

        <TabsContent value="integracoes" className="space-y-4">
          <IntegrationsPanel />
        </TabsContent>

        <TabsContent value="auditoria" className="space-y-4">
          <AuditLogViewer />
        </TabsContent>
      </Tabs>
    </div>
  );
}
