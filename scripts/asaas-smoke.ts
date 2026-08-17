/**
 * Fumaça do Sandbox do Asaas: cria (ou reusa) um cliente, emite uma cobrança
 * com split e imprime a `invoiceUrl`.
 *
 *   bun run scripts/asaas-smoke.ts
 *
 * Não toca no banco — é o que permite validar as credenciais e o split antes
 * de existir qualquer tela. Recusa rodar fora do Sandbox.
 */
import { getAsaasConfig } from "@/integrations/asaas/config.server";
import { buscarWalletIdDaPlataforma } from "@/integrations/asaas/accounts.server";
import { ensureCustomer } from "@/integrations/asaas/customers.server";
import { buscarCobranca, criarCobranca } from "@/integrations/asaas/payments.server";
import { descreverErroAsaas } from "@/integrations/asaas/errors";
import { calcularComissao } from "@/lib/pagamentos/comissao";
import { hojeNoBrasil, somarDias } from "@/lib/pagamentos/datas";

const CPF_TESTE = "52998224725";
const VALOR_TESTE = 333.33;

async function main() {
  const config = getAsaasConfig();
  if (config.ambiente !== "sandbox") {
    throw new Error("asaas-smoke só roda no Sandbox — emitiria uma cobrança real em produção.");
  }

  console.log(`Ambiente: ${config.ambiente} (${config.baseUrl})`);

  const walletPlataforma = await buscarWalletIdDaPlataforma();
  console.log(`walletId da plataforma: ${walletPlataforma}`);

  // Sem uma subconta pronta (Etapa 4), o split aponta para a própria conta.
  // Isso exercita o campo e a soma, ainda que o dinheiro não saia do lugar.
  const walletDestino = process.env.ASAAS_WALLET_ID_TESTE || walletPlataforma;
  const valores = calcularComissao(VALOR_TESTE, config.comissaoPercentualPadrao);
  console.log(
    `Valores: total ${valores.valorTotal} · comissão ${valores.valorComissao} · repasse ${valores.valorRepasse}`,
  );

  const cliente = await ensureCustomer({
    idExistente: process.env.ASAAS_CUSTOMER_ID_TESTE || null,
    name: "Família Teste Turismo Azul",
    cpfCnpj: CPF_TESTE,
    email: "familia.teste@example.com",
    externalReference: "smoke-familia-teste",
  });
  console.log(`Cliente: ${cliente.customerId} (${cliente.criado ? "criado" : "reusado"})`);

  const reusado = await ensureCustomer({
    idExistente: cliente.customerId,
    name: "Família Teste Turismo Azul",
    cpfCnpj: CPF_TESTE,
    externalReference: "smoke-familia-teste",
  });
  console.log(
    reusado.criado
      ? "ATENÇÃO: a segunda chamada criou outro cliente — ensureCustomer não está reusando."
      : "Reuso de cliente confirmado (nenhuma duplicata).",
  );

  const cobranca = await criarCobranca({
    customer: cliente.customerId,
    billingType: "UNDEFINED",
    value: valores.valorTotal,
    dueDate: somarDias(hojeNoBrasil(), 1),
    description: "Fumaça · Turismo Azul",
    externalReference: `smoke-${Date.now()}`,
    split: [{ walletId: walletDestino, fixedValue: valores.valorRepasse }],
  });

  const conferida = await buscarCobranca(cobranca.id);
  console.log(`Cobrança: ${conferida.id} · status ${conferida.status} · valor ${conferida.value}`);
  console.log(`Split: ${JSON.stringify(conferida.split ?? [])}`);
  console.log(`\ninvoiceUrl: ${conferida.invoiceUrl}\n`);

  if (conferida.value !== valores.valorTotal) {
    console.error("ATENÇÃO: o valor devolvido pelo Asaas não bate com o enviado.");
  }
}

main().catch((erro) => {
  console.error("Fumaça falhou:", descreverErroAsaas(erro));
  process.exitCode = 1;
});
