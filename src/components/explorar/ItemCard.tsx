import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  BedDouble,
  ChevronLeft,
  ChevronRight,
  Gift,
  ImageOff,
  MapPin,
  ShieldCheck,
  Star,
  Users,
} from "lucide-react";
import { RECURSO_BADGES } from "@/components/Badges";
import { ESTAB_TIPO_LABEL } from "@/lib/enums";
import type { ItemView } from "@/lib/queries";
import { ITEM_RECURSO_FLAGS } from "@/lib/explorar-search";
import {
  DetalheCompatibilidade,
  SeloCompatibilidade,
} from "@/components/explorar/SeloCompatibilidade";
import type { Compatibilidade } from "@/lib/perfil/compatibilidade";
import { cn } from "@/lib/utils";

const MAX_RECURSOS_VISIVEIS = 3;

export type VarianteCard = "grade" | "lista";

function formatPreco(preco: number): string {
  return preco.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function validadeSelo(iso: string | null): string | null {
  const m = /^(\d{4})-(\d{2})/.exec(iso ?? "");
  if (!m) return null;
  const hoje = new Date().toISOString().slice(0, 7);
  return `${m[1]}-${m[2]}` >= hoje ? `${m[2]}/${m[1]}` : null;
}

interface ItemCardProps {
  item: ItemView;
  dataIn?: string;
  dataOut?: string;
  adultos?: number;
  criancas?: number;
  variante?: VarianteCard;
  ativo?: boolean;
  onAtivar?: () => void;
  onDesativar?: () => void;
  /** `null` quando nenhum Perfil TEA está selecionado - aí não há o que medir. */
  compat?: Compatibilidade | null;
  /** Nomes dos perfis comparados, para o texto acessível do selo. */
  nomesPerfis?: string;
}

export function ItemCard({
  item,
  dataIn,
  dataOut,
  adultos,
  criancas,
  variante = "grade",
  ativo = false,
  onAtivar,
  onDesativar,
  compat = null,
  nomesPerfis = "",
}: ItemCardProps) {
  const ehVisita = item.natureza === "visita";
  const ehLista = variante === "lista";
  const imagens =
    item.imagens.length > 0
      ? item.imagens
      : item.estabelecimento_foto_capa
        ? [item.estabelecimento_foto_capa]
        : [];
  const recursosAtivos = ITEM_RECURSO_FLAGS.filter((flag) => item[flag]);
  const recursosVisiveis = recursosAtivos.slice(0, MAX_RECURSOS_VISIVEIS);
  const recursosOcultos = recursosAtivos.length - recursosVisiveis.length;
  const validade = item.selo_azul ? validadeSelo(item.selo_azul_validade) : null;
  const rotulo = ehVisita
    ? `Ver ${item.estabelecimento_nome}`
    : `Ver detalhes de ${item.item_nome} - ${item.estabelecimento_nome}`;

  const link = ehVisita ? (
    <Link
      to="/estabelecimento/$slug"
      params={{ slug: item.estabelecimento_slug }}
      className="after:absolute after:inset-0 after:content-[''] hover:underline"
      aria-label={rotulo}
    >
      {item.item_nome}
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
      className="after:absolute after:inset-0 after:content-[''] hover:underline"
      aria-label={rotulo}
    >
      {item.item_nome}
    </Link>
  );

  return (
    <article
      data-item-id={item.id}
      onMouseEnter={onAtivar}
      onMouseLeave={onDesativar}
      onFocus={onAtivar}
      onBlur={onDesativar}
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-2xl bg-white transition",
        ehLista && "sm:flex-row",
        item.selo_azul
          ? "border-2 border-secondary/70 shadow-sm hover:shadow-md"
          : "border border-border shadow-sm hover:shadow-md",
        ativo && "shadow-lg ring-2 ring-primary/60",
      )}
    >
      {item.selo_azul && !ehLista && (
        <span aria-hidden className="h-1 w-full shrink-0 bg-secondary" />
      )}

      <Carrossel
        imagens={imagens}
        alt={item.item_nome}
        selado={!!item.selo_azul}
        className={cn(ehLista && "sm:w-60 sm:shrink-0 sm:self-stretch")}
        badge={compat ? <SeloCompatibilidade compat={compat} nomes={nomesPerfis} /> : null}
      />

      <div className={cn("flex min-w-0 flex-1 flex-col p-3 sm:p-4", ehLista && "sm:p-5")}>
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {ESTAB_TIPO_LABEL[item.estabelecimento_tipo]} · {item.estabelecimento_nome}
          </span>
          {item.avaliacao_media !== null && (
            <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-foreground">
              <Star className="h-3.5 w-3.5 fill-amarelo text-amarelo" />
              {item.avaliacao_media.toLocaleString("pt-BR", {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1,
              })}
              <span className="font-normal text-muted-foreground">({item.total_avaliacoes})</span>
            </span>
          )}
        </div>

        <h3
          className={cn(
            "mt-1 font-display font-bold leading-tight text-primary",
            ehLista ? "text-lg" : "text-base",
          )}
        >
          {link}
        </h3>

        {item.selo_azul && validade && (
          <span className="mt-1 text-xs font-semibold text-secondary">
            Selo Azul válido até {validade}
          </span>
        )}

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

        {compat && <DetalheCompatibilidade compat={compat} className="mt-2" />}

        {(recursosVisiveis.length > 0 || item.tem_beneficio_tea) && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5 sm:mt-3">
            {item.tem_beneficio_tea && (
              <span
                className="inline-flex items-center gap-1 rounded-full bg-success px-2 py-0.5 text-xs font-medium text-success-foreground"
                title={item.beneficio_tea_descricao ?? "Benefício TEA"}
              >
                <Gift className="h-3 w-3" /> Benefício TEA
              </span>
            )}
            {recursosVisiveis.map((flag) => (
              <span
                key={flag}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                  RECURSO_BADGES[flag].className,
                )}
              >
                {RECURSO_BADGES[flag].icon}
                {RECURSO_BADGES[flag].label}
              </span>
            ))}
            {recursosOcultos > 0 && (
              <span className="text-xs text-muted-foreground">+{recursosOcultos}</span>
            )}
          </div>
        )}

        <div className="mt-auto flex items-baseline gap-1 pt-3">
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
    </article>
  );
}

