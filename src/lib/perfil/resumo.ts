/**
 * Converte o perfil em texto legível, seção por seção.
 *
 * Fonte única para a tela de revisão da família, o painel do estabelecimento e
 * o PDF entregue na chegada - os três leem o mesmo `blocos.ts`, então nenhum
 * campo novo pode aparecer num lugar e sumir no outro.
 */

import { BLOCOS } from "./blocos";
import {
  perguntaRespondida,
  perguntasVisiveis,
  type Bloco,
  type Opcao,
  type PerfilDraft,
  type Pergunta,
} from "./tipos";

export interface LinhaResumo {
  rotulo: string;
  valor: string | null;
  /** Marca respostas que a equipe precisa ler antes da chegada. */
  critica?: boolean;
}

export interface SecaoResumo {
  id: string;
  titulo: string;
  linhas: LinhaResumo[];
}

const CAMPOS_CRITICOS = new Set(["risco_fuga", "o_que_nao_fazer"]);

function rotulo(opcoes: Opcao[], v: string): string {
  return opcoes.find((o) => o.v === v)?.t ?? v;
}

function texto(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
}

export function valorDaPergunta(p: Pergunta, d: PerfilDraft): string | null {
  switch (p.tipo) {
    case "texto":
    case "numero":
    case "hora":
      return texto(d[p.campo]);

    case "booleano": {
      const v = d[p.campo];
      if (v === null || v === undefined) return null;
      return v ? (p.simLabel ?? "Sim") : (p.naoLabel ?? "Não");
    }

    case "unica": {
      const v = texto(d[p.campo]);
      return v === null ? null : rotulo(p.opcoes, v);
    }

    case "multipla": {
      const vs = (d[p.campo] as string[] | null | undefined) ?? [];
      if (vs.length === 0) return null;
      return vs.map((v) => rotulo(p.opcoes, v)).join(", ");
    }

    case "chips-booleano": {
      const marcados = p.opcoes.filter((o) => d[o.campo] === true);
      const respondeu = p.opcoes.some((o) => d[o.campo] != null);
      if (!respondeu) return null;
      return marcados.length > 0 ? marcados.map((o) => o.t).join(", ") : "Nenhum";
    }

    case "matriz": {
      const respondeu = p.itens.some((i) => d[i.campo] != null);
      if (!respondeu) return null;
      const marcados = p.itens.filter((i) => {
        const v = d[i.campo] as string | null | undefined;
        return v != null && v !== p.vazio;
      });
      if (marcados.length === 0) return p.nenhumLabel;
      return marcados
        .map((i) => {
          const nivel = d[i.campo] as string;
          return `${i.t} (${rotulo(p.niveis, nivel).toLowerCase()})`;
        })
        .join(", ");
    }
  }
}

function ehCritica(p: Pergunta): boolean {
  if (p.tipo === "matriz" || p.tipo === "chips-booleano") return false;
  return CAMPOS_CRITICOS.has(p.campo);
}

function secaoDoBloco(bloco: Bloco, d: PerfilDraft, apenasRespondidas: boolean): SecaoResumo {
  const linhas: LinhaResumo[] = [];
  for (const p of perguntasVisiveis(bloco, d)) {
    if (apenasRespondidas && !perguntaRespondida(p, d)) continue;
    linhas.push({ rotulo: p.titulo, valor: valorDaPergunta(p, d), critica: ehCritica(p) });
  }
  return { id: bloco.id, titulo: bloco.titulo, linhas };
}

export function resumoDoPerfil(
  d: PerfilDraft,
  { apenasRespondidas = true }: { apenasRespondidas?: boolean } = {},
): SecaoResumo[] {
  return BLOCOS.map((b) => secaoDoBloco(b, d, apenasRespondidas)).filter(
    (s) => s.linhas.length > 0,
  );
}

/** Respostas que a equipe precisa ler antes de tudo. */
export function alertasDoPerfil(d: PerfilDraft): LinhaResumo[] {
  const alertas: LinhaResumo[] = [];
  if (d.risco_fuga === true) {
    alertas.push({
      rotulo: "Risco de se afastar sozinho",
      valor: "Sim — manter atenção em áreas abertas e saídas",
      critica: true,
    });
  }
  const naoFazer = texto(d.o_que_nao_fazer);
  if (naoFazer) alertas.push({ rotulo: "O que não fazer", valor: naoFazer, critica: true });
  return alertas;
}
