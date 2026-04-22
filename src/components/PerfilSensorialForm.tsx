import { useState, type ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Check,
  VolumeX,
  Lightbulb,
  Shirt,
  Wind,
  UsersRound,
  MessageSquare,
  Image as ImageIcon,
  Hand,
  DoorOpen,
  FastForward,
  Utensils,
  Home,
  Brain,
  Waves,
  Trees,
  PawPrint,
} from "lucide-react";
import type { TablesInsert, Tables } from "@/integrations/supabase/types";

/**
 * Formulário compartilhado de perfil sensorial.
 *
 * Reusa a UX dos Steps 2 e 3 do cadastro. Usado em /minha-conta/perfis
 * tanto para criar (modal "Adicionar filho") quanto para editar.
 */

export type PerfilSensorialDraft = Pick<
  TablesInsert<"perfil_sensorial">,
  | "nome_autista"
  | "idade"
  | "nivel_tea"
  | "sensivel_sons"
  | "sensivel_luz"
  | "sensivel_texturas"
  | "sensivel_cheiros"
  | "sensivel_multidao"
  | "comunicacao_verbal"
  | "usa_caa"
  | "usa_libras"
  | "precisa_checkin_antecipado"
  | "precisa_fila_prioritaria"
  | "precisa_cardapio_visual"
  | "precisa_sala_sensorial"
  | "precisa_concierge_tea"
  | "gosta_atividades_agua"
  | "gosta_natureza"
  | "gosta_animais"
  | "notas_adicionais"
>;

export const DEFAULT_PERFIL_DRAFT: PerfilSensorialDraft = {
  nome_autista: "",
  idade: null,
  nivel_tea: null,
  sensivel_sons: false,
  sensivel_luz: false,
  sensivel_texturas: false,
  sensivel_cheiros: false,
  sensivel_multidao: false,
  comunicacao_verbal: false,
  usa_caa: false,
  usa_libras: false,
  precisa_checkin_antecipado: false,
  precisa_fila_prioritaria: false,
  precisa_cardapio_visual: false,
  precisa_sala_sensorial: false,
  precisa_concierge_tea: false,
  gosta_atividades_agua: false,
  gosta_natureza: false,
  gosta_animais: false,
  notas_adicionais: null,
};

export function perfilToDraft(p: Tables<"perfil_sensorial">): PerfilSensorialDraft {
  return {
    nome_autista: p.nome_autista,
    idade: p.idade,
    nivel_tea: p.nivel_tea,
    sensivel_sons: p.sensivel_sons,
    sensivel_luz: p.sensivel_luz,
    sensivel_texturas: p.sensivel_texturas,
    sensivel_cheiros: p.sensivel_cheiros,
    sensivel_multidao: p.sensivel_multidao,
    comunicacao_verbal: p.comunicacao_verbal,
    usa_caa: p.usa_caa,
    usa_libras: p.usa_libras,
    precisa_checkin_antecipado: p.precisa_checkin_antecipado,
    precisa_fila_prioritaria: p.precisa_fila_prioritaria,
    precisa_cardapio_visual: p.precisa_cardapio_visual,
    precisa_sala_sensorial: p.precisa_sala_sensorial,
    precisa_concierge_tea: p.precisa_concierge_tea,
    gosta_atividades_agua: p.gosta_atividades_agua,
    gosta_natureza: p.gosta_natureza,
    gosta_animais: p.gosta_animais,
    notas_adicionais: p.notas_adicionais,
  };
}

const NIVEIS = [
  { v: "leve" as const, t: "Leve (Nível 1)", d: "Fala bem, é independente na maioria das situações." },
  { v: "moderado" as const, t: "Moderado (Nível 2)", d: "Precisa de apoio em várias situações do dia a dia." },
  { v: "severo" as const, t: "Severo (Nível 3)", d: "Precisa de suporte constante." },
];

type BoolKey = {
  [K in keyof PerfilSensorialDraft]: PerfilSensorialDraft[K] extends boolean | null | undefined
    ? K
    : never;
}[keyof PerfilSensorialDraft];

interface OpcaoCard {
  key: BoolKey;
  Icon: typeof VolumeX;
  titulo: string;
  desc: string;
}

