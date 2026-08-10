import { ArrowRight, Award, Check, Clock, EyeOff, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDateBR } from "@/lib/brazil";
import type { SecaoId, SecaoInfo } from "@/lib/perfil-estabelecimento";



type PassoEstado = "concluido" | "atual" | "aguardando";

interface Passo {
  id: string;
  titulo: string;
  estado: PassoEstado;
  descricao: string;
  icone: React.ReactNode;
  acao?: React.ReactNode;
  extra?: React.ReactNode;
}

export interface ChecklistOnboardingProps {
  totalSecoes: number;
  pendentes: readonly SecaoInfo[];
  estabAtivo: boolean;
  seloAzul: boolean;
  querSelo: boolean;
  querSeloEm: string | null;
  solicitandoSelo: boolean;
  onCompletar: (secao?: SecaoId) => void;
  onSolicitarSelo: () => void;
  onOcultar: () => void;
}

export function ChecklistOnboarding({
  totalSecoes,
  pendentes,
  estabAtivo,
  seloAzul,
  querSelo,
  querSeloEm,
  solicitandoSelo,
  onCompletar,
  onSolicitarSelo,
  onOcultar,
}: ChecklistOnboardingProps) {
  const perfilCompleto = pendentes.length === 0;

  const passos: Passo[] = [
    {
      id: "perfil",
      titulo: "Perfil do local",
      estado: perfilCompleto ? "concluido" : "atual",
      descricao: perfilCompleto
        ? `As ${totalSecoes} seções estão preenchidas.`
        : pendentes.length === 1
          ? "Falta 1 seção para o perfil ficar completo."
          : `Faltam ${pendentes.length} de ${totalSecoes} seções.`,
      icone: <Sparkles className="h-4 w-4" />,
      acao: perfilCompleto ? (
        <button
          onClick={() => onCompletar()}
          className="text-sm font-semibold text-primary hover:underline inline-flex items-center gap-1"
        >
          Ver ou editar <ArrowRight className="h-3.5 w-3.5" />
        </button>
      ) : (
        <Button
          size="sm"
          onClick={() => onCompletar(pendentes[0]?.id)}
          className="bg-secondary hover:bg-secondary/90 text-white"
        >
          Completar perfil <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      ),
      // Atalho direto para a seção que falta - poupa o dono de caçar no rail
      // do editor qual delas está incompleta.
      extra: perfilCompleto ? null : (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {pendentes.map((s) => (
            <button
              key={s.id}
              onClick={() => onCompletar(s.id)}
              className="inline-flex items-center gap-1 rounded-full bg-azul-claro px-2.5 py-1 text-xs font-semibold text-primary transition hover:bg-primary hover:text-white"
            >
              {s.label}
            </button>
          ))}
        </div>
      ),
    },
    {
      id: "publicacao",
      titulo: "Publicação",
      estado: estabAtivo ? "concluido" : "aguardando",
      descricao: estabAtivo
        ? "Seu local aparece nas buscas das famílias."
        : "Cadastro em análise. Assim que aprovado, seu local entra na busca.",
      icone: <Clock className="h-4 w-4" />,
    },
    {
      id: "selo",
      titulo: "Selo Azul",
      estado: seloAzul ? "concluido" : querSelo ? "aguardando" : "atual",
      descricao: seloAzul
        ? "Certificado. Seu local tem destaque no topo das buscas."
        : querSelo
          ? querSeloEm
            ? `Interesse registrado em ${formatDateBR(querSeloEm)}. Nossa equipe entrará em contato.`
            : "Interesse registrado. Nossa equipe entrará em contato."
          : "O selo dá destaque no topo das buscas e libera os recursos verificados de acolhimento TEA.",
      icone: <Award className="h-4 w-4" />,
      acao:
        seloAzul || querSelo ? null : (
          <Button
            size="sm"
            onClick={onSolicitarSelo}
            disabled={solicitandoSelo}
            className="bg-[#c9a84c] hover:bg-[#b9962e] text-[#1a2f5e] font-semibold"
          >
            {solicitandoSelo ? (
              <>
                <Loader2 className="h-4 w-4 mr-1 animate-spin" /> Enviando…
              </>
            ) : (
              <>
                Solicitar Selo Azul <ArrowRight className="h-4 w-4 ml-1" />
              </>
            )}
          </Button>
        ),
    },
  ];

  const concluidos = passos.filter((p) => p.estado === "concluido").length;
  const progresso = Math.round((concluidos / passos.length) * 100);

  return (
    <section className="rounded-2xl border bg-white shadow-sm overflow-hidden">
      <div className="px-5 sm:px-6 pt-5 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display font-bold text-lg text-primary">Comece por aqui</h2>
            <p className="mt-1 text-sm text-foreground/60">
              Cada etapa aumenta o alcance do seu local entre as famílias.
            </p>
          </div>
          <button
            onClick={onOcultar}
            className="shrink-0 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-foreground/60 transition hover:bg-azul-claro hover:text-primary"
          >
            <EyeOff className="h-3.5 w-3.5" /> Ocultar
          </button>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-foreground/60">Progresso</span>
            <span className="font-semibold text-primary">
              {concluidos} de {passos.length} concluídas
            </span>
          </div>
          <div
            className="h-2 rounded-full bg-slate-100 overflow-hidden"
            role="progressbar"
            aria-valuenow={progresso}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Progresso da configuração"
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-[#c9a84c] transition-all"
              style={{ width: `${progresso}%` }}
            />
          </div>
        </div>
      </div>

      <ol className="grid gap-px bg-slate-200 border-t sm:grid-cols-3">
        {passos.map((p, i) => (
          <li key={p.id} className="bg-white p-5 flex flex-col">
            <div className="flex items-center gap-2.5">
              <PassoMarcador estado={p.estado} icone={p.icone} numero={i + 1} />
              <h3
                className={`font-semibold text-sm ${
                  p.estado === "aguardando" ? "text-foreground/60" : "text-primary"
                }`}
              >
                {p.titulo}
              </h3>
            </div>
            <p className="mt-2.5 text-xs leading-relaxed text-foreground/70 flex-1">
              {p.descricao}
            </p>
            {p.extra}
            {p.acao && <div className="mt-3">{p.acao}</div>}
          </li>
        ))}
      </ol>
    </section>
  );
}

/** Círculo de estado: check dourado (feito), ícone do passo (atual), número (aguardando). */
function PassoMarcador({
  estado,
  icone,
  numero,
}: {
  estado: PassoEstado;
  icone: React.ReactNode;
  numero: number;
}) {
  if (estado === "concluido") {
    return (
      <span className="h-7 w-7 shrink-0 rounded-full bg-[#c9a84c] text-white flex items-center justify-center">
        <Check className="h-4 w-4" />
      </span>
    );
  }
  if (estado === "atual") {
    return (
      <span className="h-7 w-7 shrink-0 rounded-full bg-azul-claro text-primary ring-4 ring-primary/10 flex items-center justify-center">
        {icone}
      </span>
    );
  }
  return (
    <span className="h-7 w-7 shrink-0 rounded-full border border-slate-300 text-slate-400 text-xs font-bold flex items-center justify-center">
      {numero}
    </span>
  );
}
