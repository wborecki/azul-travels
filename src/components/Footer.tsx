import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { useAuth } from "@/hooks/useAuth";
import { Instagram, Facebook, Youtube } from "lucide-react";

/**
 * Rodapé global.
 *
 * Links auth-aware: alguns destinos da coluna "Para Famílias" exigem login.
 * Quando o visitante está deslogado, a Link cai num fluxo de login/cadastro
 * em vez de levar a uma página vazia.
 */
export function Footer() {
  const ano = new Date().getFullYear();
  const { user } = useAuth();

  // Helpers — destino sensível ao estado de auth.
  const minhaContaTo = user ? "/minha-conta" : "/login";
  const perfilSensorialTo = user ? "/minha-conta/perfil-sensorial" : "/cadastro";
  const reservasTo = user ? "/minha-conta/reservas" : "/login";

  return (
    <footer className="bg-footer text-footer-foreground mt-20">
      <div className="container mx-auto px-4 py-14 grid gap-10 md:grid-cols-2 lg:grid-cols-4">
        {/* Marca */}
        <div className="space-y-4">
          <div className="bg-white/5 inline-block rounded-lg px-2 py-1.5">
            <Logo variant="dark" />
          </div>
          <p className="text-sm leading-relaxed text-footer-muted max-w-sm">
            O primeiro marketplace brasileiro de turismo inclusivo para famílias com Transtorno do
            Espectro Autista.
          </p>
          <div className="flex items-center gap-3 pt-1">
            <a
              href="https://instagram.com/turismoazul"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram do Turismo Azul"
              className="w-11 h-11 rounded-full bg-white/5 hover:bg-secondary hover:text-white flex items-center justify-center transition"
            >
              <Instagram className="h-4 w-4" />
            </a>
            <a
              href="https://facebook.com/turismoazul"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook do Turismo Azul"
              className="w-11 h-11 rounded-full bg-white/5 hover:bg-secondary hover:text-white flex items-center justify-center transition"
            >
              <Facebook className="h-4 w-4" />
            </a>
            <a
              href="https://youtube.com/@turismoazul"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="YouTube do Turismo Azul"
              className="w-11 h-11 rounded-full bg-white/5 hover:bg-secondary hover:text-white flex items-center justify-center transition"
            >
              <Youtube className="h-4 w-4" />
            </a>
          </div>
        </div>

        {/* Para Famílias */}
        <div>
          <h4 className="font-display font-semibold mb-3 text-white">Para Famílias</h4>
          <ul className="space-y-2 text-sm">
            <li>
              <Link to="/explorar" className="hover:text-secondary transition">
                Explorar destinos
              </Link>
            </li>
            <li>
              <Link to={minhaContaTo} className="hover:text-secondary transition">
                Minha conta
              </Link>
            </li>
            <li>
              <Link to={perfilSensorialTo} className="hover:text-secondary transition">
                Criar perfil sensorial
              </Link>
            </li>
            <li>
              <Link to="/beneficios-tea" className="hover:text-secondary transition">
                Benefícios TEA
              </Link>
            </li>
            <li>
              <Link to={reservasTo} className="hover:text-secondary transition">
                Avaliar estabelecimento
              </Link>
            </li>
          </ul>
        </div>

        {/* Para Estabelecimentos */}
        <div>
          <h4 className="font-display font-semibold mb-3 text-white">Para Estabelecimentos</h4>
          <ul className="space-y-2 text-sm">
            <li>
              <Link to="/para-estabelecimentos" className="hover:text-secondary transition">
                Seja certificado
              </Link>
            </li>
            <li>
              <Link to="/sobre-os-selos" className="hover:text-secondary transition">
                Sobre o Selo Azul
              </Link>
            </li>
            <li>
              <Link to="/para-estabelecimentos" className="hover:text-secondary transition">
                Listar meu negócio
              </Link>
            </li>
            <li>
              <Link to="/para-estabelecimentos" className="hover:text-secondary transition">
                FAQ estabelecimentos
              </Link>
            </li>
            <li>
              <a
                href="mailto:contato@turismoazul.com.br"
                className="hover:text-secondary transition"
              >
                Contato comercial
              </a>
            </li>
          </ul>
        </div>

        {/* Empresa */}
        <div>
          <h4 className="font-display font-semibold mb-3 text-white">Empresa</h4>
          <ul className="space-y-2 text-sm">
            <li>
              <Link to="/sobre" className="hover:text-secondary transition">
                Sobre nós
              </Link>
            </li>
            <li>
              <Link to="/conteudo" className="hover:text-secondary transition">
                Blog / Conteúdo TEA
              </Link>
            </li>
            <li>
              <Link to="/privacidade" className="hover:text-secondary transition">
                Política de privacidade (LGPD)
              </Link>
            </li>
            <li>
              <Link to="/termos" className="hover:text-secondary transition">
                Termos de uso
              </Link>
            </li>
            <li>
              <a
                href="mailto:imprensa@turismoazul.com.br"
                className="hover:text-secondary transition"
              >
                Imprensa / Parcerias
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container mx-auto px-4 py-6 text-xs text-footer-muted leading-relaxed text-center md:text-left">
          © {ano} Turismo Azul · Plataforma desenvolvida pela Solutions in BI Consulting LTDA (CNPJ
          59.668.668/0001-54) em parceria com a Absoluto Educacional (CNPJ 18.536.766/0001-50).
        </div>
      </div>
    </footer>
  );
}
