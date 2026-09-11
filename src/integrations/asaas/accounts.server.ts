/**
 * Subcontas. Usado pela Etapa 4 (onboarding de recebimentos); aqui só o
 * endpoint, para o cliente HTTP nascer completo.
 */
import { asaasFetch } from "./client.server";
import type { AsaasAccount, AsaasAccountInput, AsaasList, AsaasWalletIdResponse } from "./types";

export async function criarSubconta(input: AsaasAccountInput): Promise<AsaasAccount> {
  return asaasFetch<AsaasAccount>("/accounts", { method: "POST", body: input });
}

export async function listarSubcontas(params?: {
  cpfCnpj?: string;
  limit?: number;
  offset?: number;
}): Promise<AsaasList<AsaasAccount>> {
  return asaasFetch<AsaasList<AsaasAccount>>("/accounts", { query: params });
}

/** `walletId` da própria conta da plataforma — o outro lado do split. */
export async function buscarWalletIdDaPlataforma(): Promise<string> {
  const { walletId } = await asaasFetch<AsaasWalletIdResponse>("/myAccount/walletId");
  return walletId;
}
