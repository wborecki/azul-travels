import { forwardRef, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { chipClasses } from "@/components/explorar/chips";
import { useIsMobile } from "@/hooks/use-mobile";
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
  onLimpar?: () => void;
  onAplicar?: () => void;
  children: (fechar: () => void) => ReactNode;
}

export function PainelFiltro({
  titulo,
  rotulo,
  ativo,
  larguraDesktop = "w-[min(20rem,calc(100vw-2rem))]",
  onLimpar,
  onAplicar,
  children,
}: PainelFiltroProps) {
  const isMobile = useIsMobile();
  const [aberto, setAberto] = useState(false);

  const fechar = () => setAberto(false);
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
          onClick={() => setAberto(true)}
        />
        <Sheet open={aberto} onOpenChange={setAberto}>
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
                {temAcoes ? "Aplicar" : "Concluir"}
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </>
    );
  }

  return (
    <Popover open={aberto} onOpenChange={setAberto}>
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
              Aplicar
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
