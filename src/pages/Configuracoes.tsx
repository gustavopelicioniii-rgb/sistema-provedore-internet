import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Building2, Bell, CreditCard, Shield, Palette, Globe } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export default function Configuracoes() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [companyName, setCompanyName] = useState("NetPulse Telecom");
  const [cnpj, setCnpj] = useState("");
  const [dueDay, setDueDay] = useState("10");

  const handleSave = () => {
    toast({ title: "Configurações salvas com sucesso!" });
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
                  <Input defaultValue={user?.email || ""} />
                </div>
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input placeholder="(00) 0000-0000" />
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Endereço</Label>
                <Input placeholder="Rua, número, bairro, cidade - UF" />
              </div>
              <Button onClick={handleSave}>Salvar Alterações</Button>
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
                  <Input type="number" defaultValue="15" />
                </div>
                <div className="space-y-2">
                  <Label>Multa por atraso (%)</Label>
                  <Input type="number" defaultValue="2" step="0.1" />
                </div>
                <div className="space-y-2">
                  <Label>Juros diário (%)</Label>
                  <Input type="number" defaultValue="0.033" step="0.001" />
                </div>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div><p className="text-sm font-medium">Gerar faturas automaticamente</p><p className="text-xs text-muted-foreground">Cria faturas com base nos contratos ativos</p></div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div><p className="text-sm font-medium">Enviar boleto por e-mail</p><p className="text-xs text-muted-foreground">Envia automaticamente após geração da fatura</p></div>
                <Switch defaultChecked />
              </div>
              <Button onClick={handleSave}>Salvar</Button>
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
              {[
                { title: "E-mail", desc: "Envio de faturas, avisos e comunicados" },
                { title: "WhatsApp", desc: "Lembretes de vencimento e confirmações" },
                { title: "SMS", desc: "Alertas urgentes e códigos de verificação" },
                { title: "Push (App)", desc: "Notificações no aplicativo do assinante" },
              ].map((n) => (
                <div key={n.title} className="flex items-center justify-between">
                  <div><p className="text-sm font-medium">{n.title}</p><p className="text-xs text-muted-foreground">{n.desc}</p></div>
                  <Switch defaultChecked={n.title === "E-mail" || n.title === "WhatsApp"} />
                </div>
              ))}
              <Separator />
              <Button onClick={handleSave}>Salvar</Button>
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
                  <Select defaultValue="dark">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Claro</SelectItem>
                      <SelectItem value="dark">Escuro</SelectItem>
                      <SelectItem value="auto">Automático</SelectItem>
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
              <div className="flex items-center justify-between">
                <div><p className="text-sm font-medium">Sidebar compacta</p><p className="text-xs text-muted-foreground">Reduz a barra lateral para ícones</p></div>
                <Switch />
              </div>
              <Button onClick={handleSave}>Salvar</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
