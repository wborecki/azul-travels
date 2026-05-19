import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { Instagram, Facebook, Youtube, Construction, Mail, Phone, Globe } from "lucide-react";

export function Footer() {
  const ano = new Date().getFullYear();

  const linkClass =
    "transition-colors text-white/75 hover:text-[#00b4d8]";

  return (
    <footer
      className="text-white mt-20"
      style={{ backgroundColor: "#1a3666" }}
    >
      {/* Status banner */}
      <div className="border-b border-white/10" style={{ backgroundColor: "rgba(0,180,216,0.12)" }}>
        <div className="container mx-auto px-4 py-3 text-center text-sm font-medium flex items-center justify-center gap-2" style={{ color: "#00b4d8" }}>
          <Construction className="h-4 w-4" />
          <span>🚧 Plataforma em desenvolvimento - Lançamento previsto para 2026</span>
        </div>
      </div>

      <div className="container mx-auto px-4 py-14 grid gap-10 md:grid-cols-2 lg:grid-cols-3">
        {/* Coluna 1 - Logo + descrição + tagline */}
        <div className="space-y-5">
          <div className="bg-white/5 inline-block rounded-lg px-2 py-1.5">
            <Logo variant="dark" />
          </div>
          <p className="text-sm leading-relaxed text-white/75 max-w-sm">
            O primeiro marketplace brasileiro de turismo inclusivo para famílias
            atípicas. Capacitamos, certificamos e conectamos destinos preparados
            para acolher quem mais precisa.
          </p>
          <div
            className="tagline-italic text-base pl-4"
            style={{ borderLeft: "3px solid #00b4d8", color: "#00b4d8" }}
          >
            Inclusão que acolhe, turismo que transforma!
          </div>
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
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center transition-colors hover:bg-[#00b4d8] hover:text-[#1a3666]"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        {/* Coluna 2 - Links rápidos */}
        <div>
          <h4 className="font-display font-extrabold uppercase tracking-wide mb-4 text-white text-sm">
            Links rápidos
          </h4>
          <ul className="space-y-3 text-sm">
            <li><Link to="/" hash="como-funciona" className={linkClass}>Como Funciona</Link></li>
            <li><Link to="/familias" className={linkClass}>Para Famílias</Link></li>
            <li><Link to="/estabelecimentos" className={linkClass}>Para Parceiros</Link></li>
            <li><Link to="/sobre-os-selos" className={linkClass}>Selo Azul</Link></li>
            <li><a href="mailto:contato@turismoazulinclusivo.com.br" className={linkClass}>Contato</a></li>
          </ul>
        </div>

        {/* Coluna 3 - Contato + URL */}
        <div>
          <h4 className="font-display font-extrabold uppercase tracking-wide mb-4 text-white text-sm">
            Contato
          </h4>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-2 text-white/75">
              <Mail className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: "#00b4d8" }} />
              <a href="mailto:contato@turismoazulinclusivo.com.br" className={linkClass}>
                contato@turismoazulinclusivo.com.br
              </a>
            </li>
            <li className="flex items-start gap-2 text-white/75">
              <Phone className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: "#00b4d8" }} />
              <a href="https://wa.me/5511947150632" target="_blank" rel="noopener noreferrer" className={linkClass}>
                +55 11 94715-0632
              </a>
            </li>
          </ul>

          <div
            className="mt-6 p-4 rounded-xl flex items-center gap-3"
            style={{
              backgroundColor: "rgba(0,180,216,0.12)",
              border: "1px solid rgba(0,180,216,0.4)",
            }}
          >
            <Globe className="h-5 w-5 flex-shrink-0" style={{ color: "#00b4d8" }} />
            <a
              href="https://www.turismoazulinclusivo.com.br"
              target="_blank"
              rel="noopener noreferrer"
              className="font-display font-extrabold uppercase text-sm tracking-wide hover:text-[#00b4d8] transition-colors"
              style={{ color: "white" }}
            >
              www.turismoazulinclusivo.com.br
            </a>
          </div>
        </div>
      </div>

      {/* Divider semitransparente */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.12)" }}>
        <div className="container mx-auto px-4 py-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-white/60">
          <div className="text-center md:text-left leading-relaxed">
            © {ano} Turismo Azul Inclusivo · Solutions in BI Consulting LTDA em parceria com Absoluto Educacional.
          </div>
          <div className="flex items-center gap-5">
            <Link to="/privacidade" className={linkClass}>Privacidade</Link>
            <Link to="/termos" className={linkClass}>Termos de uso</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
