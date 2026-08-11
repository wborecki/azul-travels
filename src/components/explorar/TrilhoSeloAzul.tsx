import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { ItemCard } from "@/components/explorar/ItemCard";
import { LinhaRolavel } from "@/components/explorar/LinhaRolavel";
import { fetchItensViewPaginated, type ItemView } from "@/lib/queries";
import { searchToFilters, type ExplorarSearch } from "@/lib/explorar-search";

const MIN_ITENS = 3;
const MAX_ITENS = 8;

interface TrilhoSeloAzulProps {
  search: ExplorarSearch;
  totalResultados: number;
  onVerTodos: () => void;
}

export function TrilhoSeloAzul({ search, totalResultados, onVerTodos }: TrilhoSeloAzulProps) {
  const [itens, setItens] = useState<ItemView[]>([]);

  useEffect(() => {
    let alive = true;
    fetchItensViewPaginated({
      ...searchToFilters(search),
      selos: ["selo_azul"],
      pagina: 1,
      tamanhoPagina: MAX_ITENS,
    })
      .then((page) => {
        if (alive) setItens(page.items);
      })
      .catch(() => {
        if (alive) setItens([]);
      });
    return () => {
      alive = false;
    };
  }, [search]);

  if (itens.length < MIN_ITENS || itens.length >= totalResultados) return null;

  return (
    <section className="mb-6 min-w-0 rounded-2xl bg-teal-claro/40 p-3 sm:p-4 md:mb-8 md:p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="inline-flex items-center gap-2 font-display text-lg font-bold text-primary">
          <ShieldCheck className="h-5 w-5 text-secondary" />
          Com Selo Azul
        </h2>
        <button
          type="button"
          onClick={onVerTodos}
          className="text-sm font-semibold text-secondary underline underline-offset-2"
        >
          Ver todos
        </button>
      </div>

      <p className="mb-3 text-sm text-muted-foreground">
        Locais avaliados e certificados para receber famílias TEA.
      </p>

      <LinhaRolavel
        rotulo="Locais com Selo Azul"
        classNameLista="items-stretch gap-3 sm:gap-4 snap-x snap-mandatory"
        classNameSeta="bg-none"
      >
        {itens.map((item) => (
          <div key={item.id} className="w-[14rem] shrink-0 snap-start sm:w-[15.5rem]">
            <ItemCard
              item={item}
              dataIn={search.data_in}
              dataOut={search.data_out}
              adultos={search.adultos}
              criancas={search.criancas}
            />
          </div>
        ))}
      </LinhaRolavel>
    </section>
  );
}
