/**
 * Divisão entre comissão da plataforma e repasse ao estabelecimento.
 *
 * Puro, sem I/O: roda no servidor (para congelar os valores na reserva) e no
 * cliente (para mostrar a mesma conta na tela) sem divergir.
 */

/** Percentual usado quando o estabelecimento não tem um negociado. */
export const COMISSAO_PERCENTUAL_PADRAO = 10;

export interface DivisaoDeValores {
  valorTotal: number;
  valorComissao: number;
  valorRepasse: number;
}

/** Reais → centavos, sem erro de ponto flutuante acumulado. */
export function emCentavos(valor: number): number {
  return Math.round(valor * 100);
}

export function emReais(centavos: number): number {
  return centavos / 100;
}

/**
 * Comissão arredondada **para baixo**: quando a conta dá dízima (R$ 333,33 a
 * 10%), o centavo sobra para o estabelecimento. A plataforma absorve a
 * diferença sempre no mesmo sentido, então `comissão + repasse` fecha o total
 * exato — é isso que a conciliação financeira precisa.
 */
export function calcularComissao(valorTotal: number, percentual: number): DivisaoDeValores {
  if (!Number.isFinite(valorTotal) || valorTotal <= 0) {
    throw new RangeError(`valorTotal inválido para cálculo de comissão: ${valorTotal}`);
  }
  if (!Number.isFinite(percentual) || percentual < 0 || percentual > 100) {
    throw new RangeError(`percentual de comissão fora de 0–100: ${percentual}`);
  }

  const totalCentavos = emCentavos(valorTotal);
  const comissaoCentavos = Math.floor((totalCentavos * percentual) / 100);
  const repasseCentavos = totalCentavos - comissaoCentavos;

  return {
    valorTotal: emReais(totalCentavos),
    valorComissao: emReais(comissaoCentavos),
    valorRepasse: emReais(repasseCentavos),
  };
}

/**
 * Percentual efetivo do estabelecimento, com queda para o padrão da
 * plataforma quando nada foi negociado.
 */
export function percentualEfetivo(
  negociado: number | null | undefined,
  padrao: number = COMISSAO_PERCENTUAL_PADRAO,
): number {
  if (negociado == null || !Number.isFinite(negociado)) return padrao;
  if (negociado < 0 || negociado > 100) return padrao;
  return negociado;
}
