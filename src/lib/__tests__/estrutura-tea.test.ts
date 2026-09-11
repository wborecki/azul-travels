import { describe, it, expect } from "vitest";
import { ESTAB_CATEGORIAS, ESTAB_TIPOS, categoriaDoTipo } from "@/lib/enums";
import { ESTRUTURA_ITEMS, estruturaDoTipo, estruturaDoQuarto } from "@/lib/estrutura-tea";

/**
 * O que o compilador já garante não está aqui: o `Record<EstabCategoria, ...>`
 * quebra o build se uma categoria entrar sem lista, e as listas indexam um
 * catálogo tipado, então uma chave só pode ter um rótulo.
 *
 * O que sobra para runtime são as promessas que a forma do módulo não cobre.
 */
describe("ESTRUTURA_ITEMS por categoria", () => {
  it("nenhuma categoria fica sem itens", () => {
    for (const c of ESTAB_CATEGORIAS) {
      expect(ESTRUTURA_ITEMS[c].length, `categoria "${c}" sem itens`).toBeGreaterThan(0);
    }
  });

  it("nenhum tipo do banco cai numa lista vazia", () => {
    for (const t of ESTAB_TIPOS) {
      expect(estruturaDoTipo(t).length, `tipo "${t}" sem itens`).toBeGreaterThan(0);
    }
  });

  it("não repete chave dentro da mesma categoria", () => {
    for (const c of ESTAB_CATEGORIAS) {
      const keys = ESTRUTURA_ITEMS[c].map((i) => i.key);
      expect(new Set(keys).size, `categoria "${c}" com chave repetida`).toBe(keys.length);
    }
  });

  /**
   * Passo 2 trocou uma lista única por listas de categoria sem migration - o
   * jsonb gravado continua o mesmo. Isso só é verdade enquanto as chaves que
   * hospedagem já respondia continuarem na lista de hospedagem; tirar uma
   * esconde, na página pública, um item que o hotel marcou.
   */
  it("hospedagem preserva as chaves anteriores ao Passo 2", () => {
    const antes = [
      "quartos_silenciosos",
      "iluminacao_regulavel",
      "area_escape_sensorial",
      "cardapio_seletividade",
      "comunicacao_visual",
      "entrada_sem_filas",
      "piscina_horarios_reservados",
      "equipe_treinada_tea",
    ];
    const atuais = ESTRUTURA_ITEMS.hospedagem.map((i) => i.key);
    for (const k of antes) {
      expect(atuais, `chave "${k}" sumiu de hospedagem`).toContain(k);
    }
  });

  /** Quarto só existe em hospedagem, e a página do quarto omite o que já diz. */
  it("estruturaDoQuarto tira os itens que descrevem o próprio quarto", () => {
    const marcado = Object.fromEntries(
      ESTRUTURA_ITEMS.hospedagem.map((i) => [i.key, true]),
    ) as Record<string, boolean>;

    const noQuarto = estruturaDoQuarto("hotel", marcado).map((i) => i.key);
    expect(noQuarto).not.toContain("quartos_silenciosos");
    expect(noQuarto).not.toContain("iluminacao_regulavel");
    expect(noQuarto).toContain("area_escape_sensorial");
  });

  /** A chave órfã fica gravada, mas some da leitura - é o ponto do Passo 2. */
  it("ignora chave que não pertence à categoria do local", () => {
    expect(categoriaDoTipo("restaurante")).toBe("gastronomia");
    const keys = estruturaDoTipo("restaurante").map((i) => i.key);
    expect(keys).not.toContain("quartos_silenciosos");
    expect(keys).toContain("cardapio_seletividade");
  });
});
