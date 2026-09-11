import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type {
  Opcao,
  Pergunta,
  PerguntaChipsBooleano,
  PerguntaMatriz,
  PerguntaMultipla,
  PerguntaUnica,
  PerfilDraft,
} from "@/lib/perfil/tipos";
import { Chip, ChipOutro, ChipRemovivel } from "./Chip";

/**
 * Renderiza uma pergunta do `blocos.ts`. Cada pergunta ocupa a largura toda em
 * coluna única, com o enunciado como cabeçalho - nunca como label de campo.
 */

export interface CampoPerguntaProps {
  pergunta: Pergunta;
  draft: PerfilDraft;
  onChange: (patch: PerfilDraft) => void;
}

export function CampoPergunta({ pergunta, draft, onChange }: CampoPerguntaProps) {
  // Sem `m-0` no fieldset: ele venceria o `space-y-*` do container e colaria as perguntas.
  return (
    <fieldset className="border-0 p-0">
      <legend className="mb-0.5 font-display font-bold text-primary text-lg leading-snug">
        {pergunta.titulo}
      </legend>
      {pergunta.ajuda && <p className="text-sm text-muted-foreground mb-3">{pergunta.ajuda}</p>}
      <div className={pergunta.ajuda ? "" : "mt-3"}>
        <Controle pergunta={pergunta} draft={draft} onChange={onChange} />
      </div>
    </fieldset>
  );
}

