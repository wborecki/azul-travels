import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { fetchEstabelecimentoPorSlug, type EstabelecimentoNormalized } from "@/lib/queries/estabelecimentos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";
import { Loader2, Plus, Trash2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/minha-conta/reservas/nova")({
  validateSearch: (s: Record<string, unknown>): { slug?: string } => {
    const slug = typeof s.slug === "string" ? s.slug : undefined;
    return slug ? { slug } : {};
  },
  component: NovaReservaPage,
});

interface Acompanhante {
  nome: string;
  idade: string;
  parentesco: string;
}

function NovaReservaPage() {
  const { slug } = useSearch({ from: "/minha-conta/reservas/nova" });
  const { user } = useAuth();
  const navigate = useNavigate();

  const [estab, setEstab] = useState<EstabelecimentoNormalized | null>(null);
  const [perfil, setPerfil] = useState<Tables<"perfil_sensorial"> | null>(null);
  const [loading, setLoading] = useState(true);

  const [checkin, setCheckin] = useState("");
  const [checkout, setCheckout] = useState("");
  const [objetivo, setObjetivo] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [acompanhantes, setAcompanhantes] = useState<Acompanhante[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    let alive = true;
    setLoading(true);
    Promise.all([
      slug ? fetchEstabelecimentoPorSlug(slug) : Promise.resolve(null),
      supabase
        .from("perfil_sensorial")
        .select("*")
        .eq("familia_id", user.id)
        .maybeSingle(),
    ])
      .then(([e, p]) => {
        if (!alive) return;
        setEstab(e);
        setPerfil(p.data);
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [user, slug]);

  function addAcomp() {
    setAcompanhantes((a) => [...a, { nome: "", idade: "", parentesco: "" }]);
  }
  function rmAcomp(i: number) {
    setAcompanhantes((a) => a.filter((_, idx) => idx !== i));
  }
  function updAcomp(i: number, k: keyof Acompanhante, v: string) {
    setAcompanhantes((a) => a.map((x, idx) => (idx === i ? { ...x, [k]: v } : x)));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !estab || !perfil) return;
    if (!checkin || !checkout) {
      toast.error("Informe as datas da viagem.");
      return;
    }
    setSaving(true);
    const acompanhantesPayload = acompanhantes
      .filter((a) => a.nome.trim())
      .map((a) => ({
        nome: a.nome.trim(),
        idade: a.idade ? Number(a.idade) : null,
        parentesco: a.parentesco.trim() || null,
      }));
    const payload: TablesInsert<"reservas"> = {
      familia_id: user.id,
      estabelecimento_id: estab.id,
      perfil_sensorial_id: perfil.id,
      data_checkin: checkin,
      data_checkout: checkout,
      num_adultos: 1 + acompanhantesPayload.filter((a) => (a.idade ?? 18) >= 18).length,
      num_autistas: 1,
      mensagem: mensagem.trim() || null,
      objetivo: objetivo.trim() || null,
      acompanhantes: acompanhantesPayload,
      status: "pendente",
      perfil_enviado_ao_estabelecimento: true,
    };
    const { data, error } = await supabase
      .from("reservas")
      .insert(payload)
      .select("id")
      .single();
    setSaving(false);
    if (error) {
      toast.error("Erro ao criar reserva: " + error.message);
      return;
    }
    toast.success("Reserva enviada! O estabelecimento vai retornar em breve.");
    navigate({ to: "/minha-conta/reservas/$id", params: { id: data.id } });
  }

  if (loading) {
    return (
      <div className="text-muted-foreground inline-flex items-center">
        <Loader2 className="h-4 w-4 animate-spin mr-2" /> Carregando…
      </div>
    );
  }

  if (!estab) {
    return (
      <div className="bg-white border rounded-2xl p-8 text-center">
        <p className="text-muted-foreground">
          Estabelecimento não encontrado. Volte para explorar destinos.
        </p>
        <Button asChild className="mt-4">
          <Link to="/explorar">Explorar</Link>
        </Button>
      </div>
    );
  }

  if (!perfil) {
    return (
      <div className="bg-white border rounded-2xl p-8 text-center max-w-xl mx-auto">
        <h2 className="font-display font-bold text-primary text-xl">
          Cadastre o Perfil TEA primeiro
        </h2>
        <p className="text-sm text-muted-foreground mt-2">
          Para abrir uma reserva precisamos do perfil que será enviado ao estabelecimento.
        </p>
        <Button
          asChild
          className="mt-4 bg-secondary hover:bg-secondary/90 text-white"
        >
          <Link
            to="/minha-conta/perfil"
            search={{ next: `/minha-conta/reservas/nova?slug=${slug ?? ""}` } as never}
          >
            Cadastrar Perfil TEA →
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <Link
          to="/explorar"
          className="text-xs text-muted-foreground hover:text-primary inline-flex items-center gap-1"
        >
          <ArrowLeft className="h-3 w-3" /> Voltar para destinos
        </Link>
        <h1 className="text-3xl font-display font-bold text-primary mt-2">
          Nova reserva
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {estab.nome}
          {estab.cidade && ` · ${estab.cidade}/${estab.estado}`}
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        <div className="bg-white border rounded-2xl p-5 space-y-4">
          <h2 className="font-display font-bold text-primary">Datas</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label>Check-in</Label>
              <Input
                type="date"
                required
                value={checkin}
                onChange={(e) => setCheckin(e.target.value)}
              />
            </div>
            <div>
              <Label>Check-out</Label>
              <Input
                type="date"
                required
                value={checkout}
                onChange={(e) => setCheckout(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-primary">
              Acompanhantes desta viagem
            </h2>
            <Button type="button" variant="outline" size="sm" onClick={addAcomp}>
              <Plus className="h-3 w-3 mr-1" /> Adicionar
            </Button>
          </div>
          {acompanhantes.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Adicione quem vai junto além de você e do {perfil.nome_autista}.
            </p>
          ) : (
            <ul className="space-y-2">
              {acompanhantes.map((a, i) => (
                <li key={i} className="grid sm:grid-cols-[1fr_80px_1fr_auto] gap-2">
                  <Input
                    placeholder="Nome"
                    value={a.nome}
                    onChange={(e) => updAcomp(i, "nome", e.target.value)}
                  />
                  <Input
                    type="number"
                    placeholder="Idade"
                    value={a.idade}
                    onChange={(e) => updAcomp(i, "idade", e.target.value)}
                  />
                  <Input
                    placeholder="Parentesco"
                    value={a.parentesco}
                    onChange={(e) => updAcomp(i, "parentesco", e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => rmAcomp(i)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white border rounded-2xl p-5 space-y-4">
          <h2 className="font-display font-bold text-primary">Sobre esta viagem</h2>
          <div>
            <Label>Objetivo desta viagem</Label>
            <Input
              value={objetivo}
              onChange={(e) => setObjetivo(e.target.value)}
              placeholder="Descansar, comemorar aniversário, primeira viagem com o filho…"
            />
          </div>
          <div>
            <Label>Notas específicas para esta estadia</Label>
            <Textarea
              rows={3}
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              placeholder="Algo que muda pra esta viagem além do Perfil TEA padrão"
            />
          </div>
        </div>

        <div className="bg-azul-claro/40 border border-primary/20 rounded-2xl p-5">
          <h2 className="font-display font-bold text-primary text-sm">
            Perfil TEA que será enviado
          </h2>
          <p className="text-sm text-foreground/80 mt-1">
            <strong>{perfil.nome_autista}</strong>
            {perfil.idade ? `, ${perfil.idade} anos` : ""}
            {perfil.nivel_tea ? ` · Nível ${perfil.nivel_tea}` : ""}
          </p>
          <Link
            to="/minha-conta/perfil"
            className="text-xs text-secondary hover:underline mt-2 inline-block"
          >
            Editar perfil →
          </Link>
        </div>

        <div className="flex justify-end gap-2">
          <Button asChild type="button" variant="ghost">
            <Link to="/minha-conta/reservas">Cancelar</Link>
          </Button>
          <Button
            type="submit"
            disabled={saving}
            className="bg-secondary hover:bg-secondary/90 text-white"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" /> Enviando…
              </>
            ) : (
              "Enviar reserva"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
