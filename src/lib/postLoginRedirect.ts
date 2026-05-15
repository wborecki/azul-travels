import { supabase } from "@/integrations/supabase/client";

/**
 * Após login bem-sucedido, decide o destino:
 * - estabelecimento → /minha-empresa
 * - família sem perfil_tea → /minha-conta/perfil
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

  // Verifica role
  const { data: roles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);

  const rolesList = (roles ?? []).map((r) => r.role as string);
  if (rolesList.includes("estabelecimento")) {
    return "/minha-empresa";
  }

  const { data, error } = await supabase
    .from("perfil_sensorial")
    .select("id")
    .eq("familia_id", userId)
    .limit(1);

  if (error) return "/minha-conta";
  if (!data || data.length === 0) return "/minha-conta/perfil";
  return "/minha-conta";
}
