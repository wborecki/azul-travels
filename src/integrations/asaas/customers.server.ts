import { asaasFetch } from "./client.server";
import { ehClienteInvalido } from "./errors";
import type { AsaasCustomer, AsaasCustomerInput } from "./types";

export async function criarCustomer(input: AsaasCustomerInput): Promise<AsaasCustomer> {
  return asaasFetch<AsaasCustomer>("/customers", { method: "POST", body: input });
}

export async function buscarCustomer(id: string): Promise<AsaasCustomer | null> {
  try {
    return await asaasFetch<AsaasCustomer>(`/customers/${encodeURIComponent(id)}`);
  } catch (erro) {
    if (ehClienteInvalido(erro)) return null;
    throw erro;
  }
}

export interface EnsureCustomerParams extends AsaasCustomerInput {
  /** O que já está em `familia_profiles.asaas_customer_id`, se houver. */
  idExistente: string | null;
}

export interface EnsureCustomerResult {
  customerId: string;
  /** `true` quando um cliente novo foi criado e o id precisa ser persistido. */
  criado: boolean;
}

/**
 * Reusa o cliente já criado ou cria um novo. Persistir o id é responsabilidade
 * de quem chama — este módulo não fala com o banco.
 *
 * Um id que o Asaas não reconhece mais (conta recriada no Sandbox, por
 * exemplo) é tratado como ausência: criamos outro em vez de derrubar a reserva.
 */
export async function ensureCustomer({
  idExistente,
  ...input
}: EnsureCustomerParams): Promise<EnsureCustomerResult> {
  if (idExistente) {
    const existente = await buscarCustomer(idExistente);
    if (existente && !existente.deleted) {
      return { customerId: existente.id, criado: false };
    }
  }

  const novo = await criarCustomer(input);
  return { customerId: novo.id, criado: true };
}