const GRUPO_SENSIBILIDADES: OpcaoCard[] = [
  { key: "sensivel_sons", Icon: VolumeX, titulo: "É sensível a barulho", desc: "Música alta, gritos, ruídos inesperados." },
  { key: "sensivel_luz", Icon: Lightbulb, titulo: "É sensível a luz intensa", desc: "Sol forte, flash, luzes de neon." },
  { key: "sensivel_texturas", Icon: Shirt, titulo: "É sensível a texturas", desc: "Roupas, superfícies, areia, tapetes." },
  { key: "sensivel_cheiros", Icon: Wind, titulo: "É sensível a cheiros fortes", desc: "Limpeza, perfumes, comida." },
  { key: "sensivel_multidao", Icon: UsersRound, titulo: "Fica agitado em lugares cheios", desc: "Praias lotadas, shoppings, filas." },
];
const GRUPO_COMUNICACAO: OpcaoCard[] = [
  { key: "comunicacao_verbal", Icon: MessageSquare, titulo: "Comunica verbalmente", desc: "Fala e entende bem." },
  { key: "usa_caa", Icon: ImageIcon, titulo: "Usa comunicação alternativa (CAA)", desc: "Pranchas, app ou fichas." },
  { key: "usa_libras", Icon: Hand, titulo: "Usa Libras", desc: "Comunicação principal por Libras." },
];
const GRUPO_PRECISA: OpcaoCard[] = [
  { key: "precisa_checkin_antecipado", Icon: DoorOpen, titulo: "Check-in antecipado", desc: "Sem fila na recepção." },
  { key: "precisa_fila_prioritaria", Icon: FastForward, titulo: "Fila prioritária", desc: "Não consegue esperar muito." },
  { key: "precisa_cardapio_visual", Icon: Utensils, titulo: "Cardápio visual", desc: "Imagens dos pratos." },
  { key: "precisa_sala_sensorial", Icon: Home, titulo: "Sala sensorial no local", desc: "Espaço calmo pra reequilibrar." },
  { key: "precisa_concierge_tea", Icon: Brain, titulo: "Concierge TEA no local", desc: "Profissional especializado." },
];
const GRUPO_GOSTA: OpcaoCard[] = [
  { key: "gosta_atividades_agua", Icon: Waves, titulo: "Atividades com água", desc: "Piscina, praia, cachoeira." },
  { key: "gosta_natureza", Icon: Trees, titulo: "Natureza e ar livre", desc: "Trilhas, fazendas, jardins." },
  { key: "gosta_animais", Icon: PawPrint, titulo: "Animais", desc: "Pets, cavalos, aquários." },
];

export interface PerfilSensorialFormProps {
  draft: PerfilSensorialDraft;
  onChange: (next: PerfilSensorialDraft) => void;
  onSubmit: () => void | Promise<void>;
  onCancel?: () => void;
  submitLabel: string;
  loading?: boolean;
  /** Opcional: cabeçalho compacto p/ uso em modal. */
  compact?: boolean;
}

