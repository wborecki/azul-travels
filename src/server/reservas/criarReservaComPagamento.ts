import { createServerFn } from "@tanstack/react-start";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getAsaasConfig, getUrlPublica } from "@/integrations/asaas/config.server";
import { ensureCustomer } from "@/integrations/asaas/customers.server";
import { criarCobranca, excluirCobranca } from "@/integrations/asaas/payments.server";
import { descreverErroAsaas } from "@/integrations/asaas/errors";
import { criarReservaComPagamentoSchema } from "@/lib/pagamentos/criar-reserva-input";
import { calcularComissao, percentualEfetivo } from "@/lib/pagamentos/comissao";
import { contarNoites, hojeNoBrasil, somarDias } from "@/lib/pagamentos/datas";
import { erroDeReserva, type ResultadoReservaPaga } from "@/lib/pagamentos/erros";
import { buildReservaPayload } from "@/lib/queries/reservas";
import {
  cancelarReservaSemCobranca,
  fetchContextoDeCobranca,
  fetchPerfilDeCobranca,
  fetchReservaEmAberto,
  inserirPagamento,
  inserirReserva,
  salvarDadosAsaasDaFamilia,
  vincularPerfis,
} from "@/lib/queries/pagamentos.server";
import { normalizarCPF, validarCPF } from "@/lib/brazil";

/** A trigger de disponibilidade recusa o insert com este HINT. */
const HINT_SEM_DISPONIBILIDADE = "ITEM_SEM_DISPONIBILIDADE";

function ehItemIndisponivel(erro: unknown): boolean {
  return (
    typeof erro === "object" &&
    erro !== null &&
    (erro as { hint?: unknown }).hint === HINT_SEM_DISPONIBILIDADE
  );
}

function descreverPeriodo(checkIn: string, checkOut: string): string {
  const fmt = new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
  return `${fmt.format(new Date(`${checkIn}T00:00:00Z`))} a ${fmt.format(new Date(`${checkOut}T00:00:00Z`))}`;
}

/**
 * Cria a reserva e a cobrança numa operação só.
 *
 * A reserva vem antes da cobrança de propósito: é o insert que dispara a
 * trigger de disponibilidade, e é ela que garante que o quarto é nosso. Cobrar
 * primeiro significaria cobrar por um quarto que pode ter sido vendido no meio
 * do caminho. O preço disso é a compensação quando o Asaas falha — se a
 * cobrança não nasce, a reserva é cancelada antes de retornarmos.
 */
