import { describe, it, expect } from "vitest";
import {
  calcularComissao,
  emCentavos,
  percentualEfetivo,
  COMISSAO_PERCENTUAL_PADRAO,
} from "../comissao";

/**
 * A soma é conferida em centavos, não em reais: `33.33 + 300` em ponto
 * flutuante não é confiável, mas `3333 + 30000` é. É também assim que o
 * Postgres guarda (numeric exato) e como o Asaas recebe o split.
 */
function somaFecha(total: number, comissao: number, repasse: number): boolean {
  return emCentavos(comissao) + emCentavos(repasse) === emCentavos(total);
}

describe("calcularComissao", () => {
  it("divide um valor redondo", () => {
    const r = calcularComissao(1000, 10);
    expect(r.valorComissao).toBe(100);
    expect(r.valorRepasse).toBe(900);
    expect(somaFecha(r.valorTotal, r.valorComissao, r.valorRepasse)).toBe(true);
  });

  it("com dízima, o centavo sobra para o estabelecimento", () => {
    const r = calcularComissao(333.33, 10);
    // 33333 centavos × 10% = 3333,3 → comissão trunca em 3333.
    expect(r.valorComissao).toBe(33.33);
    expect(r.valorRepasse).toBe(300);
    expect(somaFecha(r.valorTotal, r.valorComissao, r.valorRepasse)).toBe(true);
  });

  it("percentual 0 não cobra comissão", () => {
    const r = calcularComissao(500, 0);
    expect(r.valorComissao).toBe(0);
    expect(r.valorRepasse).toBe(500);
  });

  it("percentual 100 não deixa repasse", () => {
    const r = calcularComissao(500, 100);
    expect(r.valorComissao).toBe(500);
    expect(r.valorRepasse).toBe(0);
  });

  it("percentual fracionário", () => {
    const r = calcularComissao(199.99, 12.5);
    expect(somaFecha(r.valorTotal, r.valorComissao, r.valorRepasse)).toBe(true);
    expect(r.valorComissao).toBe(24.99);
  });

  it("valor mínimo de um centavo", () => {
    const r = calcularComissao(0.01, 10);
    expect(r.valorComissao).toBe(0);
    expect(r.valorRepasse).toBe(0.01);
  });

  it("a soma fecha em uma varredura de valores e percentuais", () => {
    for (let centavos = 1; centavos <= 5000; centavos += 7) {
      for (const percentual of [0, 3, 10, 12.5, 33.33, 50, 99.9, 100]) {
        const r = calcularComissao(centavos / 100, percentual);
        expect(somaFecha(r.valorTotal, r.valorComissao, r.valorRepasse)).toBe(true);
        expect(r.valorComissao).toBeGreaterThanOrEqual(0);
        expect(r.valorRepasse).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it("recusa valores e percentuais impossíveis", () => {
    expect(() => calcularComissao(0, 10)).toThrow(RangeError);
    expect(() => calcularComissao(-10, 10)).toThrow(RangeError);
    expect(() => calcularComissao(Number.NaN, 10)).toThrow(RangeError);
    expect(() => calcularComissao(100, -1)).toThrow(RangeError);
    expect(() => calcularComissao(100, 101)).toThrow(RangeError);
  });
});

describe("percentualEfetivo", () => {
  it("usa o negociado quando existe", () => {
    expect(percentualEfetivo(7)).toBe(7);
    expect(percentualEfetivo(0)).toBe(0);
  });

  it("cai para o padrão quando não há negociado ou ele é absurdo", () => {
    expect(percentualEfetivo(null)).toBe(COMISSAO_PERCENTUAL_PADRAO);
    expect(percentualEfetivo(undefined)).toBe(COMISSAO_PERCENTUAL_PADRAO);
    expect(percentualEfetivo(-5)).toBe(COMISSAO_PERCENTUAL_PADRAO);
    expect(percentualEfetivo(150)).toBe(COMISSAO_PERCENTUAL_PADRAO);
    expect(percentualEfetivo(12, 20)).toBe(12);
    expect(percentualEfetivo(null, 20)).toBe(20);
  });
});
