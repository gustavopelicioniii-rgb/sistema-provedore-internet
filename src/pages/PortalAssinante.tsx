import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Smartphone, Globe, Bell, MessageSquare, FileText, CreditCard, Wifi, Settings } from "lucide-react";

const features = [
  { icon: Globe, title: "Portal Web", desc: "Acesso via navegador para consultar faturas, planos e suporte", status: "ativo" },
  { icon: Smartphone, title: "App Mobile", desc: "Aplicativo para iOS e Android com acesso rápido", status: "em breve" },
  { icon: CreditCard, title: "2ª Via de Boleto", desc: "Emissão automática de segunda via de faturas", status: "ativo" },
  { icon: Wifi, title: "Teste de Velocidade", desc: "Speed test integrado para verificar a conexão", status: "ativo" },
  { icon: MessageSquare, title: "Abertura de Chamado", desc: "O assinante pode abrir tickets diretamente", status: "ativo" },
  { icon: Bell, title: "Notificações Push", desc: "Alertas sobre vencimento, manutenções e promoções", status: "em breve" },
  { icon: FileText, title: "Histórico de Faturas", desc: "Consulta completa do histórico financeiro", status: "ativo" },
  { icon: Settings, title: "Dados Cadastrais", desc: "Atualização de dados pessoais e senha", status: "ativo" },
];

export default function PortalAssinante() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Portal do Assinante</h1>
        <p className="text-muted-foreground text-sm">App e portal web self-service para seus clientes</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((f) => (
          <Card key={f.title} className="relative">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                  <f.icon className="size-5 text-primary" />
                </div>
                <Badge variant="outline" className={f.status === "ativo" ? "bg-success/10 text-success border-success/20" : "bg-warning/10 text-warning border-warning/20"}>
                  {f.status === "ativo" ? "Ativo" : "Em breve"}
                </Badge>
              </div>
              <CardTitle className="text-sm mt-3">{f.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">{f.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Personalização do Portal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border p-4 space-y-1">
              <p className="text-sm font-medium">URL do Portal</p>
              <p className="text-xs text-muted-foreground">portal.suaempresa.com.br</p>
            </div>
            <div className="rounded-lg border p-4 space-y-1">
              <p className="text-sm font-medium">Logo & Cores</p>
              <p className="text-xs text-muted-foreground">Personalize com sua identidade visual</p>
            </div>
            <div className="rounded-lg border p-4 space-y-1">
              <p className="text-sm font-medium">Termos de Uso</p>
              <p className="text-xs text-muted-foreground">Configure termos e política de privacidade</p>
            </div>
          </div>
          <Button variant="outline" size="sm">Configurar Portal</Button>
        </CardContent>
      </Card>
    </div>
  );
}
