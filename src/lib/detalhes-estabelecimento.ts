import {
  Accessibility,
  Baby,
  BusFront,
  Clock,
  FileText,
  Hourglass,
  Ticket,
  Timer,
  type LucideIcon,
} from "lucide-react";
import { categoriaDoTipo, type EstabCategoria, type EstabTipo } from "@/lib/enums";


interface CampoBase {
  key: string;
  label: string;
  icon: LucideIcon;
  /** Uma linha abaixo do campo, no formulário do dono. */
  ajuda?: string;
}

export type CampoDetalhe =
  | (CampoBase & { tipo: "texto"; placeholder?: string; maxLength?: number })
  | (CampoBase & { tipo: "texto_longo"; placeholder?: string; maxLength?: number })
  | (CampoBase & { tipo: "numero"; unidade: string; min?: number; max?: number })
  | (CampoBase & { tipo: "hora" })
  | (CampoBase & { tipo: "booleano"; rotuloSim: string; rotuloNao: string })
  | (CampoBase & { tipo: "arquivo" });

export type ValorDetalhe = string | number | boolean;
export type Detalhes = Record<string, ValorDetalhe>;

export const DETALHES_POR_CATEGORIA: Record<EstabCategoria, readonly CampoDetalhe[]> = {
  gastronomia: [
    {
      key: "cardapio_pdf",
      tipo: "arquivo",
      label: "Cardápio",
      icon: FileText,
      ajuda:
        "PDF de até 10 MB. A família consegue ver o que vai servir antes de reservar - é o que evita a surpresa no prato para uma criança seletiva.",
    },
    {
      key: "horario_menor_movimento",
      tipo: "hora",
      label: "Horário de menor movimento",
      icon: Clock,
      ajuda:
        "O horário mais calmo do dia. Muitas famílias organizam a saída inteira em torno disso.",
    },
    {
      key: "tempo_medio_espera",
      tipo: "numero",
      unidade: "minutos",
      min: 0,
      max: 240,
      label: "Tempo médio de espera pelo prato",
      icon: Timer,
      ajuda: "Uma estimativa honesta ajuda mais que um número otimista.",
    },
  ],
  passeios: [
    {
      key: "duracao_media",
      tipo: "numero",
      unidade: "minutos",
      min: 0,
      max: 1440,
      label: "Duração média da visita",
      icon: Hourglass,
    },
    {
      key: "faixa_etaria",
      tipo: "texto",
      maxLength: 60,
      placeholder: "Ex: a partir de 4 anos",
      label: "Faixa etária indicada",
      icon: Baby,
    },
    {
      key: "exige_ingresso_antecipado",
      tipo: "booleano",
      rotuloSim: "Exige compra antecipada",
      rotuloNao: "Ingresso na hora, sem compra antecipada",
      label: "Ingresso antecipado",
      icon: Ticket,
      ajuda:
        "Fila na bilheteria é um dos pontos mais difíceis de uma saída. Dizer que não exige também é informação.",
    },
  ],
  transporte: [
    {
      key: "tipo_veiculo",
      tipo: "texto",
      maxLength: 80,
      placeholder: "Ex: van de 15 lugares, ar-condicionado",
      label: "Tipo de veículo",
      icon: BusFront,
    },
    {
      key: "acessibilidade",
      tipo: "texto_longo",
      maxLength: 400,
      placeholder:
        "Elevador para cadeira de rodas, cinto de quatro pontas, espaço para carrinho...",
      label: "Acessibilidade do veículo",
      icon: Accessibility,
    },
  ],
  hospedagem: [],
  planejamento: [],
};

export function detalhesDoTipo(tipo: EstabTipo): readonly CampoDetalhe[] {
  return DETALHES_POR_CATEGORIA[categoriaDoTipo(tipo)];
}

export function lerDetalhe(campo: CampoDetalhe, detalhes: Detalhes): ValorDetalhe | null {
  const bruto = detalhes[campo.key];
  if (bruto === undefined || bruto === null) return null;

  switch (campo.tipo) {
    case "numero": {
      const n = typeof bruto === "number" ? bruto : Number(bruto);
      return Number.isFinite(n) ? n : null;
    }
    case "booleano":
      return typeof bruto === "boolean" ? bruto : null;
    default: {
      const s = typeof bruto === "string" ? bruto.trim() : "";
      return s === "" ? null : s;
    }
  }
}

export interface DetalhePreenchido {
  campo: CampoDetalhe;
  valor: ValorDetalhe;
}

/** Os campos da categoria que têm valor, na ordem da declaração. */
export function detalhesPreenchidos(tipo: EstabTipo, detalhes: Detalhes): DetalhePreenchido[] {
  const out: DetalhePreenchido[] = [];
  for (const campo of detalhesDoTipo(tipo)) {
    const valor = lerDetalhe(campo, detalhes);
    if (valor !== null) out.push({ campo, valor });
  }
  return out;
}

export function formatarDetalhe(campo: CampoDetalhe, valor: ValorDetalhe): string {
  switch (campo.tipo) {
    case "numero":
      return `${valor} ${campo.unidade}`;
    case "booleano":
      return valor ? campo.rotuloSim : campo.rotuloNao;
    case "hora":
      // O input type="time" devolve "HH:MM" ou "HH:MM:SS"; a página mostra só a hora.
      return String(valor).slice(0, 5);
    default:
      return String(valor);
  }
}

export function horarioMenorMovimento(tipo: EstabTipo, detalhes: Detalhes): string | null {
  const campo = detalhesDoTipo(tipo).find((c) => c.key === "horario_menor_movimento");
  if (!campo) return null;
  const valor = lerDetalhe(campo, detalhes);
  return valor === null ? null : formatarDetalhe(campo, valor);
}

export function limparDetalhes(tipo: EstabTipo, detalhes: Detalhes): Detalhes {
  const out: Detalhes = {};
  for (const { campo, valor } of detalhesPreenchidos(tipo, detalhes)) {
    out[campo.key] = valor;
  }
  return out;
}
