import { X } from "lucide-react";
import { RECURSO_BADGES, SELO_BADGES } from "@/components/Badges";
import { ESTAB_TIPO_LABEL, type EstabTipo } from "@/lib/enums";
import { ESTADOS_BR, formatDateBR } from "@/lib/brazil";
import { cn } from "@/lib/utils";
import type { PerfilNecessidades } from "@/lib/perfil/compatibilidade";
import {
  csvOrUndefined,
  parsePerfisCsv,
  parseRecursosCsv,
  parseSelosCsv,
  parseTiposCsv,
  totalHospedes,
  type ExplorarSearch,
} from "@/lib/explorar-search";

interface ChipsAtivosProps {
  search: ExplorarSearch;
  perfisSelecionados?: ReadonlyArray<PerfilNecessidades>;
  areaAtiva: boolean;
  onPatch: (patch: Partial<ExplorarSearch>) => void;
  onRemoverTipo: () => void;
  onLimparArea: () => void;
  onLimparTudo: () => void;
  className?: string;
}

interface ChipAtivo {
  chave: string;
  rotulo: string;
  remover: () => void;
}

function precoRotulo(min?: number, max?: number): string {
  const f = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
  if (min !== undefined && max !== undefined) return `${f(min)} – ${f(max)}`;
  if (min !== undefined) return `A partir de ${f(min)}`;
  return `Até ${f(max as number)}`;
}

export function ChipsAtivos({
  search,
  perfisSelecionados = [],
  areaAtiva,
  onPatch,
  onRemoverTipo,
  onLimparArea,
  onLimparTudo,
  className,
}: ChipsAtivosProps) {
  const chips: ChipAtivo[] = [];

  if (search.busca) {
    chips.push({
      chave: "busca",
      rotulo: `“${search.busca}”`,
      remover: () => onPatch({ busca: undefined }),
    });
  }

  const tipos = parseTiposCsv(search.tipos);
  if (tipos.length === 1) {
    chips.push({
      chave: "tipo",
      rotulo: ESTAB_TIPO_LABEL[tipos[0] as EstabTipo],
      remover: onRemoverTipo,
    });
  }

  const selos = parseSelosCsv(search.selos);
  for (const flag of selos) {
    chips.push({
      chave: `selo:${flag}`,
      rotulo: SELO_BADGES[flag].label,
      remover: () => onPatch({ selos: csvOrUndefined(selos.filter((s) => s !== flag)) }),
    });
  }

  // Um chip por perfil: remover um sem perder os outros é o comportamento
  // esperado quando a família compara dois filhos ao mesmo tempo.
  const idsPerfis = parsePerfisCsv(search.perfis);
  for (const perfil of perfisSelecionados) {
    chips.push({
      chave: `perfil:${perfil.id}`,
      rotulo: `Perfil de ${perfil.nome_autista}`,
      remover: () => {
        const restantes = idsPerfis.filter((id) => id !== perfil.id);
        onPatch({
          perfis: csvOrUndefined(restantes),
          ...(restantes.length === 0 ? { so_compativeis: undefined } : {}),
        });
      },
    });
  }

  if (search.so_compativeis) {
    chips.push({
      chave: "so_compativeis",
      rotulo: "Só os que atendem tudo",
      remover: () => onPatch({ so_compativeis: undefined }),
    });
  }

  const recursos = parseRecursosCsv(search.recursos);
  for (const flag of recursos) {
    chips.push({
      chave: `recurso:${flag}`,
      rotulo: RECURSO_BADGES[flag].label,
      remover: () => onPatch({ recursos: csvOrUndefined(recursos.filter((r) => r !== flag)) }),
    });
  }

  if (search.estado) {
    const nome = ESTADOS_BR.find((uf) => uf.sigla === search.estado)?.nome ?? search.estado;
    chips.push({ chave: "estado", rotulo: nome, remover: () => onPatch({ estado: undefined }) });
  }

  if (search.cidade) {
    chips.push({
      chave: "cidade",
      rotulo: search.cidade,
      remover: () => onPatch({ cidade: undefined }),
    });
  }

  if (search.preco_min !== undefined || search.preco_max !== undefined) {
    chips.push({
      chave: "preco",
      rotulo: precoRotulo(search.preco_min, search.preco_max),
      remover: () => onPatch({ preco_min: undefined, preco_max: undefined }),
    });
  }

  if (search.data_in) {
    chips.push({
      chave: "periodo",
      rotulo: search.data_out
        ? `${formatDateBR(search.data_in)} – ${formatDateBR(search.data_out)}`
        : formatDateBR(search.data_in),
      remover: () => onPatch({ data_in: undefined, data_out: undefined }),
    });
  }

  if (search.adultos !== undefined || search.criancas !== undefined) {
    const total = totalHospedes(search);
    chips.push({
      chave: "hospedes",
      rotulo: `${total} hóspede${total === 1 ? "" : "s"}`,
      remover: () => onPatch({ adultos: undefined, criancas: undefined }),
    });
  }

  if (areaAtiva) {
    chips.push({
      chave: "area",
      rotulo: search.centro_lat !== undefined ? "Perto de você" : "Nesta área",
      remover: onLimparArea,
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {chips.map((chip) => (
        <button
          key={chip.chave}
          type="button"
          onClick={chip.remover}
          className="inline-flex items-center gap-1.5 rounded-full bg-azul-claro px-3 py-1.5 text-xs font-medium text-primary transition hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2"
        >
          {chip.rotulo}
          <X className="h-3.5 w-3.5" aria-hidden />
          <span className="sr-only">— remover filtro</span>
        </button>
      ))}

      {chips.length > 1 && (
        <button
          type="button"
          onClick={onLimparTudo}
          className="px-1 text-xs font-semibold text-muted-foreground underline underline-offset-2 transition hover:text-primary"
        >
          Limpar tudo
        </button>
      )}
    </div>
  );
}