export function PerfilSensorialForm({
  draft,
  onChange,
  onSubmit,
  onCancel,
  submitLabel,
  loading,
  compact,
}: PerfilSensorialFormProps) {
  const valido =
    !!draft.nome_autista &&
    draft.nome_autista.trim().length > 0 &&
    draft.idade != null &&
    draft.idade >= 1 &&
    draft.idade <= 30 &&
    !!draft.nivel_tea;

  const set = <K extends keyof PerfilSensorialDraft>(k: K, v: PerfilSensorialDraft[K]) =>
    onChange({ ...draft, [k]: v });
  const toggle = (k: BoolKey) => set(k, !draft[k] as never);

  return (
    <div className={compact ? "space-y-5" : "space-y-6"}>
      <Field label="Nome (como a família chama)" required>
        <Input
          value={draft.nome_autista ?? ""}
          onChange={(e) => set("nome_autista", e.target.value)}
          placeholder="Como vocês chamam ele ou ela?"
        />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-3">
        <Field label="Idade" required>
          <Input
            type="number"
            min={1}
            max={30}
            value={draft.idade ?? ""}
            onChange={(e) => set("idade", e.target.value ? Number(e.target.value) : null)}
            placeholder="Anos"
          />
        </Field>

        <div>
          <Label className="text-sm font-medium text-primary">
            Nível TEA <span className="text-destructive">*</span>
          </Label>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {NIVEIS.map((n) => (
              <button
                key={n.v}
                type="button"
                onClick={() => set("nivel_tea", n.v)}
                className={`px-3 py-2 rounded-lg border-2 text-sm font-medium transition ${
                  draft.nivel_tea === n.v
                    ? "border-secondary bg-teal-claro text-primary"
                    : "border-border hover:border-secondary/50 text-muted-foreground"
                }`}
              >
                {n.t}
              </button>
            ))}
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <button type="button" className="mt-1.5 text-xs text-secondary hover:underline">
                O que são os níveis TEA?
              </button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Níveis de suporte do TEA</DialogTitle>
                <DialogDescription>
                  A classificação (1, 2, 3) indica o grau de suporte que a pessoa precisa no dia a
                  dia. É a forma usada pelo DSM-5.
                </DialogDescription>
              </DialogHeader>
              <ul className="text-sm space-y-2 text-muted-foreground">
                {NIVEIS.map((n) => (
                  <li key={n.v}>
                    <strong className="text-primary">{n.t}:</strong> {n.d}
                  </li>
                ))}
              </ul>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Grupo titulo="Sensibilidades">
        {GRUPO_SENSIBILIDADES.map((o) => (
          <CardOpcao key={o.key} opcao={o} ativo={!!draft[o.key]} onToggle={() => toggle(o.key)} />
        ))}
      </Grupo>
      <Grupo titulo="Comunicação">
        {GRUPO_COMUNICACAO.map((o) => (
          <CardOpcao key={o.key} opcao={o} ativo={!!draft[o.key]} onToggle={() => toggle(o.key)} />
        ))}
      </Grupo>
      <Grupo titulo="Precisa de estrutura">
        {GRUPO_PRECISA.map((o) => (
          <CardOpcao key={o.key} opcao={o} ativo={!!draft[o.key]} onToggle={() => toggle(o.key)} />
        ))}
      </Grupo>
      <Grupo titulo="Gosta de">
        {GRUPO_GOSTA.map((o) => (
          <CardOpcao key={o.key} opcao={o} ativo={!!draft[o.key]} onToggle={() => toggle(o.key)} />
        ))}
      </Grupo>

      <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
        {onCancel && (
          <Button variant="ghost" onClick={onCancel} className="sm:flex-1">
            Cancelar
          </Button>
        )}
        <Button
          onClick={() => void onSubmit()}
          disabled={!valido || loading}
          className="sm:flex-1 bg-secondary hover:bg-secondary/90 text-white"
        >
          {loading ? "Salvando…" : submitLabel}
        </Button>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div>
      <Label className="text-sm font-medium text-primary">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function Grupo({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div>
      <h3 className="font-display font-bold text-primary text-base mb-2">{titulo}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function CardOpcao({
  opcao,
  ativo,
  onToggle,
}: {
  opcao: OpcaoCard;
  ativo: boolean;
  onToggle: () => void;
}) {
  const { Icon, titulo, desc } = opcao;
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={ativo}
      className={`w-full text-left p-3 rounded-xl border-2 transition flex items-start gap-3 ${
        ativo
          ? "border-secondary bg-teal-claro/40"
          : "border-border bg-muted/30 hover:border-secondary/40"
      }`}
    >
      <div
        className={`shrink-0 h-9 w-9 rounded-lg flex items-center justify-center ${
          ativo ? "bg-secondary text-white" : "bg-background text-secondary border border-border"
        }`}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm text-primary">{titulo}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{desc}</div>
      </div>
      <div
        className={`shrink-0 h-5 w-5 rounded border-2 flex items-center justify-center mt-0.5 ${
          ativo ? "border-secondary bg-secondary" : "border-border bg-background"
        }`}
      >
        {ativo && <Check className="h-3 w-3 text-white" />}
      </div>
    </button>
  );
}

// Helpers usados nas chips de resumo (dashboard, lista de perfis)
export const RECURSO_LABELS: Record<BoolKey, string> = {
  sensivel_sons: "Sensível a barulho",
  sensivel_luz: "Sensível à luz",
  sensivel_texturas: "Sensível a texturas",
  sensivel_cheiros: "Sensível a cheiros",
  sensivel_multidao: "Multidões",
  comunicacao_verbal: "Verbal",
  usa_caa: "Usa CAA",
  usa_libras: "Libras",
  precisa_checkin_antecipado: "Check-in antecipado",
  precisa_fila_prioritaria: "Fila prioritária",
  precisa_cardapio_visual: "Cardápio visual",
  precisa_sala_sensorial: "Sala sensorial",
  precisa_concierge_tea: "Concierge TEA",
  gosta_atividades_agua: "Gosta de água",
  gosta_natureza: "Natureza",
  gosta_animais: "Animais",
};

export const RECURSO_KEYS_ORDENADAS = Object.keys(RECURSO_LABELS) as BoolKey[];

export type PerfilBoolKey = BoolKey;
