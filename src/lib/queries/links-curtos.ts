/**
 * Links curtos para URLs do `/explorar`.
 *
 * Estratégia:
 *  - Slug 8 chars base62 gerado no client (≈218 trilhões → colisão
 *    desprezível para nosso volume; CHECK no banco aceita 6-16).
 *  - **Dedupe** por SHA-256 do path completo: o mesmo conjunto de
 *    filtros sempre devolve o mesmo `/l/xxx`. Isso é feito num passo
 *    de leitura prévia + insert; em corrida (raro) o constraint
 *    UNIQUE em `path_hash` é o backstop.
 *  - Acesso (`/l/$slug`) é resolvido por `registrar_acesso_link_curto`
 *    no banco, que atualiza `ultimo_acesso_em` (alimenta o expurgo
 *    de 90 dias) e devolve o path para redirect.
 */

import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export type LinkCurto = Tables<"explorar_links_curtos">;
type LinkCurtoInsert = TablesInsert<"explorar_links_curtos">;

const SLUG_ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const SLUG_LENGTH = 8;

function gerarSlug(): string {
  // crypto.getRandomValues é universal (browser + edge runtime).
  const bytes = new Uint8Array(SLUG_LENGTH);
  crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < SLUG_LENGTH; i++) {
    // Mod 62: levíssimo viés (256 % 62 = 8 valores extras), aceitável
    // para slug não-criptográfico — colisão já é tratada por UNIQUE.
    out += SLUG_ALPHABET[bytes[i]! % SLUG_ALPHABET.length];
  }
  return out;
}

/** SHA-256 hex do path. Usado para dedupe estável. */
async function hashPath(path: string): Promise<string> {
  const data = new TextEncoder().encode(path);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Cria (ou recupera) um link curto para o path informado.
 *
 * - `path` deve começar com `/explorar` (validado pelo CHECK do banco).
 * - Idempotente para o mesmo path: chamadas sucessivas devolvem o
 *   mesmo slug. Em corrida com colisão de slug aleatório, retenta
 *   até 3 vezes antes de propagar o erro.
 */
export async function obterOuCriarLinkCurto(
  path: string,
  userId: string,
): Promise<{ slug: string; jaExistia: boolean }> {
  const path_hash = await hashPath(path);

  // Caminho feliz: já existe → devolve direto. Evita escrever sem
  // necessidade (e reduz garbage para o expurgo).
  const { data: existente, error: errLeitura } = await supabase
    .from("explorar_links_curtos")
    .select("slug")
    .eq("path_hash", path_hash)
    .maybeSingle();

  if (errLeitura) throw errLeitura;
  if (existente) return { slug: existente.slug, jaExistia: true };

  // Insere com retry em caso de colisão de slug (rara, mas possível).
  let ultimoErro: unknown = null;
  for (let tentativa = 0; tentativa < 3; tentativa++) {
    const slug = gerarSlug();
    const payload: LinkCurtoInsert = {
      slug,
      path,
      path_hash,
      criado_por: userId,
    };
    const { data, error } = await supabase
      .from("explorar_links_curtos")
      .insert(payload)
      .select("slug")
      .single();

    if (!error && data) return { slug: data.slug, jaExistia: false };

    // 23505 = unique_violation. Pode ser slug OU path_hash:
    //  - slug → tenta de novo com outro slug;
    //  - path_hash → outra requisição venceu a corrida; relê e devolve.
    if (error && (error as { code?: string }).code === "23505") {
      const { data: corrida } = await supabase
        .from("explorar_links_curtos")
        .select("slug")
        .eq("path_hash", path_hash)
        .maybeSingle();
      if (corrida) return { slug: corrida.slug, jaExistia: true };
      ultimoErro = error;
      continue;
    }
    throw error;
  }
  throw ultimoErro ?? new Error("Falha ao gerar slug único após 3 tentativas.");
}

/**
 * Resolve um slug para o path original e marca o acesso.
 *
 * Usa a função `registrar_acesso_link_curto` (SECURITY DEFINER) para
 * que o update de `ultimo_acesso_em` aconteça mesmo sem policy de
 * UPDATE para o caller. Retorna `null` quando o slug não existe.
 */
export async function resolverLinkCurto(slug: string): Promise<string | null> {
  // O cliente tipado não conhece essa RPC (não está no schema gerado),
  // então usamos chamada não-tipada e validamos o retorno manualmente.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)(
    "registrar_acesso_link_curto",
    { _slug: slug },
  );
  if (error) throw error;
  if (typeof data !== "string" || !data.startsWith("/explorar")) return null;
  return data;
}
