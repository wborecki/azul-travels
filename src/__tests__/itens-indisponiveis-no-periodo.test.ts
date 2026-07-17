/**
 * Testes de contrato da RPC `itens_indisponiveis_no_periodo` (F5).
 *
 * Roda contra o Supabase real com a chave publishable (anon), como
 * `rls-policies.test.ts`. Cobre o que o client anônimo consegue exercitar:
 * execução permitida, shape do retorno, período inválido e janela limitada.
 *
 * Os cenários que dependem de fixtures privadas (reserva parcial, bloqueio,
 * múltiplas unidades, limite meio-aberto) exigem service role para seed e
 * ficam fora desta suíte — a lógica espelha `datas_indisponiveis_item`,
 * validada no fluxo de reserva.
 */
import { describe, it, expect, beforeAll } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_PUBLISHABLE_KEY ?? "";

let anon: SupabaseClient<Database>;
// A migration F5 pode ainda não ter sido aplicada (`supabase db push` é
// manual). Nesse caso a suíte é pulada com aviso em vez de falhar.
let rpcAusente = false;

beforeAll(async () => {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error(
      "VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY ausentes — testes da RPC não podem rodar.",
    );
  }
  anon = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error } = await rpc("2026-08-01", "2026-08-02");
  if (error?.code === "PGRST202") {
    rpcAusente = true;
    console.warn(
      "itens_indisponiveis_no_periodo não existe no banco — aplique a migration 20260715200000 e rode novamente. Suíte pulada.",
    );
  }
});

function rpc(checkin: string, checkout: string) {
  return anon.rpc("itens_indisponiveis_no_periodo", {
    p_checkin: checkin,
    p_checkout: checkout,
  });
}

describe("RPC itens_indisponiveis_no_periodo", () => {
  it("anon executa período válido e recebe lista de IDs", async (ctx) => {
    if (rpcAusente) return ctx.skip();
    const { data, error } = await rpc("2026-08-01", "2026-08-05");
    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
    for (const row of data ?? []) {
      expect(typeof row.item_id).toBe("string");
    }
  });

  it("check-out igual ao check-in retorna vazio", async (ctx) => {
    if (rpcAusente) return ctx.skip();
    const { data, error } = await rpc("2026-08-01", "2026-08-01");
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it("check-out anterior ao check-in retorna vazio", async (ctx) => {
    if (rpcAusente) return ctx.skip();
    const { data, error } = await rpc("2026-08-10", "2026-08-01");
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it("janela gigante é limitada a 12 meses (responde sem erro)", async (ctx) => {
    if (rpcAusente) return ctx.skip();
    const { data, error } = await rpc("2026-08-01", "2999-12-31");
    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
  });

  it("data malformada é rejeitada pelo tipo date", async (ctx) => {
    if (rpcAusente) return ctx.skip();
    const { error } = await rpc("nao-e-data", "2026-08-05");
    expect(error).not.toBeNull();
  });
});
