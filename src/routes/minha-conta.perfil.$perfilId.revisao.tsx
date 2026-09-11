import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AlertTriangle, ArrowLeft, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { fetchPerfilPorId, type PerfilSensorial } from "@/lib/queries";
import { alertasDoPerfil, resumoDoPerfil } from "@/lib/perfil/resumo";
import { SkeletonRevisao } from "@/components/perfil/Skeletons";

export const Route = createFileRoute("/minha-conta/perfil/$perfilId/revisao")({
  component: RevisaoPerfilPage,
});

/**
 * "O que o hotel vai receber".
 *
 * A família autoriza o compartilhamento reserva por reserva; até aqui ela nunca
 * tinha visto o conteúdo que estava liberando.
 */
function RevisaoPerfilPage() {
  const { perfilId } = Route.useParams();
  const [perfil, setPerfil] = useState<PerfilSensorial | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    fetchPerfilPorId(perfilId)
      .then((p) => {
        if (alive) setPerfil(p);
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

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <SkeletonRevisao />
      </div>
    );
  }

  if (!perfil) {
    return (
      <div className="space-y-3">
        <p className="text-muted-foreground">Perfil não encontrado.</p>
        <Link to="/minha-conta/perfil" className="text-secondary hover:underline text-sm">
          Voltar para os Perfis TEA
        </Link>
      </div>
    );
  }

  const secoes = resumoDoPerfil(perfil);
  const alertas = alertasDoPerfil(perfil);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link
        to="/minha-conta/perfil/$perfilId"
        params={{ perfilId }}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" /> {perfil.nome_autista}
      </Link>

      <header>
        <h1 className="text-3xl font-display font-bold text-primary">O que o hotel vai receber</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Só aparece o que vocês responderam, e só depois de vocês autorizarem em cada reserva.
        </p>
      </header>

      <p className="rounded-xl border border-secondary/30 bg-secondary/5 p-3.5 text-sm text-foreground/80 flex items-start gap-2.5">
        <ShieldCheck className="h-4 w-4 text-secondary shrink-0 mt-0.5" />
        Nenhum estabelecimento tem acesso a este perfil enquanto vocês não marcarem o
        compartilhamento na reserva. Vocês podem editar qualquer resposta a qualquer momento.
      </p>

      {alertas.length > 0 && (
        <section className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-4">
          <h2 className="font-display font-bold text-amber-900 text-sm inline-flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4" /> A equipe lê isto primeiro
          </h2>
          <dl className="mt-2.5 space-y-2">
            {alertas.map((a) => (
              <div key={a.rotulo}>
                <dt className="text-xs font-semibold text-amber-900/70">{a.rotulo}</dt>
                <dd className="text-sm text-amber-950">{a.valor}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {secoes.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          Ainda não há nada preenchido.{" "}
          <Link
            to="/minha-conta/perfil/$perfilId"
            params={{ perfilId }}
            className="text-secondary hover:underline"
          >
            Começar agora
          </Link>
          .
        </p>
      ) : (
        <div className="space-y-3">
          {secoes.map((s) => (
            <section key={s.id} className="rounded-2xl border bg-white p-5">
              <div className="flex items-center justify-between gap-3 mb-3">
                <h2 className="font-display font-bold text-primary">{s.titulo}</h2>
                <Link
                  to="/minha-conta/perfil/$perfilId/$bloco"
                  params={{ perfilId, bloco: s.id }}
                  className="text-sm text-secondary hover:underline shrink-0"
                >
                  Editar
                </Link>
              </div>
              <dl className="space-y-2.5">
                {s.linhas.map((l) => (
                  <div key={l.rotulo} className="grid sm:grid-cols-[1fr_1.2fr] gap-x-4 gap-y-0.5">
                    <dt className="text-sm text-muted-foreground">{l.rotulo}</dt>
                    <dd
                      className={
                        l.critica ? "text-sm font-semibold text-amber-800" : "text-sm text-primary"
                      }
                    >
                      {l.valor ?? "—"}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
