import { supabase } from "@/integrations/supabase/client";

/**
 * Após login bem-sucedido, decide entre:
 * - /minha-conta/perfil-sensorial → se ainda não há perfil cadastrado
 * - destino solicitado (redirect) ou /explorar → caso contrário
 */
export async function resolvePostLoginPath(
  userId: string,
  preferredRedirect?: string | null,
): Promise<string> {
  if (preferredRedirect && preferredRedirect.startsWith("/") && !preferredRedirect.startsWith("//")) {
    return preferredRedirect;
  }
  const { data, error } = await supabase
    .from("perfil_sensorial")
    .select("id")
    .eq("familia_id", userId)
    .limit(1);

  if (error) {
    return "/explorar";
  }
  if (!data || data.length === 0) {
    return "/minha-conta/perfil-sensorial";
  }
  return "/explorar";
}
