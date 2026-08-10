import { describe, expect, expectTypeOf, it } from "vitest";
import {
  applyItensViewFilters,
  type ItemView,
  type ItensViewFilters,
  type RecursoFlag,
  type SeloFlag,
} from "../itens-view";
import type { Tables } from "@/integrations/supabase/types";

type ItemViewRow = Tables<"ofertas_view">;

interface AnyBuilder {
  or(...args: unknown[]): unknown;
  eq(...args: unknown[]): unknown;
  in(...args: unknown[]): unknown;
  not(...args: unknown[]): unknown;
  limit(...args: unknown[]): unknown;
  range(...args: unknown[]): unknown;
  gte(...args: unknown[]): unknown;
  lte(...args: unknown[]): unknown;
  order(...args: unknown[]): unknown;
}
const fluentStub: Record<string, (...args: unknown[]) => unknown> = {};
for (const m of ["eq", "in", "or", "not", "limit", "range", "gte", "lte", "order"] as const) {
  fluentStub[m] = () => fluentStub;
}
const fakeBuilder = fluentStub as unknown as AnyBuilder;

describe("ItensViewFilters - contratos de tipo (regressão)", () => {
  it("SeloFlag corresponde às colunas boolean de selo na view", () => {
    expectTypeOf<SeloFlag>().toEqualTypeOf<"selo_azul" | "selo_governamental" | "selo_privado">();
    expectTypeOf<ItemViewRow["selo_azul"]>().toEqualTypeOf<boolean | null>();
    expectTypeOf<ItemViewRow["selo_governamental"]>().toEqualTypeOf<boolean | null>();
    expectTypeOf<ItemViewRow["selo_privado"]>().toEqualTypeOf<boolean | null>();
  });

  it("RecursoFlag corresponde às colunas boolean de recursos na view", () => {
    expectTypeOf<RecursoFlag>().toEqualTypeOf<
      | "tem_sala_sensorial"
      | "tem_concierge_tea"
      | "tem_checkin_antecipado"
      | "tem_fila_prioritaria"
      | "tem_cardapio_visual"
      | "tem_caa"
    >();
    expectTypeOf<ItemViewRow["tem_sala_sensorial"]>().toEqualTypeOf<boolean | null>();
    expectTypeOf<ItemViewRow["tem_caa"]>().toEqualTypeOf<boolean | null>();
  });

  it("aceita selos e recursos válidos", () => {
    const filtros: ItensViewFilters = {
      selos: ["selo_azul", "selo_governamental", "selo_privado"],
      recursos: [
        "tem_sala_sensorial",
        "tem_concierge_tea",
        "tem_checkin_antecipado",
        "tem_fila_prioritaria",
        "tem_cardapio_visual",
        "tem_caa",
      ],
    };
    const result = applyItensViewFilters(fakeBuilder, filtros);
    expectTypeOf(result).toEqualTypeOf<AnyBuilder>();
  });

  it("rejeita selos inválidos em tempo de compilação", () => {
    // @ts-expect-error - "selo_falso" não pertence a SeloFlag.
    const _a: ItensViewFilters = { selos: ["selo_falso"] };
    // @ts-expect-error - "selo_azul_validade" é date, não flag.
    const _b: ItensViewFilters = { selos: ["selo_azul_validade"] };
    // @ts-expect-error - string genérica não é aceita.
    const _c: ItensViewFilters = { selos: ["qualquer_coisa" as string] };
    void _a;
    void _b;
    void _c;
  });

  it("rejeita recursos inválidos em tempo de compilação", () => {
    // @ts-expect-error - "tem_xyz" não pertence a RecursoFlag.
    const _a: ItensViewFilters = { recursos: ["tem_xyz"] };
    // @ts-expect-error - "tem_beneficio_tea" não é RecursoFlag.
    const _b: ItensViewFilters = { recursos: ["tem_beneficio_tea"] };
    // @ts-expect-error - selo não pode ir em recursos.
    const _c: ItensViewFilters = { recursos: ["selo_azul"] };
    void _a;
    void _b;
    void _c;
  });

  it("aceita apenas valores válidos de estab_tipo em `tipos`", () => {
    const valido: ItensViewFilters = {
      tipos: [
        "hotel",
        "pousada",
        "resort",
        "restaurante",
        "parque",
        "atracoes",
        "agencia",
        "transporte",
      ],
    };
    expectTypeOf(valido.tipos).toEqualTypeOf<
      ReadonlyArray<ItemViewRow["estabelecimento_tipo"]> | undefined
    >();

    // @ts-expect-error - "motel" não existe no enum.
    const _a: ItensViewFilters = { tipos: ["motel"] };
    void _a;
  });

  it("aceita filtros numéricos tipados", () => {
    const ok: ItensViewFilters = {
      preco_min: 100,
      preco_max: 500,
      capacidade_min: 2,
    };
    expectTypeOf(ok.preco_min).toEqualTypeOf<number | undefined>();
    expectTypeOf(ok.preco_max).toEqualTypeOf<number | undefined>();
    expectTypeOf(ok.capacidade_min).toEqualTypeOf<number | undefined>();
  });

  it("aceita ordenação tipada", () => {
    const ok: ItensViewFilters = { ordenacao: "preco_asc" };
    expectTypeOf(ok.ordenacao).toEqualTypeOf<
      "preco_asc" | "preco_desc" | "avaliacao" | undefined
    >();

    // @ts-expect-error - "relevancia" não é valor válido.
    const _bad: ItensViewFilters = { ordenacao: "relevancia" };
    void _bad;
  });

  it("preserva o tipo do builder original", () => {
    type BrandedBuilder = AnyBuilder & { readonly __brand: "itens-view" };
    const branded = fakeBuilder as BrandedBuilder;
    const out = applyItensViewFilters(branded, { selos: ["selo_azul"] });
    expectTypeOf(out).toEqualTypeOf<BrandedBuilder>();
    expectTypeOf(out).not.toBeAny();
    expectTypeOf(out).not.toBeUnknown();
  });

  // ── Os dois ramos da view (estadia e visita) ──────────────────────────────

  it("a view discrimina as duas naturezas", () => {
    expectTypeOf<ItemViewRow["natureza"]>().toEqualTypeOf<"estadia" | "visita">();
  });

  it("colunas que só existem em quarto são nulas na visita", () => {
    // Se alguma destas voltar a ser não-nula, a UI que renderiza visita quebra
    // em runtime sem o build reclamar - por isso o contrato mora aqui.
    expectTypeOf<ItemViewRow["preco"]>().toEqualTypeOf<number | null>();
    expectTypeOf<ItemViewRow["capacidade_total"]>().toEqualTypeOf<number | null>();
    expectTypeOf<ItemViewRow["quantidade_camas"]>().toEqualTypeOf<number | null>();
    expectTypeOf<ItemViewRow["quantidade"]>().toEqualTypeOf<number | null>();
    expectTypeOf<ItemViewRow["check_in_padrao"]>().toEqualTypeOf<string | null>();
    expectTypeOf<ItemViewRow["check_out_padrao"]>().toEqualTypeOf<string | null>();
  });

  it("colunas presentes nas duas naturezas seguem não-nulas", () => {
    expectTypeOf<ItemViewRow["id"]>().toEqualTypeOf<string>();
    expectTypeOf<ItemViewRow["item_nome"]>().toEqualTypeOf<string>();
    expectTypeOf<ItemViewRow["comodidades"]>().toEqualTypeOf<string[]>();
    expectTypeOf<ItemViewRow["estabelecimento_id"]>().toEqualTypeOf<string>();
    // O slug é o destino do clique numa visita - sem ele o card não linka.
    expectTypeOf<ItemViewRow["estabelecimento_slug"]>().toEqualTypeOf<string>();
  });

  it("ItemView espelha a nulidade da view", () => {
    expectTypeOf<ItemView["natureza"]>().toEqualTypeOf<"estadia" | "visita">();
    expectTypeOf<ItemView["preco"]>().toEqualTypeOf<number | null>();
    expectTypeOf<ItemView["quantidade_camas"]>().toEqualTypeOf<number | null>();
    expectTypeOf<ItemView["imagens"]>().toEqualTypeOf<string[]>();
  });
});

