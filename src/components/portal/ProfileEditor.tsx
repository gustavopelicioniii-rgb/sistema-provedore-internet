import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { User, Save, Loader2 } from "lucide-react";

export function ProfileEditor() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["portal-profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const { data } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", user.id)
        .single();

      return {
        email: user.email ?? "",
        full_name: data?.full_name ?? "",
        phone: user.user_metadata?.phone ?? "",
      };
    },
  });

  const [form, setForm] = useState<{ full_name: string; phone: string } | null>(null);
  const current = form ?? { full_name: profile?.full_name ?? "", phone: profile?.phone ?? "" };

  const updateProfile = useMutation({
    mutationFn: async (vals: { full_name: string; phone: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const { error: profileErr } = await supabase
        .from("profiles")
        .update({ full_name: vals.full_name })
        .eq("id", user.id);
      if (profileErr) throw profileErr;

      const { error: metaErr } = await supabase.auth.updateUser({
        data: { phone: vals.phone },
      });
      if (metaErr) throw metaErr;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portal-profile"] });
      toast({ title: "Perfil atualizado com sucesso!" });
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
          <Label>Email</Label>
          <Input value={profile?.email ?? ""} disabled className="bg-muted" />
          <p className="text-xs text-muted-foreground">O email não pode ser alterado por aqui.</p>
        </div>

        <div className="space-y-2">
          <Label>Nome completo</Label>
          <Input
            value={current.full_name}
            onChange={(e) => setForm({ ...current, full_name: e.target.value })}
            placeholder="Seu nome"
          />
        </div>

        <div className="space-y-2">
          <Label>Telefone</Label>
          <Input
            value={current.phone}
            onChange={(e) => setForm({ ...current, phone: e.target.value })}
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
