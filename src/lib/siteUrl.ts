/**
 * URL pública do site, usada em links que o Supabase envia por e-mail
 * (confirmação de cadastro, redefinição de senha).
 *
 * Nunca usa `window.location.origin`: em desenvolvimento isso faria o
 * e-mail apontar para localhost. O padrão é produção; para testar
 * localmente defina `VITE_SITE_URL=http://localhost:3000` no `.env`
 * (a URL também precisa estar na lista de Redirect URLs do Supabase).
 */
export const SITE_URL: string = (
  import.meta.env.VITE_SITE_URL || "https://turismoazulinclusivo.com.br"
).replace(/\/+$/, "");

/** Monta a URL absoluta de redirect para um path do site (ex.: `/minha-conta`). */
export function authRedirectUrl(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
