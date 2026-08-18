import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Check, HeartHandshake } from "lucide-react";
import { RECURSO_BADGES } from "@/components/Badges";
import { FotoAvatar } from "@/components/perfil/FotoAvatar";
import { PainelFiltro } from "@/components/explorar/PainelFiltro";
import { useContagemPreview } from "@/hooks/useContagemPreview";
import {
  necessidadesDosPerfis,
  quemPrecisa,
  type PerfilNecessidades,
} from "@/lib/perfil/compatibilidade";
import { csvOrUndefined, type ExplorarSearch } from "@/lib/explorar-search";
import { cn } from "@/lib/utils";

interface PainelPerfisProps {
  search: ExplorarSearch;
  disponiveis: ReadonlyArray<PerfilNecessidades>;
  selecionados: ReadonlyArray<PerfilNecessidades>;
  onPatch: (patch: Partial<ExplorarSearch>) => void;
}

/**
 * Filtro por Perfil TEA.
 *
 * Marcar um perfil não esconde nada por padrão - ele liga o percentual de
 * compatibilidade em cada card. Esconder resultados é uma escolha explícita
 * ("só os que atendem tudo"), com a contagem à vista antes de aplicar, porque
 * uma família com muitas necessidades pode zerar a lista sem entender por quê.
 */
export function PainelPerfis({ search, disponiveis, selecionados, onPatch }: PainelPerfisProps) {
  const [rascunho, setRascunho] = useState<string[]>(selecionados.map((p) => p.id));
  const [soCompativeis, setSoCompativeis] = useState(!!search.so_compativeis);
  const [aberto, setAberto] = useState(false);

  useEffect(() => {
    setRascunho(selecionados.map((p) => p.id));
    setSoCompativeis(!!search.so_compativeis);
  }, [selecionados, search.so_compativeis]);

  const perfisRascunho = disponiveis.filter((p) => rascunho.includes(p.id));
  const necessidadesRascunho = necessidadesDosPerfis(perfisRascunho);

  const contagem = useContagemPreview(
    {
      ...search,
      perfis: csvOrUndefined(rascunho),
      so_compativeis: soCompativeis && rascunho.length > 0 ? true : undefined,
    },
    aberto,
    necessidadesRascunho,
  );

  if (disponiveis.length === 0) return null;

  const rotulo =
    selecionados.length === 0
      ? "Perfil TEA"
      : selecionados.length === 1
        ? selecionados[0].nome_autista
        : `${selecionados.length} perfis`;

  function alternar(id: string) {
    setRascunho((atual) => (atual.includes(id) ? atual.filter((x) => x !== id) : [...atual, id]));
  }

  return (
    <PainelFiltro
      titulo="Compatibilidade com o Perfil TEA"
      rotulo={rotulo}
      ativo={selecionados.length > 0}
      larguraDesktop="w-[min(22rem,calc(100vw-2rem))]"
      contagem={contagem}
      onAbertoChange={setAberto}
      onLimpar={() => {
        setRascunho([]);
        setSoCompativeis(false);
        onPatch({ perfis: undefined, so_compativeis: undefined });
      }}
      onAplicar={() =>
        onPatch({
          perfis: csvOrUndefined(rascunho),
          so_compativeis: soCompativeis && rascunho.length > 0 ? true : undefined,
        })
      }
    >
      {() => (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Escolha quem vai na viagem. Mostramos o quanto cada lugar atende ao que essa pessoa
            precisa.
          </p>

          <ul className="flex flex-col">
            {disponiveis.map((perfil) => {
              const marcado = rascunho.includes(perfil.id);
              return (
                <li key={perfil.id}>
                  <button
                    type="button"
                    aria-pressed={marcado}
                    onClick={() => alternar(perfil.id)}
                    className="flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left text-sm transition hover:bg-muted"
                  >
                    <span
                      className={cn(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded border transition",
                        marcado
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-white",
                      )}
                      aria-hidden
                    >
                      {marcado && <Check className="h-3.5 w-3.5" />}
                    </span>
                    <FotoAvatar
                      nome={perfil.nome_autista}
                      fotoUrl={perfil.foto_url}
                      tamanho="h-8 w-8"
                    />
                    <span className="min-w-0 flex-1 truncate font-medium text-primary">
                      {perfil.nome_autista}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          {rascunho.length > 0 && (
            <div className="rounded-xl border border-border bg-muted/40 p-3">
              {necessidadesRascunho.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Esse perfil ainda não declarou nada que dependa da estrutura do local, então não
                  há o que comparar.{" "}
                  <Link to="/minha-conta/perfil" className="text-secondary hover:underline">
                    Completar o perfil
                  </Link>
                </p>
              ) : (
                <>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Precisa de
                  </p>
                  <ul className="mt-1.5 space-y-1">
                    {necessidadesRascunho.map((flag) => (
                      <li key={flag} className="text-xs text-foreground/80">
                        {RECURSO_BADGES[flag].label}
                        {perfisRascunho.length > 1 && (
                          <span className="text-muted-foreground">
                            {" "}
                            · {quemPrecisa(perfisRascunho, flag).join(", ")}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>

                  <label className="mt-3 flex cursor-pointer items-start gap-2.5 border-t border-border pt-3">
                    <input
                      type="checkbox"
                      checked={soCompativeis}
                      onChange={(e) => setSoCompativeis(e.target.checked)}
                      className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
                    />
                    <span className="text-xs text-foreground/80">
                      Mostrar só os lugares que atendem tudo
                      <span className="block text-muted-foreground">
                        Sem isso, você vê todos com a nota de compatibilidade.
                      </span>
                    </span>
                  </label>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </PainelFiltro>
  );
}

/** Convite para quem ainda não tem perfil - o filtro não existe sem um. */
export function ConviteCriarPerfil() {
  return (
    <Link
      to="/minha-conta/perfil"
      className="inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-dashed border-secondary/60 px-3 text-sm font-medium text-secondary transition hover:bg-teal-claro/40"
    >
      <HeartHandshake className="h-4 w-4" aria-hidden />
      Ver compatibilidade
    </Link>
  );
}
