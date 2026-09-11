import { useEffect, useState } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { ArrowLeft, ChevronLeft, ChevronRight, ImageOff, LayoutGrid, X } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";

interface QuartoGaleriaProps {
  imagens: string[];
  titulo: string;
}

/**
 * Galeria de fotos do quarto, inspirada no fluxo do Airbnb: grid de prévia na
 * página, "Mostrar todas as fotos" abre um tour em coluna única, e clicar em
 * qualquer foto (do grid ou do tour) abre o visualizador em tela cheia com
 * setas de navegação. Todo o estado (tour aberto / foto ativa) vive na URL
 * (`?galeria=todas&foto=N`) - compartilhável e funciona com o botão voltar.
 */
export function QuartoGaleria({ imagens, titulo }: QuartoGaleriaProps) {
  const search = useSearch({ from: "/quartos/$id" });
  const navigate = useNavigate({ from: "/quartos/$id" });

  const total = imagens.length;
  const tourAberto = search.galeria === "todas" && search.foto === undefined;
  const fotoAberta = search.foto !== undefined && total > 0;
  const idxAtiva = Math.min(Math.max(search.foto ?? 0, 0), Math.max(total - 1, 0));

  function abrirTour() {
    navigate({ search: (prev) => ({ ...prev, galeria: "todas" as const }) });
  }
  function fecharTour() {
    navigate({
      search: (prev) => {
        const { galeria: _galeria, ...rest } = prev;
        return rest;
      },
    });
  }
  function abrirFoto(idx: number) {
    navigate({ search: (prev) => ({ ...prev, foto: idx }) });
  }
  function fecharFoto() {
    navigate({
      search: (prev) => {
        const { foto: _foto, ...rest } = prev;
        return rest;
      },
    });
  }
  function fecharTudo() {
    navigate({
      search: (prev) => {
        const { galeria: _galeria, foto: _foto, ...rest } = prev;
        return rest;
      },
    });
  }
  function irPara(idx: number) {
    if (total === 0) return;
    const wrapped = ((idx % total) + total) % total;
    navigate({ search: (prev) => ({ ...prev, foto: wrapped }), replace: true });
  }

  useEffect(() => {
    if (!tourAberto && !fotoAberta) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [tourAberto, fotoAberta]);

  useEffect(() => {
    if (!tourAberto && !fotoAberta) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (fotoAberta) fecharFoto();
        else fecharTour();
      } else if (fotoAberta && e.key === "ArrowRight") {
        irPara(idxAtiva + 1);
      } else if (fotoAberta && e.key === "ArrowLeft") {
        irPara(idxAtiva - 1);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tourAberto, fotoAberta, idxAtiva]);

  const principal = imagens[0];
  const extras = imagens.slice(1, 5);
  const colunasExtras = extras.length >= 4 ? 2 : 1;
  const mostrarBotaoTodas = total > 3;

  const [apiMobile, setApiMobile] = useState<CarouselApi>();
  const [slideAtivo, setSlideAtivo] = useState(0);

  useEffect(() => {
    if (!apiMobile) return;
    const onSelect = () => setSlideAtivo(apiMobile.selectedScrollSnap());
    onSelect();
    apiMobile.on("select", onSelect);
    return () => {
      apiMobile.off("select", onSelect);
    };
  }, [apiMobile]);

  return (
    <>
      <div className="relative rounded-2xl overflow-hidden h-[320px] md:h-[520px]">
        {total === 0 ? (
          <div className="w-full h-full bg-muted grid place-items-center text-muted-foreground">
            <ImageOff className="h-8 w-8" />
          </div>
        ) : (
          <>
            {/* Mobile: uma foto por vez, deslizável, sem abrir modal */}
            <div className="h-full md:hidden">
              <Carousel setApi={setApiMobile} className="h-full">
                <CarouselContent className="h-full !ml-0">
                  {imagens.map((url, i) => (
                    <CarouselItem key={url + i} className="h-full !pl-0">
                      <button
                        type="button"
                        onClick={() => abrirFoto(i)}
                        className="block h-full w-full"
                        aria-label={`Ver foto ${i + 1} de ${titulo}`}
                      >
                        <img
                          src={url}
                          alt={i === 0 ? titulo : ""}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </Carousel>
              {total > 1 && (
                <span className="pointer-events-none absolute top-3 right-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white">
                  {slideAtivo + 1} / {total}
                </span>
              )}
            </div>

            {/* Desktop: grid estilo Airbnb (1 grande + miniaturas) */}
            <div className="hidden md:flex gap-2 h-full">
              <button
                type="button"
                onClick={() => abrirFoto(0)}
                className="relative h-full flex-1 min-w-0 overflow-hidden"
                aria-label={`Ver foto 1 de ${titulo}`}
              >
                <img src={principal} alt={titulo} className="w-full h-full object-cover" />
              </button>
              {extras.length > 0 && (
                <div className="flex flex-1 min-w-0 flex-col gap-2 h-full">
                  {colunasExtras === 1
                    ? extras.map((url, i) => (
                        <button
                          key={url + i}
                          type="button"
                          onClick={() => abrirFoto(i + 1)}
                          className="relative flex-1 min-h-0 w-full overflow-hidden"
                          aria-label={`Ver foto ${i + 2} de ${titulo}`}
                        >
                          <img src={url} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))
                    : [extras.slice(0, 2), extras.slice(2, 4)].map((linha, linhaIdx) => (
                        <div key={linhaIdx} className="flex flex-1 min-h-0 gap-2">
                          {linha.map((url, i) => {
                            const idx = linhaIdx * 2 + i + 1;
                            return (
                              <button
                                key={url + idx}
                                type="button"
                                onClick={() => abrirFoto(idx)}
                                className="relative flex-1 min-w-0 h-full overflow-hidden"
                                aria-label={`Ver foto ${idx + 1} de ${titulo}`}
                              >
                                <img src={url} alt="" className="w-full h-full object-cover" />
                              </button>
                            );
                          })}
                        </div>
                      ))}
                </div>
              )}
            </div>
          </>
        )}
        {mostrarBotaoTodas && (
          <button
            type="button"
            onClick={abrirTour}
            className="absolute bottom-4 right-4 inline-flex items-center gap-2 rounded-lg border border-foreground bg-background px-3 py-2 text-xs font-semibold shadow hover:bg-muted transition"
          >
            <LayoutGrid className="h-3.5 w-3.5" /> Mostrar todas as fotos
          </button>
        )}
      </div>

      {/* Tour por fotos - coluna única com todas as imagens */}
      {tourAberto && (
        <div className="fixed inset-0 z-[100] bg-background overflow-y-auto">
          <div className="sticky top-0 z-10 flex items-center gap-4 border-b border-border bg-background px-4 sm:px-6 py-4">
            <button
              type="button"
              onClick={fecharTour}
              className="rounded-full p-2 hover:bg-muted transition"
              aria-label="Fechar tour de fotos"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h2 className="text-base sm:text-lg font-semibold text-foreground">{titulo}</h2>
          </div>
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-4">
            {imagens.map((url, i) => (
              <button
                key={url + i}
                type="button"
                onClick={() => abrirFoto(i)}
                className="block w-full"
                aria-label={`Ver foto ${i + 1} de ${titulo}`}
              >
                <img src={url} alt="" className="w-full h-auto rounded-xl object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Visualizador em tela cheia de uma foto específica */}
      {fotoAberta && (
        <div className="fixed inset-0 z-[110] bg-background flex flex-col">
          <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-border">
            <button
              type="button"
              onClick={fecharFoto}
              className="rounded-full p-2 hover:bg-muted transition"
              aria-label="Voltar"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <span className="text-sm text-muted-foreground">
              {idxAtiva + 1} de {total}
            </span>
            <button
              type="button"
              onClick={fecharTudo}
              className="rounded-full p-2 hover:bg-muted transition"
              aria-label="Fechar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="relative flex-1 min-h-0 flex items-center justify-center p-4 sm:p-10">
            {total > 1 && (
              <button
                type="button"
                onClick={() => irPara(idxAtiva - 1)}
                className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 rounded-full bg-background border border-border p-2 shadow hover:bg-muted transition"
                aria-label="Foto anterior"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}
            <img
              src={imagens[idxAtiva]}
              alt={`${titulo} - foto ${idxAtiva + 1}`}
              className="max-h-full max-w-full object-contain rounded-lg"
            />
            {total > 1 && (
              <button
                type="button"
                onClick={() => irPara(idxAtiva + 1)}
                className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 rounded-full bg-background border border-border p-2 shadow hover:bg-muted transition"
                aria-label="Próxima foto"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
