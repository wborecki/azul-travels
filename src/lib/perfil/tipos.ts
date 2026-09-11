/**
 * Vocabulário declarativo do Perfil TEA.
 *
 * As ~80 perguntas do Pré-Check-in são descritas como dado, não como JSX: o hub,
 * o percentual, a tela de revisão e o PDF saem todos daqui. Adicionar pergunta é
 * adicionar uma linha em `blocos.ts`.
 */

import type { LucideIcon } from "lucide-react";
import type { TablesInsert } from "@/integrations/supabase/types";

export type PerfilDraft = Partial<TablesInsert<"perfil_sensorial">>;

export type CampoPerfil = keyof PerfilDraft;

/**
 * Restringe cada tipo de pergunta às colunas que ele sabe gravar - com ~80
 * perguntas escritas à mão, é o que impede um boolean cair num campo de texto.
 */
type CampoDoTipo<T> = {
  [K in CampoPerfil]-?: NonNullable<PerfilDraft[K]> extends T ? K : never;
}[CampoPerfil];

export type CampoTexto = CampoDoTipo<string>;
export type CampoNumero = CampoDoTipo<number>;
export type CampoBooleano = CampoDoTipo<boolean>;
export type CampoLista = CampoDoTipo<string[]>;

export interface Opcao {
  v: string;
  t: string;
  /** Uma linha explicando o que a opção significa na prática. */
  d?: string;
  Icon?: LucideIcon;
}

interface Base {
  titulo: string;
  /** Frase curta de apoio - por que perguntamos, ou como responder. */
  ajuda?: string;
}

/** Texto livre. `exemplo` vira placeholder, nunca label. */
export interface PerguntaTexto extends Base {
  tipo: "texto";
  campo: CampoTexto;
  multilinha?: boolean;
  exemplo?: string;
}

export interface PerguntaNumero extends Base {
  tipo: "numero";
  campo: CampoNumero;
  min: number;
  max: number;
}

/** Horário "HH:MM" gravado como texto. */
export interface PerguntaHora extends Base {
  tipo: "hora";
  campo: CampoTexto;
}

export interface PerguntaBooleano extends Base {
  tipo: "booleano";
  campo: CampoBooleano;
  simLabel?: string;
  naoLabel?: string;
}

/** Escolha única gravada numa coluna enum. */
export interface PerguntaUnica extends Base {
  tipo: "unica";
  campo: CampoTexto;
  opcoes: Opcao[];
}

/** Escolha múltipla gravada numa coluna `text[]`. */
export interface PerguntaMultipla extends Base {
  tipo: "multipla";
  campo: CampoLista;
  opcoes: Opcao[];
  /** Agrupa os chips por rótulo, na ordem em que aparecem aqui. */
  grupos?: Array<{ rotulo: string; valores: string[] }>;
  /** Habilita o chip "+" para um item que não está na lista. */
  permiteOutro?: boolean;
  /** Chip que limpa a seleção inteira ("Nada disso", "Não uso nenhum"). */
  nenhum?: string;
}

/** Vários booleans apresentados como uma nuvem de chips só. */
export interface PerguntaChipsBooleano extends Base {
  tipo: "chips-booleano";
  opcoes: Array<Opcao & { campo: CampoBooleano }>;
}

/**
 * Triagem + refino. Evita a matriz do PDF (14 estímulos × 4 níveis = 56 toques):
 * primeiro marca-se o que se aplica, e só os marcados pedem intensidade.
 * Os não marcados gravam `vazio`.
 */
export interface PerguntaMatriz extends Base {
  tipo: "matriz";
  id: string;
  tituloRefino: string;
  itens: Array<{ campo: CampoTexto; t: string; grupo: string }>;
  niveis: Opcao[];
  vazio: string;
  nenhumLabel: string;
}

export type Pergunta = (
  | PerguntaTexto
  | PerguntaNumero
  | PerguntaHora
  | PerguntaBooleano
  | PerguntaUnica
  | PerguntaMultipla
  | PerguntaChipsBooleano
  | PerguntaMatriz
) & {
  /** Só aparece quando a condição bate (ex.: piscina, se a família marcou piscina). */
  visivelSe?: (d: PerfilDraft) => boolean;
};

export interface Bloco {
  id: string;
  titulo: string;
  /** O que o estabelecimento faz com as respostas deste bloco. */
  porque: string;
  Icon: LucideIcon;
  /** Quanto o bloco vale no percentual do perfil. A soma dá 100. */
  peso: number;
  minutos: number;
  perguntas: Pergunta[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Leitura / escrita do draft
// ─────────────────────────────────────────────────────────────────────────────

function vazio(v: unknown): boolean {
  if (v === null || v === undefined) return true;
  if (typeof v === "string") return v.trim() === "";
  if (Array.isArray(v)) return v.length === 0;
  return false;
}

/** Campos que a pergunta escreve - usado pelo autosave e pela revisão. */
export function camposDaPergunta(p: Pergunta): CampoPerfil[] {
  if (p.tipo === "matriz") return p.itens.map((i) => i.campo);
  if (p.tipo === "chips-booleano") return p.opcoes.map((o) => o.campo);
  return [p.campo];
}

export function perguntaRespondida(p: Pergunta, d: PerfilDraft): boolean {
  // Booleans não distinguem "não" de "não respondi": `false` conta como resposta
  // só depois que a família passou pela pergunta, e é isso que `undefined` marca.
  return camposDaPergunta(p).some((c) => !vazio(d[c]));
}

export function perguntasVisiveis(bloco: Bloco, d: PerfilDraft): Pergunta[] {
  return bloco.perguntas.filter((p) => !p.visivelSe || p.visivelSe(d));
}

export interface StatusBloco {
  total: number;
  respondidas: number;
  /** Bloco completo quando toda pergunta visível foi respondida. */
  completo: boolean;
  iniciado: boolean;
}

export function statusBloco(bloco: Bloco, d: PerfilDraft): StatusBloco {
  const visiveis = perguntasVisiveis(bloco, d);
  const respondidas = visiveis.filter((p) => perguntaRespondida(p, d)).length;
  return {
    total: visiveis.length,
    respondidas,
    completo: visiveis.length > 0 && respondidas === visiveis.length,
    iniciado: respondidas > 0,
  };
}

/**
 * Percentual do perfil ponderado pelo peso de cada bloco - um bloco de segurança
 * vale mais que "Interesses", e o número reflete isso.
 */
export function percentualPerfil(blocos: Bloco[], d: PerfilDraft): number {
  let ganho = 0;
  let total = 0;
  for (const b of blocos) {
    const s = statusBloco(b, d);
    total += b.peso;
    if (s.total > 0) ganho += b.peso * (s.respondidas / s.total);
  }
  return total === 0 ? 0 : Math.round((ganho / total) * 100);
}
