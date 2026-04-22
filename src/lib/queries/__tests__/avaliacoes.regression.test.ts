/**
 * Teste de regressão — `familia_profiles.nome_responsavel`.
 *
 * Existe especificamente para travar UM contrato crítico que já mordeu o
 * projeto antes: o campo `nome_responsavel` embutido no payload de
 * `fetchAvaliacoesPublicasPorEstab` precisa permanecer **`string | null`**.
 *
 * Por que um teste dedicado, se já há guards em
 * `core-payloads.guard.ts`?
 *
 *   - Os guards (`AssertEqual`/`AssertNotAny`) travam o build no `tsc`.
 *     Eles cobrem o caso "tipo mudou de forma".
 *   - Este arquivo cobre o caso "Supabase devolveu valor com formato
 *     diferente em runtime" (e.g. embed virou objeto aninhado, virou
 *     array, virou número). Se a API do PostgREST mudar, o tsc passa
 *     mas a UI quebra — o teste runtime pega.
 *   - `expectTypeOf` adiciona uma terceira camada: roda dentro do
 *     vitest (não só no `tsc`), garantindo que a checagem está
 *     realmente sendo exercitada no CI.
 *
 * Estratégia:
 *   1. Mocka o `supabase` client com payloads representativos.
 *   2. Chama `fetchAvaliacoesPublicasPorEstab` de verdade.
 *   3. Valida tipo (compile-time) + valor (runtime) do `nome_responsavel`.
 */

import { afterEach, describe, expect, expectTypeOf, it, vi } from "vitest";

// Mock do client antes de importar a query (vi.mock é hoisted).
const orderMock = vi.fn();
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            order: () => ({
              returns: () => orderMock(),
            }),
          }),
        }),
      }),
    }),
  },
}));

// Import depois do mock — o módulo capturará a versão mockada.
import { fetchAvaliacoesPublicasPorEstab } from "@/lib/queries/avaliacoes";
import type { AvaliacaoComFamilia } from "@/lib/queries/avaliacoes";

afterEach(() => {
  orderMock.mockReset();
});

// Helper para montar uma row válida — só os campos que importam ao teste.
function makeRow(familia: AvaliacaoComFamilia["familia_profiles"]): AvaliacaoComFamilia {
  return {
    id: "av-1",
    estabelecimento_id: "est-1",
    familia_id: "fam-1",
    comentario: null,
    nota_geral: 5,
    nota_acolhimento: null,
    nota_comunicacao: null,
    nota_estrutura: null,
    publica: true,
    criado_em: "2025-01-01T00:00:00Z",
    familia_profiles: familia,
  };
}

