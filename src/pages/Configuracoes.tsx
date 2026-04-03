import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Building2, Bell, CreditCard, Shield, Palette } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "next-themes";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

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
    mutationFn: async (updates: Record<string, unknown>) => {
      const { data: org } = await supabase.from("organizations").select("id").single();
      if (!org) throw new Error("Organização não encontrada");
      const { error } = await supabase.from("organizations").update(updates).eq("id", org.id);
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
        <TabsList>
          <TabsTrigger value="empresa"><Building2 className="size-4 mr-1.5" />Empresa</TabsTrigger>
          <TabsTrigger value="financeiro"><CreditCard className="size-4 mr-1.5" />Financeiro</TabsTrigger>
          <TabsTrigger value="notificacoes"><Bell className="size-4 mr-1.5" />Notificações</TabsTrigger>
          <TabsTrigger value="aparencia"><Palette className="size-4 mr-1.5" />Aparência</TabsTrigger>
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
      </Tabs>
    </div>
  );
}
