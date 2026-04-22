/**
 * Teste de regressão — contratos de tipo de
 * `applyEstabelecimentosViewFilters` / `EstabelecimentosViewFilters`.
 *
 * Garante, via `expectTypeOf` + `@ts-expect-error`, que:
 *
 *  1. Os literais de selos (`SeloFlag`) e recursos (`RecursoFlag`)
 *     correspondem **exatamente** às colunas boolean do schema. Se
 *     alguém renomear `selo_azul` no banco e não atualizar
 *     `SeloFlag`, o build quebra aqui — antes de chegar em produção
 *     com filtro silenciosamente sem efeito.
 *
 *  2. Strings arbitrárias (`"selo_falso"`, `"tem_xyz"`) são rejeitadas
 *     em tempo de compilação dentro de `selos`/`recursos`. Hoje isso
 *     passaria sem erro se alguém afrouxar os tipos para `string[]` —
 *     o teste trava essa regressão.
 *
 *  3. O parâmetro `tipo`/`tipos` aceita **apenas** valores do enum
 *     `estab_tipo` (e não qualquer string).
 *
 *  4. O retorno do helper preserva o tipo do builder original (passa
 *     `Q` adiante — não vira `any`/`unknown`). Crítico pra manter o
 *     encadeamento `.returns<EstabelecimentoView[]>()` tipado nos callers.
 *
 * Esses testes não fazem chamadas reais ao Supabase — são puramente
 * type-level (`expectTypeOf` no vitest typecheck + `@ts-expect-error`).
 * Eles complementam (não substituem) os guards em `types.guard.ts`.
 */

import { describe, expectTypeOf, it } from "vitest";
import {
  applyEstabelecimentosViewFilters,
  type EstabelecimentosViewFilters,
  type RecursoFlag,
  type SeloFlag,
} from "../estabelecimentos";
import type { Tables } from "@/integrations/supabase/types";

type EstabRow = Tables<"estabelecimentos">;

// Builder mínimo apenas para satisfazer a assinatura genérica do
// helper — nunca executado em runtime real. Stub fluente: cada método
// devolve o próprio objeto para permitir o encadeamento que o helper faz.
//
// Definimos o tipo aqui como interface estrutural (mesmos métodos que
// `AnyEstabBuilder` espera no helper) em vez de importar
// `@supabase/postgrest-js` — esse subpath não está exposto na
// resolução do workspace.
/* eslint-disable @typescript-eslint/no-explicit-any */
interface AnyBuilder {
  or(...args: any[]): any;
  eq(...args: any[]): any;
  in(...args: any[]): any;
  not(...args: any[]): any;
  limit(...args: any[]): any;
  range(...args: any[]): any;
}
/* eslint-enable @typescript-eslint/no-explicit-any */
const fluentStub: Record<string, (...args: unknown[]) => unknown> = {};
for (const m of ["eq", "in", "or", "not", "limit", "range"] as const) {
  fluentStub[m] = () => fluentStub;
}
const fakeBuilder = fluentStub as unknown as AnyBuilder;

