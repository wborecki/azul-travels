/**
 * Cliente HTTP do Asaas. Servidor apenas — o sufixo `.server.ts` segue a
 * convenção de `src/integrations/supabase/client.server.ts`.
 */
import { getAsaasConfig } from "./config.server";
import { AsaasApiError, AsaasNetworkError, parseAsaasErrors } from "./errors";

export interface AsaasFetchInit {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  query?: Record<string, string | number | undefined>;
  /** Abortar a chamada depois de N ms. Padrão 20s. */
  timeoutMs?: number;
}

const TIMEOUT_PADRAO_MS = 20_000;

function montarUrl(baseUrl: string, path: string, query?: AsaasFetchInit["query"]): string {
  const url = new URL(`${baseUrl}${path.startsWith("/") ? path : `/${path}`}`);
  for (const [chave, valor] of Object.entries(query ?? {})) {
    if (valor !== undefined) url.searchParams.set(chave, String(valor));
  }
  return url.toString();
}

export async function asaasFetch<T>(path: string, init: AsaasFetchInit = {}): Promise<T> {
  const { baseUrl, apiKey } = getAsaasConfig();
  const method = init.method ?? "GET";
  const url = montarUrl(baseUrl, path, init.query);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), init.timeoutMs ?? TIMEOUT_PADRAO_MS);

  let resposta: Response;
  try {
    resposta = await fetch(url, {
      method,
      signal: controller.signal,
      headers: {
        access_token: apiKey,
        "Content-Type": "application/json",
        // O Asaas pede identificação da aplicação em todas as chamadas.
        "User-Agent": "TurismoAzul/1.0",
      },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    });
  } catch (causa) {
    // Nunca inclua `init.body` aqui: o payload de cliente carrega CPF.
    throw new AsaasNetworkError(`Falha de rede em ${method} ${path}`, causa);
  } finally {
    clearTimeout(timeout);
  }

  const texto = await resposta.text();
  const corpo: unknown = texto ? seguroJson(texto) : null;

  if (!resposta.ok) {
    throw new AsaasApiError(resposta.status, parseAsaasErrors(corpo));
  }

  return corpo as T;
}

function seguroJson(texto: string): unknown {
  try {
    return JSON.parse(texto);
  } catch {
    return { raw: texto };
  }
}