function Controle({ pergunta, draft, onChange }: CampoPerguntaProps) {
  switch (pergunta.tipo) {
    case "texto": {
      const valor = (draft[pergunta.campo] as string | null | undefined) ?? "";
      const set = (v: string) => onChange({ [pergunta.campo]: v || null });
      return pergunta.multilinha ? (
        <Textarea
          rows={3}
          value={valor}
          placeholder={pergunta.exemplo}
          onChange={(e) => set(e.target.value)}
        />
      ) : (
        <Input value={valor} placeholder={pergunta.exemplo} onChange={(e) => set(e.target.value)} />
      );
    }

    case "numero": {
      const valor = (draft[pergunta.campo] as number | null | undefined) ?? "";
      return (
        <Input
          type="number"
          inputMode="numeric"
          min={pergunta.min}
          max={pergunta.max}
          value={valor}
          className="max-w-32"
          onChange={(e) =>
            onChange({ [pergunta.campo]: e.target.value ? Number(e.target.value) : null })
          }
        />
      );
    }

    case "hora": {
      const valor = (draft[pergunta.campo] as string | null | undefined) ?? "";
      return (
        <Input
          type="time"
          value={valor}
          className="max-w-40"
          onChange={(e) => onChange({ [pergunta.campo]: e.target.value || null })}
        />
      );
    }

    case "booleano": {
      const valor = draft[pergunta.campo] as boolean | null | undefined;
      return (
        <div className="flex flex-wrap gap-2">
          <Chip ativo={valor === true} onClick={() => onChange({ [pergunta.campo]: true })}>
            {pergunta.simLabel ?? "Sim"}
          </Chip>
          <Chip ativo={valor === false} onClick={() => onChange({ [pergunta.campo]: false })}>
            {pergunta.naoLabel ?? "Não"}
          </Chip>
        </div>
      );
    }

    case "unica":
      return <EscolhaUnica pergunta={pergunta} draft={draft} onChange={onChange} />;

    case "multipla":
      return <EscolhaMultipla pergunta={pergunta} draft={draft} onChange={onChange} />;

    case "chips-booleano":
      return <ChipsBooleano pergunta={pergunta} draft={draft} onChange={onChange} />;

    case "matriz":
      return <MatrizTriada pergunta={pergunta} draft={draft} onChange={onChange} />;
  }
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Cards quando as opções precisam de explicação, pills quando falam por si.
 * Sem slider: click-and-drag é barreira de acessibilidade (WCAG 2.5.1).
 */
function EscolhaUnica({
  pergunta,
  draft,
  onChange,
}: CampoPerguntaProps & { pergunta: PerguntaUnica }) {
  const valor = draft[pergunta.campo] as string | null | undefined;
  const set = (v: string) => onChange({ [pergunta.campo]: valor === v ? null : v });
  const comDescricao = pergunta.opcoes.some((o) => o.d);

  if (!comDescricao) {
    return (
      <div className="flex flex-wrap gap-2">
        {pergunta.opcoes.map((o) => (
          <Chip key={o.v} ativo={valor === o.v} onClick={() => set(o.v)}>
            {o.t}
          </Chip>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {pergunta.opcoes.map((o) => (
        <CardOpcao key={o.v} opcao={o} ativo={valor === o.v} onClick={() => set(o.v)} />
      ))}
    </div>
  );
}

function CardOpcao({
  opcao,
  ativo,
  onClick,
}: {
  opcao: Opcao;
  ativo: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ativo}
      className={cn(
        "w-full text-left p-3.5 rounded-xl border-2 transition flex items-start gap-3",
        ativo
          ? "border-secondary bg-teal-claro/40"
          : "border-border bg-white hover:border-secondary/40",
      )}
    >
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm text-primary">{opcao.t}</div>
        {opcao.d && <div className="text-xs text-muted-foreground mt-0.5">{opcao.d}</div>}
      </div>
      <span
        className={cn(
          "shrink-0 h-5 w-5 rounded-full border-2 mt-0.5 grid place-items-center",
          ativo ? "border-secondary bg-secondary" : "border-border",
        )}
      >
        {ativo && <span className="h-2 w-2 rounded-full bg-white" />}
      </span>
    </button>
  );
}

/**
 * Nuvem de chips com sugestões prontas. Substitui os campos "separados por
 * vírgula": um toque em vez de digitação, e o "+" cobre o que a lista não prevê.
 */
function EscolhaMultipla({
  pergunta,
  draft,
  onChange,
}: CampoPerguntaProps & { pergunta: PerguntaMultipla }) {
  const valores = (draft[pergunta.campo] as string[] | null | undefined) ?? [];
  const conhecidos = new Set(pergunta.opcoes.map((o) => o.v));
  const proprios = valores.filter((v) => !conhecidos.has(v) && v !== pergunta.nenhum);
  const marcouNenhum = pergunta.nenhum != null && valores.includes(pergunta.nenhum);

  const set = (proximos: string[]) => onChange({ [pergunta.campo]: proximos });

  function alternar(v: string) {
    // "Nenhum" é excludente: marcar limpa o resto, marcar qualquer outro o remove.
    const semNenhum = pergunta.nenhum ? valores.filter((x) => x !== pergunta.nenhum) : valores;
    set(semNenhum.includes(v) ? semNenhum.filter((x) => x !== v) : [...semNenhum, v]);
  }

  const grupos = pergunta.grupos ?? [{ rotulo: "", valores: pergunta.opcoes.map((o) => o.v) }];

  return (
    <div className="space-y-3">
      {grupos.map((g) => (
        <div key={g.rotulo || "todos"}>
          {g.rotulo && (
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
              {g.rotulo}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {pergunta.opcoes
              .filter((o) => g.valores.includes(o.v))
              .map((o) => (
                <Chip
                  key={o.v}
                  ativo={!marcouNenhum && valores.includes(o.v)}
                  onClick={() => alternar(o.v)}
                >
                  {o.t}
                </Chip>
              ))}
          </div>
        </div>
      ))}

      {/* Itens próprios, "+ Outro" e "Nenhum" na mesma faixa: em linhas separadas
          cada um virava um chip órfão no meio do branco. */}
      {(proprios.length > 0 || pergunta.permiteOutro || pergunta.nenhum) && (
        <div className="flex flex-wrap gap-2">
          {proprios.map((v) => (
            <ChipRemovivel
              key={v}
              texto={v}
              onRemover={() => set(valores.filter((x) => x !== v))}
            />
          ))}
          {pergunta.permiteOutro && (
            <ChipOutro
              onAdicionar={(t) => {
                if (valores.includes(t)) return;
                const semNenhum = pergunta.nenhum
                  ? valores.filter((x) => x !== pergunta.nenhum)
                  : valores;
                set([...semNenhum, t]);
              }}
            />
          )}
          {pergunta.nenhum && (
            <Chip ativo={marcouNenhum} onClick={() => set(marcouNenhum ? [] : [pergunta.nenhum!])}>
              {pergunta.nenhum}
            </Chip>
          )}
        </div>
      )}
    </div>
  );
}

/** Vários booleans numa nuvem só - marcado vira `true`, desmarcado vira `false`. */
function ChipsBooleano({
  pergunta,
  draft,
  onChange,
}: CampoPerguntaProps & { pergunta: PerguntaChipsBooleano }) {
  return (
    <div className="flex flex-wrap gap-2">
      {pergunta.opcoes.map((o) => {
        const ativo = draft[o.campo] === true;
        return (
          <Chip key={o.v} ativo={ativo} onClick={() => onChange({ [o.campo]: !ativo })}>
            {o.t}
          </Chip>
        );
      })}
    </div>
  );
}

/**
 * Triagem + refino. A matriz do Pré-Check-in tem 14 estímulos × 4 níveis: aqui a
 * família marca só o que se aplica e a intensidade aparece apenas para esses.
 * Quem não marca nada resolve a seção inteira num toque.
 */
function MatrizTriada({
  pergunta,
  draft,
  onChange,
}: CampoPerguntaProps & { pergunta: PerguntaMatriz }) {
  const marcados = pergunta.itens.filter((i) => {
    const v = draft[i.campo] as string | null | undefined;
    return v != null && v !== pergunta.vazio;
  });
  const respondeu = pergunta.itens.some((i) => draft[i.campo] != null);
  const nenhum = respondeu && marcados.length === 0;

  const grupos = [...new Set(pergunta.itens.map((i) => i.grupo))];

  function alternar(campo: PerguntaMatriz["itens"][number]["campo"]) {
    const atual = draft[campo] as string | null | undefined;
    const ligado = atual != null && atual !== pergunta.vazio;
    if (ligado) {
      onChange({ [campo]: pergunta.vazio });
      return;
    }
    // Ligar um item também fecha o "nada disso": os demais viram `vazio`.
    const patch: PerfilDraft = { [campo]: pergunta.niveis[0].v };
    for (const i of pergunta.itens) {
      if (i.campo !== campo && draft[i.campo] == null) {
        Object.assign(patch, { [i.campo]: pergunta.vazio });
      }
    }
    onChange(patch);
  }

  function marcarNenhum() {
    const patch: PerfilDraft = {};
    for (const i of pergunta.itens) Object.assign(patch, { [i.campo]: pergunta.vazio });
    onChange(patch);
  }

  return (
    <div className="space-y-4">
      {grupos.map((g) => (
        <div key={g}>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
            {g}
          </p>
          <div className="flex flex-wrap gap-2">
            {pergunta.itens
              .filter((i) => i.grupo === g)
              .map((i) => {
                const v = draft[i.campo] as string | null | undefined;
                return (
                  <Chip
                    key={i.campo}
                    ativo={v != null && v !== pergunta.vazio}
                    onClick={() => alternar(i.campo)}
                  >
                    {i.t}
                  </Chip>
                );
              })}
          </div>
        </div>
      ))}

      <Chip ativo={nenhum} onClick={marcarNenhum}>
        {pergunta.nenhumLabel}
      </Chip>

      {marcados.length > 0 && (
        <div className="rounded-xl border bg-muted/30 p-4 space-y-3">
          <p className="font-display font-bold text-primary text-sm">{pergunta.tituloRefino}</p>
          {marcados.map((i) => (
            <div key={i.campo} className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm text-primary">{i.t}</span>
              <Segmented
                opcoes={pergunta.niveis}
                valor={draft[i.campo] as string | null | undefined}
                onChange={(v) => onChange({ [i.campo]: v })}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Escala em pills lado a lado. "Depende" é resposta de primeira classe. */
function Segmented({
  opcoes,
  valor,
  onChange,
}: {
  opcoes: Opcao[];
  valor: string | null | undefined;
  onChange: (v: string) => void;
}) {
  return (
    <div className="inline-flex rounded-full border-2 border-border bg-white p-0.5">
      {opcoes.map((o) => (
        <button
          key={o.v}
          type="button"
          onClick={() => onChange(o.v)}
          aria-pressed={valor === o.v}
          title={o.d}
          className={cn(
            "px-3 py-1.5 rounded-full text-sm font-medium transition",
            valor === o.v ? "bg-secondary text-white" : "text-muted-foreground hover:text-primary",
          )}
        >
          {o.t}
        </button>
      ))}
    </div>
  );
}
