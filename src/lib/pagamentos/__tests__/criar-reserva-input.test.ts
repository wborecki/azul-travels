import { describe, it, expect } from "vitest";
import { criarReservaComPagamentoSchema, MAX_NOITES } from "../criar-reserva-input";
import { hojeNoBrasil, somarDias, contarNoites, ehDataISOValida } from "../datas";
import { normalizarCPF, validarCPF } from "@/lib/brazil";

const ITEM = "11111111-1111-4111-8111-111111111111";
const ESTAB = "22222222-2222-4222-8222-222222222222";

/** CPF de teste com dígitos verificadores corretos. */
const CPF_VALIDO = "52998224725";

function base(patch: Record<string, unknown> = {}) {
  const checkIn = somarDias(hojeNoBrasil(), 10);
  return {
    itemId: ITEM,
    estabelecimentoId: ESTAB,
    checkIn,
    checkOut: somarDias(checkIn, 2),
    adultos: 2,
    criancas: 1,
    perfilIds: [],
    mensagem: "",
    cpf: CPF_VALIDO,
    ...patch,
  };
}

describe("criarReservaComPagamentoSchema", () => {
  it("aceita um pedido bem formado", () => {
    const r = criarReservaComPagamentoSchema.safeParse(base());
    expect(r.success).toBe(true);
  });

  it("não tem campo de preço no contrato", () => {
    // Se um dia alguém adicionar `valorTotal` à entrada, o parse passaria a
    // devolvê-lo e o servidor poderia usá-lo. O contrato precisa descartar.
    const r = criarReservaComPagamentoSchema.safeParse(base({ valorTotal: 1 }));
    expect(r.success).toBe(true);
    expect(r.success && "valorTotal" in r.data).toBe(false);
  });

  it("recusa datas invertidas", () => {
    const checkIn = somarDias(hojeNoBrasil(), 10);
    const r = criarReservaComPagamentoSchema.safeParse(
      base({ checkIn, checkOut: somarDias(checkIn, -2) }),
    );
    expect(r.success).toBe(false);
  });

  it("recusa check-in igual ao check-out", () => {
    const checkIn = somarDias(hojeNoBrasil(), 10);
    const r = criarReservaComPagamentoSchema.safeParse(base({ checkIn, checkOut: checkIn }));
    expect(r.success).toBe(false);
  });

  it("recusa check-in no passado", () => {
    const checkIn = somarDias(hojeNoBrasil(), -1);
    const r = criarReservaComPagamentoSchema.safeParse(
      base({ checkIn, checkOut: somarDias(checkIn, 2) }),
    );
    expect(r.success).toBe(false);
  });

  it("aceita check-in hoje", () => {
    const checkIn = hojeNoBrasil();
    const r = criarReservaComPagamentoSchema.safeParse(
      base({ checkIn, checkOut: somarDias(checkIn, 1) }),
    );
    expect(r.success).toBe(true);
  });

  it("recusa períodos acima do teto", () => {
    const checkIn = somarDias(hojeNoBrasil(), 1);
    const r = criarReservaComPagamentoSchema.safeParse(
      base({ checkIn, checkOut: somarDias(checkIn, MAX_NOITES + 1) }),
    );
    expect(r.success).toBe(false);
  });

  it("recusa data que não existe no calendário", () => {
    const r = criarReservaComPagamentoSchema.safeParse(base({ checkIn: "2027-02-30" }));
    expect(r.success).toBe(false);
  });

  it("recusa zero adultos", () => {
    expect(criarReservaComPagamentoSchema.safeParse(base({ adultos: 0 })).success).toBe(false);
    expect(criarReservaComPagamentoSchema.safeParse(base({ adultos: 1.5 })).success).toBe(false);
    expect(criarReservaComPagamentoSchema.safeParse(base({ criancas: -1 })).success).toBe(false);
  });

  it("recusa ids que não são uuid", () => {
    expect(criarReservaComPagamentoSchema.safeParse(base({ itemId: "abc" })).success).toBe(false);
    expect(
      criarReservaComPagamentoSchema.safeParse(base({ perfilIds: ["nao-e-uuid"] })).success,
    ).toBe(false);
  });

  it("normaliza o CPF e recusa dígitos verificadores errados", () => {
    const r = criarReservaComPagamentoSchema.safeParse(base({ cpf: "529.982.247-25" }));
    expect(r.success && r.data.cpf).toBe(CPF_VALIDO);
    expect(criarReservaComPagamentoSchema.safeParse(base({ cpf: "11111111111" })).success).toBe(
      false,
    );
    expect(criarReservaComPagamentoSchema.safeParse(base({ cpf: "52998224726" })).success).toBe(
      false,
    );
  });

  it("aceita CPF vazio — quem decide se é obrigatório é o servidor, que enxerga o perfil", () => {
    const r = criarReservaComPagamentoSchema.safeParse(base({ cpf: "" }));
    expect(r.success && r.data.cpf).toBe("");
  });
});

describe("datas", () => {
  it("conta noites", () => {
    expect(contarNoites("2026-08-12", "2026-08-15")).toBe(3);
    expect(contarNoites("2026-08-12", "2026-08-12")).toBe(0);
    expect(contarNoites("2026-08-15", "2026-08-12")).toBe(-3);
  });

  it("conta noites atravessando o horário de verão do hemisfério norte", () => {
    expect(contarNoites("2026-03-28", "2026-03-30")).toBe(2);
    expect(contarNoites("2026-10-24", "2026-10-26")).toBe(2);
  });

  it("soma dias virando o mês e o ano", () => {
    expect(somarDias("2026-01-31", 1)).toBe("2026-02-01");
    expect(somarDias("2026-12-31", 1)).toBe("2027-01-01");
    expect(somarDias("2028-02-28", 1)).toBe("2028-02-29");
  });

  it("hojeNoBrasil usa o fuso de Brasília, não UTC", () => {
    // 03:00 UTC de 15/08 ainda é 14/08 às 00:00 em São Paulo.
    expect(hojeNoBrasil(new Date("2026-08-15T02:00:00Z"))).toBe("2026-08-14");
    expect(hojeNoBrasil(new Date("2026-08-15T12:00:00Z"))).toBe("2026-08-15");
  });

  it("valida o formato ISO", () => {
    expect(ehDataISOValida("2026-08-15")).toBe(true);
    expect(ehDataISOValida("2026-02-30")).toBe(false);
    expect(ehDataISOValida("15/08/2026")).toBe(false);
    expect(ehDataISOValida("2026-8-5")).toBe(false);
  });
});

describe("CPF", () => {
  it("valida pelos dígitos verificadores", () => {
    expect(validarCPF("529.982.247-25")).toBe(true);
    expect(validarCPF("52998224725")).toBe(true);
    expect(validarCPF("52998224726")).toBe(false);
  });

  it("recusa sequências repetidas, que passam na conta mas não existem", () => {
    for (let d = 0; d <= 9; d++) {
      expect(validarCPF(String(d).repeat(11))).toBe(false);
    }
  });

  it("recusa comprimento errado", () => {
    expect(validarCPF("5299822472")).toBe(false);
    expect(validarCPF("")).toBe(false);
  });

  it("normaliza para só dígitos", () => {
    expect(normalizarCPF("529.982.247-25")).toBe("52998224725");
  });
});
