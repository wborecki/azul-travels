import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { Instagram, Facebook, Youtube, Construction } from "lucide-react";

export function Footer() {
  const ano = new Date().getFullYear();

  return (
    <footer className="bg-footer text-footer-foreground mt-20">
      {/* Status banner */}
      <div className="bg-secondary/15 border-b border-white/10">
        <div className="container mx-auto px-4 py-3 text-center text-sm text-secondary font-medium flex items-center justify-center gap-2">
          <Construction className="h-4 w-4" />
          <span>🚧 Plataforma em desenvolvimento — Lançamento previsto para 2026</span>
        </div>
      </div>

      <div className="container mx-auto px-4 py-14 grid gap-10 md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-4">
          <div className="bg-white/5 inline-block rounded-lg px-2 py-1.5">
            <Logo variant="dark" />
          </div>
          <p className="text-sm leading-relaxed text-footer-muted max-w-sm">
            O primeiro marketplace brasileiro de turismo inclusivo para famílias com Transtorno do
            Espectro Autista.
          </p>
          <div className="flex items-center gap-3 pt-1">
            {[
              { Icon: Instagram, href: "https://instagram.com/turismoazul", label: "Instagram" },
              { Icon: Facebook, href: "https://facebook.com/turismoazul", label: "Facebook" },
              { Icon: Youtube, href: "https://youtube.com/@turismoazul", label: "YouTube" },
            ].map(({ Icon, href, label }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="w-11 h-11 rounded-full bg-white/5 hover:bg-secondary hover:text-white flex items-center justify-center transition"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-display font-semibold mb-3 text-white">Para famílias</h4>
          <ul className="space-y-2 text-sm">
            <li>
              <Link to="/familias" className="hover:text-secondary transition">
                Entrar na lista de espera
              </Link>
            </li>
            <li>
              <Link to="/beneficios-tea" className="hover:text-secondary transition">
                Benefícios TEA
              </Link>
            </li>
            <li>
              <Link to="/conteudo" className="hover:text-secondary transition">
                Conteúdo
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-display font-semibold mb-3 text-white">Para estabelecimentos</h4>
          <ul className="space-y-2 text-sm">
            <li>
              <Link to="/estabelecimentos" className="hover:text-secondary transition">
                Cadastre seu estabelecimento
              </Link>
            </li>
            <li>
              <Link to="/sobre-os-selos" className="hover:text-secondary transition">
                Sobre o Selo Azul
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

        <div>
          <h4 className="font-display font-semibold mb-3 text-white">Empresa</h4>
          <ul className="space-y-2 text-sm">
            <li>
              <Link to="/sobre" className="hover:text-secondary transition">
                Sobre nós
              </Link>
            </li>
            <li>
              <Link to="/demo" className="hover:text-secondary transition">
                Ver demonstração da plataforma
              </Link>
            </li>
            <li>
              <Link to="/privacidade" className="hover:text-secondary transition">
                Privacidade (LGPD)
              </Link>
            </li>
            <li>
              <Link to="/termos" className="hover:text-secondary transition">
                Termos de uso
              </Link>
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
