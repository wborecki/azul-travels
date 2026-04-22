import { Link } from "@tanstack/react-router";
import {
  MapPin,
  Star,
  Hotel,
  UtensilsCrossed,
  Compass,
  Plane,
  Briefcase,
  type LucideIcon,
} from "lucide-react";
import { Pill, SELO_BADGES, RECURSO_BADGES } from "./Badges";
import { mapEstabCard, type EstabelecimentoView, type EstabCardProps } from "@/lib/queries";
import { categoriaDoTipo, type EstabCategoria, type EstabTipo } from "@/lib/enums";

/** @deprecated use `EstabelecimentoView` de `@/lib/queries`. Mantido como alias. */
export type Estab = EstabelecimentoView;

/**
 * Props do EstabCard. Aceita:
 *  - `vm: EstabCardVM` + `tipo` (preferido — tipagem forte via `EstabCardProps`)
 *  - `e: EstabelecimentoView` (legado — mapeia internamente, tipo vem da row)
 */
type EstabCardComponentProps =
  | (EstabCardProps & { tipo?: EstabTipo })
  | { e: EstabelecimentoView; maxRecursos?: number };

/**
 * Ícone Lucide derivado da categoria do estabelecimento. Usar a
 * categoria (e não o tipo bruto) garante consistência visual: hotel,
 * pousada e resort compartilham o mesmo ícone de "hospedagem".
 */
const ICONE_POR_CATEGORIA: Record<EstabCategoria, LucideIcon> = {
  hospedagem: Hotel,
  gastronomia: UtensilsCrossed,
  passeios: Compass,
  transporte: Plane,
  planejamento: Briefcase,
};

function iconeFallback(tipo: EstabTipo | undefined): LucideIcon {
  if (!tipo) return Hotel;
  return ICONE_POR_CATEGORIA[categoriaDoTipo(tipo)];
}

export function EstabCard(props: EstabCardComponentProps) {
  const vm = "vm" in props ? props.vm : mapEstabCard(props.e);
  const maxRecursos = props.maxRecursos ?? 3;
  // Tipo bruto: row direta quando temos `e`; prop opcional `tipo` no caso `vm`.
  // Sem tipo, ícone genérico (Hotel).
  const tipoBruto: EstabTipo | undefined =
    "e" in props ? props.e.tipo : "tipo" in props ? props.tipo : undefined;
  const IconeFallback = iconeFallback(tipoBruto);

  return (
    <Link
      to="/estabelecimento/$slug"
      params={{ slug: vm.slug }}
      className="group bg-card rounded-2xl overflow-hidden shadow-soft hover:shadow-elegant transition-all duration-300 border border-border/50 flex flex-col h-full animate-fade-up"
    >
      {/* Imagem com altura FIXA (h-48 = 192px) — uniforme em todos os cards */}
      <div className="relative w-full h-48 overflow-hidden bg-azul-claro">
        {vm.media.fotoCapa ? (
          <img
            src={vm.media.fotoCapa}
            alt={vm.nome}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            style={{ objectPosition: "center 30%" }}
          />
        ) : (
          <div
            aria-hidden="true"
            className="w-full h-full flex items-center justify-center bg-gradient-to-br from-azul-claro to-teal-claro"
          >
            <IconeFallback className="h-16 w-16 text-primary/25" strokeWidth={1.5} />
          </div>
        )}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 max-w-[calc(100%-1.5rem)]">
          {vm.temSeloAzul && <Pill {...SELO_BADGES.selo_azul} />}
          {vm.temTour360 && <Pill {...SELO_BADGES.tour_360} />}
        </div>
        {vm.temBeneficioTea && (
          <div className="absolute bottom-3 left-3">
            <Pill {...SELO_BADGES.beneficio_tea} />
          </div>
        )}
      </div>

      <div className="p-4 flex-1 flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display font-bold text-base leading-tight text-primary group-hover:text-secondary transition-colors line-clamp-2">
            {vm.nome}
          </h3>
        </div>
        <div className="text-xs text-muted-foreground flex items-center gap-1">
          <span className="font-medium">{vm.tipoLabel}</span>
          {vm.localidade && (
            <>
              <span>·</span>
              <MapPin className="h-3 w-3" />
              <span>{vm.localidade}</span>
            </>
          )}
        </div>

        {vm.recursosAtivos.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {vm.recursosAtivos.slice(0, maxRecursos).map((k) => (
              <Pill key={k} {...RECURSO_BADGES[k]} />
            ))}
            {vm.recursosAtivos.length > maxRecursos && (
              <span className="text-[11px] text-muted-foreground self-center font-medium">
                +{vm.recursosAtivos.length - maxRecursos}
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
