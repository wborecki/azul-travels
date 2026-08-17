/**
 * Contrato de entrada da reserva paga.
 *
 * Note a ausência de qualquer campo de valor: o preço é lido de
 * `itens_reservaveis.preco` no servidor. Aceitar preço do cliente seria
 * aceitar uma suíte por R$ 1,00.
 */
import { z } from "zod";
import { contarNoites, ehDataISOValida, hojeNoBrasil } from "./datas";
import { normalizarCPF, validarCPF } from "@/lib/brazil";

/** Teto de noites numa reserva única — trava de sanidade, não regra de negócio. */
export const MAX_NOITES = 90;

const dataISO = z
  .string()
  .refine(ehDataISOValida, "Data deve ser uma data real no formato AAAA-MM-DD");

export const criarReservaComPagamentoSchema = z
  .object({
    itemId: z.uuid(),
    estabelecimentoId: z.uuid(),
    checkIn: dataISO,
    checkOut: dataISO,
    adultos: z.number().int().min(1).max(30),
    criancas: z.number().int().min(0).max(30),
    perfilIds: z.array(z.uuid()).max(20).default([]),
    mensagem: z.string().max(2000).default(""),
    cpf: z
      .string()
      .transform(normalizarCPF)
      .refine((v) => v.length === 0 || validarCPF(v), "CPF inválido")
      .default(""),
  })
  .refine((v) => contarNoites(v.checkIn, v.checkOut) >= 1, {
    message: "O check-out precisa ser depois do check-in",
    path: ["checkOut"],
  })
  .refine((v) => contarNoites(v.checkIn, v.checkOut) <= MAX_NOITES, {
    message: `Períodos acima de ${MAX_NOITES} noites precisam ser combinados direto com o local`,
    path: ["checkOut"],
  })
  .refine((v) => v.checkIn >= hojeNoBrasil(), {
    message: "O check-in não pode ser no passado",
    path: ["checkIn"],
  });

export type CriarReservaComPagamentoInput = z.input<typeof criarReservaComPagamentoSchema>;
export type CriarReservaComPagamentoData = z.output<typeof criarReservaComPagamentoSchema>;

export const consultarPagamentoSchema = z.object({
  reservaId: z.uuid(),
});