export const criarReservaComPagamento = createServerFn({ method: "POST" })
  .middleware([attachSupabaseAuth, requireSupabaseAuth])
  .inputValidator(criarReservaComPagamentoSchema)
  .handler(async ({ data, context }): Promise<ResultadoReservaPaga> => {
    const familiaId = context.userId;
    const config = getAsaasConfig();

    const contexto = await fetchContextoDeCobranca(data.itemId, data.estabelecimentoId);
    if (!contexto) return erroDeReserva("ITEM_INDISPONIVEL");

    const { item, estabelecimento, recebimentos } = contexto;

    if (!item.ativo || estabelecimento.status !== "ativo") {
      return erroDeReserva("ITEM_INDISPONIVEL");
    }

    const walletId = recebimentos?.asaas_wallet_id ?? null;
    if (!estabelecimento.aceita_pagamento_online || !walletId) {
      return erroDeReserva("ESTAB_SEM_RECEBIMENTO");
    }

    const noites = contarNoites(data.checkIn, data.checkOut);
    if (noites < 1) return erroDeReserva("DATAS_INVALIDAS");

    const valores = calcularComissao(
      item.preco * noites,
      percentualEfetivo(recebimentos?.comissao_percentual, config.comissaoPercentualPadrao),
    );

    const emAberto = await fetchReservaEmAberto(
      familiaId,
      data.itemId,
      data.checkIn,
      data.checkOut,
    );
    if (emAberto) {
      return {
        ok: true,
        reservaId: emAberto.reservaId,
        invoiceUrl: emAberto.invoiceUrl,
        valorTotal: emAberto.valorTotal,
        reaproveitada: true,
      };
    }

    const perfil = await fetchPerfilDeCobranca(familiaId);
    const cpf = normalizarCPF(data.cpf || perfil?.cpf || "");
    if (!cpf) return erroDeReserva("CPF_OBRIGATORIO");
    if (!validarCPF(cpf)) return erroDeReserva("CPF_INVALIDO");

    let customerId: string;
    try {
      const cliente = await ensureCustomer({
        idExistente: perfil?.asaas_customer_id ?? null,
        name: perfil?.nome_responsavel?.trim() || "Família Turismo Azul",
        cpfCnpj: cpf,
        email: perfil?.email ?? undefined,
        mobilePhone: perfil?.telefone ?? undefined,
        externalReference: familiaId,
      });
      customerId = cliente.customerId;
      await salvarDadosAsaasDaFamilia(familiaId, {
        cpf,
        asaasCustomerId: cliente.criado ? cliente.customerId : undefined,
      });
    } catch (erro) {
      console.error("[asaas] falha ao garantir cliente:", descreverErroAsaas(erro));
      return erroDeReserva("FALHA_ASAAS");
    }

    const payload = buildReservaPayload({
      natureza: "estadia",
      familia_id: familiaId,
      estabelecimento_id: estabelecimento.id,
      item_reservavel_id: item.id,
      perfil_sensorial_id: data.perfilIds[0] ?? null,
      data_checkin: data.checkIn,
      data_checkout: data.checkOut,
      num_adultos: data.adultos,
      num_autistas: data.perfilIds.length,
      num_acompanhantes: data.criancas,
      mensagem: data.mensagem,
      perfil_enviado_ao_estabelecimento: data.perfilIds.length > 0,
      status: "aguardando_pagamento",
      valor_total: valores.valorTotal,
      valor_comissao: valores.valorComissao,
      valor_repasse: valores.valorRepasse,
    });

    let reservaId: string;
    try {
      const reserva = await inserirReserva(payload);
      reservaId = reserva.id;
    } catch (erro) {
      if (ehItemIndisponivel(erro)) return erroDeReserva("ITEM_INDISPONIVEL");
      throw erro;
    }

    try {
      await vincularPerfis(reservaId, data.perfilIds);
    } catch (erro) {
      // Perfis são contexto para o estabelecimento, não pré-requisito da
      // cobrança: derrubar a reserva por causa disso seria pior que seguir.
      console.error("[reserva] falha ao vincular perfis:", erro);
    }

    const dueDate = somarDias(hojeNoBrasil(), 1);
    const descricao = `Reserva ${item.nome} · ${estabelecimento.nome} · ${descreverPeriodo(data.checkIn, data.checkOut)}`;

    let cobranca;
    try {
      cobranca = await criarCobranca({
        customer: customerId,
        billingType: "UNDEFINED",
        value: valores.valorTotal,
        dueDate,
        description: descricao,
        externalReference: reservaId,
        // `fixedValue`, não `percentualValue`: o repasse já foi calculado e
        // congelado na reserva. Mandar percentual deixaria o Asaas arredondar
        // com regra própria, e um centavo de divergência recorrente quebra a
        // conciliação.
        split: [{ walletId, fixedValue: valores.valorRepasse }],
        callback: {
          successUrl: `${getUrlPublica()}/minha-conta/reservas/${reservaId}?pagamento=retorno`,
          autoRedirect: true,
        },
      });
    } catch (erro) {
      console.error("[asaas] falha ao criar cobrança:", descreverErroAsaas(erro));
      await cancelarReservaSemCobranca(reservaId).catch((e) =>
        console.error("[reserva] falha ao cancelar reserva órfã:", e),
      );
      return erroDeReserva("FALHA_ASAAS");
    }

    if (!cobranca.invoiceUrl) {
      console.error("[asaas] cobrança criada sem invoiceUrl:", cobranca.id);
      await excluirCobranca(cobranca.id).catch(() => undefined);
      await cancelarReservaSemCobranca(reservaId).catch(() => undefined);
      return erroDeReserva("FALHA_ASAAS");
    }

    try {
      await inserirPagamento({
        reserva_id: reservaId,
        asaas_payment_id: cobranca.id,
        asaas_customer_id: customerId,
        ambiente: config.ambiente,
        status: "pendente",
        valor_total: valores.valorTotal,
        valor_comissao: valores.valorComissao,
        valor_repasse: valores.valorRepasse,
        invoice_url: cobranca.invoiceUrl,
        billing_type: cobranca.billingType,
        due_date: cobranca.dueDate,
        wallet_id_destino: walletId,
      });
    } catch (erro) {
      // Sem a linha em `pagamentos` o webhook não teria onde conciliar: a
      // cobrança viraria dinheiro sem reserva. Desfaz os dois lados.
      console.error("[pagamento] falha ao gravar cobrança:", erro);
      await excluirCobranca(cobranca.id).catch(() => undefined);
      await cancelarReservaSemCobranca(reservaId).catch(() => undefined);
      return erroDeReserva("FALHA_ASAAS");
    }

    return {
      ok: true,
      reservaId,
      invoiceUrl: cobranca.invoiceUrl,
      valorTotal: valores.valorTotal,
      reaproveitada: false,
    };
  });
