import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  fetchPerfisCompletos,
  criarPerfilSensorial,
  atualizarPerfilSensorial,
  excluirPerfilSensorial,
  uploadFotoPerfil,
  type PerfilSensorial,
} from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { TablesInsert } from "@/integrations/supabase/types";
import { Loader2, CheckCircle2, Circle, Plus, Camera, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/minha-conta/perfil")({
  component: PerfisTeaPage,
});

type Draft = Partial<TablesInsert<"perfil_sensorial">>;

/** Sentinela de seleção para "criando um novo perfil". */
const NOVO = "novo" as const;

const NIVEIS = [
  { v: "leve", t: "Leve (Nível 1)" },
  { v: "moderado", t: "Moderado (Nível 2)" },
  { v: "severo", t: "Severo (Nível 3)" },
] as const;

function csvToArray(s: string): string[] {
  return s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

function arrayToCsv(a: string[] | null | undefined): string {
  return (a ?? []).join(", ");
}

function PerfisTeaPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [perfis, setPerfis] = useState<PerfilSensorial[]>([]);
  const [selecionadoId, setSelecionadoId] = useState<string>(NOVO);
  const [draft, setDraft] = useState<Draft>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);
  const fotoInputRef = useRef<HTMLInputElement>(null);

  // CSV mirrors for array fields
  const [restricoesCsv, setRestricoesCsv] = useState("");
  const [gatilhosCsv, setGatilhosCsv] = useState("");
  const [interessesCsv, setInteressesCsv] = useState("");

  function carregarNoForm(p: PerfilSensorial | null) {
    if (p) {
      setSelecionadoId(p.id);
      setDraft(p);
      setRestricoesCsv(arrayToCsv(p.alimentacao_restricoes));
      setGatilhosCsv(arrayToCsv(p.gatilhos));
      setInteressesCsv(arrayToCsv(p.interesses_extra));
    } else {
      setSelecionadoId(NOVO);
      setDraft({});
      setRestricoesCsv("");
      setGatilhosCsv("");
      setInteressesCsv("");
    }
  }

  useEffect(() => {
    if (!user) return;
    let alive = true;
    fetchPerfisCompletos(user.id)
      .then((data) => {
        if (!alive) return;
        setPerfis(data);
        carregarNoForm(data[0] ?? null);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (!alive) return;
        toast.error("Erro ao carregar perfis", {
          description: err instanceof Error ? err.message : undefined,
        });
        setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [user]);

  function set<K extends keyof Draft>(k: K, v: Draft[K]) {
    setDraft((d) => ({ ...d, [k]: v }));
  }
  function tog(k: keyof Draft) {
    setDraft((d) => ({ ...d, [k]: !d[k] as never }));
  }

  const editando = selecionadoId !== NOVO;

  async function onSelecionarFoto(file: File) {
    if (!user) return;
    setUploadingFoto(true);
    try {
      const url = await uploadFotoPerfil(user.id, file);
      set("foto_url", url);
      // Perfil já salvo: persiste a foto na hora, sem esperar o botão Salvar.
      if (editando) {
        const atualizado = await atualizarPerfilSensorial(selecionadoId, { foto_url: url });
        setPerfis((lista) => lista.map((p) => (p.id === atualizado.id ? atualizado : p)));
        toast.success("Foto atualizada!");
      }
    } catch (err) {
      toast.error("Erro ao enviar foto", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setUploadingFoto(false);
    }
  }

  async function onSave() {
    if (!user) return;
    if (!draft.nome_autista || !draft.idade || !draft.nivel_tea) {
      toast.error("Preencha nome, idade e nível TEA.");
      return;
    }
    setSaving(true);
    // Remove campos de controle da row antes de montar o payload.
    const { id: _id, criado_em: _criadoEm, ...campos } = draft;
    const payload: TablesInsert<"perfil_sensorial"> = {
      ...campos,
      familia_id: user.id,
      nome_autista: draft.nome_autista,
      alimentacao_restricoes: csvToArray(restricoesCsv),
      gatilhos: csvToArray(gatilhosCsv),
      interesses_extra: csvToArray(interessesCsv),
    };

    try {
      if (editando) {
        const atualizado = await atualizarPerfilSensorial(selecionadoId, payload);
        setPerfis((lista) => lista.map((p) => (p.id === atualizado.id ? atualizado : p)));
        toast.success(`Perfil de ${atualizado.nome_autista} atualizado!`);
      } else {
        const criado = await criarPerfilSensorial(payload);
        setPerfis((lista) => [...lista, criado]);
        carregarNoForm(criado);
        toast.success(`Perfil de ${criado.nome_autista} criado!`);
      }
      // Redireciona se veio com ?next
      const url = new URL(window.location.href);
      const next = url.searchParams.get("next");
      if (next && next.startsWith("/")) navigate({ to: next });
    } catch (err) {
      toast.error("Erro ao salvar", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setSaving(false);
    }
  }

  async function onExcluir() {
    if (!editando) return;
    try {
      await excluirPerfilSensorial(selecionadoId);
      const restantes = perfis.filter((p) => p.id !== selecionadoId);
      setPerfis(restantes);
      carregarNoForm(restantes[0] ?? null);
      toast.success("Perfil excluído.");
    } catch (err) {
      toast.error("Erro ao excluir perfil", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setConfirmandoExclusao(false);
    }
  }

  if (loading) {
    return (
      <div className="text-muted-foreground inline-flex items-center">
        <Loader2 className="h-4 w-4 animate-spin mr-2" /> Carregando…
      </div>
    );
  }

  const sectionStatus = computeSectionStatus(draft, {
    restricoesCsv,
    gatilhosCsv,
    interessesCsv,
  });
  const completas = sectionStatus.filter((s) => s.done).length;
  const total = sectionStatus.length;
  const pct = Math.round((completas / total) * 100);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-display font-bold text-primary">Perfis TEA</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Cadastre um Perfil TEA para cada pessoa autista da família. Salvos uma vez, são
          reaproveitados em todas as reservas - edite quando algo mudar.
        </p>
      </header>

      {/* Seletor de perfis + adicionar novo */}
      <div className="bg-white border rounded-2xl p-4">
        <div className="flex flex-wrap items-center gap-2">
          {perfis.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => carregarNoForm(p)}
              aria-pressed={selecionadoId === p.id}
              className={`inline-flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-full border-2 text-sm font-medium transition ${
                selecionadoId === p.id
                  ? "border-secondary bg-teal-claro text-primary"
                  : "border-border hover:border-secondary/50 text-muted-foreground"
              }`}
            >
              <FotoAvatar nome={p.nome_autista} fotoUrl={p.foto_url} tamanho="h-7 w-7" />
              {p.nome_autista}
            </button>
          ))}
          <button
            type="button"
            onClick={() => carregarNoForm(null)}
            aria-pressed={!editando}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-full border-2 border-dashed text-sm font-medium transition ${
              !editando
                ? "border-secondary bg-teal-claro/40 text-primary"
                : "border-border hover:border-secondary/50 text-muted-foreground"
            }`}
          >
            <Plus className="h-4 w-4" /> Adicionar Perfil TEA
          </button>
        </div>
      </div>

      <div className="bg-white border rounded-2xl p-5 sticky top-16 z-20 shadow-sm">
        <div className="flex items-center justify-between gap-3 mb-2">
          <div>
            <p className="text-sm font-display font-bold text-primary">
              Progresso do perfil{draft.nome_autista ? ` de ${draft.nome_autista}` : ""}
            </p>
            <p className="text-xs text-muted-foreground">
              {completas} de {total} seções preenchidas
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-display font-bold text-secondary leading-none">{pct}%</p>
            {pct === 100 && (
              <p className="text-[11px] text-emerald-600 font-semibold mt-1">✓ Perfil completo</p>
            )}
          </div>
        </div>
        <div className="h-2 w-full bg-azul-claro rounded-full overflow-hidden">
          <div
            className="h-full bg-secondary transition-all duration-500 ease-out"
            style={{ width: `${pct}%` }}
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {sectionStatus.map((s) => (
            <li
              key={s.key}
              className={`inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-full border ${
                s.done
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                  : "bg-muted/40 border-border text-muted-foreground"
              }`}
            >
              {s.done ? <CheckCircle2 className="h-3 w-3" /> : <Circle className="h-3 w-3" />}
              {s.label}
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-white border rounded-2xl p-6 space-y-5">
        {/* Foto do perfil */}
        <div className="flex items-center gap-4">
          <FotoAvatar
            nome={draft.nome_autista ?? ""}
            fotoUrl={draft.foto_url ?? null}
            tamanho="h-20 w-20"
          />
          <div>
            <input
              ref={fotoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void onSelecionarFoto(file);
                e.target.value = "";
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploadingFoto}
              onClick={() => fotoInputRef.current?.click()}
            >
              {uploadingFoto ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> Enviando…
                </>
              ) : (
                <>
                  <Camera className="h-4 w-4 mr-1.5" />
                  {draft.foto_url ? "Trocar foto" : "Adicionar foto"}
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground mt-1.5">
              A foto ajuda a equipe do estabelecimento a reconhecer a pessoa na chegada.
            </p>
          </div>
        </div>

        <div className="grid sm:grid-cols-[1fr_140px_1fr] gap-3">
          <Field label="Nome (como a família chama)" required>
            <Input
              value={draft.nome_autista ?? ""}
              onChange={(e) => set("nome_autista", e.target.value)}
            />
          </Field>
          <Field label="Idade" required>
            <Input
              type="number"
              min={1}
              max={99}
              value={draft.idade ?? ""}
              onChange={(e) => set("idade", e.target.value ? Number(e.target.value) : null)}
            />
          </Field>
          <Field label="Nível TEA" required>
            <select
              value={draft.nivel_tea ?? ""}
              onChange={(e) => set("nivel_tea", (e.target.value || null) as Draft["nivel_tea"])}
              className="w-full px-3 py-2 border border-input rounded-md text-sm bg-white h-10"
            >
              <option value="">Selecione…</option>
              {NIVEIS.map((n) => (
                <option key={n.v} value={n.v}>
                  {n.t}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Accordion type="multiple" defaultValue={["comunicacao"]} className="w-full">
          <Section value="comunicacao" title="Comunicação e compreensão">
            <BoolGrid
              draft={draft}
              tog={tog}
              items={[
                ["comunicacao_verbal", "Comunica verbalmente"],
                ["usa_caa", "Usa CAA (pranchas, app)"],
                ["usa_libras", "Usa Libras"],
              ]}
            />
          </Section>

          <Section value="apoio" title="Necessidades de apoio diário">
            <BoolGrid
              draft={draft}
              tog={tog}
              items={[
                ["apoio_higiene", "Apoio na higiene"],
                ["apoio_alimentacao", "Apoio na alimentação"],
                ["apoio_mobilidade", "Apoio na mobilidade"],
                ["apoio_seguranca", "Apoio constante para segurança"],
              ]}
            />
          </Section>

          <Section value="rotina" title="Rotina e horários">
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Costuma acordar às">
                <Input
                  type="time"
                  value={draft.rotina_horario_acordar ?? ""}
                  onChange={(e) => set("rotina_horario_acordar", e.target.value)}
                />
              </Field>
              <Field label="Costuma dormir às">
                <Input
                  type="time"
                  value={draft.rotina_horario_dormir ?? ""}
                  onChange={(e) => set("rotina_horario_dormir", e.target.value)}
                />
              </Field>
            </div>
            <Field label="Observações sobre rotina">
              <Textarea
                rows={3}
                value={draft.rotina_observacoes ?? ""}
                onChange={(e) => set("rotina_observacoes", e.target.value)}
                placeholder="Sonecas, sequência de manhã, horários de medicação…"
              />
            </Field>
          </Section>

          <Section value="alimentacao" title="Alimentação">
            <BoolGrid
              draft={draft}
              tog={tog}
              items={[
                ["alimentacao_seletiva", "Alimentação seletiva"],
                ["precisa_cardapio_visual", "Precisa de cardápio visual"],
              ]}
            />
            <Field label="Restrições (separadas por vírgula)">
              <Input
                value={restricoesCsv}
                onChange={(e) => setRestricoesCsv(e.target.value)}
                placeholder="glúten, lactose, amendoim…"
              />
            </Field>
            <Field label="Observações sobre alimentação">
              <Textarea
                rows={2}
                value={draft.alimentacao_observacoes ?? ""}
                onChange={(e) => set("alimentacao_observacoes", e.target.value)}
                placeholder="Aceita só comida em pratos separados, prefere água sem gás…"
              />
            </Field>
          </Section>

          <Section value="sensorial" title="Perfil sensorial">
            <BoolGrid
              draft={draft}
              tog={tog}
              items={[
                ["sensivel_sons", "Sensível a barulho"],
                ["sensivel_luz", "Sensível à luz forte"],
                ["sensivel_texturas", "Sensível a texturas"],
                ["sensivel_cheiros", "Sensível a cheiros"],
                ["sensivel_multidao", "Fica agitado em lugares cheios"],
              ]}
            />
          </Section>

          <Section value="emocional" title="Regulação emocional">
            <Field label="Gatilhos (separados por vírgula)">
              <Input
                value={gatilhosCsv}
                onChange={(e) => setGatilhosCsv(e.target.value)}
                placeholder="mudança de rotina, fogos de artifício, esperar…"
              />
            </Field>
            <Field label="O que costuma acalmar">
              <Textarea
                rows={2}
                value={draft.estrategias_acalmar ?? ""}
                onChange={(e) => set("estrategias_acalmar", e.target.value)}
                placeholder="Música no fone, brinquedo X, abraço apertado…"
              />
            </Field>
            <Field label="Sinais de sobrecarga">
              <Textarea
                rows={2}
                value={draft.sinais_sobrecarga ?? ""}
                onChange={(e) => set("sinais_sobrecarga", e.target.value)}
                placeholder="Tampa os ouvidos, começa a balançar, fica em silêncio…"
              />
            </Field>
          </Section>

          <Section value="quarto" title="Preferências gerais de quarto">
            <BoolGrid
              draft={draft}
              tog={tog}
              items={[
                ["quarto_andar_baixo", "Andar baixo"],
                ["quarto_longe_elevador", "Longe do elevador"],
                ["quarto_blackout", "Cortina blackout"],
                ["quarto_sem_estampas", "Sem estampas/cores fortes"],
                ["quarto_cama_extra", "Cama extra"],
              ]}
            />
            <Field label="Outras observações sobre quarto">
              <Textarea
                rows={2}
                value={draft.quarto_observacoes ?? ""}
                onChange={(e) => set("quarto_observacoes", e.target.value)}
              />
            </Field>
          </Section>

          <Section value="interesses" title="Interesses e estratégias">
            <BoolGrid
              draft={draft}
              tog={tog}
              items={[
                ["gosta_atividades_agua", "Atividades com água"],
                ["gosta_natureza", "Natureza e ar livre"],
                ["gosta_animais", "Animais"],
              ]}
            />
            <Field label="Outros interesses (separados por vírgula)">
              <Input
                value={interessesCsv}
                onChange={(e) => setInteressesCsv(e.target.value)}
                placeholder="dinossauros, trens, música clássica…"
              />
            </Field>
            <Field label="Estratégias que funcionam">
              <Textarea
                rows={2}
                value={draft.estrategias_que_funcionam ?? ""}
                onChange={(e) => set("estrategias_que_funcionam", e.target.value)}
                placeholder="Avisar com 5 minutos antes de mudanças, mostrar foto do lugar…"
              />
            </Field>
          </Section>
        </Accordion>

        <Field label="Notas adicionais">
          <Textarea
            rows={3}
            value={draft.notas_adicionais ?? ""}
            onChange={(e) => set("notas_adicionais", e.target.value)}
            placeholder="Qualquer coisa que ajude a equipe a receber bem."
          />
        </Field>

        <div className="flex items-center justify-between gap-2 pt-2 flex-wrap">
          {editando ? (
            <Button
              type="button"
              variant="ghost"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => setConfirmandoExclusao(true)}
            >
              <Trash2 className="h-4 w-4 mr-1.5" /> Excluir perfil
            </Button>
          ) : (
            <span />
          )}
          <Button
            onClick={() => void onSave()}
            disabled={saving}
            className="bg-secondary hover:bg-secondary/90 text-white"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" /> Salvando…
              </>
            ) : editando ? (
              "Salvar alterações"
            ) : (
              "Salvar Perfil TEA"
            )}
          </Button>
        </div>
      </div>

      <AlertDialog open={confirmandoExclusao} onOpenChange={setConfirmandoExclusao}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Excluir o Perfil TEA de {draft.nome_autista || "esta pessoa"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita. O perfil deixa de aparecer nas próximas reservas (as
              já enviadas não são alteradas).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => void onExcluir()}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function FotoAvatar({
  nome,
  fotoUrl,
  tamanho,
}: {
  nome: string;
  fotoUrl: string | null;
  tamanho: string;
}) {
  const inicial = nome.trim().charAt(0).toUpperCase() || "?";
  return (
    <div
      className={`${tamanho} rounded-full overflow-hidden bg-azul-claro grid place-items-center shrink-0 border border-border`}
    >
      {fotoUrl ? (
        <img src={fotoUrl} alt={`Foto de ${nome}`} className="h-full w-full object-cover" />
      ) : (
        <span className="font-display font-bold text-primary">{inicial}</span>
      )}
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
  children: React.ReactNode;
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

function Section({
  value,
  title,
  children,
}: {
  value: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <AccordionItem value={value}>
      <AccordionTrigger className="text-base font-display font-bold text-primary">
        {title}
      </AccordionTrigger>
      <AccordionContent>
        <div className="space-y-4 pt-1">{children}</div>
      </AccordionContent>
    </AccordionItem>
  );
}

function BoolGrid({
  draft,
  tog,
  items,
}: {
  draft: Draft;
  tog: (k: keyof Draft) => void;
  items: Array<[keyof Draft, string]>;
}) {
  return (
    <div className="grid sm:grid-cols-2 gap-2">
      {items.map(([k, label]) => (
        <label
          key={String(k)}
          className="flex items-center gap-2 px-3 py-2 border rounded-lg text-sm cursor-pointer hover:bg-azul-claro/30"
        >
          <Checkbox checked={!!draft[k]} onCheckedChange={() => tog(k)} />
          <span>{label}</span>
        </label>
      ))}
    </div>
  );
}

type SectionStatus = { key: string; label: string; done: boolean };

function computeSectionStatus(
  d: Draft,
  csv: { restricoesCsv: string; gatilhosCsv: string; interessesCsv: string },
): SectionStatus[] {
  const anyBool = (...keys: Array<keyof Draft>) => keys.some((k) => !!d[k]);
  const anyText = (...vals: Array<string | null | undefined>) =>
    vals.some((v) => !!(v && String(v).trim()));

  return [
    {
      key: "basico",
      label: "Dados básicos",
      done: !!d.nome_autista && !!d.idade && !!d.nivel_tea,
    },
    {
      key: "comunicacao",
      label: "Comunicação",
      done: anyBool("comunicacao_verbal", "usa_caa", "usa_libras"),
    },
    {
      key: "apoio",
      label: "Apoio diário",
      done: anyBool("apoio_higiene", "apoio_alimentacao", "apoio_mobilidade", "apoio_seguranca"),
    },
    {
      key: "rotina",
      label: "Rotina",
      done: anyText(d.rotina_horario_acordar, d.rotina_horario_dormir, d.rotina_observacoes),
    },
    {
      key: "alimentacao",
      label: "Alimentação",
      done:
        anyBool("alimentacao_seletiva", "precisa_cardapio_visual") ||
        anyText(csv.restricoesCsv, d.alimentacao_observacoes),
    },
    {
      key: "sensorial",
      label: "Sensorial",
      done: anyBool(
        "sensivel_sons",
        "sensivel_luz",
        "sensivel_texturas",
        "sensivel_cheiros",
        "sensivel_multidao",
      ),
    },
    {
      key: "emocional",
      label: "Regulação",
      done: anyText(csv.gatilhosCsv, d.estrategias_acalmar, d.sinais_sobrecarga),
    },
    {
      key: "quarto",
      label: "Quarto",
      done:
        anyBool(
          "quarto_andar_baixo",
          "quarto_longe_elevador",
          "quarto_blackout",
          "quarto_sem_estampas",
          "quarto_cama_extra",
        ) || anyText(d.quarto_observacoes),
    },
    {
      key: "interesses",
      label: "Interesses",
      done:
        anyBool("gosta_atividades_agua", "gosta_natureza", "gosta_animais") ||
        anyText(csv.interessesCsv, d.estrategias_que_funcionam),
    },
  ];
}
