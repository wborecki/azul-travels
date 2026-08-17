/** Erros do Asaas traduzidos para tipos nossos. */

export interface AsaasErrorItem {
  code: string;
  description: string;
}

/** Resposta 4xx/5xx do Asaas: `{ errors: [{ code, description }] }`. */
export class AsaasApiError extends Error {
  readonly name = "AsaasApiError";
  readonly status: number;
  readonly erros: AsaasErrorItem[];

  constructor(status: number, erros: AsaasErrorItem[], mensagem?: string) {
    super(mensagem ?? erros[0]?.description ?? `Asaas respondeu ${status}`);
    this.status = status;
    this.erros = erros;
  }

  get codigo(): string | null {
    return this.erros[0]?.code ?? null;
  }

  get descricao(): string | null {
    return this.erros[0]?.description ?? null;
  }

  temCodigo(code: string): boolean {
    return this.erros.some((e) => e.code === code);
  }
}

/** Falha de transporte: DNS, timeout, conexão cortada. Retentável. */
export class AsaasNetworkError extends Error {
  readonly name = "AsaasNetworkError";
  readonly causa: unknown;

  constructor(mensagem: string, causa: unknown) {
    super(mensagem);
    this.causa = causa;
  }
}

/**
 * Erros que significam "a integração está mal configurada", não "esta
 * requisição falhou". Chave trocada entre ambientes é o caso clássico: toda
 * chamada vai falhar até alguém corrigir a variável.
 */
export const ASAAS_ERROS_DE_CONFIGURACAO = [
  "invalid_environment",
  "access_token_not_found",
  "invalid_access_token",
] as const;

export function ehErroDeConfiguracao(erro: unknown): erro is AsaasApiError {
  return (
    erro instanceof AsaasApiError &&
    ASAAS_ERROS_DE_CONFIGURACAO.some((code) => erro.temCodigo(code))
  );
}

/** O `asaas_customer_id` que guardamos não existe mais lá — recriar. */
export function ehClienteInvalido(erro: unknown): erro is AsaasApiError {
  return erro instanceof AsaasApiError && erro.temCodigo("invalid_customer");
}

export function parseAsaasErrors(body: unknown): AsaasErrorItem[] {
  if (typeof body !== "object" || body === null) return [];
  const errors = (body as { errors?: unknown }).errors;
  if (!Array.isArray(errors)) return [];
  return errors.flatMap((e) => {
    if (typeof e !== "object" || e === null) return [];
    const { code, description } = e as { code?: unknown; description?: unknown };
    return [
      {
        code: typeof code === "string" ? code : "unknown",
        description: typeof description === "string" ? description : "",
      },
    ];
  });
}

/**
 * Resumo seguro para log e para a coluna `erro` de `asaas_webhook_events`:
 * códigos e descrições do Asaas, nunca o corpo que enviamos (que carrega CPF).
 */
export function descreverErroAsaas(erro: unknown): string {
  if (erro instanceof AsaasApiError) {
    const detalhe = erro.erros.map((e) => `${e.code}: ${e.description}`).join(" | ");
    return `HTTP ${erro.status} — ${detalhe || erro.message}`;
  }
  if (erro instanceof AsaasNetworkError) return `rede — ${erro.message}`;
  if (erro instanceof Error) return erro.message;
  return String(erro);
}
