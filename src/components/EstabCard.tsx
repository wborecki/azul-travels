import { Link } from "@tanstack/react-router";
import { MapPin, Star } from "lucide-react";
import { Pill, SELO_BADGES, RECURSO_BADGES } from "./Badges";
import { TIPO_LABEL } from "@/lib/brazil";
import { pickEstabMedia, type EstabelecimentoView } from "@/lib/queries";

/** @deprecated use `EstabelecimentoView` de `@/lib/queries`. Mantido como alias. */
export type Estab = EstabelecimentoView;

export function EstabCard({ e }: { e: EstabelecimentoView }) {
  const recursos = (
    [
      "tem_sala_sensorial",
      "tem_concierge_tea",
      "tem_checkin_antecipado",
      "tem_fila_prioritaria",
      "tem_cardapio_visual",
      "tem_caa",
    ] as const
  ).filter((k) => e[k]);

  // Mídia padronizada — mesmo shape do detalhe e do admin.
  const { fotoCapa, tour360Url } = pickEstabMedia(e);

  return (
    <Link
      to="/estabelecimento/$slug"
      params={{ slug: e.slug }}
      className="group bg-card rounded-2xl overflow-hidden shadow-soft hover:shadow-elegant transition-all duration-300 border border-border/50 flex flex-col animate-fade-up"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {fotoCapa && (
          <img
            src={fotoCapa}
            alt={e.nome}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        )}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 max-w-[calc(100%-1.5rem)]">
          {e.selo_azul && <Pill {...SELO_BADGES.selo_azul} />}
          {tour360Url && <Pill {...SELO_BADGES.tour_360} />}
        </div>
        {e.tem_beneficio_tea && (
          <div className="absolute bottom-3 left-3">
            <Pill {...SELO_BADGES.beneficio_tea} />
          </div>
        )}
      </div>

      <div className="p-4 flex-1 flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display font-bold text-base leading-tight text-primary group-hover:text-secondary transition-colors line-clamp-2">
            {e.nome}
          </h3>
        </div>
        <div className="text-xs text-muted-foreground flex items-center gap-1">
          <span className="font-medium">{TIPO_LABEL[e.tipo] ?? e.tipo}</span>
          {e.cidade && (
            <>
              <span>·</span>
              <MapPin className="h-3 w-3" />
              <span>
                {e.cidade}
                {e.estado ? `, ${e.estado}` : ""}
              </span>
            </>
          )}
        </div>

        {recursos.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {recursos.slice(0, 3).map((k) => (
              <Pill key={k} {...RECURSO_BADGES[k]} />
            ))}
            {recursos.length > 3 && (
              <span className="text-[11px] text-muted-foreground self-center font-medium">
                +{recursos.length - 3}
              </span>
            )}
          </div>
        )}

        <div className="flex items-center gap-1 mt-auto pt-3 text-xs text-muted-foreground">
          <Star className="h-3.5 w-3.5 fill-amarelo text-amarelo" />
          <span className="font-semibold text-foreground">4.8</span>
          <span>· Avaliações de famílias TEA</span>
        </div>
      </div>
    </Link>
  );
}
