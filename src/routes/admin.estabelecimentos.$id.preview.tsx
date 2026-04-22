import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  fetchEstabelecimentoAdminDetalhe,
  pickEstabMedia,
  type EstabelecimentoDetalhe,
  type EstabelecimentoNormalized,
} from "@/lib/queries";
import { AvaliacoesPublicasSection } from "@/components/AvaliacoesPublicasSection";
import { Pill, SELO_BADGES, RECURSO_BADGES } from "@/components/Badges";
import { Button } from "@/components/ui/button";
import { TIPO_LABEL, formatDateBR } from "@/lib/brazil";
import { ESTAB_STATUS_LABEL, toEstabStatus } from "@/lib/enums";
import {
  ArrowLeft,
  Camera,
  Eye,
  ExternalLink,
  Gift,
  Globe,
  Loader2,
  MapPin,
  Pencil,
  Phone,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";

/**
 * Pré-visualização administrativa do estabelecimento.
 *
 * Renderiza o mesmo layout da página pública (`/estabelecimento/$slug`),
 * mas busca por `id` via `fetchEstabelecimentoAdminDetalhe` — ignora o
 * filtro `status = 'ativo'` para que admins revisem como o registro
 * aparecerá para famílias com TEA antes de publicar.
 *
 * O bloco lateral de **reserva** é substituído por um painel de status
 * (status atual, link para a página pública quando ativo, atalho para
 * voltar à edição). Nenhuma ação de escrita é exposta aqui.
 */
export const Route = createFileRoute("/admin/estabelecimentos/$id/preview")({
  component: AdminEstabelecimentoPreview,
});

type Estab = EstabelecimentoNormalized;

function AdminEstabelecimentoPreview() {
  const { id } = Route.useParams();
  const navigate = useNavigate();

  const [detalhe, setDetalhe] = useState<EstabelecimentoDetalhe | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const data = await fetchEstabelecimentoAdminDetalhe(id);
        if (!data) {
          toast.error("Estabelecimento não encontrado");
          navigate({ to: "/admin/estabelecimentos" });
          return;
        }
        setDetalhe(data);
      } catch (err) {
        toast.error("Erro ao carregar pré-visualização", {
          description: err instanceof Error ? err.message : undefined,
        });
        setDetalhe(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando pré-visualização...
      </div>
    );
  }

  if (!detalhe) return null;

  const e: Estab = detalhe.estabelecimento;
  const status = toEstabStatus(e.status, "ativo");
  const isAtivo = status === "ativo";

  const recursoKeys = [
    "tem_sala_sensorial",
    "tem_concierge_tea",
    "tem_checkin_antecipado",
    "tem_fila_prioritaria",
    "tem_cardapio_visual",
    "tem_caa",
  ] as const;
  const recursosAtivos = recursoKeys.filter((k) => e[k]);

  const { fotoCapa, fotos, tour360Url } = pickEstabMedia(e);

  const statusBadge =
    status === "ativo"
      ? "bg-secondary/10 text-secondary border-secondary/20"
      : status === "pendente"
        ? "bg-amarelo/15 text-amarelo-foreground border-amarelo/30"
        : "bg-destructive/10 text-destructive border-destructive/20";

  return (
    <div className="space-y-6">
      {/* Barra superior admin — fora do layout público */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amarelo/30 bg-amarelo/10 px-4 py-3">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon" className="h-9 w-9">
            <Link
              to="/admin/estabelecimentos/$id"
              params={{ id }}
              aria-label="Voltar para edição"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-amarelo-foreground" />
            <span className="text-sm font-semibold text-amarelo-foreground">
              Pré-visualização — como famílias com TEA verão este estabelecimento
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusBadge}`}
          >
            {ESTAB_STATUS_LABEL[status]}
          </span>
          <Button asChild size="sm" variant="outline" className="gap-2">
            <Link to="/admin/estabelecimentos/$id" params={{ id }}>
              <Pencil className="h-4 w-4" /> Editar
            </Link>
          </Button>
          {isAtivo && (
            <Button asChild size="sm" className="gap-2">
              <Link to="/estabelecimento/$slug" params={{ slug: e.slug }} target="_blank">
                <ExternalLink className="h-4 w-4" /> Abrir no site
              </Link>
            </Button>
          )}
        </div>
      </div>

      {!isAtivo && (
        <div className="flex items-start gap-3 rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <ShieldAlert className="mt-0.5 h-4 w-4 flex-none" />
          <p>
            Este estabelecimento está com status{" "}
            <strong>{ESTAB_STATUS_LABEL[status]}</strong> e <strong>não aparece</strong> no site
            público. Esta é apenas uma simulação para revisão.
          </p>
        </div>
      )}

      {/* Galeria — espelha /estabelecimento/$slug */}
      <div className="grid lg:grid-cols-3 gap-3 max-h-[480px]">
        <div className="lg:col-span-2 relative rounded-2xl overflow-hidden bg-muted aspect-[16/9] lg:aspect-auto">
          {fotoCapa ? (
            <img src={fotoCapa} alt={e.nome} className="w-full h-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
              Sem foto de capa
            </div>
          )}
          {tour360Url && (
            <a
              href={tour360Url}
              target="_blank"
              rel="noreferrer"
              className="absolute bottom-4 right-4 bg-amarelo text-amarelo-foreground rounded-xl px-4 py-2 font-semibold text-sm flex items-center gap-2 shadow-elegant hover:scale-105 transition"
            >
              <Camera className="h-4 w-4" /> Tour 360° dos ambientes
            </a>
          )}
        </div>
        <div className="hidden lg:grid grid-rows-2 gap-3">
          {[fotos[0], fotos[1]].map((f, i) => (
            <div key={i} className="bg-muted rounded-2xl overflow-hidden">
              {f && <img src={f} alt="" className="w-full h-full object-cover" />}
            </div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-secondary">
              {TIPO_LABEL[e.tipo]}
            </span>
            <h1 className="mt-1 text-3xl md:text-4xl font-display font-bold text-primary">
              {e.nome}
            </h1>
            <p className="mt-1 text-muted-foreground flex items-center gap-1">
              <MapPin className="h-4 w-4" /> {e.cidade || "—"}
              {e.estado ? `, ${e.estado}` : ""}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {e.selo_azul && <Pill {...SELO_BADGES.selo_azul} />}
              {e.selo_governamental && <Pill {...SELO_BADGES.selo_governamental} />}
              {e.selo_privado && (
                <Pill {...SELO_BADGES.selo_privado} label={e.selo_privado_nome || "Selo Privado"} />
              )}
              {tour360Url && <Pill {...SELO_BADGES.tour_360} />}
              {e.tem_beneficio_tea && <Pill {...SELO_BADGES.beneficio_tea} />}
            </div>
          </div>

          <section>
            <h2 className="font-display font-bold text-xl text-primary">
              Sobre o local para famílias TEA
            </h2>
            <p className="mt-3 text-foreground leading-relaxed whitespace-pre-line">
              {e.descricao_tea || e.descricao || (
                <span className="italic text-muted-foreground">Nenhuma descrição cadastrada.</span>
              )}
            </p>
          </section>

          {recursosAtivos.length > 0 && (
            <section>
              <h3 className="font-display font-bold text-lg text-primary mb-3">
                Recursos disponíveis
              </h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {recursosAtivos.map((k) => (
                  <div key={k} className="flex items-start gap-3 p-3 bg-azul-claro rounded-xl">
                    <Pill {...RECURSO_BADGES[k]} />
                  </div>
                ))}
              </div>
            </section>
          )}

          {e.tem_beneficio_tea && (
            <section className="bg-teal-claro border border-secondary/20 rounded-2xl p-6">
              <div className="flex items-center gap-2 text-secondary font-display font-bold text-lg">
                <Gift className="h-5 w-5" /> Benefício especial para pessoas autistas
              </div>
              <p className="mt-2 text-foreground whitespace-pre-line">
                {e.beneficio_tea_descricao || (
                  <span className="italic text-muted-foreground">
                    Sem descrição do benefício.
                  </span>
                )}
              </p>
            </section>
          )}

          {(e.selo_azul || e.selo_governamental || e.selo_privado) && (
            <section>
              <h3 className="font-display font-bold text-lg text-primary mb-3">
                Selos e certificações
              </h3>
              <ul className="space-y-2 text-sm">
                {e.selo_azul && (
                  <li className="flex justify-between py-2 border-b">
                    <span className="font-semibold">Selo Azul (Absoluto Educacional)</span>
                    {e.selo_azul_validade && (
                      <span className="text-muted-foreground">
                        Válido até {formatDateBR(e.selo_azul_validade)}
                      </span>
                    )}
                  </li>
                )}
                {e.selo_governamental && (
                  <li className="py-2 border-b font-semibold">Certificado Governamental</li>
                )}
                {e.selo_privado && (
                  <li className="py-2 border-b font-semibold">
                    {e.selo_privado_nome || "Selo Privado"}
                  </li>
                )}
              </ul>
            </section>
          )}

          <section>
            <h3 className="font-display font-bold text-lg text-primary mb-3">Contato</h3>
            <div className="space-y-2 text-sm">
              {e.telefone ? (
                <p className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-secondary" /> {e.telefone}
                </p>
              ) : null}
              {e.website ? (
                <p className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-secondary" />{" "}
                  <a
                    href={e.website}
                    target="_blank"
                    rel="noreferrer"
                    className="text-secondary hover:underline"
                  >
                    {e.website}
                  </a>
                </p>
              ) : null}
              {e.endereco ? (
                <p className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-secondary" /> {e.endereco}
                </p>
              ) : null}
              {!e.telefone && !e.website && !e.endereco && (
                <p className="italic text-muted-foreground">Sem informações de contato.</p>
              )}
            </div>
          </section>

          <AvaliacoesPublicasSection estabelecimentoId={e.id} />
        </div>

        {/* Painel lateral admin (substitui o bloco de reserva) */}
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <div className="bg-card rounded-2xl border shadow-elegant p-6 space-y-4">
            <div>
              <h3 className="font-display font-bold text-lg text-primary">Resumo da revisão</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Confira se tudo está pronto antes de publicar.
              </p>
            </div>

            <dl className="text-sm space-y-2">
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Status</dt>
                <dd>
                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${statusBadge}`}
                  >
                    {ESTAB_STATUS_LABEL[status]}
                  </span>
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Tipo</dt>
                <dd className="font-medium">{TIPO_LABEL[e.tipo]}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Slug</dt>
                <dd className="font-mono text-xs">/{e.slug}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Destaque na home</dt>
                <dd className="font-medium">{e.destaque ? "Sim" : "Não"}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Fotos</dt>
                <dd className="font-medium">
                  {fotos.length} {fotos.length === 1 ? "foto" : "fotos"}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Tour 360°</dt>
                <dd className="font-medium">{tour360Url ? "Sim" : "Não"}</dd>
              </div>
            </dl>

            <div className="pt-2 space-y-2">
              <Button asChild className="w-full gap-2">
                <Link to="/admin/estabelecimentos/$id" params={{ id }}>
                  <Pencil className="h-4 w-4" /> Voltar para editar
                </Link>
              </Button>
              {isAtivo && (
                <Button asChild variant="outline" className="w-full gap-2">
                  <Link to="/estabelecimento/$slug" params={{ slug: e.slug }} target="_blank">
                    <ExternalLink className="h-4 w-4" /> Ver página pública
                  </Link>
                </Button>
              )}
            </div>

            <p className="text-[11px] text-muted-foreground leading-snug">
              O bloco de reserva foi ocultado nesta visualização — admins não enviam reservas.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
