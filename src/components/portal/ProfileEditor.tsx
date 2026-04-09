import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { usePortalApi } from "@/hooks/usePortalApi";
import { useSubscriberAuth } from "@/hooks/useSubscriberAuth";
import { User, Save, Loader2 } from "lucide-react";

interface CustomerProfile {
  name: string;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  cpf_cnpj: string;
}

export function ProfileEditor() {
  const { toast } = useToast();
  const { customer } = useSubscriberAuth();
  const { portalFetch } = usePortalApi();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["portal-profile"],
    queryFn: () => portalFetch<CustomerProfile>("profile"),
  });

  const [form, setForm] = useState<{ phone: string; whatsapp: string } | null>(null);
  const current = form ?? {
    phone: profile?.phone ?? "",
    whatsapp: profile?.whatsapp ?? "",
  };

  const updateProfile = useMutation({
    mutationFn: async (vals: { phone: string; whatsapp: string }) => {
      await portalFetch("update-profile", {
        method: "POST",
        body: { phone: vals.phone, whatsapp: vals.whatsapp },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portal-profile"] });
      toast({ title: "Dados atualizados com sucesso!" });
      setForm(null);
    },
    onError: (e: Error) => {
      toast({ title: "Erro ao atualizar", description: e.message, variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 flex justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <User className="size-4 text-primary" /> Meus Dados
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Nome</Label>
          <Input value={profile?.name ?? customer?.name ?? ""} disabled className="bg-muted" />
        </div>

        <div className="space-y-2">
          <Label>CPF/CNPJ</Label>
          <Input value={profile?.cpf_cnpj ?? customer?.cpf ?? ""} disabled className="bg-muted" />
        </div>

        <div className="space-y-2">
          <Label>Email</Label>
          <Input value={profile?.email ?? ""} disabled className="bg-muted" />
          <p className="text-xs text-muted-foreground">Para alterar o email, entre em contato com o suporte.</p>
        </div>

        <div className="space-y-2">
          <Label>Telefone</Label>
          <Input
            value={current.phone}
            onChange={(e) => setForm({ ...current, phone: e.target.value })}
            placeholder="(00) 00000-0000"
          />
        </div>

        <div className="space-y-2">
          <Label>WhatsApp</Label>
          <Input
            value={current.whatsapp}
            onChange={(e) => setForm({ ...current, whatsapp: e.target.value })}
            placeholder="(00) 00000-0000"
          />
        </div>

        <Button
          onClick={() => updateProfile.mutate(current)}
          disabled={updateProfile.isPending || !form}
          className="w-full gap-2"
        >
          {updateProfile.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          Salvar Alterações
        </Button>
      </CardContent>
    </Card>
  );
}
