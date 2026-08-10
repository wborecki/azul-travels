import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Check, HelpCircle, Loader2, Save, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ContadorHospedes } from "@/components/ContadorHospedes";
import { SeletorPeriodo } from "@/components/explorar/SeletorPeriodo";
import { PainelFiltro } from "@/components/explorar/PainelFiltro";
import { chipSeloClasses } from "@/components/explorar/chips";
import { RECURSO_BADGES, SELO_BADGES } from "@/components/Badges";
import { ESTADOS_BR, formatDataISO, formatDateBR, parseDataISO } from "@/lib/brazil";
import { cn } from "@/lib/utils";
import type { ItemRecursoFlag, ItemSeloFlag } from "@/lib/queries";
import {
  ITEM_RECURSO_FLAGS,
  buscaSoDeHospedagem,
  csvOrUndefined,
  parseRecursosCsv,
  parseSelosCsv,
  parseTiposCsv,
  totalHospedes,
  type ExplorarSearch,
} from "@/lib/explorar-search";

const MAX_ADULTOS = 16;
const MAX_CRIANCAS = 10;
const CERTIFICACOES: ReadonlyArray<ItemSeloFlag> = ["selo_governamental", "selo_privado"];

interface FiltrosRapidosProps {
  search: ExplorarSearch;
  onPatch: (patch: Partial<ExplorarSearch>) => void;
  onSalvarPadrao?: () => void;
  salvandoPadrao?: boolean;
}

export function FiltrosRapidos({
  search,
  onPatch,
  onSalvarPadrao,
  salvandoPadrao,
}: FiltrosRapidosProps) {
  const selos = parseSelosCsv(search.selos);
  const recursos = parseRecursosCsv(search.recursos);
  const soHospedagem = buscaSoDeHospedagem(parseTiposCsv(search.tipos));

  const temSeloAzul = selos.includes("selo_azul");
  const certificacoesAtivas = selos.filter((s) => s !== "selo_azul");

  function alternarSelo(flag: ItemSeloFlag) {
    const novos = selos.includes(flag) ? selos.filter((s) => s !== flag) : [...selos, flag];
    onPatch({ selos: csvOrUndefined(novos) });
  }

  function alternarRecurso(flag: ItemRecursoFlag) {
    const novos = recursos.includes(flag)
      ? recursos.filter((r) => r !== flag)
      : [...recursos, flag];
    onPatch({ recursos: csvOrUndefined(novos) });
  }

  return (
    <>
      <button
        type="button"
        aria-pressed={temSeloAzul}
        onClick={() => alternarSelo("selo_azul")}
        className={chipSeloClasses(temSeloAzul)}
      >
        <ShieldCheck className={cn("h-4 w-4", !temSeloAzul && "text-secondary")} aria-hidden />
        Selo Azul
      </button>

      <Link
        to="/como-funciona-o-selo-azul"
        aria-label="O que é o Selo Azul?"
        title="O que é o Selo Azul?"
        className="flex h-9 w-6 shrink-0 items-center justify-center text-muted-foreground transition hover:text-primary"
      >
        <HelpCircle className="h-4 w-4" aria-hidden />
      </Link>

      <PainelLista
        titulo="Certificações"
        ativos={certificacoesAtivas}
        opcoes={CERTIFICACOES}
        etiqueta={(flag) => SELO_BADGES[flag].label}
        onAlternar={alternarSelo}
      />

      <PainelLista
        titulo="Recursos TEA"
        ativos={recursos}
        opcoes={ITEM_RECURSO_FLAGS}
        etiqueta={(flag) => RECURSO_BADGES[flag].label}
        onAlternar={alternarRecurso}
      />

      {soHospedagem && (
        <>
          <PainelPeriodo
            dataIn={search.data_in}
            dataOut={search.data_out}
            onAplicar={(data_in, data_out) => onPatch({ data_in, data_out })}
          />
          <PainelHospedes
            adultos={search.adultos}
            criancas={search.criancas}
            total={totalHospedes(search)}
            definido={search.adultos !== undefined || search.criancas !== undefined}
            onAplicar={(adultos, criancas) => onPatch({ adultos, criancas })}
          />
          <PainelPreco
            precoMin={search.preco_min}
            precoMax={search.preco_max}
            onAplicar={(preco_min, preco_max) => onPatch({ preco_min, preco_max })}
          />
        </>
      )}

      <PainelEstado estado={search.estado} onSelecionar={(estado) => onPatch({ estado })} />

      {onSalvarPadrao && (
        <button
          type="button"
          onClick={onSalvarPadrao}
          disabled={salvandoPadrao}
          title="Tipos, selos e recursos aplicados serão reaplicados na sua próxima visita"
          className="inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 text-sm font-medium text-muted-foreground transition hover:text-primary disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2"
        >
          {salvandoPadrao ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Save className="h-4 w-4" aria-hidden />
          )}
          Salvar filtros
        </button>
      )}
    </>
  );
}

