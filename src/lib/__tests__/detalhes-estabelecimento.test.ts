import { describe, it, expect } from "vitest";
import { ESTAB_CATEGORIAS } from "@/lib/enums";
import {
  DETALHES_POR_CATEGORIA,
  detalhesDoTipo,
  detalhesPreenchidos,
  formatarDetalhe,
  lerDetalhe,
  limparDetalhes,
  type CampoDetalhe,
} from "@/lib/detalhes-estabelecimento";

const campo = (parcial: Partial<CampoDetalhe> & Pick<CampoDetalhe, "tipo">) =>
  ({
    key: "x",
    label: "X",
    icon: (() => null) as unknown as CampoDetalhe["icon"],
    ...parcial,
  }) as CampoDetalhe;

describe("declaração por categoria", () => {
  it("não repete chave dentro da mesma categoria", () => {
    for (const c of ESTAB_CATEGORIAS) {
      const keys = DETALHES_POR_CATEGORIA[c].map((f) => f.key);
      expect(new Set(keys).size, `categoria "${c}" com chave repetida`).toBe(keys.length);
    }
  });

  it("campo numero sempre declara unidade", () => {
    for (const c of ESTAB_CATEGORIAS) {
      for (const f of DETALHES_POR_CATEGORIA[c]) {
        if (f.tipo === "numero") expect(f.unidade, `${c}.${f.key} sem unidade`).toBeTruthy();
      }
    }
  });

  it("categoria sem campos declarados devolve lista vazia", () => {
    expect(detalhesDoTipo("hotel")).toHaveLength(0);
    expect(detalhesDoTipo("restaurante").length).toBeGreaterThan(0);
  });
});

/**
 * O jsonb vem de um `update()` do cliente e pode ter qualquer forma. A coerção
 * mora em `lerDetalhe` justamente para não se espalhar pelas telas - e é o que
 * mais merece teste neste módulo.
 */
describe("lerDetalhe", () => {
  it("descarta ausente, nulo e string vazia", () => {
    const c = campo({ tipo: "texto" });
    expect(lerDetalhe(c, {})).toBeNull();
    expect(lerDetalhe(c, { x: "" })).toBeNull();
    expect(lerDetalhe(c, { x: "   " })).toBeNull();
  });

  it("apara espaços do texto", () => {
    expect(lerDetalhe(campo({ tipo: "texto" }), { x: "  van  " })).toBe("van");
  });

  it("aceita número em string mas recusa lixo", () => {
    const c = campo({ tipo: "numero", unidade: "minutos" });
    expect(lerDetalhe(c, { x: 30 })).toBe(30);
    expect(lerDetalhe(c, { x: "30" })).toBe(30);
    expect(lerDetalhe(c, { x: "trinta" })).toBeNull();
  });

  it("booleano só aceita booleano de verdade - e false não é ausência", () => {
    const c = campo({ tipo: "booleano", rotuloSim: "Sim", rotuloNao: "Não" });
    expect(lerDetalhe(c, { x: false })).toBe(false);
    expect(lerDetalhe(c, { x: true })).toBe(true);
    expect(lerDetalhe(c, { x: "sim" })).toBeNull();
  });
});

describe("formatarDetalhe", () => {
  it("número vem com a unidade", () => {
    expect(formatarDetalhe(campo({ tipo: "numero", unidade: "minutos" }), 45)).toBe("45 minutos");
  });

  it("booleano usa o rótulo declarado, inclusive no não", () => {
    const c = campo({ tipo: "booleano", rotuloSim: "Exige", rotuloNao: "Não exige" });
    expect(formatarDetalhe(c, true)).toBe("Exige");
    expect(formatarDetalhe(c, false)).toBe("Não exige");
  });

  it("hora corta os segundos que o input pode mandar", () => {
    expect(formatarDetalhe(campo({ tipo: "hora" }), "14:30:00")).toBe("14:30");
  });
});

describe("limparDetalhes", () => {
  it("tira campo vazio, valor inválido e chave de fora da categoria", () => {
    const sujo = {
      duracao_media: 90,
      faixa_etaria: "   ",
      exige_ingresso_antecipado: false,
      cardapio_pdf: "https://exemplo/menu.pdf", // é de gastronomia, não de passeios
      lixo: 1,
    };
    expect(limparDetalhes("parque", sujo)).toEqual({
      duracao_media: 90,
      exige_ingresso_antecipado: false,
    });
  });

  it("preserva a ordem da declaração ao listar preenchidos", () => {
    const keys = detalhesPreenchidos("restaurante", {
      tempo_medio_espera: 20,
      cardapio_pdf: "https://exemplo/menu.pdf",
    }).map((d) => d.campo.key);
    expect(keys).toEqual(["cardapio_pdf", "tempo_medio_espera"]);
  });
});
