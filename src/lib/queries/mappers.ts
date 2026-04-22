/**
 * Mapeadores de normalização — `Row do Supabase → View Model tipado da UI`.
 *
 * Esta camada existe para garantir que **toda página renderiza o mesmo
 * shape**, independente de quem fez o fetch. As queries continuam
 * devolvendo as rows tipadas do banco (`AvaliacaoComFamilia`,
 * `ReservaComContexto`, `EstabelecimentoView`); estes mapeadores
 * convertem em view models prontos para JSX, **sem** lógica de UI:
 *
 *   - Strings de exibição já resolvidas (primeiro nome, label do tipo,
 *     data formatada, status com fallback).
 *   - Listas derivadas já materializadas (recursos ativos do estab,
 *     selos visíveis, mídia normalizada).
 *   - Defaults aplicados uma única vez (status `pendente`, nota 0).
 *
 * Por que separar de `/lib/queries/*.ts`?
 *   - Queries tocam Supabase (I/O, async, throw). Mappers são puros
 *     (sync, sem deps externas) — fáceis de testar e reusar em SSR.
 *   - Permite que cada componente importe **apenas** o view model que
 *     consome, sem trazer junto o cliente Supabase.
 *
 * Os guards em `src/integrations/supabase/core-payloads.guard.ts`
 * travam o build se o shape de qualquer view model regredir.
 */

import { formatDateBR, TIPO_LABEL } from "@/lib/brazil";
import { RESERVA_STATUS_LABEL, type ReservaStatus } from "@/lib/enums";
import {
  pickEstabMedia,
  type EstabMedia,
} from "@/lib/media";
import type { AvaliacaoComFamilia } from "./avaliacoes";
import type { EstabelecimentoView } from "./estabelecimentos";
import type { ReservaComContexto } from "./reservas";

// ─────────────────────────────────────────────────────────────────────────────
// 1. Avaliação pública → AvaliacaoVM
// ─────────────────────────────────────────────────────────────────────────────

/**
 * View model de uma avaliação pública. Os campos cruz/UI já vêm
 * resolvidos para que o componente seja mero `<dl>`.
 */
export interface AvaliacaoVM {
  id: string;
  /** Primeiro nome do responsável, ou "Família" se ausente. */
  nomeExibicao: string;
  /** Data já formatada em pt-BR (string vazia se inválida). */
  dataFormatada: string;
  /** Nota geral com fallback `0` (nunca `null`). */
  nota: number;
  /** Comentário trimado; `null` se vazio. */
  comentario: string | null;
}

/** Converte uma row de `fetchAvaliacoesPublicasPorEstab` em `AvaliacaoVM`. */
export function mapAvaliacao(row: AvaliacaoComFamilia): AvaliacaoVM {
  const nomeCompleto = row.familia_profiles?.nome_responsavel ?? null;
  const primeiroNome = nomeCompleto?.trim().split(/\s+/)[0];
  const comentarioTrim = row.comentario?.trim();

  return {
    id: row.id,
    nomeExibicao: primeiroNome && primeiroNome.length > 0 ? primeiroNome : "Família",
    dataFormatada: formatDateBR(row.criado_em),
    nota: row.nota_geral ?? 0,
    comentario: comentarioTrim && comentarioTrim.length > 0 ? comentarioTrim : null,
  };
}

/** Conveniência: mapeia uma lista inteira preservando ordem. */
export function mapAvaliacoes(rows: ReadonlyArray<AvaliacaoComFamilia>): AvaliacaoVM[] {
  return rows.map(mapAvaliacao);
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. EstabelecimentoView (card) → EstabCardVM
// ─────────────────────────────────────────────────────────────────────────────

/** Chaves de recursos sensoriais — mesma ordem do componente Badges. */
const RECURSO_KEYS = [
  "tem_sala_sensorial",
  "tem_concierge_tea",
  "tem_checkin_antecipado",
  "tem_fila_prioritaria",
  "tem_cardapio_visual",
  "tem_caa",
] as const;

export type RecursoKey = (typeof RECURSO_KEYS)[number];

/** View model de um card de listagem (landing, /explorar, benefícios…). */
export interface EstabCardVM {
  id: string;
  slug: string;
  nome: string;
  /** Label legível do tipo (ex: "Hotel"). */
  tipoLabel: string;
  /** Cidade + UF concatenados ("Florianópolis, SC") ou `null`. */
  localidade: string | null;
  /** Mídia já normalizada (capa string|null, tour string|null). */
  media: EstabMedia;
  /** Recursos sensoriais ativos (apenas as keys com `true` no banco). */
  recursosAtivos: ReadonlyArray<RecursoKey>;
  /** Booleans de exibição direta — pré-coalescidos (sem `null`). */
  temSeloAzul: boolean;
  temBeneficioTea: boolean;
  temTour360: boolean;
}

/** Converte uma row do payload View em view model de card. */
export function mapEstabCard(row: EstabelecimentoView): EstabCardVM {
  const media = pickEstabMedia(row);
  const recursosAtivos = RECURSO_KEYS.filter((k) => row[k] === true);
  const localidade = row.cidade
    ? row.estado
      ? `${row.cidade}, ${row.estado}`
      : row.cidade
    : null;

  return {
    id: row.id,
    slug: row.slug,
    nome: row.nome,
    tipoLabel: TIPO_LABEL[row.tipo] ?? row.tipo,
    localidade,
    media,
    recursosAtivos,
    temSeloAzul: row.selo_azul === true,
    temBeneficioTea: row.tem_beneficio_tea === true,
    temTour360: media.tour360Url !== null,
  };
}

export function mapEstabCards(rows: ReadonlyArray<EstabelecimentoView>): EstabCardVM[] {
  return rows.map(mapEstabCard);
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Reserva com contexto → ReservaVM
// ─────────────────────────────────────────────────────────────────────────────

/** View model de uma linha da tabela de reservas. */
export interface ReservaVM {
  id: string;
  /** Status com fallback `"pendente"` (nunca `null`). */
  status: ReservaStatus;
  /** Label legível do status (ex: "Pendente"). */
  statusLabel: string;
  /** Resumo do estabelecimento embutido — `null` se o join falhou. */
  estabelecimento: {
    slug: string;
    nome: string;
    /** "Cidade, UF" ou apenas a cidade — `null` se ambos vazios. */
    localidade: string | null;
  } | null;
  /** "10/01/2025 → 14/01/2025", "10/01/2025", ou string vazia. */
  periodoFormatado: string;
}

function montaPeriodo(checkin: string | null, checkout: string | null): string {
  const ci = checkin ? formatDateBR(checkin) : "";
  const co = checkout ? formatDateBR(checkout) : "";
  if (ci && co) return `${ci} → ${co}`;
  return ci || co;
}

export function mapReserva(row: ReservaComContexto): ReservaVM {
  const status: ReservaStatus = row.status ?? "pendente";
  const estab = row.estabelecimentos;

  return {
    id: row.id,
    status,
    statusLabel: RESERVA_STATUS_LABEL[status],
    estabelecimento: estab
      ? {
          slug: estab.slug,
          nome: estab.nome,
          localidade: estab.cidade
            ? estab.estado
              ? `${estab.cidade}, ${estab.estado}`
              : estab.cidade
            : null,
        }
      : null,
    periodoFormatado: montaPeriodo(row.data_checkin, row.data_checkout),
  };
}

export function mapReservas(rows: ReadonlyArray<ReservaComContexto>): ReservaVM[] {
  return rows.map(mapReserva);
}
