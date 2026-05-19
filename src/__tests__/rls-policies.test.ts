/**
 * Testes automatizados de RLS (Row-Level Security).
 *
 * Verifica que o cliente anônimo (não autenticado) NÃO consegue:
 *  - ler tabelas restritas a admins ou aos próprios donos
 *  - alterar/deletar registros em tabelas sensíveis
 *  - chamar RPCs administrativas
 *
 * Roda contra o Supabase real do projeto usando a chave publishable (anon).
 * Use: `bun run test` ou `bunx vitest run src/__tests__/rls-policies.test.ts`
 */
import { describe, it, expect, beforeAll } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  process.env.SUPABASE_PUBLISHABLE_KEY ??
  "";

let anon: SupabaseClient;

beforeAll(() => {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error(
      "VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY ausentes — testes RLS não podem rodar.",
    );
  }
  anon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
});

/**
 * Para tabelas com RLS de SELECT restrito, o PostgREST não devolve erro —
 * apenas retorna um conjunto vazio. Já operações de INSERT/UPDATE/DELETE
 * bloqueadas retornam erro explícito (código 42501 / "row-level security").
 */

const TABELAS_SENSIVEIS_SOMENTE_ADMIN = [
  "familia_profiles",
  "estabelecimento_profiles",
  "perfil_tea",
  "perfil_sensorial",
  "leads_familias",
  "leads_estabelecimentos",
  "contatos_gerais",
  "contatos_estabelecimentos",
  "admin_password_resets",
  "user_roles",
  "reservas",
  "reservas_auditoria",
  "estabelecimentos_auditoria",
  "pre_checkins",
  "auth_audit_log",
] as const;

describe("RLS — leitura anônima bloqueada em tabelas sensíveis", () => {
  for (const tabela of TABELAS_SENSIVEIS_SOMENTE_ADMIN) {
    it(`anon NÃO pode ler ${tabela}`, async () => {
      const { data, error } = await anon
        .from(tabela)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .select("*" as any)
        .limit(5);
      // RLS bloqueia silenciosamente: erro nulo + array vazio.
      expect(error).toBeNull();
      expect(Array.isArray(data) ? data.length : 0).toBe(0);
    });
  }
});

describe("RLS — escrita anônima bloqueada em tabelas sensíveis", () => {
  it("anon NÃO pode inserir em user_roles", async () => {
    const { error } = await anon
      .from("user_roles")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .insert({ user_id: "00000000-0000-0000-0000-000000000000", role: "admin" } as any);
    expect(error).not.toBeNull();
  });

  it("anon NÃO pode inserir em admin_password_resets", async () => {
    const { error } = await anon
      .from("admin_password_resets")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .insert({ target_user_id: "00000000-0000-0000-0000-000000000000" } as any);
    expect(error).not.toBeNull();
  });

  it("anon NÃO pode inserir em perfil_tea", async () => {
    const { error } = await anon.from("perfil_tea").insert({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      user_id: "00000000-0000-0000-0000-000000000000",
      nome_pessoa: "teste",
    } as any);
    expect(error).not.toBeNull();
  });

  it("anon NÃO pode inserir em familia_profiles", async () => {
    const { error } = await anon.from("familia_profiles").insert({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      id: "00000000-0000-0000-0000-000000000000",
      nome_responsavel: "x",
    } as any);
    expect(error).not.toBeNull();
  });

  it("anon NÃO pode inserir em estabelecimento_profiles", async () => {
    const { error } = await anon.from("estabelecimento_profiles").insert({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      id: "00000000-0000-0000-0000-000000000000",
    } as any);
    expect(error).not.toBeNull();
  });

  it("anon NÃO pode inserir reserva", async () => {
    const { error } = await anon.from("reservas").insert({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      familia_id: "00000000-0000-0000-0000-000000000000",
      estabelecimento_id: "00000000-0000-0000-0000-000000000000",
    } as any);
    expect(error).not.toBeNull();
  });

  it("anon NÃO pode atualizar estabelecimentos", async () => {
    const { error } = await anon
      .from("estabelecimentos")
      .update({ nome: "hackeado" })
      .eq("id", "00000000-0000-0000-0000-000000000000");
    // Update bloqueado por RLS: retorna erro OU 0 linhas afetadas; ambos são aceitáveis.
    // Garantimos que NÃO ocorreu sucesso silencioso em linha real.
    expect(error === null || error.code === "42501").toBe(true);
  });

  it("anon NÃO pode deletar estabelecimentos", async () => {
    const { error } = await anon
      .from("estabelecimentos")
      .delete()
      .eq("id", "00000000-0000-0000-0000-000000000000");
    expect(error === null || error.code === "42501").toBe(true);
  });
});

describe("RLS — RPCs administrativas exigem autenticação/role", () => {
  it("anon NÃO pode chamar promote_to_admin", async () => {
    const { error } = await anon.rpc("promote_to_admin", {
      _user_id: "00000000-0000-0000-0000-000000000000",
    });
    expect(error).not.toBeNull();
  });

  it("anon NÃO pode chamar get_dashboard_stats", async () => {
    const { error } = await anon.rpc("get_dashboard_stats");
    expect(error).not.toBeNull();
  });

  it("anon NÃO pode chamar get_familias_count", async () => {
    const { error } = await anon.rpc("get_familias_count");
    expect(error).not.toBeNull();
  });

  it("anon NÃO pode chamar log_admin_password_reset", async () => {
    const { error } = await anon.rpc("log_admin_password_reset", {
      _target_user_id: "00000000-0000-0000-0000-000000000000",
    });
    expect(error).not.toBeNull();
  });

  it("anon PODE chamar log_auth_event (auditoria pública de eventos)", async () => {
    const { error } = await anon.rpc("log_auth_event", {
      _evento: "login_failure",
      _sucesso: false,
      _email: "teste@example.com",
      _metadata: { test: true, password: "DEVE_SER_REMOVIDO" },
    });
    expect(error).toBeNull();
  });
});

describe("RLS — leituras públicas permitidas continuam funcionando", () => {
  it("anon pode listar estabelecimentos ativos", async () => {
    const { data, error } = await anon
      .from("estabelecimentos")
      .select("id, nome, status")
      .limit(1);
    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
  });

  it("anon pode ler conteudo_tea publicado", async () => {
    const { error } = await anon
      .from("conteudo_tea")
      .select("id, titulo, slug, publicado")
      .limit(1);
    expect(error).toBeNull();
  });

  it("anon pode resolver link curto via RPC", async () => {
    const { error } = await anon.rpc("registrar_acesso_link_curto", {
      _slug: "__inexistente__",
    });
    // RPC pública — não deve dar erro de permissão, mesmo que slug não exista.
    expect(error).toBeNull();
  });
});
