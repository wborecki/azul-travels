import { Star } from "lucide-react";
import { Link } from "@tanstack/react-router";
import {
  type DemoEstabelecimento,
  type DemoPerfilSensorial,
  TIPO_LABEL,
  calcularCompatibilidade,
  corCompatibilidade,
} from "@/data/demo";

type Props = {
  estab: DemoEstabelecimento;
  perfil?: DemoPerfilSensorial;
};

export function DemoEstabCard({ estab, perfil }: Props) {
  const compat = perfil ? calcularCompatibilidade(perfil, estab) : null;
  const corC = compat !== null ? corCompatibilidade(compat) : null;

  return (
    <Link
      to="/demo/estabelecimento/$slug"
      params={{ slug: estab.slug }}
      className="group bg-card rounded-2xl overflow-hidden shadow-soft hover:shadow-elegant transition-all duration-300 border border-border/50 flex flex-col h-full"
    >
      <div className="relative w-full h-48 overflow-hidden bg-azul-claro">
        <img
          src={estab.foto_capa}
          alt={estab.nome}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          style={{ objectPosition: "center 30%" }}
        />
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 max-w-[calc(100%-1.5rem)]">
          {estab.selo_azul && (
            <span className="text-[11px] font-semibold bg-primary text-primary-foreground rounded-full px-2 py-0.5">
              Selo Azul
            </span>
          )}
          {estab.tour_360_url && (
            <span className="text-[11px] font-semibold bg-secondary text-secondary-foreground rounded-full px-2 py-0.5">
              Tour 360°
            </span>
          )}
        </div>
        {estab.tem_beneficio_tea && (
          <div className="absolute bottom-3 left-3">
            <span className="text-[11px] font-semibold bg-amber-500 text-white rounded-full px-2 py-0.5">
              🎁 Benefício TEA
            </span>
          </div>
        )}
      </div>

      <div className="p-4 flex-1 flex flex-col gap-2">
        <h3 className="font-display font-bold text-base leading-tight text-primary group-hover:text-secondary transition-colors line-clamp-2">
          {estab.nome}
        </h3>
        <div className="text-xs text-muted-foreground">
          <span className="font-medium">{TIPO_LABEL[estab.tipo]}</span> ·{" "}
          {estab.cidade}, {estab.estado}
        </div>

        {compat !== null && corC && perfil && (
          <div className="mt-1">
            <div className={`text-[12px] font-semibold ${corC.text}`}>
              {compat}% compatível com {perfil.nome_autista}
            </div>
            <div className="mt-1 h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full ${corC.bar} rounded-full transition-all`}
                style={{ width: `${compat}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex items-center gap-1 mt-auto pt-3 text-xs text-muted-foreground">
          <Star className="h-3.5 w-3.5 fill-amarelo text-amarelo" />
          <span className="font-semibold text-foreground">
            {estab.nota_media.toFixed(1)}
          </span>
          <span>· {estab.total_avaliacoes} avaliações</span>
        </div>
      </div>
    </Link>
  );
}
