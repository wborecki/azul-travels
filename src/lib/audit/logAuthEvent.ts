import { supabase } from "@/integrations/supabase/client";

type AuthEvento =
  | "login_success"
  | "login_failure"
  | "logout"
  | "signup_success"
  | "signup_failure"
  | "password_reset_request"
  | "password_reset_complete"
  | "session_refresh"
  | "session_expired"
  | "oauth_start"
  | "oauth_callback";

/**
 * Registra um evento de autenticação na trilha de auditoria
 * (`public.auth_audit_log`) via RPC `log_auth_event`.
 *
 * O servidor mascara o e-mail e remove campos sensíveis (password, token, etc.)
 * do metadata. Use livremente — falhas são silenciosas para não bloquear o
 * fluxo de auth.
 */
export async function logAuthEvent(
  evento: AuthEvento,
  opts: {
    sucesso?: boolean;
    userId?: string | null;
    email?: string | null;
    metadata?: Record<string, unknown>;
  } = {},
) {
  try {
    const userAgent =
      typeof navigator !== "undefined" ? navigator.userAgent : null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).rpc("log_auth_event", {
      _evento: evento,
      _sucesso: opts.sucesso ?? true,
      _user_id: opts.userId ?? null,
      _email: opts.email ?? null,
      _ip: null, // IP só fica disponível server-side; pode ser preenchido por edge func
      _user_agent: userAgent,
      _metadata: opts.metadata ?? {},
    });
  } catch {
    // auditoria nunca deve quebrar o fluxo de auth
  }
}
