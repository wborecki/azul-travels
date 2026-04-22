import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground mt-20">
      <div className="container mx-auto px-4 py-14 grid gap-10 md:grid-cols-4">
        <div className="md:col-span-2 space-y-3">
          <div className="bg-white/10 inline-block rounded-lg px-2 py-1.5">
            <Logo light />
          </div>
          <p className="text-sm text-white/70 max-w-sm">
            O primeiro marketplace brasileiro que conecta famílias TEA a destinos turísticos
            realmente preparados.
          </p>
        </div>
        <div>
          <h4 className="font-display font-semibold mb-3 text-white">Plataforma</h4>
          <ul className="space-y-2 text-sm text-white/70">
            <li><Link to="/explorar" className="hover:text-secondary">Explorar</Link></li>
            <li><Link to="/beneficios-tea" className="hover:text-secondary">Benefícios TEA</Link></li>
            <li><Link to="/conteudo" className="hover:text-secondary">Conteúdo TEA</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-display font-semibold mb-3 text-white">Famílias</h4>
          <ul className="space-y-2 text-sm text-white/70">
            <li><Link to="/cadastro" className="hover:text-secondary">Cadastre-se</Link></li>
            <li><Link to="/login" className="hover:text-secondary">Entrar</Link></li>
            <li><Link to="/minha-conta" className="hover:text-secondary">Minha conta</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container mx-auto px-4 py-5 flex flex-col md:flex-row justify-between gap-2 text-xs text-white/50">
          <p>© {new Date().getFullYear()} Turismo Azul. Todos os direitos reservados.</p>
          <p>Plataforma desenvolvida por Solutions in BI</p>
        </div>
      </div>
    </footer>
  );
}
