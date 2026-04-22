/**
 * Tracking de eventos de conteúdo (visualizações e cliques).
 *
 * - Insere em `conteudo_eventos` via RLS pública (anon/auth).
 * - Gera/recupera um `sessao_id` anônimo via `sessionStorage` — não-pessoal,
 *   apenas para deduplicar visualizações na mesma aba.
 * - Best-effort: erros são silenciosamente ignorados para não quebrar UX.
 */

import { supabase } from "@/integrations/supabase/client";

const SESSAO_KEY = "tza_sessao_id";
const VIEW_DEDUP_PREFIX = "tza_view_";

function getSessaoId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    let id = window.sessionStorage.getItem(SESSAO_KEY);
    if (!id) {
      id = crypto.randomUUID();
      window.sessionStorage.setItem(SESSAO_KEY, id);
    }
    return id;
  } catch {
    return null;
  }
}

/**
 * Registra uma visualização do artigo. Deduplica por sessão (uma view
 * por artigo por aba). Não bloqueia o render — best-effort.
 */
export async function registrarView(conteudoId: string): Promise<void> {
  if (typeof window === "undefined" || !conteudoId) return;
  try {
    const dedupKey = `${VIEW_DEDUP_PREFIX}${conteudoId}`;
    if (window.sessionStorage.getItem(dedupKey)) return;
    window.sessionStorage.setItem(dedupKey, "1");

    await supabase.from("conteudo_eventos").insert({
      conteudo_id: conteudoId,
      tipo: "view",
      referrer: document.referrer || null,
      sessao_id: getSessaoId(),
    });
  } catch {
    // best-effort
  }
}

/** Registra um clique em link/elemento dentro do artigo. */
export async function registrarClick(conteudoId: string, urlAlvo: string): Promise<void> {
  if (typeof window === "undefined" || !conteudoId) return;
  try {
    await supabase.from("conteudo_eventos").insert({
      conteudo_id: conteudoId,
      tipo: "click",
      url_alvo: urlAlvo.slice(0, 500),
      sessao_id: getSessaoId(),
    });
  } catch {
    // best-effort
  }
}