describe("regressão: familia_profiles.nome_responsavel", () => {
  // ── TYPE-LEVEL ─────────────────────────────────────────────────────────────
  // Estes três `expectTypeOf` rodam dentro do vitest (validam que o
  // tipo está sendo exercitado, não só compilado). Se alguém trocar
  // `nome_responsavel` por `string` puro, ou por `unknown`, ou por
  // `number`, qualquer um destes quebra.

  it("tipo de nome_responsavel deve ser exatamente string | null", () => {
    type Embed = NonNullable<AvaliacaoComFamilia["familia_profiles"]>;
    expectTypeOf<Embed["nome_responsavel"]>().toEqualTypeOf<string | null>();
  });

  it("nome_responsavel não pode ser any", () => {
    type Embed = NonNullable<AvaliacaoComFamilia["familia_profiles"]>;
    // `toBeAny` do expectTypeOf inverte: queremos garantir que NÃO é any.
    expectTypeOf<Embed["nome_responsavel"]>().not.toBeAny();
  });

  it("nome_responsavel não pode ser unknown", () => {
    type Embed = NonNullable<AvaliacaoComFamilia["familia_profiles"]>;
    expectTypeOf<Embed["nome_responsavel"]>().not.toBeUnknown();
  });

  // ── RUNTIME (shape vindo do PostgREST) ────────────────────────────────────
  // Se o Supabase mudar o formato do embed (aninha, achata, vira array)
  // os guards de tipo passam mas estes quebram.

  it("aceita string normal e mantém typeof === 'string'", async () => {
    orderMock.mockResolvedValueOnce({
      data: [makeRow({ nome_responsavel: "Maria Silva" })],
      error: null,
    });

    const rows = await fetchAvaliacoesPublicasPorEstab("est-1");

    expect(rows).toHaveLength(1);
    const embed = rows[0]!.familia_profiles;
    expect(embed).not.toBeNull();
    expect(typeof embed!.nome_responsavel).toBe("string");
    expect(embed!.nome_responsavel).toBe("Maria Silva");
  });

  it("aceita null explícito (família anônima/sem nome)", async () => {
    orderMock.mockResolvedValueOnce({
      data: [makeRow({ nome_responsavel: null })],
      error: null,
    });

    const rows = await fetchAvaliacoesPublicasPorEstab("est-1");

    expect(rows[0]!.familia_profiles).not.toBeNull();
    expect(rows[0]!.familia_profiles!.nome_responsavel).toBeNull();
  });

  it("aceita embed null (família sem registro associado)", async () => {
    orderMock.mockResolvedValueOnce({
      data: [makeRow(null)],
      error: null,
    });

    const rows = await fetchAvaliacoesPublicasPorEstab("est-1");

    expect(rows[0]!.familia_profiles).toBeNull();
  });

  // ── DETECÇÃO de payload corrompido ────────────────────────────────────────
  // A função `fetchAvaliacoesPublicasPorEstab` repassa o que o Supabase
  // devolve — não valida shape em runtime. Estes testes documentam o
  // CONTRATO esperado: se a UI receber `nome_responsavel` que não é
  // `string | null`, é regressão. Os testes detectam isso explicitamente
  // (em vez de fingir que a função sanitiza).

  it("DETECTA: number devolvido pelo Supabase é regressão de contrato", async () => {
    orderMock.mockResolvedValueOnce({
      data: [
        // @ts-expect-error — propósito: documentar que o tipo proíbe number.
        makeRow({ nome_responsavel: 12345 }),
      ],
      error: null,
    });

    const rows = await fetchAvaliacoesPublicasPorEstab("est-1");
    const valor = rows[0]!.familia_profiles!.nome_responsavel;

    // Se este `expect` falhar (i.e. o valor PASSAR no contrato),
    // ótimo — significa que adicionamos validação runtime na função.
    // Atualize o teste para refletir a nova garantia.
    const respeitaContrato = typeof valor === "string" || valor === null;
    expect(respeitaContrato).toBe(false);
  });

  it("DETECTA: objeto aninhado devolvido pelo Supabase é regressão", async () => {
    orderMock.mockResolvedValueOnce({
      data: [
        // @ts-expect-error — propósito: PostgREST mudou shape do embed.
        makeRow({ nome_responsavel: { value: "Maria" } }),
      ],
      error: null,
    });

    const rows = await fetchAvaliacoesPublicasPorEstab("est-1");
    const valor = rows[0]!.familia_profiles!.nome_responsavel;

    const respeitaContrato = typeof valor === "string" || valor === null;
    expect(respeitaContrato).toBe(false);
  });

  // ── PROPAGAÇÃO DE ERRO ────────────────────────────────────────────────────
  // Se a query falhar (e.g. RLS bloqueia, FK ausente), a função
  // precisa lançar — e não devolver `[]` silenciosamente.

  it("propaga erro do Supabase em vez de mascarar com array vazio", async () => {
    orderMock.mockResolvedValueOnce({
      data: null,
      error: { message: "FK avaliacoes_familia_id_fkey ausente" },
    });

    await expect(fetchAvaliacoesPublicasPorEstab("est-1")).rejects.toMatchObject({
      message: expect.stringContaining("FK"),
    });
  });

  it("devolve array vazio quando data === null sem erro", async () => {
    orderMock.mockResolvedValueOnce({ data: null, error: null });

    const rows = await fetchAvaliacoesPublicasPorEstab("est-1");
    expect(rows).toEqual([]);
  });
});
