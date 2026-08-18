/**
 * Compatibilidade entre Perfis TEA e ofertas do /explorar.
 *
 * O cálculo só usa pares que existem dos dois lados: uma necessidade declarada
 * pela família e o recurso correspondente declarado pelo estabelecimento. Nada
 * do Pré-Check-in que o local não declara (sensorial, rotina, alimentação) entra
 * aqui - inventar sinal desses campos produziria um percentual que parece
 * preciso e não é.
 */

import type { ItemRecursoFlag } from "@/lib/queries";

/** Colunas de `perfil_sensorial` que o cálculo lê. */
export interface PerfilNecessidades {
  id: string;
  nome_autista: string;
  foto_url: string | null;
  precisa_sala_sensorial: boolean | null;
  precisa_concierge_tea: boolean | null;
  precisa_checkin_antecipado: boolean | null;
  precisa_fila_prioritaria: boolean | null;
  precisa_cardapio_visual: boolean | null;
  usa_caa: boolean | null;
}

type CampoNecessidade = Exclude<keyof PerfilNecessidades, "id" | "nome_autista" | "foto_url">;

/**
 * `usa_caa` é a exceção do padrão `precisa_*` → `tem_*`: quem se comunica por
 * CAA precisa que o local saiba receber CAA. A coluna é derivada de
 * `recursos_comunicacao` pela trigger do perfil.
 */
const PARES: ReadonlyArray<{ precisa: CampoNecessidade; recurso: ItemRecursoFlag }> = [
  { precisa: "precisa_sala_sensorial", recurso: "tem_sala_sensorial" },
  { precisa: "precisa_concierge_tea", recurso: "tem_concierge_tea" },
  { precisa: "precisa_checkin_antecipado", recurso: "tem_checkin_antecipado" },
  { precisa: "precisa_fila_prioritaria", recurso: "tem_fila_prioritaria" },
  { precisa: "precisa_cardapio_visual", recurso: "tem_cardapio_visual" },
  { precisa: "usa_caa", recurso: "tem_caa" },
];

export const CAMPOS_NECESSIDADE = PARES.map((p) => p.precisa);

/**
 * União das necessidades dos perfis selecionados: numa viagem em família, basta
 * uma pessoa precisar de sala sensorial para o local precisar ter.
 */
export function necessidadesDosPerfis(
  perfis: ReadonlyArray<PerfilNecessidades>,
): ItemRecursoFlag[] {
  const flags = new Set<ItemRecursoFlag>();
  for (const perfil of perfis) {
    for (const { precisa, recurso } of PARES) {
      if (perfil[precisa] === true) flags.add(recurso);
    }
  }
  return PARES.filter((p) => flags.has(p.recurso)).map((p) => p.recurso);
}

/** Quem, entre os perfis selecionados, depende de cada recurso. */
export function quemPrecisa(
  perfis: ReadonlyArray<PerfilNecessidades>,
  recurso: ItemRecursoFlag,
): string[] {
  const par = PARES.find((p) => p.recurso === recurso);
  if (!par) return [];
  return perfis.filter((p) => p[par.precisa] === true).map((p) => p.nome_autista);
}

export interface Compatibilidade {
  pct: number;
  atendidas: ItemRecursoFlag[];
  faltando: ItemRecursoFlag[];
  total: number;
}

/**
 * `null` quando não há necessidade declarada - aí não existe compatibilidade a
 * medir, e mostrar "100%" seria afirmar algo que ninguém verificou.
 */
export function compatibilidade(
  item: Partial<Record<ItemRecursoFlag, boolean | null>>,
  necessidades: ReadonlyArray<ItemRecursoFlag>,
): Compatibilidade | null {
  if (necessidades.length === 0) return null;
  const atendidas = necessidades.filter((flag) => item[flag] === true);
  const faltando = necessidades.filter((flag) => item[flag] !== true);
  return {
    pct: Math.round((atendidas.length / necessidades.length) * 100),
    atendidas,
    faltando,
    total: necessidades.length,
  };
}

export interface NivelCompatibilidade {
  rotulo: string;
  texto: string;
  fundo: string;
  barra: string;
}

export function nivelCompatibilidade(pct: number): NivelCompatibilidade {
  if (pct >= 100) {
    return {
      rotulo: "Atende tudo",
      texto: "text-emerald-800",
      fundo: "bg-emerald-100",
      barra: "bg-emerald-500",
    };
  }
  if (pct >= 50) {
    return {
      rotulo: "Atende em parte",
      texto: "text-amber-900",
      fundo: "bg-amber-100",
      barra: "bg-amber-500",
    };
  }
  return {
    rotulo: "Atende pouco",
    texto: "text-red-800",
    fundo: "bg-red-100",
    barra: "bg-red-500",
  };
}
