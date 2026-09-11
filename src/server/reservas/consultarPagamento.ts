import { createServerFn } from "@tanstack/react-start";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { consultarPagamentoSchema } from "@/lib/pagamentos/criar-reserva-input";
import {
  fetchStatusDaReservaPaga,
  type StatusDaReservaPaga,
} from "@/lib/queries/pagamentos.server";

export type ConsultarPagamentoResultado =
  | { ok: true; status: StatusDaReservaPaga }
  | { ok: false; motivo: "NAO_ENCONTRADA" };

/**
 * Status da reserva e da cobrança, para o polling da tela de retorno.
 *
 * Lê do nosso banco, não do Asaas: quem move o status é o webhook (Etapa 3).
 * Consultar o Asaas aqui daria uma segunda fonte de verdade e um caminho para
 * confirmar reserva sem passar pela conciliação.
 */
export const consultarPagamento = createServerFn({ method: "GET" })
  .middleware([attachSupabaseAuth, requireSupabaseAuth])
  .inputValidator(consultarPagamentoSchema)
  .handler(async ({ data, context }): Promise<ConsultarPagamentoResultado> => {
    const status = await fetchStatusDaReservaPaga(data.reservaId, context.userId);
    if (!status) return { ok: false, motivo: "NAO_ENCONTRADA" };
    return { ok: true, status };
  });
