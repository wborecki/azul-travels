import { forwardRef, useState, type ReactNode } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { chipClasses } from "@/components/explorar/chips";
import { useIsMobile } from "@/hooks/use-mobile";
import type { ContagemPreview } from "@/hooks/useContagemPreview";
import { cn } from "@/lib/utils";

interface GatilhoChipProps extends React.ComponentPropsWithoutRef<"button"> {
  ativo: boolean;
  rotulo: string;
  aberto: boolean;
}

export const GatilhoChip = forwardRef<HTMLButtonElement, GatilhoChipProps>(
  ({ ativo, rotulo, aberto, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      aria-expanded={aberto}
      className={chipClasses(ativo)}
      {...props}
    >
      {rotulo}
      <ChevronDown
        className={cn("h-3.5 w-3.5 transition-transform", aberto && "rotate-180")}
        aria-hidden
      />
    </button>
  ),
);
GatilhoChip.displayName = "GatilhoChip";

interface PainelFiltroProps {
  titulo: string;
  rotulo: string;
  ativo: boolean;
  larguraDesktop?: string;
  contagem?: ContagemPreview;
  onAbertoChange?: (aberto: boolean) => void;
  onLimpar?: () => void;
  onAplicar?: () => void;
  children: (fechar: () => void) => ReactNode;
}

function RotuloAplicar({ contagem }: { contagem?: ContagemPreview }) {
  if (!contagem || (contagem.total === null && !contagem.carregando)) return <>Aplicar</>;
  if (contagem.total === null) {
    return (
      <>
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Aplicar
      </>
    );
  }
  if (contagem.total === 0) return <>Nenhum resultado</>;
  return (
    <>
      Ver {contagem.total} resultado{contagem.total === 1 ? "" : "s"}
    </>
  );
}

export function PainelFiltro({
  titulo,
  rotulo,
  ativo,
  larguraDesktop = "w-[min(20rem,calc(100vw-2rem))]",
  contagem,
  onAbertoChange,
  onLimpar,
  onAplicar,
  children,
}: PainelFiltroProps) {
  const isMobile = useIsMobile();
  const [aberto, setAberto] = useState(false);

  function mudarAberto(proximo: boolean) {
    setAberto(proximo);
    onAbertoChange?.(proximo);
  }

  const fechar = () => mudarAberto(false);
  const temAcoes = !!onLimpar || !!onAplicar;

  function limpar() {
    onLimpar?.();
    fechar();
  }

  function aplicar() {
    onAplicar?.();
    fechar();
  }

  if (isMobile) {
    return (
      <>
        <GatilhoChip
          ativo={ativo}
          rotulo={rotulo}
          aberto={aberto}
          onClick={() => mudarAberto(true)}
        />
        <Sheet open={aberto} onOpenChange={mudarAberto}>
          <SheetContent
            side="bottom"
            aria-describedby={undefined}
            className="flex max-h-[92dvh] flex-col gap-0 rounded-t-2xl p-0"
          >
            <SheetHeader className="shrink-0 border-b border-border px-5 py-4 text-left">
              <SheetTitle>{titulo}</SheetTitle>
            </SheetHeader>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children(fechar)}</div>

            <div
              className="flex shrink-0 items-center justify-between gap-3 border-t border-border px-5 pt-3"
              style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
            >
              <button
                type="button"
                onClick={temAcoes ? limpar : fechar}
                className="text-sm font-semibold text-foreground underline underline-offset-2"
              >
                {temAcoes ? "Limpar" : "Fechar"}
              </button>
              <Button type="button" onClick={temAcoes ? aplicar : fechar} className="min-w-32">
                {temAcoes ? <RotuloAplicar contagem={contagem} /> : "Concluir"}
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </>
    );
  }

  return (
    <Popover open={aberto} onOpenChange={mudarAberto}>
      <PopoverTrigger asChild>
        <GatilhoChip ativo={ativo} rotulo={rotulo} aberto={aberto} />
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={8}
        className={cn("max-h-[70vh] overflow-y-auto p-4", larguraDesktop)}
      >
        {children(fechar)}
        {temAcoes && (
          <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-3">
            <button
              type="button"
              onClick={limpar}
              className="text-sm font-semibold text-foreground underline underline-offset-2"
            >
              Limpar
            </button>
            <Button type="button" size="sm" onClick={aplicar}>
              <RotuloAplicar contagem={contagem} />
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
