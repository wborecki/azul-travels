import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { comportamentoRolagem } from "@/lib/movimento";
import { cn } from "@/lib/utils";

interface LinhaRolavelProps {
  children: ReactNode;
  rotulo: string;
  className?: string;
  classNameLista?: string;
  classNameSeta?: string;
}

export function LinhaRolavel({
  children,
  rotulo,
  className,
  classNameLista,
  classNameSeta,
}: LinhaRolavelProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [temAntes, setTemAntes] = useState(false);
  const [temDepois, setTemDepois] = useState(false);

  const medir = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setTemAntes(el.scrollLeft > 4);
    setTemDepois(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    medir();
    const observador = new ResizeObserver(medir);
    observador.observe(el);
    for (const filho of Array.from(el.children)) observador.observe(filho);
    return () => observador.disconnect();
  }, [medir]);

  function rolar(direcao: 1 | -1) {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({
      left: direcao * Math.round(el.clientWidth * 0.7),
      behavior: comportamentoRolagem(),
    });
  }

  return (
    <div className={cn("relative min-w-0", className)}>
      <div
        ref={ref}
        onScroll={medir}
        role="group"
        aria-label={rotulo}
        className={cn(
          "flex items-center gap-2 overflow-x-auto py-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          classNameLista,
        )}
      >
        {children}
      </div>

      {temAntes && <Seta lado="esquerda" onClick={() => rolar(-1)} className={classNameSeta} />}
      {temDepois && <Seta lado="direita" onClick={() => rolar(1)} className={classNameSeta} />}
    </div>
  );
}

interface SetaProps {
  lado: "esquerda" | "direita";
  onClick: () => void;
  className?: string;
}

function Seta({ lado, onClick, className }: SetaProps) {
  const Icone = lado === "esquerda" ? ChevronLeft : ChevronRight;
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-y-0 hidden w-16 items-center md:flex",
        lado === "esquerda"
          ? "left-0 justify-start bg-gradient-to-r from-white via-white/90 to-transparent"
          : "right-0 justify-end bg-gradient-to-l from-white via-white/90 to-transparent",
        className,
      )}
    >
      <button
        type="button"
        tabIndex={-1}
        onClick={onClick}
        className="pointer-events-auto flex h-8 w-8 items-center justify-center rounded-full border border-border bg-white text-primary shadow-sm transition hover:border-primary/40"
      >
        <Icone className="h-4 w-4" />
      </button>
    </div>
  );
}
