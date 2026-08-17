import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, CloudOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { atualizarPerfilSensorial, fetchPerfilPorId, type PerfilSensorial } from "@/lib/queries";
import { BLOCOS, blocoPorId } from "@/lib/perfil/blocos";
import { perguntasVisiveis, statusBloco, type PerfilDraft } from "@/lib/perfil/tipos";
import { CampoPergunta } from "@/components/perfil/CampoPergunta";
import { SkeletonBloco } from "@/components/perfil/Skeletons";

export const Route = createFileRoute("/minha-conta/perfil/$perfilId/$bloco")({
  component: BlocoPerfilPage,
});

type EstadoSalvamento = "ocioso" | "pendente" | "salvando" | "salvo" | "erro";

const ATRASO_AUTOSAVE_MS = 800;

function BlocoPerfilPage() {
  const { perfilId, bloco: blocoId } = Route.useParams();
  const navigate = useNavigate();
  const bloco = blocoPorId(blocoId);

  const [perfil, setPerfil] = useState<PerfilSensorial | null>(null);
  const [draft, setDraft] = useState<PerfilDraft>({});
  const [loading, setLoading] = useState(true);
  const [estado, setEstado] = useState<EstadoSalvamento>("ocioso");

  const pendente = useRef<PerfilDraft>({});
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetchPerfilPorId(perfilId)
      .then((p) => {
        if (!alive) return;
        setPerfil(p);
        setDraft(p ?? {});
      })
      .catch((err: unknown) => {
        toast.error("Erro ao carregar o perfil", {
          description: err instanceof Error ? err.message : undefined,
        });
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [perfilId]);

  /** Grava o que estiver acumulado. Devolve `false` se a gravação falhou. */
  const gravar = useCallback(async (): Promise<boolean> => {
    const patch = pendente.current;
    pendente.current = {};
    if (Object.keys(patch).length === 0) return true;
    setEstado("salvando");
    try {
      await atualizarPerfilSensorial(perfilId, patch);
      setEstado("salvo");
      return true;
    } catch (err) {
      // Devolve o patch à fila para a próxima tentativa não perder resposta.
      pendente.current = { ...patch, ...pendente.current };
      setEstado("erro");
      toast.error("Não deu para salvar agora", {
        description: err instanceof Error ? err.message : undefined,
      });
      return false;
    }
  }, [perfilId]);

  function aplicar(patch: PerfilDraft) {
    setDraft((d) => ({ ...d, ...patch }));
    pendente.current = { ...pendente.current, ...patch };
    setEstado("pendente");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void gravar(), ATRASO_AUTOSAVE_MS);
  }

  // Sair da tela grava o que ainda estiver na fila.
  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
      if (Object.keys(pendente.current).length > 0) void gravar();
    };
  }, [gravar]);

  async function sairPara(destino: () => Promise<void>) {
    if (timer.current) clearTimeout(timer.current);
    await gravar();
    await destino();
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <SkeletonBloco />
      </div>
    );
  }

  if (!bloco || !perfil) {
    return (
      <div className="space-y-3">
        <p className="text-muted-foreground">Bloco não encontrado.</p>
        <Link to="/minha-conta/perfil" className="text-secondary hover:underline text-sm">
          Voltar para os Perfis TEA
        </Link>
      </div>
    );
  }

  const indice = BLOCOS.findIndex((b) => b.id === bloco.id);
  const seguinte = BLOCOS[indice + 1];
  const perguntas = perguntasVisiveis(bloco, draft);
  const status = statusBloco(bloco, draft);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between gap-3 mb-6">
        <Link
          to="/minha-conta/perfil/$perfilId"
          params={{ perfilId }}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> {perfil.nome_autista}
        </Link>

        <div className="flex items-center gap-3">
          <IndicadorSalvamento estado={estado} />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              void sairPara(() =>
                navigate({ to: "/minha-conta/perfil/$perfilId", params: { perfilId } }),
              )
            }
          >
            Salvar e sair
          </Button>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        Bloco {indice + 1} de {BLOCOS.length}
      </p>
      <h1 className="text-3xl font-display font-bold text-primary mt-0.5">{bloco.titulo}</h1>
      <p className="text-sm text-muted-foreground mt-1.5">{bloco.porque}</p>

      <p className="text-xs text-muted-foreground mt-4">
        Nenhuma pergunta é obrigatória. Se não souber, deixe em branco e volte depois.
      </p>

      <div className="mt-8 space-y-8">
        {perguntas.map((p) => (
          <CampoPergunta
            key={p.tipo === "matriz" ? p.id : p.tipo === "chips-booleano" ? p.titulo : p.campo}
            pergunta={p}
            draft={draft}
            onChange={aplicar}
          />
        ))}
      </div>

      <div className="mt-10 pt-6 border-t flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-muted-foreground">
          {status.respondidas} de {status.total} respondidas
        </p>

        {seguinte ? (
          <Button
            onClick={() =>
              void sairPara(() =>
                navigate({
                  to: "/minha-conta/perfil/$perfilId/$bloco",
                  params: { perfilId, bloco: seguinte.id },
                }),
              )
            }
            className="bg-secondary hover:bg-secondary/90 text-white"
          >
            {seguinte.titulo} <ArrowRight className="h-4 w-4 ml-1.5" />
          </Button>
        ) : (
          <Button
            onClick={() =>
              void sairPara(() =>
                navigate({ to: "/minha-conta/perfil/$perfilId/revisao", params: { perfilId } }),
              )
            }
            className="bg-secondary hover:bg-secondary/90 text-white"
          >
            Ver o resumo <ArrowRight className="h-4 w-4 ml-1.5" />
          </Button>
        )}
      </div>
    </div>
  );
}

function IndicadorSalvamento({ estado }: { estado: EstadoSalvamento }) {
  if (estado === "ocioso") return null;
  if (estado === "erro") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-destructive">
        <CloudOff className="h-3.5 w-3.5" /> Não salvo
      </span>
    );
  }
  if (estado === "salvo") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600">
        <Check className="h-3.5 w-3.5" /> Salvo
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Salvando…
    </span>
  );
}
