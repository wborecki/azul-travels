import { ImageOff, Users, Baby, MapPin, BedDouble, Clock } from "lucide-react";
import { MarkdownView } from "@/components/MarkdownView";
import { COMODIDADE_POR_KEY } from "@/lib/itens-comodidades";

interface ItemReservavelPreviewCardProps {
  nome: string;
  descricao: string;
  preco: number | null;
  quantidade: number;
  capacidadeTotal: number;
  capacidadeAdultos: number | null;
  capacidadeCriancas: number | null;
  quantidadeCamas: number;
  comodidades: string[];
  checkInPadrao: string | null;
  checkOutPadrao: string | null;
  imagens: string[];
  localResumo?: string | null;
}

function formatPreco(preco: number | null): string {
  if (preco === null) return "Preço por noite não informado ainda";
  return `${preco.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} / noite`;
}

export function ItemReservavelPreviewCard({
  nome,
  descricao,
  preco,
  quantidade,
  capacidadeTotal,
  capacidadeAdultos,
  capacidadeCriancas,
  quantidadeCamas,
  comodidades,
  checkInPadrao,
  checkOutPadrao,
  imagens,
  localResumo,
}: ItemReservavelPreviewCardProps) {
  const capa = imagens[0];
  const miniaturas = imagens.slice(1, 5);
  const temDetalhePorCategoria = capacidadeAdultos !== null || capacidadeCriancas !== null;

  return (
    <div className="bg-white border rounded-2xl overflow-hidden shadow-sm">
      <div className="aspect-[4/3] bg-muted flex items-center justify-center">
        {capa ? (
          <img src={capa} alt={nome || "Prévia da opção"} className="w-full h-full object-cover" />
        ) : (
          <ImageOff className="h-8 w-8 text-foreground/30" />
        )}
      </div>
      {miniaturas.length > 0 && (
        <div className="grid grid-cols-4 gap-1 p-1">
          {miniaturas.map((url, i) => (
            <div key={i} className="aspect-square rounded-md overflow-hidden bg-muted">
              <img src={url} alt="" className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      )}
      <div className="p-5 space-y-3">
        <h3 className="font-display font-bold text-xl text-primary">{nome || "Nome da opção"}</h3>

        {localResumo && (
          <p className="flex items-center gap-1.5 text-xs text-foreground/60">
            <MapPin className="h-3.5 w-3.5 shrink-0" /> {localResumo}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-foreground/70">
          <span className="inline-flex items-center gap-1.5">
            <Users className="h-4 w-4" /> Até {capacidadeTotal} pessoa(s)
          </span>
          <span className="inline-flex items-center gap-1.5">
            <BedDouble className="h-4 w-4" /> {quantidadeCamas} cama(s)
          </span>
        </div>

        {temDetalhePorCategoria && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-foreground/50">
            {capacidadeAdultos !== null && (
              <span className="inline-flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" /> Até {capacidadeAdultos} adulto(s)
              </span>
            )}
            {capacidadeCriancas !== null && (
              <span className="inline-flex items-center gap-1.5">
                <Baby className="h-3.5 w-3.5" /> Até {capacidadeCriancas} criança(s)
              </span>
            )}
          </div>
        )}

        {comodidades.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {comodidades.map((key) => {
              const c = COMODIDADE_POR_KEY[key];
              if (!c) return null;
              const Icon = c.icon;
              return (
                <span
                  key={key}
                  className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs text-foreground/70"
                >
                  <Icon className="h-3.5 w-3.5" /> {c.label}
                </span>
              );
            })}
          </div>
        )}

        {(checkInPadrao || checkOutPadrao) && (
          <p className="flex items-center gap-1.5 text-xs text-foreground/60">
            <Clock className="h-3.5 w-3.5 shrink-0" />
            {checkInPadrao && `Check-in a partir de ${checkInPadrao}`}
            {checkInPadrao && checkOutPadrao && " · "}
            {checkOutPadrao && `Check-out até ${checkOutPadrao}`}
          </p>
        )}

        <div className="text-lg font-semibold text-primary">{formatPreco(preco)}</div>

        {descricao.trim() ? (
          <MarkdownView source={descricao} className="prose-sm" />
        ) : (
          <p className="text-sm text-foreground/40 italic">Sem descrição ainda.</p>
        )}

        <p className="text-xs text-foreground/50 pt-1 border-t">
          {quantidade} unidade(s) disponível(is) para reserva.
        </p>
      </div>
    </div>
  );
}
