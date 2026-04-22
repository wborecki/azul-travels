import type { Database } from "@/integrations/supabase/types";

export type ConteudoCategoria = Database["public"]["Enums"]["conteudo_categoria"];

export const CATEGORIA_LABEL: Record<ConteudoCategoria, string> = {
  legislacao: "Legislação",
  dicas_viagem: "Dicas de viagem",
  boas_praticas: "Boas práticas",
  novidades: "Novidades",
  destinos: "Destinos",
};
