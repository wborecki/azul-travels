import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";

const WHATSAPP_NUMBER = "5541999999999";
const WHATSAPP_MESSAGE =
  "Olá, vim pelo site do Turismo Azul e quero saber mais.";

export function FloatingWhatsApp() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShow(true), 5000);
    return () => clearTimeout(t);
  }, []);

  if (!show) return null;

  const href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title="Fale com a gente"
      aria-label="Falar no WhatsApp"
      className="fixed bottom-5 right-5 z-50 group inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#1ebe5d] text-white rounded-full shadow-lg pl-4 pr-5 py-3 transition animate-fade-in"
    >
      <MessageCircle className="h-5 w-5" />
      <span className="hidden md:inline text-sm font-semibold">Fale com a gente</span>
    </a>
  );
}
