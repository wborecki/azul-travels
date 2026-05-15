import { supabase } from "@/integrations/supabase/client";

/**
 * Após login bem-sucedido, decide o destino:
 * - 2+ roles distintos → /selecionar-perfil
 * - admin (único) → /admin
 * - estabelecimento (único) → /meu-estabelecimento
 * - família (user) sem perfil_tea → /minha-conta/perfil
 * - família com perfil → /minha-conta
 * - se houver redirect explícito válido, prioriza
 */
export async function resolvePostLoginPath(
  userId: string,
  preferredRedirect?: string | null,
): Promise<string> {
  if (preferredRedirect && preferredRedirect.startsWith("/") && !preferredRedirect.startsWith("//")) {
    return preferredRedirect;
  }

  const { data: roles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);

  const list = (roles ?? []).map((r) => r.role as string);
  const distinct = Array.from(new Set(list));

  if (distinct.length >= 2) {
    return "/selecionar-perfil";
  }

  if (distinct.includes("admin")) return "/admin";
  if (distinct.includes("estabelecimento")) return "/meu-estabelecimento";

  // família (user)
  const { data, error } = await supabase
    .from("perfil_sensorial")
    .select("id")
    .eq("familia_id", userId)
    .limit(1);

  if (error) return "/minha-conta";
  if (!data || data.length === 0) return "/minha-conta/perfil";
  return "/minha-conta";
}
