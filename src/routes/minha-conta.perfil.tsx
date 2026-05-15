import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
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
import type { Tables, TablesInsert } from "@/integrations/supabase/types";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/minha-conta/perfil")({
  component: PerfilTeaPage,
});

type Perfil = Tables<"perfil_sensorial">;
type Draft = Partial<TablesInsert<"perfil_sensorial">>;

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

function PerfilTeaPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [draft, setDraft] = useState<Draft>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasExisting, setHasExisting] = useState(false);

  // CSV mirrors for array fields
  const [restricoesCsv, setRestricoesCsv] = useState("");
  const [gatilhosCsv, setGatilhosCsv] = useState("");
  const [interessesCsv, setInteressesCsv] = useState("");

  useEffect(() => {
    if (!user) return;
    let alive = true;
    supabase
      .from("perfil_sensorial")
      .select("*")
      .eq("familia_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!alive) return;
        if (data) {
          const p = data as Perfil;
          setDraft(p);
          setHasExisting(true);
          setRestricoesCsv(arrayToCsv(p.alimentacao_restricoes));
          setGatilhosCsv(arrayToCsv(p.gatilhos));
          setInteressesCsv(arrayToCsv(p.interesses_extra));
        }
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

  async function onSave() {
    if (!user) return;
    if (!draft.nome_autista || !draft.idade || !draft.nivel_tea) {
      toast.error("Preencha nome, idade e nível TEA.");
      return;
    }
    setSaving(true);
    const payload: TablesInsert<"perfil_sensorial"> = {
      ...draft,
      familia_id: user.id,
      nome_autista: draft.nome_autista,
      alimentacao_restricoes: csvToArray(restricoesCsv),
      gatilhos: csvToArray(gatilhosCsv),
      interesses_extra: csvToArray(interessesCsv),
    } as TablesInsert<"perfil_sensorial">;

    const { error } = await supabase
      .from("perfil_sensorial")
      .upsert(payload, { onConflict: "familia_id" });

    setSaving(false);
    if (error) {
      toast.error("Erro ao salvar: " + error.message);
      return;
    }
    toast.success("Perfil TEA salvo!");
    setHasExisting(true);
    // Redireciona se veio com ?next
    const url = new URL(window.location.href);
    const next = url.searchParams.get("next");
    if (next && next.startsWith("/")) navigate({ to: next });
  }

  if (loading) {
    return (
      <div className="text-muted-foreground inline-flex items-center">
        <Loader2 className="h-4 w-4 animate-spin mr-2" /> Carregando…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-display font-bold text-primary">Perfil TEA</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Salvo uma vez, reaproveitado em todas as reservas. Edite quando algo mudar.
        </p>
      </header>

      <div className="bg-white border rounded-2xl p-6 space-y-5">
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
              max={30}
              value={draft.idade ?? ""}
              onChange={(e) => set("idade", e.target.value ? Number(e.target.value) : null)}
            />
          </Field>
          <Field label="Nível TEA" required>
            <select
              value={draft.nivel_tea ?? ""}
              onChange={(e) =>
                set("nivel_tea", (e.target.value || null) as Draft["nivel_tea"])
              }
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

        <div className="flex justify-end pt-2">
          <Button
            onClick={() => void onSave()}
            disabled={saving}
            className="bg-secondary hover:bg-secondary/90 text-white"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" /> Salvando…
              </>
            ) : hasExisting ? (
              "Salvar alterações"
            ) : (
              "Salvar Perfil TEA"
            )}
          </Button>
        </div>
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
