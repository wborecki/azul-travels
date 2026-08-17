/**
 * Acesso a dados do fluxo de reserva paga, com service role.
 *
 * Vive em `src/lib/queries/` porque é lá que toda query Supabase mora (a regra
 * `no-restricted-syntax` do ESLint), e carrega o sufixo `.server.ts` porque
 * usa `supabaseAdmin` — nada aqui pode entrar no grafo de imports do cliente.
 * Por isso este módulo **não** é reexportado por `src/lib/queries/index.ts`.
 */
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export type Pagamento = Tables<"pagamentos">;
export type PagamentoInsert = TablesInsert<"pagamentos">;
export type ReservaInsertServer = TablesInsert<"reservas">;

export interface ContextoDeCobranca {
  item: Pick<
    Tables<"itens_reservaveis">,
    "id" | "nome" | "preco" | "ativo" | "estabelecimento_id" | "capacidade_total"
  >;
  estabelecimento: Pick<
    Tables<"estabelecimentos">,
    "id" | "nome" | "slug" | "status" | "aceita_pagamento_online"
  >;
  recebimentos: Pick<
    Tables<"estabelecimento_recebimentos">,
    "asaas_wallet_id" | "comissao_percentual" | "status_onboarding"
  > | null;
}

/**
 * Item + estabelecimento + dados de recebimento numa ida só. `null` quando o
 * item não existe ou não pertence ao estabelecimento informado — a checagem de
 * coerência que impede reservar um quarto de outro local.
 */
export async function fetchContextoDeCobranca(
  itemId: string,
  estabelecimentoId: string,
): Promise<ContextoDeCobranca | null> {
  const { data: item, error: erroItem } = await supabaseAdmin
    .from("itens_reservaveis")
    .select("id, nome, preco, ativo, estabelecimento_id, capacidade_total")
    .eq("id", itemId)
    .maybeSingle();
  if (erroItem) throw erroItem;
  if (!item || item.estabelecimento_id !== estabelecimentoId) return null;

  const { data: estabelecimento, error: erroEstab } = await supabaseAdmin
    .from("estabelecimentos")
    .select("id, nome, slug, status, aceita_pagamento_online")
    .eq("id", estabelecimentoId)
    .maybeSingle();
  if (erroEstab) throw erroEstab;
  if (!estabelecimento) return null;

  const { data: recebimentos, error: erroReceb } = await supabaseAdmin
    .from("estabelecimento_recebimentos")
    .select("asaas_wallet_id, comissao_percentual, status_onboarding")
    .eq("estabelecimento_id", estabelecimentoId)
    .maybeSingle();
  if (erroReceb) throw erroReceb;

  return { item, estabelecimento, recebimentos };
}

export type PerfilDeCobranca = Pick<
  Tables<"familia_profiles">,
  "id" | "nome_responsavel" | "email" | "telefone" | "cpf" | "asaas_customer_id"
>;

export async function fetchPerfilDeCobranca(familiaId: string): Promise<PerfilDeCobranca | null> {
  const { data, error } = await supabaseAdmin
    .from("familia_profiles")
    .select("id, nome_responsavel, email, telefone, cpf, asaas_customer_id")
    .eq("id", familiaId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function salvarDadosAsaasDaFamilia(
  familiaId: string,
  dados: { cpf?: string; asaasCustomerId?: string },
): Promise<void> {
  const patch: { cpf?: string; asaas_customer_id?: string } = {};
  if (dados.cpf) patch.cpf = dados.cpf;
  if (dados.asaasCustomerId) patch.asaas_customer_id = dados.asaasCustomerId;
  if (Object.keys(patch).length === 0) return;

  const { error } = await supabaseAdmin.from("familia_profiles").update(patch).eq("id", familiaId);
  if (error) throw error;
}

export interface ReservaEmAberto {
  reservaId: string;
  invoiceUrl: string;
  valorTotal: number;
}

/**
 * Reserva da mesma família, mesmo quarto e mesmas datas que ainda espera
 * pagamento e já tem fatura. É a defesa contra duplo clique e contra o botão
 * "voltar" do navegador: em vez de emitir outra cobrança, devolvemos a que
 * está de pé.
 */
export async function fetchReservaEmAberto(
  familiaId: string,
  itemId: string,
  checkIn: string,
  checkOut: string,
): Promise<ReservaEmAberto | null> {
  const { data, error } = await supabaseAdmin
    .from("reservas")
    .select("id, valor_total, pagamentos(invoice_url, status)")
    .eq("familia_id", familiaId)
    .eq("item_reservavel_id", itemId)
    .eq("data_checkin", checkIn)
    .eq("data_checkout", checkOut)
    .eq("status", "aguardando_pagamento")
    .order("criado_em", { ascending: false })
    .limit(5);
  if (error) throw error;

  for (const reserva of data ?? []) {
    const pagamento = reserva.pagamentos.find(
      (p) => p.status === "pendente" && p.invoice_url !== null,
    );
    if (pagamento?.invoice_url) {
      return {
        reservaId: reserva.id,
        invoiceUrl: pagamento.invoice_url,
        valorTotal: reserva.valor_total ?? 0,
      };
    }
  }
  return null;
}

export async function inserirReserva(payload: ReservaInsertServer): Promise<Tables<"reservas">> {
  const { data, error } = await supabaseAdmin.from("reservas").insert(payload).select("*").single();
  if (error) throw error;
  return data;
}

export async function vincularPerfis(reservaId: string, perfilIds: string[]): Promise<void> {
  if (perfilIds.length === 0) return;
  const { error } = await supabaseAdmin.from("reserva_perfis").upsert(
    perfilIds.map((perfilSensorialId) => ({
      reserva_id: reservaId,
      perfil_sensorial_id: perfilSensorialId,
    })),
    { onConflict: "reserva_id,perfil_sensorial_id", ignoreDuplicates: true },
  );
  if (error) throw error;
}

export async function inserirPagamento(payload: PagamentoInsert): Promise<Pagamento> {
  const { data, error } = await supabaseAdmin
    .from("pagamentos")
    .insert(payload)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

/**
 * Compensação quando a cobrança falha depois da reserva inserida: sem isso o
 * quarto fica bloqueado por uma reserva que ninguém vai pagar. O pg_cron de
 * expiração é a rede de segurança, não o caminho principal.
 */
export async function cancelarReservaSemCobranca(reservaId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from("reservas")
    .update({ status: "cancelada" })
    .eq("id", reservaId)
    .eq("status", "aguardando_pagamento");
  if (error) throw error;
}

export interface StatusDaReservaPaga {
  reservaId: string;
  statusReserva: Tables<"reservas">["status"];
  statusPagamento: Pagamento["status"] | null;
  invoiceUrl: string | null;
  valorTotal: number | null;
}

/** Status para o polling da tela de retorno. Restrito à família dona da reserva. */
export async function fetchStatusDaReservaPaga(
  reservaId: string,
  familiaId: string,
): Promise<StatusDaReservaPaga | null> {
  const { data, error } = await supabaseAdmin
    .from("reservas")
    .select("id, status, valor_total, pagamentos(invoice_url, status, criado_em)")
    .eq("id", reservaId)
    .eq("familia_id", familiaId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const pagamento = [...data.pagamentos].sort((a, b) => b.criado_em.localeCompare(a.criado_em))[0];

  return {
    reservaId: data.id,
    statusReserva: data.status,
    statusPagamento: pagamento?.status ?? null,
    invoiceUrl: pagamento?.invoice_url ?? null,
    valorTotal: data.valor_total,
  };
}
