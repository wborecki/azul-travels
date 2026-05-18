import { createFileRoute, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/minha-empresa")({
  head: () => ({ meta: [{ title: "Minha empresa · Turismo Azul" }] }),
  component: MinhaEmpresaPage,
});

type Estab = Tables<"estabelecimentos">;

const RECURSOS: Array<{ key: keyof Estab; label: string }> = [
  { key: "tem_caa", label: "Comunicação alternativa (CAA)" },
  { key: "tem_cardapio_visual", label: "Cardápio visual" },
  { key: "tem_fila_prioritaria", label: "Fila prioritária" },
  { key: "tem_checkin_antecipado", label: "Check-in antecipado" },
  { key: "tem_concierge_tea", label: "Concierge TEA" },
  { key: "tem_sala_sensorial", label: "Sala sensorial" },
];

function MinhaEmpresaPage() {
  const { user, loading, isEstabelecimento, role } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [estab, setEstab] = useState<Estab | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: "/login", search: { redirect: pathname } });
      return;
    }
    if (role && !isEstabelecimento && role !== "admin") {
      navigate({ to: "/minha-conta" });
      return;
    }
    void (async () => {
      const { data } = await supabase
        .from("estabelecimentos")
        .select("*")
        .eq("owner_user_id", user.id)
        .maybeSingle();
      setEstab(data ?? null);
      setCarregando(false);
    })();
  }, [user, loading, role, isEstabelecimento, pathname, navigate]);

  async function salvar() {
    if (!estab) return;
    setSalvando(true);
    const { error } = await supabase
      .from("estabelecimentos")
      .update({
        nome: estab.nome,
        descricao: estab.descricao,
        descricao_tea: estab.descricao_tea,
        cidade: estab.cidade,
        estado: estab.estado,
        endereco: estab.endereco,
        cep: estab.cep,
        telefone: estab.telefone,
        email: estab.email,
        website: estab.website,
        tem_caa: estab.tem_caa,
        tem_cardapio_visual: estab.tem_cardapio_visual,
        tem_fila_prioritaria: estab.tem_fila_prioritaria,
        tem_checkin_antecipado: estab.tem_checkin_antecipado,
        tem_concierge_tea: estab.tem_concierge_tea,
        tem_sala_sensorial: estab.tem_sala_sensorial,
      })
      .eq("id", estab.id);
    setSalvando(false);
    if (error) {
      toast.error("Erro ao salvar: " + error.message);
      return;
    }
    toast.success("Cadastro atualizado!");
  }

  if (loading || carregando) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando…
        </main>
        <Footer />
      </div>
    );
  }

  if (!estab) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 pt-24 pb-12">
          <div className="max-w-2xl mx-auto bg-white border rounded-2xl p-8 text-center">
            <h1 className="text-2xl font-display font-bold text-primary">
              Nenhum cadastro encontrado
            </h1>
            <p className="mt-2 text-muted-foreground">
              Sua conta ainda não tem um estabelecimento vinculado. Entre em contato com o time
              do Turismo Azul.
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-azul-claro/20">
      <Header />
      <main className="flex-1 container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-baseline justify-between mb-6">
            <h1 className="text-3xl font-display font-bold text-primary">Minha empresa</h1>
            <span className="text-sm text-muted-foreground">
              Status: <strong className="text-foreground">{estab.status}</strong>
            </span>
          </div>

          <div className="bg-white border rounded-2xl p-6 md:p-8 space-y-4">
            <Field label="Nome do estabelecimento">
              <Input value={estab.nome ?? ""} onChange={(e) => setEstab({ ...estab, nome: e.target.value })} />
            </Field>

            <Field label="Descrição geral">
              <Textarea
                rows={3}
                value={estab.descricao ?? ""}
                onChange={(e) => setEstab({ ...estab, descricao: e.target.value })}
              />
            </Field>

            <Field label="Descrição TEA - o que vocês oferecem para autistas?">
              <Textarea
                rows={4}
                value={estab.descricao_tea ?? ""}
                onChange={(e) => setEstab({ ...estab, descricao_tea: e.target.value })}
              />
            </Field>

            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Cidade">
                <Input value={estab.cidade ?? ""} onChange={(e) => setEstab({ ...estab, cidade: e.target.value })} />
              </Field>
              <Field label="Estado (UF)">
                <Input
                  maxLength={2}
                  value={estab.estado ?? ""}
                  onChange={(e) => setEstab({ ...estab, estado: e.target.value.toUpperCase() })}
                />
              </Field>
            </div>

            <Field label="Endereço">
              <Input value={estab.endereco ?? ""} onChange={(e) => setEstab({ ...estab, endereco: e.target.value })} />
            </Field>

            <div className="grid sm:grid-cols-3 gap-4">
              <Field label="CEP">
                <Input value={estab.cep ?? ""} onChange={(e) => setEstab({ ...estab, cep: e.target.value })} />
              </Field>
              <Field label="Telefone">
                <Input value={estab.telefone ?? ""} onChange={(e) => setEstab({ ...estab, telefone: e.target.value })} />
              </Field>
              <Field label="E-mail público">
                <Input
                  type="email"
                  value={estab.email ?? ""}
                  onChange={(e) => setEstab({ ...estab, email: e.target.value })}
                />
              </Field>
            </div>

            <Field label="Website">
              <Input value={estab.website ?? ""} onChange={(e) => setEstab({ ...estab, website: e.target.value })} />
            </Field>

            <div>
              <Label className="mb-2 block">Recursos para o público TEA</Label>
              <div className="grid sm:grid-cols-2 gap-2">
                {RECURSOS.map((r) => (
                  <label key={r.key as string} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox
                      checked={Boolean(estab[r.key])}
                      onCheckedChange={(v) => setEstab({ ...estab, [r.key]: v === true } as Estab)}
                    />
                    {r.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <Button onClick={salvar} disabled={salvando} className="bg-secondary hover:bg-primary text-white">
                {salvando ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Salvar alterações
              </Button>
            </div>
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            A ativação pública do cadastro (status “ativo”) é feita pelo time do Turismo Azul
            após a revisão das informações.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="mb-1.5 block">{label}</Label>
      {children}
    </div>
  );
}
