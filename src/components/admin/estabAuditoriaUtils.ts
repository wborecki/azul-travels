/**
 * Helpers compartilhados entre a aba "Histórico" do editor e a tela
 * global de auditoria de estabelecimentos.
 */
import type { Json } from "@/integrations/supabase/types";

/** Labels amigáveis para os campos da tabela `estabelecimentos`. */
export const CAMPO_LABEL: Record<string, string> = {
  nome: "Nome",
  slug: "Slug",
  tipo: "Tipo",
  status: "Status",
  descricao: "Descrição",
  descricao_tea: "Descrição TEA",
  cidade: "Cidade",
  estado: "Estado",
  endereco: "Endereço",
  cep: "CEP",
  telefone: "Telefone",
  email: "E-mail",
  website: "Website",
  foto_capa: "Foto de capa",
  fotos: "Galeria de fotos",
  tour_360_url: "URL Tour 360°",
  selo_azul: "Selo Azul",
  selo_azul_validade: "Validade do Selo Azul",
  selo_governamental: "Selo governamental",
  selo_privado: "Selo privado",
  selo_privado_nome: "Nome do selo privado",
  destaque: "Destaque na home",
  mensalidade_ativa: "Mensalidade ativa",
  listagem_basica: "Listagem básica",
  tem_sala_sensorial: "Sala sensorial",
  tem_concierge_tea: "Concierge TEA",
  tem_checkin_antecipado: "Check-in antecipado",
  tem_fila_prioritaria: "Fila prioritária",
  tem_cardapio_visual: "Cardápio visual",
  tem_caa: "CAA",
  tem_beneficio_tea: "Benefício TEA",
  beneficio_tea_descricao: "Descrição do benefício TEA",
  latitude: "Latitude",
  longitude: "Longitude",
};

/**
 * Converte um valor JSON do log em uma string legível.
 * - null/undefined → "—"
 * - boolean → "sim"/"não"
 * - array → "N item(s)" (galerias podem ser longas)
 * - object → JSON compacto
 */
export function formatAuditValue(v: Json | null | undefined): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "boolean") return v ? "sim" : "não";
  if (typeof v === "string") {
    if (v.trim() === "") return "—";
    return v.length > 80 ? v.slice(0, 77) + "…" : v;
  }
  if (typeof v === "number") return String(v);
  if (Array.isArray(v)) return `${v.length} item(s)`;
  try {
    const s = JSON.stringify(v);
    return s.length > 80 ? s.slice(0, 77) + "…" : s;
  } catch {
    return String(v);
  }
}

export function acaoBadgeEstab(acao: string): { label: string; cls: string } {
  switch (acao) {
    case "criado":
      return { label: "Criou", cls: "bg-violet-100 text-violet-700 border-violet-200" };
    case "editado":
      return { label: "Editou", cls: "bg-blue-100 text-blue-700 border-blue-200" };
    case "excluido":
      return { label: "Excluiu", cls: "bg-rose-100 text-rose-700 border-rose-200" };
    default:
      return { label: acao, cls: "bg-muted text-foreground/70 border-border" };
  }
}
