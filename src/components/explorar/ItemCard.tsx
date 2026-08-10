import { Link } from "@tanstack/react-router";
import { BedDouble, ImageOff, MapPin, ShieldCheck, Star, Users } from "lucide-react";
import { RECURSO_BADGES } from "@/components/Badges";
import { ESTAB_TIPO_LABEL } from "@/lib/enums";
import type { ItemView } from "@/lib/queries";
import { ITEM_RECURSO_FLAGS } from "@/lib/explorar-search";

const MAX_RECURSOS_VISIVEIS = 3;

function formatPreco(preco: number): string {
  return preco.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

interface ItemCardProps {
  item: ItemView;
  /** Datas da busca (`YYYY-MM-DD`) - pré-preenchem a reserva em `/quartos/$id`. */
  dataIn?: string;
  dataOut?: string;
  /** Hóspedes da busca - pré-preenchem a reserva em `/quartos/$id`. */
  adultos?: number;
  criancas?: number;
}

/**
 * Card de uma oferta na grade do `/explorar`.
 *
 * Numa estadia mostra o quarto (capacidade, camas, preço por noite) e leva a
 * `/quartos/:id`. Numa visita o card é o próprio local: sem preço nem camas,
 * porque o local não declara nada disso, e o clique vai para a página dele.
 */
export function ItemCard({ item, dataIn, dataOut, adultos, criancas }: ItemCardProps) {
  const ehVisita = item.natureza === "visita";
  const capa = item.imagens[0] ?? item.estabelecimento_foto_capa;
  const recursosAtivos = ITEM_RECURSO_FLAGS.filter((flag) => item[flag]);
  const recursosVisiveis = recursosAtivos.slice(0, MAX_RECURSOS_VISIVEIS);
  const recursosOcultos = recursosAtivos.length - recursosVisiveis.length;

  // A grade mistura local com e sem Selo Azul. A pill sozinha some no meio das
  // fotos - a moldura é o que faz o cartão selado se destacar na varredura.
  const classeCartao = item.selo_azul
    ? "group relative bg-white rounded-2xl border border-primary ring-1 ring-primary overflow-hidden flex flex-col shadow-md hover:shadow-lg transition"
    : "group relative bg-white rounded-2xl border overflow-hidden flex flex-col shadow-sm hover:shadow-md transition";
  const rotulo = ehVisita
    ? `Ver ${item.estabelecimento_nome}`
    : `Ver detalhes de ${item.item_nome} - ${item.estabelecimento_nome}`;

  const conteudo = (
    <>
      {item.selo_azul && (
        <span className="absolute top-3 right-3 z-10 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary text-primary-foreground text-[11px] font-semibold shadow">
          <ShieldCheck className="h-3 w-3" /> Selo Azul ✓
        </span>
      )}

      <div className="aspect-[16/10] w-full shrink-0 overflow-hidden bg-azul-claro">
        {capa ? (
          <img
            src={capa}
            alt={item.item_nome}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-primary/40">
            <ImageOff className="h-10 w-10" />
          </div>
        )}
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold truncate">
            {ESTAB_TIPO_LABEL[item.estabelecimento_tipo]} · {item.estabelecimento_nome}
          </span>
          {item.avaliacao_media !== null && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-foreground shrink-0">
              <Star className="h-3.5 w-3.5 fill-amarelo text-amarelo" />
              {item.avaliacao_media.toLocaleString("pt-BR", {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1,
              })}
              <span className="font-normal text-muted-foreground">({item.total_avaliacoes})</span>
            </span>
          )}
        </div>

        <h3 className="mt-1 font-display font-bold text-primary text-lg leading-tight group-hover:underline">
          {item.item_nome}
        </h3>

        {(item.cidade || item.estado) && (
          <div className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {[item.cidade, item.estado].filter(Boolean).join(" · ")}
          </div>
        )}

        {item.capacidade_total !== null && item.quantidade_camas !== null && (
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-foreground/70">
            <span className="inline-flex items-center gap-1">
              <Users className="h-3.5 w-3.5" /> Até {item.capacidade_total} pessoa
              {item.capacidade_total === 1 ? "" : "s"}
            </span>
            <span className="inline-flex items-center gap-1">
              <BedDouble className="h-3.5 w-3.5" /> {item.quantidade_camas} cama
              {item.quantidade_camas === 1 ? "" : "s"}
            </span>
          </div>
        )}

        {recursosVisiveis.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5">
            {recursosVisiveis.map((flag) => (
              <span
                key={flag}
                className="inline-flex items-center gap-1 text-[11px] text-foreground/80"
                title={RECURSO_BADGES[flag].label}
              >
                <span className="text-primary">{RECURSO_BADGES[flag].icon}</span>
                {RECURSO_BADGES[flag].label}
              </span>
            ))}
            {recursosOcultos > 0 && (
              <span className="text-[11px] text-muted-foreground">+{recursosOcultos}</span>
            )}
          </div>
        )}

        <div className="mt-auto pt-3 flex items-baseline gap-1">
          {item.preco !== null ? (
            <>
              <span className="text-lg font-bold text-primary">{formatPreco(item.preco)}</span>
              <span className="text-xs text-muted-foreground">/ noite</span>
            </>
          ) : (
            <>
              <span className="text-sm font-bold text-primary">Reserva sem cobrança</span>
              <span className="text-xs text-muted-foreground">· dia e horário</span>
            </>
          )}
        </div>
      </div>
    </>
  );

  // Destinos diferentes exigem dois `Link`: o `to` do TanStack é tipado e não
  // aceita rota variável com params distintos.
  return ehVisita ? (
    <Link
      to="/estabelecimento/$slug"
      params={{ slug: item.estabelecimento_slug }}
      className={classeCartao}
      aria-label={rotulo}
    >
      {conteudo}
    </Link>
  ) : (
    <Link
      to="/quartos/$id"
      params={{ id: item.id }}
      search={{
        ...(dataIn ? { checkIn: dataIn } : {}),
        ...(dataIn && dataOut ? { checkOut: dataOut } : {}),
        ...(adultos !== undefined ? { adultos } : {}),
        ...(criancas !== undefined ? { criancas } : {}),
      }}
      className={classeCartao}
      aria-label={rotulo}
    >
      {conteudo}
    </Link>
  );
}
