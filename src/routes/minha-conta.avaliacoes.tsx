import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Star, Pencil } from "lucide-react";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";
import { formatDateBR } from "@/lib/brazil";

type AvaliacaoComEstab = Tables<"avaliacoes"> & {
  estabelecimentos: Pick<Tables<"estabelecimentos">, "id" | "nome" | "slug"> | null;
};

interface ReservaParaAvaliar {
  id: string;
  estabelecimento_id: string;
  estabelecimento_nome: string;
}

export const Route = createFileRoute("/minha-conta/avaliacoes")({
  validateSearch: (s: Record<string, unknown>) => ({
    reserva: typeof s.reserva === "string" ? s.reserva : undefined,
  }),
  component: AvaliacoesPage,
});

function AvaliacoesPage() {
  const { user } = useAuth();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const [list, setList] = useState<AvaliacaoComEstab[]>([]);
  const [editing, setEditing] = useState<AvaliacaoComEstab | null>(null);
  const [criando, setCriando] = useState<ReservaParaAvaliar | null>(null);

  const load = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("avaliacoes")
      .select("*, estabelecimentos(id, nome, slug)")
      .eq("familia_id", user.id)
      .order("criado_em", { ascending: false })
      .returns<AvaliacaoComEstab[]>();
    if (error) {
      toast.error("Erro ao carregar avaliações", { description: error.message });
      return;
    }
    setList(data ?? []);
  };

  useEffect(() => {
    void load();
  }, [user]);

  // Abre formulário a partir de ?reserva=ID
  useEffect(() => {
    if (!user || !search.reserva) return;
    void (async () => {
      const { data, error } = await supabase
        .from("reservas")
        .select("id, estabelecimento_id, estabelecimentos(nome)")
        .eq("id", search.reserva!)
        .eq("familia_id", user.id)
        .maybeSingle();
      if (error || !data) {
        toast.error("Reserva não encontrada para avaliação.");
        navigate({ to: "/minha-conta/avaliacoes", search: {} });
        return;
      }
      setCriando({
        id: data.id,
        estabelecimento_id: data.estabelecimento_id,
        estabelecimento_nome:
          (data.estabelecimentos as { nome: string } | null)?.nome ?? "Estabelecimento",
      });
    })();
  }, [user, search.reserva, navigate]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-display font-bold text-primary">Suas avaliações</h1>
        <p className="text-sm text-muted-foreground">
          Outras famílias contam com sua experiência para escolher onde ir.
        </p>
      </div>

      {list.length === 0 ? (
        <div className="bg-azul-claro rounded-2xl p-8 text-center">
          <Star className="h-10 w-10 text-secondary mx-auto mb-2" />
          <p className="text-muted-foreground">Você ainda não avaliou nenhuma experiência.</p>
          <p className="text-xs text-muted-foreground mt-1">
            Após uma reserva ser concluída, você poderá compartilhar como foi.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((a) => (
            <AvaliacaoRow key={a.id} avaliacao={a} onEditar={() => setEditing(a)} />
          ))}
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-primary">Editar avaliação</DialogTitle>
            <DialogDescription>
              {editing?.estabelecimentos?.nome ?? "Estabelecimento"}
            </DialogDescription>
          </DialogHeader>
          {editing && (
            <AvaliacaoForm
              avaliacaoId={editing.id}
              estabelecimentoNome={editing.estabelecimentos?.nome ?? ""}
              valoresIniciais={{
                nota_geral: editing.nota_geral ?? 0,
                nota_acolhimento: editing.nota_acolhimento ?? 0,
                nota_estrutura: editing.nota_estrutura ?? 0,
                nota_comunicacao: editing.nota_comunicacao ?? 0,
                comentario: editing.comentario ?? "",
                publica: editing.publica ?? true,
              }}
              onPronto={async () => {
                setEditing(null);
                await load();
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!criando}
        onOpenChange={(o) => {
          if (!o) {
            setCriando(null);
            navigate({ to: "/minha-conta/avaliacoes", search: {} });
          }
        }}
      >
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-primary">
              Avaliar experiência
            </DialogTitle>
            <DialogDescription>{criando?.estabelecimento_nome}</DialogDescription>
          </DialogHeader>
          {criando && user && (
            <AvaliacaoForm
              estabelecimentoNome={criando.estabelecimento_nome}
              novoEstabelecimentoId={criando.estabelecimento_id}
              familiaId={user.id}
              onPronto={async () => {
                setCriando(null);
                navigate({ to: "/minha-conta/avaliacoes", search: {} });
                await load();
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AvaliacaoRow({
  avaliacao,
  onEditar,
}: {
  avaliacao: AvaliacaoComEstab;
  onEditar: () => void;
}) {
  return (
    <div className="bg-card border rounded-2xl p-4 flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-semibold text-primary">
            {avaliacao.estabelecimentos?.nome ?? "Estabelecimento removido"}
          </h3>
          <Estrelas valor={avaliacao.nota_geral ?? 0} />
        </div>
        <div className="text-xs text-muted-foreground">
          {formatDateBR(avaliacao.criado_em)}
          {avaliacao.publica === false && (
            <span className="ml-2 px-2 py-0.5 rounded-full bg-muted text-foreground/70 font-medium">
              Privada
            </span>
          )}
        </div>
        {avaliacao.comentario && (
          <p className="mt-2 text-sm text-foreground/80 line-clamp-3">{avaliacao.comentario}</p>
        )}
      </div>
      <Button size="sm" variant="outline" onClick={onEditar}>
        <Pencil className="h-3.5 w-3.5 mr-1" /> Editar
      </Button>
    </div>
  );
}

function Estrelas({ valor }: { valor: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${i <= valor ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/40"}`}
        />
      ))}
    </span>
  );
}

interface AvaliacaoFormProps {
  avaliacaoId?: string;
  novoEstabelecimentoId?: string;
  familiaId?: string;
  estabelecimentoNome: string;
  valoresIniciais?: {
    nota_geral: number;
    nota_acolhimento: number;
    nota_estrutura: number;
    nota_comunicacao: number;
    comentario: string;
    publica: boolean;
  };
  onPronto: () => void | Promise<void>;
}

function AvaliacaoForm({
  avaliacaoId,
  novoEstabelecimentoId,
  familiaId,
  estabelecimentoNome,
  valoresIniciais,
  onPronto,
}: AvaliacaoFormProps) {
  const [nota_geral, setGeral] = useState(valoresIniciais?.nota_geral ?? 0);
  const [nota_acolhimento, setAcolh] = useState(valoresIniciais?.nota_acolhimento ?? 0);
  const [nota_estrutura, setEstr] = useState(valoresIniciais?.nota_estrutura ?? 0);
  const [nota_comunicacao, setCom] = useState(valoresIniciais?.nota_comunicacao ?? 0);
  const [comentario, setComentario] = useState(valoresIniciais?.comentario ?? "");
  const [publica, setPublica] = useState(valoresIniciais?.publica ?? true);
  const [loading, setLoading] = useState(false);

  const valido = useMemo(
    () => nota_geral > 0 && comentario.trim().length >= 50 && comentario.length <= 800,
    [nota_geral, comentario],
  );

  const salvar = async () => {
    setLoading(true);
    const payload = {
      nota_geral,
      nota_acolhimento,
      nota_estrutura,
      nota_comunicacao,
      comentario: comentario.trim(),
      publica,
    };
    let error: { message: string } | null = null;
    if (avaliacaoId) {
      const r = await supabase.from("avaliacoes").update(payload).eq("id", avaliacaoId);
      error = r.error;
    } else if (novoEstabelecimentoId && familiaId) {
      const r = await supabase.from("avaliacoes").insert({
        ...payload,
        estabelecimento_id: novoEstabelecimentoId,
        familia_id: familiaId,
      });
      error = r.error;
    }
    setLoading(false);
    if (error) {
      toast.error("Não foi possível salvar.", { description: error.message });
      return;
    }
    toast.success(avaliacaoId ? "Avaliação atualizada." : "Avaliação publicada. Obrigado!");
    await onPronto();
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-sm font-medium text-primary">Estabelecimento</Label>
        <div className="mt-1 px-3 py-2 rounded-md bg-muted/40 text-sm">{estabelecimentoNome}</div>
      </div>

      <EstrelasInput label="Nota geral" valor={nota_geral} onChange={setGeral} obrigatorio />

      <div className="space-y-3 pt-2 border-t">
        <EstrelasInput
          label="Como foi o acolhimento da equipe?"
          valor={nota_acolhimento}
          onChange={setAcolh}
        />
        <EstrelasInput
          label="A estrutura atendeu as necessidades do seu filho?"
          valor={nota_estrutura}
          onChange={setEstr}
        />
        <EstrelasInput
          label="A comunicação foi clara e respeitosa?"
          valor={nota_comunicacao}
          onChange={setCom}
        />
      </div>

      <div>
        <Label className="text-sm font-medium text-primary">Conte como foi a experiência</Label>
        <Textarea
          rows={5}
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          maxLength={800}
          placeholder="O que funcionou bem? O que poderia ser melhor? Outras famílias vão ler isso."
          className="mt-1.5"
        />
        <div
          className={`text-xs mt-1 ${comentario.length < 50 ? "text-muted-foreground" : "text-success"}`}
        >
          {comentario.length}/800 caracteres {comentario.length < 50 && "(mínimo 50)"}
        </div>
      </div>

      <label className="flex items-center justify-between gap-3 p-3 rounded-lg border bg-muted/20">
        <div>
          <div className="font-medium text-sm text-primary">Exibir publicamente</div>
          <div className="text-xs text-muted-foreground">
            Outras famílias verão sua avaliação na página do estabelecimento.
          </div>
        </div>
        <Switch checked={publica} onCheckedChange={setPublica} />
      </label>

      <Button
        onClick={salvar}
        disabled={!valido || loading}
        className="w-full bg-secondary hover:bg-secondary/90"
      >
        {loading ? "Enviando…" : avaliacaoId ? "Salvar alterações" : "Publicar avaliação"}
      </Button>
    </div>
  );
}

function EstrelasInput({
  label,
  valor,
  onChange,
  obrigatorio,
}: {
  label: string;
  valor: number;
  onChange: (v: number) => void;
  obrigatorio?: boolean;
}) {
  return (
    <div>
      <Label className="text-sm font-medium text-primary">
        {label}
        {obrigatorio && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      <div className="mt-1.5 flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            type="button"
            onClick={() => onChange(i === valor ? 0 : i)}
            aria-label={`${i} estrela${i > 1 ? "s" : ""}`}
            className="p-0.5"
          >
            <Star
              className={`h-6 w-6 transition ${
                i <= valor
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-muted-foreground/40 hover:text-yellow-400"
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
