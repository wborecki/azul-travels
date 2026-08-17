import { Check, Plus, X } from "lucide-react";
import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Chip de seleção - alvo de toque grande, estado por borda + check, nunca só por
 * cor. É a unidade de resposta de quase todo o Perfil TEA.
 */
export function Chip({
  ativo,
  onClick,
  children,
  className,
}: {
  ativo: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ativo}
      className={cn(
        "inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-full border-2 text-sm font-medium transition text-left",
        ativo
          ? "border-secondary bg-teal-claro text-primary"
          : "border-border bg-white text-muted-foreground hover:border-secondary/50",
        className,
      )}
    >
      {ativo && <Check className="h-3.5 w-3.5 shrink-0" />}
      {children}
    </button>
  );
}

/** Chip de item escrito pela família, removível. */
export function ChipRemovivel({ texto, onRemover }: { texto: string; onRemover: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 pl-3.5 pr-2 py-2.5 rounded-full border-2 border-secondary bg-teal-claro text-sm font-medium text-primary">
      {texto}
      <button
        type="button"
        onClick={onRemover}
        aria-label={`Remover ${texto}`}
        className="rounded-full p-0.5 hover:bg-secondary/20"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </span>
  );
}

/** Chip "+" que abre um input inline - resolve os "Outro: ____" do Pré-Check-in. */
export function ChipOutro({ onAdicionar }: { onAdicionar: (texto: string) => void }) {
  const [aberto, setAberto] = useState(false);
  const [texto, setTexto] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function confirmar() {
    const t = texto.trim();
    if (t) onAdicionar(t);
    setTexto("");
    setAberto(false);
  }

  if (!aberto) {
    return (
      <button
        type="button"
        onClick={() => {
          setAberto(true);
          requestAnimationFrame(() => inputRef.current?.focus());
        }}
        className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-full border-2 border-dashed border-border text-sm font-medium text-muted-foreground hover:border-secondary/50 transition"
      >
        <Plus className="h-3.5 w-3.5" /> Outro
      </button>
    );
  }

  return (
    <span className="inline-flex items-center rounded-full border-2 border-secondary bg-white overflow-hidden">
      <input
        ref={inputRef}
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        onBlur={confirmar}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            confirmar();
          }
          if (e.key === "Escape") {
            setTexto("");
            setAberto(false);
          }
        }}
        placeholder="Digite e aperte Enter"
        className="px-3.5 py-2.5 text-sm outline-none w-52 bg-transparent"
      />
    </span>
  );
}
