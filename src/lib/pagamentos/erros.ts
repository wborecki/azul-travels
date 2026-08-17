/**
 * Erros de domínio da criação de reserva paga.
 *
 * Atravessam a fronteira RPC como **valor de retorno**, não como exceção: a UI
 * da Etapa 5 ramifica por código (oferecer contato direto quando o local não
 * recebe online, pedir o CPF quando falta, etc.) e uma exceção serializada
 * perderia o tipo no caminho.
 */

export const CODIGOS_ERRO_RESERVA = [
  "ESTAB_SEM_RECEBIMENTO",
  "CPF_OBRIGATORIO",
  "CPF_INVALIDO",
  "ITEM_INDISPONIVEL",
  "DATAS_INVALIDAS",
  "FALHA_ASAAS",
] as const;

export type CodigoErroReserva = (typeof CODIGOS_ERRO_RESERVA)[number];

export const MENSAGEM_ERRO_RESERVA: Record<CodigoErroReserva, string> = {
  ESTAB_SEM_RECEBIMENTO:
    "Este local ainda não recebe pagamentos pela plataforma. Você pode falar direto com ele para reservar.",
  CPF_OBRIGATORIO: "Precisamos do seu CPF para emitir a cobrança.",
  CPF_INVALIDO: "Confira o CPF: os dígitos não batem.",
  ITEM_INDISPONIVEL: "Este quarto acabou de ficar indisponível para as datas escolhidas.",
  DATAS_INVALIDAS: "Confira as datas de check-in e check-out.",
  FALHA_ASAAS: "Não conseguimos gerar a cobrança agora. Tente de novo em alguns instantes.",
};

export function isCodigoErroReserva(v: unknown): v is CodigoErroReserva {
  return typeof v === "string" && (CODIGOS_ERRO_RESERVA as readonly string[]).includes(v);
}

export interface ReservaPagaOk {
  ok: true;
  reservaId: string;
  invoiceUrl: string;
  valorTotal: number;
  /** `true` quando devolvemos uma reserva em aberto em vez de criar outra. */
  reaproveitada: boolean;
}

export interface ReservaPagaErro {
  ok: false;
  codigo: CodigoErroReserva;
  mensagem: string;
}

export type ResultadoReservaPaga = ReservaPagaOk | ReservaPagaErro;

export function erroDeReserva(
  codigo: CodigoErroReserva,
  mensagem = MENSAGEM_ERRO_RESERVA[codigo],
): ReservaPagaErro {
  return { ok: false, codigo, mensagem };
}
