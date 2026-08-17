import { describe, it, expect } from "vitest";
import {
  AsaasApiError,
  AsaasNetworkError,
  descreverErroAsaas,
  ehClienteInvalido,
  ehErroDeConfiguracao,
  parseAsaasErrors,
} from "../errors";

describe("parseAsaasErrors", () => {
  it("extrai a lista do formato do Asaas", () => {
    const erros = parseAsaasErrors({
      errors: [{ code: "invalid_customer", description: "Cliente não encontrado" }],
    });
    expect(erros).toEqual([{ code: "invalid_customer", description: "Cliente não encontrado" }]);
  });

  it("sobrevive a corpos que não seguem o formato", () => {
    expect(parseAsaasErrors(null)).toEqual([]);
    expect(parseAsaasErrors("Gateway Timeout")).toEqual([]);
    expect(parseAsaasErrors({})).toEqual([]);
    expect(parseAsaasErrors({ errors: "boom" })).toEqual([]);
    expect(parseAsaasErrors({ errors: [null, 42] })).toEqual([]);
  });

  it("completa campos ausentes em vez de estourar", () => {
    expect(parseAsaasErrors({ errors: [{ description: "sem código" }] })).toEqual([
      { code: "unknown", description: "sem código" },
    ]);
  });
});

describe("AsaasApiError", () => {
  it("usa a primeira descrição como mensagem", () => {
    const erro = new AsaasApiError(400, [
      { code: "invalid_value", description: "Valor mínimo é R$ 5,00" },
    ]);
    expect(erro.message).toBe("Valor mínimo é R$ 5,00");
    expect(erro.codigo).toBe("invalid_value");
    expect(erro.status).toBe(400);
  });

  it("tem mensagem mesmo sem corpo de erro", () => {
    const erro = new AsaasApiError(502, []);
    expect(erro.message).toContain("502");
    expect(erro.codigo).toBeNull();
  });

  it("reconhece erros de configuração", () => {
    for (const code of ["invalid_environment", "access_token_not_found", "invalid_access_token"]) {
      expect(ehErroDeConfiguracao(new AsaasApiError(401, [{ code, description: "" }]))).toBe(true);
    }
    expect(
      ehErroDeConfiguracao(new AsaasApiError(400, [{ code: "invalid_value", description: "" }])),
    ).toBe(false);
    expect(ehErroDeConfiguracao(new Error("qualquer"))).toBe(false);
  });

  it("reconhece cliente inexistente", () => {
    expect(
      ehClienteInvalido(new AsaasApiError(404, [{ code: "invalid_customer", description: "" }])),
    ).toBe(true);
    expect(ehClienteInvalido(new AsaasNetworkError("timeout", null))).toBe(false);
  });
});

describe("descreverErroAsaas", () => {
  it("resume código e descrição sem vazar o que enviamos", () => {
    const texto = descreverErroAsaas(
      new AsaasApiError(400, [{ code: "invalid_cpfCnpj", description: "CPF inválido" }]),
    );
    expect(texto).toBe("HTTP 400 — invalid_cpfCnpj: CPF inválido");
  });

  it("distingue falha de rede", () => {
    expect(descreverErroAsaas(new AsaasNetworkError("Falha de rede em POST /payments", null))).toBe(
      "rede — Falha de rede em POST /payments",
    );
  });

  it("aceita qualquer coisa", () => {
    expect(descreverErroAsaas(new Error("boom"))).toBe("boom");
    expect(descreverErroAsaas("boom")).toBe("boom");
  });
});