// A vitrine deixou de filtrar por Selo Azul (ver a migration
// 20260810120000): o selo virou destaque, e o destaque só existe se ele for a
// primeira chave de ordenação. Se alguém acrescentar um `.order` antes deste,
// o local certificado afunda no meio da grade sem nada quebrar - por isso a
// posição está travada aqui.
describe("applyItensViewFilters - ranking do Selo Azul (regressão)", () => {
  function builderQueGravaOrder() {
    const chamadas: Array<[unknown, unknown]> = [];
    const stub: Record<string, (...args: unknown[]) => unknown> = {};
    for (const m of ["eq", "in", "or", "not", "limit", "range", "gte", "lte"] as const) {
      stub[m] = () => stub;
    }
    stub.order = (coluna, opcoes) => {
      chamadas.push([coluna, opcoes]);
      return stub;
    };
    return { builder: stub as unknown as AnyBuilder, chamadas };
  }

  it.each(["preco_asc", "preco_desc", "avaliacao", undefined] as const)(
    "ordena por selo_azul antes do critério %s",
    (ordenacao) => {
      const { builder, chamadas } = builderQueGravaOrder();
      applyItensViewFilters(builder, { ordenacao });

      expect(chamadas[0]).toEqual(["selo_azul", { ascending: false, nullsFirst: false }]);
      // O critério escolhido continua sendo aplicado depois do selo.
      expect(chamadas.length).toBeGreaterThan(1);
    },
  );
});
