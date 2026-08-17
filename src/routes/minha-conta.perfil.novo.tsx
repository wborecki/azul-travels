import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Clock, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { criarPerfilSensorial, type PerfilSensorialInsert } from "@/lib/queries";
import { BLOCO_ESSENCIAL } from "@/lib/perfil/blocos";
import { perguntaRespondida, perguntasVisiveis, type PerfilDraft } from "@/lib/perfil/tipos";
import { CampoPergunta } from "@/components/perfil/CampoPergunta";

export const Route = createFileRoute("/minha-conta/perfil/novo")({
  component: NovoPerfilPage,
});

/** Destino após criar - `?next=` vem do fluxo de reserva que exigiu um perfil. */
function destinoDepois(): string | null {
  if (typeof window === "undefined") return null;
  const next = new URL(window.location.href).searchParams.get("next");
  return next && next.startsWith("/") && !next.startsWith("//") ? next : null;
}

function NovoPerfilPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [passo, setPasso] = useState(-1);
  const [draft, setDraft] = useState<PerfilDraft>({});
  const [salvando, setSalvando] = useState(false);

  const perguntas = perguntasVisiveis(BLOCO_ESSENCIAL, draft);
  const atual = perguntas[passo];
  const ultima = passo === perguntas.length - 1;

  function aplicar(patch: PerfilDraft) {
    setDraft((d) => ({ ...d, ...patch }));
  }

  async function salvar() {
    if (!user) return;
    const nome = (draft.nome_autista ?? "").trim();
    if (!nome) {
      toast.error("Falta o nome.");
      setPasso(0);
      return;
    }
    setSalvando(true);
    try {
      const payload: PerfilSensorialInsert = {
        ...draft,
        familia_id: user.id,
        nome_autista: nome,
      };
      const criado = await criarPerfilSensorial(payload);
      toast.success(`Perfil de ${criado.nome_autista} criado!`);
      const next = destinoDepois();
      await navigate(
        next
          ? { to: next }
          : { to: "/minha-conta/perfil/$perfilId", params: { perfilId: criado.id } },
      );
    } catch (err) {
      toast.error("Erro ao salvar", {
        description: err instanceof Error ? err.message : undefined,
      });
      setSalvando(false);
    }
  }

  // ── Abertura: contrato de tempo antes de pedir qualquer coisa ──────────────
  if (passo < 0) {
    return (
      <div className="max-w-2xl mx-auto">
        <Link
          to="/minha-conta/perfil"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary mb-6"
        >
          <ArrowLeft className="h-4 w-4" /> Perfis TEA
        </Link>

        <h1 className="text-3xl font-display font-bold text-primary">Vamos começar pelo básico</h1>
        <p className="text-muted-foreground mt-2">
          São {perguntas.length} perguntas. Depois disso o perfil já funciona nas reservas, e vocês
          completam o resto quando der vontade.
        </p>

        <div className="mt-6 space-y-3">
          <p className="flex items-center gap-2.5 text-sm text-foreground/80">
            <Clock className="h-4 w-4 text-secondary shrink-0" />
            Cerca de {BLOCO_ESSENCIAL.minutos} minutos
          </p>
          <p className="flex items-center gap-2.5 text-sm text-foreground/80">
            <ShieldCheck className="h-4 w-4 text-secondary shrink-0" />
            Nenhum hotel vê o perfil sem vocês autorizarem, reserva por reserva
          </p>
        </div>

        <Button
          onClick={() => setPasso(0)}
          className="mt-8 bg-secondary hover:bg-secondary/90 text-white"
        >
          Começar
        </Button>
      </div>
    );
  }

  const obrigatoriaPendente =
    atual?.tipo === "texto" && atual.campo === "nome_autista"
      ? !(draft.nome_autista ?? "").trim()
      : false;

  return (
    <div className="max-w-2xl mx-auto">
      <button
        type="button"
        onClick={() => setPasso((p) => p - 1)}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary mb-6"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar
      </button>

      <p className="text-sm text-muted-foreground mb-2">
        Pergunta {passo + 1} de {perguntas.length}
      </p>

      {atual && <CampoPergunta pergunta={atual} draft={draft} onChange={aplicar} />}

      <div className="mt-8 flex items-center gap-3">
        <Button
          onClick={() => (ultima ? void salvar() : setPasso((p) => p + 1))}
          disabled={obrigatoriaPendente || salvando}
          className="bg-secondary hover:bg-secondary/90 text-white"
        >
          {salvando ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" /> Salvando…
            </>
          ) : ultima ? (
            "Criar perfil"
          ) : (
            "Continuar"
          )}
        </Button>

        {!obrigatoriaPendente && atual && !perguntaRespondida(atual, draft) && !ultima && (
          <button
            type="button"
            onClick={() => setPasso((p) => p + 1)}
            className="text-sm text-muted-foreground hover:text-primary"
          >
            Não sei agora
          </button>
        )}
      </div>
    </div>
  );
}