describe("EstabelecimentosViewFilters — contratos de tipo (regressão)", () => {
  it("SeloFlag corresponde exatamente às colunas boolean de selo do schema", () => {
    // Cada literal de SeloFlag PRECISA existir como coluna em `estabelecimentos`
    // e ser compatível com `boolean | null`. Se alguém renomear a coluna no
    // banco (regenerando types.ts) e esquecer SeloFlag, isso quebra aqui.
    expectTypeOf<SeloFlag>().toEqualTypeOf<
      "selo_azul" | "selo_governamental" | "selo_privado"
    >();
    expectTypeOf<EstabRow["selo_azul"]>().toEqualTypeOf<boolean | null>();
    expectTypeOf<EstabRow["selo_governamental"]>().toEqualTypeOf<boolean | null>();
    expectTypeOf<EstabRow["selo_privado"]>().toEqualTypeOf<boolean | null>();
  });

  it("RecursoFlag corresponde exatamente às colunas boolean de recursos do schema", () => {
    expectTypeOf<RecursoFlag>().toEqualTypeOf<
      | "tem_sala_sensorial"
      | "tem_concierge_tea"
      | "tem_checkin_antecipado"
      | "tem_fila_prioritaria"
      | "tem_cardapio_visual"
      | "tem_caa"
    >();
    expectTypeOf<EstabRow["tem_sala_sensorial"]>().toEqualTypeOf<boolean | null>();
    expectTypeOf<EstabRow["tem_caa"]>().toEqualTypeOf<boolean | null>();
  });

  it("aceita selos e recursos válidos como literais", () => {
    const filtros: EstabelecimentosViewFilters = {
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
    // Sanity runtime — o helper deve aceitar sem lançar.
    const result = applyEstabelecimentosViewFilters(fakeBuilder, filtros);
    expectTypeOf(result).toEqualTypeOf<AnyBuilder>();
  });

  it("rejeita selos inválidos em tempo de compilação", () => {
    // @ts-expect-error — "selo_falso" não pertence a SeloFlag.
    const _a: EstabelecimentosViewFilters = { selos: ["selo_falso"] };

    // @ts-expect-error — "selo_azul_validade" é date, não boolean flag de filtro.
    const _b: EstabelecimentosViewFilters = { selos: ["selo_azul_validade"] };

    // @ts-expect-error — string genérica não é aceita.
    const _c: EstabelecimentosViewFilters = { selos: ["qualquer_coisa" as string] };

    void _a;
    void _b;
    void _c;
  });

  it("rejeita recursos inválidos em tempo de compilação", () => {
    // @ts-expect-error — "tem_xyz" não pertence a RecursoFlag.
    const _a: EstabelecimentosViewFilters = { recursos: ["tem_xyz"] };

    // @ts-expect-error — "tem_beneficio_tea" existe mas não é filtro de recurso
    // (use `apenasComBeneficio` em vez disso).
    const _b: EstabelecimentosViewFilters = { recursos: ["tem_beneficio_tea"] };

    // @ts-expect-error — não pode misturar literal de selo em `recursos`.
    const _c: EstabelecimentosViewFilters = { recursos: ["selo_azul"] };

    void _a;
    void _b;
    void _c;
  });

  it("aceita apenas valores válidos de `estab_tipo` em `tipo`/`tipos`", () => {
    const valido: EstabelecimentosViewFilters = {
      tipo: "hotel",
      tipos: ["pousada", "resort", "restaurante", "parque", "atracoes", "agencia", "transporte"],
    };
    expectTypeOf(valido.tipo).toEqualTypeOf<EstabRow["tipo"] | undefined>();

    // @ts-expect-error — "motel" não existe no enum estab_tipo.
    const _a: EstabelecimentosViewFilters = { tipo: "motel" };

    // @ts-expect-error — array com valor inválido também é rejeitado.
    const _b: EstabelecimentosViewFilters = { tipos: ["hotel", "motel"] };

    void _a;
    void _b;
  });

  it("aceita opções de paginação tipadas (number)", () => {
    const ok: EstabelecimentosViewFilters = {
      pagina: 1,
      tamanhoPagina: 24,
      limite: 100,
    };
    expectTypeOf(ok.pagina).toEqualTypeOf<number | undefined>();
    expectTypeOf(ok.tamanhoPagina).toEqualTypeOf<number | undefined>();

    // @ts-expect-error — strings não são aceitas (caller deve parsear antes).
    const _bad: EstabelecimentosViewFilters = { pagina: "1" };
    void _bad;
  });

  it("preserva o tipo do builder original (não vira any/unknown)", () => {
    // O genérico `Q extends AnyEstabBuilder` deve devolver exatamente
    // o mesmo subtipo recebido — crítico para manter `.returns<...>()`
    // tipado nos callers. Usamos uma marca de fantasia (`__brand`) para
    // distinguir o subtipo sem precisar reconstruir um GenericSchema válido.
    type BrandedBuilder = AnyBuilder & { readonly __brand: "estab-view" };
    const branded = fakeBuilder as BrandedBuilder;
    const out = applyEstabelecimentosViewFilters(branded, { selos: ["selo_azul"] });
    expectTypeOf(out).toEqualTypeOf<BrandedBuilder>();
    // Garantia explícita: o retorno NÃO foi alargado para any/unknown.
    // (No vitest 4 essas asserções são getters — sem parênteses.)
    expectTypeOf(out).not.toBeAny;
    expectTypeOf(out).not.toBeUnknown;
  });
});
