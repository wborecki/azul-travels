import { asaasFetch } from "./client.server";
import type { AsaasDeleted, AsaasPayment, AsaasPaymentInput } from "./types";

export async function criarCobranca(input: AsaasPaymentInput): Promise<AsaasPayment> {
  return asaasFetch<AsaasPayment>("/payments", { method: "POST", body: input });
}

export async function buscarCobranca(id: string): Promise<AsaasPayment> {
  return asaasFetch<AsaasPayment>(`/payments/${encodeURIComponent(id)}`);
}

/** Remove uma cobrança ainda não paga. É a compensação quando a reserva cai. */
export async function excluirCobranca(id: string): Promise<AsaasDeleted> {
  return asaasFetch<AsaasDeleted>(`/payments/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export async function estornarCobranca(
  id: string,
  opcoes?: { value?: number; description?: string },
): Promise<AsaasPayment> {
  return asaasFetch<AsaasPayment>(`/payments/${encodeURIComponent(id)}/refund`, {
    method: "POST",
    body: opcoes ?? {},
  });
}
