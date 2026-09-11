import { describe, expect, it } from "vitest";
import {
  CAMPOS_NECESSIDADE,
  compatibilidade,
  necessidadesDosPerfis,
  quemPrecisa,
  type PerfilNecessidades,
} from "@/lib/perfil/compatibilidade";
import { PERFIL_NECESSIDADES_SELECT } from "@/lib/queries";
import { searchToFilters, validateExplorarSearch } from "@/lib/explorar-search";

function perfil(nome: string, necessidades: Partial<PerfilNecessidades> = {}): PerfilNecessidades {
  return {
    id: nome,
    nome_autista: nome,
    foto_url: null,
    precisa_sala_sensorial: false,
    precisa_concierge_tea: false,
    precisa_checkin_antecipado: false,
    precisa_fila_prioritaria: false,
    precisa_cardapio_visual: false,
    usa_caa: false,
    ...necessidades,
  };
}

const UUID_A = "11111111-1111-4111-8111-111111111111";
const UUID_B = "22222222-2222-4222-8222-222222222222";

describe("necessidadesDosPerfis", () => {
  it("é a união das necessidades - basta um precisar", () => {
    const flags = necessidadesDosPerfis([
      perfil("Pedro", { precisa_sala_sensorial: true }),
      perfil("Ana", { precisa_fila_prioritaria: true }),
    ]);
    expect(flags).toEqual(["tem_sala_sensorial", "tem_fila_prioritaria"]);
  });

  it("não repete quando dois perfis precisam do mesmo", () => {
    const flags = necessidadesDosPerfis([
      perfil("Pedro", { precisa_sala_sensorial: true }),
      perfil("Ana", { precisa_sala_sensorial: true }),
    ]);
    expect(flags).toEqual(["tem_sala_sensorial"]);
  });

  it("mapeia usa_caa para tem_caa", () => {
    expect(necessidadesDosPerfis([perfil("Pedro", { usa_caa: true })])).toEqual(["tem_caa"]);
  });

  it("ignora null (campo nunca respondido)", () => {
    expect(necessidadesDosPerfis([perfil("Pedro", { precisa_sala_sensorial: null })])).toEqual([]);
  });
});

describe("quemPrecisa", () => {
  it("nomeia só quem depende do recurso", () => {
    const perfis = [
      perfil("Pedro", { precisa_sala_sensorial: true }),
      perfil("Ana", { precisa_fila_prioritaria: true }),
    ];
    expect(quemPrecisa(perfis, "tem_sala_sensorial")).toEqual(["Pedro"]);
  });
});

describe("compatibilidade", () => {
  it("é null sem necessidades declaradas - não existe 100% a afirmar", () => {
    expect(compatibilidade({ tem_sala_sensorial: true }, [])).toBeNull();
  });

  it("conta só o que foi declarado como necessário", () => {
    const compat = compatibilidade({ tem_sala_sensorial: true, tem_caa: false }, [
      "tem_sala_sensorial",
      "tem_caa",
    ]);
    expect(compat).toEqual({
      pct: 50,
      atendidas: ["tem_sala_sensorial"],
      faltando: ["tem_caa"],
      total: 2,
    });
  });

  it("trata null do estabelecimento como não atendido", () => {
    const compat = compatibilidade({ tem_sala_sensorial: null }, ["tem_sala_sensorial"]);
    expect(compat?.pct).toBe(0);
    expect(compat?.faltando).toEqual(["tem_sala_sensorial"]);
  });

  it("recurso extra do local não infla a nota", () => {
    const compat = compatibilidade({ tem_sala_sensorial: true, tem_concierge_tea: true }, [
      "tem_sala_sensorial",
    ]);
    expect(compat?.pct).toBe(100);
    expect(compat?.total).toBe(1);
  });
});

describe("select de necessidades", () => {
  it("cobre exatamente os campos que o cálculo lê", () => {
    const colunas = PERFIL_NECESSIDADES_SELECT.split(",").map((c) => c.trim());
    for (const campo of CAMPOS_NECESSIDADE) {
      expect(colunas).toContain(campo);
    }
  });
});

describe("perfis na URL", () => {
  it("aceita uuid e descarta lixo", () => {
    const s = validateExplorarSearch({ perfis: `${UUID_A},nao-e-uuid,${UUID_B}` });
    expect(s.perfis).toBe(`${UUID_A},${UUID_B}`);
  });

  it("so_compativeis só sobrevive com perfil selecionado", () => {
    expect(validateExplorarSearch({ so_compativeis: true }).so_compativeis).toBeUndefined();
    expect(validateExplorarSearch({ perfis: UUID_A, so_compativeis: true }).so_compativeis).toBe(
      true,
    );
  });

  it("perfil selecionado não filtra sozinho - só anota", () => {
    const search = validateExplorarSearch({ perfis: UUID_A });
    expect(searchToFilters(search, ["tem_sala_sensorial"]).recursos).toBeUndefined();
  });

  it("so_compativeis vira exigência de recurso, somada aos filtros manuais", () => {
    const search = validateExplorarSearch({
      perfis: UUID_A,
      so_compativeis: true,
      recursos: "tem_caa",
    });
    expect(searchToFilters(search, ["tem_sala_sensorial"]).recursos).toEqual([
      "tem_caa",
      "tem_sala_sensorial",
    ]);
  });

  it("não duplica quando a necessidade já é filtro manual", () => {
    const search = validateExplorarSearch({
      perfis: UUID_A,
      so_compativeis: true,
      recursos: "tem_caa",
    });
    expect(searchToFilters(search, ["tem_caa"]).recursos).toEqual(["tem_caa"]);
  });
});
