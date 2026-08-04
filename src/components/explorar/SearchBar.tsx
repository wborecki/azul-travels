import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SearchBarProps {
  /** Valor aplicado (vindo da URL) - ressincroniza o input em back/forward. */
  valor: string;
  onBuscar: (termo: string) => void;
}

/**
 * Busca textual do `/explorar` - input controlado com submit explícito
 * (Enter ou botão). O termo só vai para a URL no submit, para não gerar
 * histórico a cada tecla. Auto-suggest de destinos chega na F4, acoplado
 * a este componente.
 */
export function SearchBar({ valor, onBuscar }: SearchBarProps) {
  const [termo, setTermo] = useState(valor);

  // URL mudou por fora (back/forward, limpar filtros) - reflete no input.
  useEffect(() => {
    setTermo(valor);
  }, [valor]);

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        onBuscar(termo.trim());
      }}
      className="flex w-full max-w-2xl items-center gap-2"
    >
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          value={termo}
          onChange={(e) => setTermo(e.target.value)}
          placeholder="Buscar por cidade, estabelecimento ou lugar…"
          className="pl-9"
          aria-label="Buscar quartos"
        />
      </div>
      <Button type="submit">Buscar</Button>
    </form>
  );
}
