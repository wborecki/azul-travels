/**
 * Configuração do Asaas lida do ambiente.
 *
 * Nenhuma dessas variáveis pode ganhar prefixo `VITE_`: o Vite injeta as
 * prefixadas no bundle do cliente em tempo de build, e a chave de API dá
 * controle total sobre a conta financeira.
 */

export type AsaasAmbiente = "sandbox" | "producao";

export interface AsaasConfig {
  baseUrl: string;
  apiKey: string;
  ambiente: AsaasAmbiente;
  walletIdPlataforma: string | null;
  comissaoPercentualPadrao: number;
  prazoPagamentoMinutos: number;
}

const PRAZO_PAGAMENTO_MINUTOS_PADRAO = 30;

function numeroDoAmbiente(valor: string | undefined, padrao: number): number {
  const n = Number(valor);
  return Number.isFinite(n) && n > 0 ? n : padrao;
}

function montarConfig(): AsaasConfig {
  const baseUrl = process.env.ASAAS_BASE_URL?.replace(/\/+$/, "");
  const apiKey = process.env.ASAAS_API_KEY;

  if (!baseUrl || !apiKey) {
    throw new Error(
      "Integração Asaas não configurada: defina ASAAS_BASE_URL e ASAAS_API_KEY (sem prefixo VITE_).",
    );
  }

  const ambiente: AsaasAmbiente =
    process.env.ASAAS_AMBIENTE === "producao" ? "producao" : "sandbox";
  const urlEhSandbox = baseUrl.includes("sandbox");

  // Chave de produção contra a URL de sandbox devolve `invalid_environment` em
  // toda chamada. Falhar aqui aponta a variável errada em vez de deixar o erro
  // aparecer como "não conseguimos gerar a cobrança".
  if (urlEhSandbox !== (ambiente === "sandbox")) {
    throw new Error(`ASAAS_AMBIENTE="${ambiente}" não combina com ASAAS_BASE_URL="${baseUrl}".`);
  }

  return {
    baseUrl,
    apiKey,
    ambiente,
    walletIdPlataforma: process.env.ASAAS_WALLET_ID_PLATAFORMA || null,
    comissaoPercentualPadrao: numeroDoAmbiente(process.env.PLATAFORMA_COMISSAO_PERCENTUAL, 10),
    prazoPagamentoMinutos: numeroDoAmbiente(
      process.env.RESERVA_PRAZO_PAGAMENTO_MINUTOS,
      PRAZO_PAGAMENTO_MINUTOS_PADRAO,
    ),
  };
}

let cache: AsaasConfig | undefined;

export function getAsaasConfig(): AsaasConfig {
  if (!cache) cache = montarConfig();
  return cache;
}

/** URL pública do site, usada no `callback.successUrl` da cobrança. */
export function getUrlPublica(): string {
  const url = process.env.APP_BASE_URL || process.env.VITE_APP_BASE_URL;
  return (url || "http://localhost:8080").replace(/\/+$/, "");
}