interface CarrosselProps {
  imagens: string[];
  alt: string;
  selado: boolean;
  className?: string;
  badge?: React.ReactNode;
}

function Carrossel({ imagens, alt, selado, className, badge }: CarrosselProps) {
  const [indice, setIndice] = useState(0);
  const total = imagens.length;

  function mover(e: React.MouseEvent, direcao: 1 | -1) {
    e.preventDefault();
    e.stopPropagation();
    setIndice((i) => (i + direcao + total) % total);
  }

  return (
    <div
      className={cn(
        "relative aspect-[16/10] w-full shrink-0 overflow-hidden bg-azul-claro sm:aspect-[4/3]",
        className,
      )}
    >
      {total > 0 ? (
        <img
          src={imagens[indice]}
          alt={alt}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-primary/40">
          <ImageOff className="h-10 w-10" />
        </div>
      )}

      {badge}

      {selado && (
        <span className="absolute bottom-2 left-2 z-10 inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-xs font-bold text-primary shadow-md">
          <ShieldCheck className="h-4 w-4 text-secondary" />
          Selo Azul
        </span>
      )}

      {total > 1 && (
        <>
          <SetaFoto lado="esquerda" onClick={(e) => mover(e, -1)} />
          <SetaFoto lado="direita" onClick={(e) => mover(e, 1)} />
          <div className="pointer-events-none absolute bottom-2 left-1/2 z-10 flex -translate-x-1/2 gap-1">
            {imagens.slice(0, 6).map((src, i) => (
              <span
                key={src}
                className={cn(
                  "h-1.5 w-1.5 rounded-full bg-white/60 transition",
                  i === indice && "w-3 bg-white",
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

interface SetaFotoProps {
  lado: "esquerda" | "direita";
  onClick: (e: React.MouseEvent) => void;
}

function SetaFoto({ lado, onClick }: SetaFotoProps) {
  const Icone = lado === "esquerda" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={lado === "esquerda" ? "Foto anterior" : "Próxima foto"}
      className={cn(
        "absolute top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-primary shadow transition hover:bg-white md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100",
        lado === "esquerda" ? "left-2" : "right-2",
      )}
    >
      <Icone className="h-4 w-4" />
    </button>
  );
}