function PainelLista<T extends string>({
  titulo,
  ativos,
  opcoes,
  etiqueta,
  onAlternar,
}: {
  titulo: string;
  ativos: ReadonlyArray<T>;
  opcoes: ReadonlyArray<T>;
  etiqueta: (valor: T) => string;
  onAlternar: (valor: T) => void;
}) {
  return (
    <PainelFiltro
      titulo={titulo}
      rotulo={ativos.length > 0 ? `${titulo} · ${ativos.length}` : titulo}
      ativo={ativos.length > 0}
      larguraDesktop="w-[min(20rem,calc(100vw-2rem))] p-2"
    >
      {() => (
        <ul className="flex flex-col">
          {opcoes.map((opcao) => {
            const marcado = ativos.includes(opcao);
            return (
              <li key={opcao}>
                <button
                  type="button"
                  aria-pressed={marcado}
                  onClick={() => onAlternar(opcao)}
                  className="flex w-full items-center gap-3 rounded-lg px-2 py-3 text-left text-sm transition hover:bg-muted md:py-2"
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
                  {etiqueta(opcao)}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </PainelFiltro>
  );
}

function PainelPeriodo({
  dataIn,
  dataOut,
  onAplicar,
}: {
  dataIn?: string;
  dataOut?: string;
  onAplicar: (dataIn?: string, dataOut?: string) => void;
}) {
  const [inicio, setInicio] = useState(dataIn ?? "");
  const [fim, setFim] = useState(dataOut ?? "");

  useEffect(() => {
    setInicio(dataIn ?? "");
    setFim(dataOut ?? "");
  }, [dataIn, dataOut]);

  const rotulo = dataIn
    ? dataOut
      ? `${formatDateBR(dataIn)} – ${formatDateBR(dataOut)}`
      : formatDateBR(dataIn)
    : "Período";

  return (
    <PainelFiltro
      titulo="Período"
      rotulo={rotulo}
      ativo={!!dataIn}
      larguraDesktop="w-auto"
      onLimpar={() => {
        setInicio("");
        setFim("");
        onAplicar(undefined, undefined);
      }}
      onAplicar={() => onAplicar(inicio || undefined, inicio && fim ? fim : undefined)}
    >
      {() => (
        <SeletorPeriodo
          checkIn={parseDataISO(inicio)}
          checkOut={parseDataISO(fim)}
          mostrarBotaoFechar={false}
          onChange={(ci, co) => {
            setInicio(ci ? formatDataISO(ci) : "");
            setFim(co ? formatDataISO(co) : "");
          }}
        />
      )}
    </PainelFiltro>
  );
}

function PainelHospedes({
  adultos,
  criancas,
  total,
  definido,
  onAplicar,
}: {
  adultos?: number;
  criancas?: number;
  total: number;
  definido: boolean;
  onAplicar: (adultos?: number, criancas?: number) => void;
}) {
  const [rascunhoAdultos, setRascunhoAdultos] = useState(adultos ?? 1);
  const [rascunhoCriancas, setRascunhoCriancas] = useState(criancas ?? 0);

  useEffect(() => {
    setRascunhoAdultos(adultos ?? 1);
    setRascunhoCriancas(criancas ?? 0);
  }, [adultos, criancas]);

  const totalRascunho = rascunhoAdultos + rascunhoCriancas;

  return (
    <PainelFiltro
      titulo="Hóspedes"
      rotulo={definido ? `${total} hóspede${total === 1 ? "" : "s"}` : "Hóspedes"}
      ativo={definido}
      onLimpar={() => {
        setRascunhoAdultos(1);
        setRascunhoCriancas(0);
        onAplicar(undefined, undefined);
      }}
      onAplicar={() =>
        onAplicar(
          rascunhoAdultos !== 1 ? rascunhoAdultos : undefined,
          rascunhoCriancas !== 0 ? rascunhoCriancas : undefined,
        )
      }
    >
      {() => (
        <div className="space-y-5">
          <ContadorHospedes
            label="Adultos"
            sublabel="13 anos ou mais"
            valor={rascunhoAdultos}
            min={1}
            max={MAX_ADULTOS}
            onChange={setRascunhoAdultos}
          />
          <ContadorHospedes
            label="Crianças"
            sublabel="De 2 a 12 anos"
            valor={rascunhoCriancas}
            min={0}
            max={MAX_CRIANCAS}
            onChange={setRascunhoCriancas}
          />
          <p className="text-xs text-muted-foreground">
            Mostra apenas quartos que acomodam {totalRascunho} hóspede
            {totalRascunho === 1 ? "" : "s"}.
          </p>
        </div>
      )}
    </PainelFiltro>
  );
}

function formatPrecoCurto(valor: number): string {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
}

function rotuloPreco(min?: number, max?: number): string {
  if (min !== undefined && max !== undefined)
    return `${formatPrecoCurto(min)} – ${formatPrecoCurto(max)}`;
  if (min !== undefined) return `A partir de ${formatPrecoCurto(min)}`;
  if (max !== undefined) return `Até ${formatPrecoCurto(max)}`;
  return "Preço";
}

function numeroOuUndefined(v: string): number | undefined {
  const t = v.trim();
  if (t === "") return undefined;
  const n = Number(t);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

function PainelPreco({
  precoMin,
  precoMax,
  onAplicar,
}: {
  precoMin?: number;
  precoMax?: number;
  onAplicar: (min?: number, max?: number) => void;
}) {
  const [min, setMin] = useState(precoMin?.toString() ?? "");
  const [max, setMax] = useState(precoMax?.toString() ?? "");

  useEffect(() => {
    setMin(precoMin?.toString() ?? "");
    setMax(precoMax?.toString() ?? "");
  }, [precoMin, precoMax]);

  return (
    <PainelFiltro
      titulo="Preço por noite"
      rotulo={rotuloPreco(precoMin, precoMax)}
      ativo={precoMin !== undefined || precoMax !== undefined}
      onLimpar={() => {
        setMin("");
        setMax("");
        onAplicar(undefined, undefined);
      }}
      onAplicar={() => onAplicar(numeroOuUndefined(min), numeroOuUndefined(max))}
    >
      {() => (
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase text-muted-foreground">Mínimo</span>
            <Input
              type="number"
              min={0}
              inputMode="numeric"
              placeholder="R$ 0"
              value={min}
              onChange={(e) => setMin(e.target.value)}
              className="h-11"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase text-muted-foreground">Máximo</span>
            <Input
              type="number"
              min={0}
              inputMode="numeric"
              placeholder="Sem limite"
              value={max}
              onChange={(e) => setMax(e.target.value)}
              className="h-11"
            />
          </label>
        </div>
      )}
    </PainelFiltro>
  );
}

function PainelEstado({
  estado,
  onSelecionar,
}: {
  estado?: string;
  onSelecionar: (uf?: string) => void;
}) {
  const nome = ESTADOS_BR.find((uf) => uf.sigla === estado)?.nome;

  return (
    <PainelFiltro
      titulo="Estado"
      rotulo={nome ?? "Estado"}
      ativo={!!estado}
      larguraDesktop="w-[min(16rem,calc(100vw-2rem))] p-2"
    >
      {(fechar) => (
        <ul>
          <li>
            <OpcaoEstado
              ativo={!estado}
              onClick={() => {
                onSelecionar(undefined);
                fechar();
              }}
            >
              Todos os estados
            </OpcaoEstado>
          </li>
          {ESTADOS_BR.map((uf) => (
            <li key={uf.sigla}>
              <OpcaoEstado
                ativo={estado === uf.sigla}
                onClick={() => {
                  onSelecionar(uf.sigla);
                  fechar();
                }}
              >
                {uf.nome}
              </OpcaoEstado>
            </li>
          ))}
        </ul>
      )}
    </PainelFiltro>
  );
}

function OpcaoEstado({
  ativo,
  onClick,
  children,
}: {
  ativo: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={ativo}
      onClick={onClick}
      className={cn(
        "flex w-full items-center justify-between gap-2 rounded-lg px-2 py-3 text-left text-sm transition hover:bg-muted md:py-2",
        ativo && "font-semibold text-primary",
      )}
    >
      {children}
      {ativo && <Check className="h-4 w-4 shrink-0" aria-hidden />}
    </button>
  );
}
