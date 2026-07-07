import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";
import { fetchEstabelecimentoAdminPorId } from "@/lib/queries";
import { ESTADOS_BR } from "@/lib/brazil";
import { normalizeFotos, normalizeUrl } from "@/lib/media";
import {
  ESTAB_TIPOS,
  ESTAB_STATUS,
  ESTAB_TIPO_LABEL,
  ESTAB_STATUS_LABEL,
  toEstabStatus,
  type EstabTipo,
  type EstabStatus,
} from "@/lib/enums";
import { SELO_BADGES, RECURSO_BADGES, Pill } from "@/components/Badges";
import { EstabAuditoriaList } from "@/components/admin/EstabAuditoriaList";
import { FotosGaleria } from "@/components/estabelecimento/FotosGaleria";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Eye,
  Loader2,
  MapPin,
  Save,
  Search,
  Star as StarIcon,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/estabelecimentos/$id")({
  component: AdminEstabelecimentoForm,
});

type EstabRow = Tables<"estabelecimentos">;
type EstabInsert = TablesInsert<"estabelecimentos">;
// Aliases locais - apontam para os enums centralizados em `@/lib/enums`.
type Tipo = EstabTipo;
type Status = EstabStatus;

const SELO_KEYS = ["selo_azul", "selo_governamental", "selo_privado"] as const;
const RECURSO_KEYS = [
  "tem_sala_sensorial",
  "tem_concierge_tea",
  "tem_checkin_antecipado",
  "tem_fila_prioritaria",
  "tem_cardapio_visual",
  "tem_caa",
] as const;

const formSchema = z.object({
  nome: z.string().trim().min(2, "Nome obrigatório").max(120),
  slug: z
    .string()
    .trim()
    .min(2, "Slug obrigatório")
    .max(120)
    .regex(/^[a-z0-9-]+$/, "Use apenas letras minúsculas, números e hífen"),
  tipo: z.enum(ESTAB_TIPOS),
  status: z.enum(ESTAB_STATUS),
  descricao: z.string().max(2000).optional().nullable(),
  descricao_tea: z.string().max(2000).optional().nullable(),
  cidade: z.string().max(120).optional().nullable(),
  estado: z.string().max(2).optional().nullable(),
  endereco: z.string().max(255).optional().nullable(),
  cep: z.string().max(20).optional().nullable(),
  telefone: z.string().max(40).optional().nullable(),
  email: z.string().email("E-mail inválido").max(255).optional().or(z.literal("")),
  website: z.string().url("URL inválida").max(255).optional().or(z.literal("")),
  tour_360_url: z.string().url("URL inválida").max(500).optional().or(z.literal("")),
  beneficio_tea_descricao: z.string().max(1000).optional().nullable(),
  selo_privado_nome: z.string().max(120).optional().nullable(),
  latitude: z.number().min(-90).max(90).nullable(),
  longitude: z.number().min(-180).max(180).nullable(),
});

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

/**
 * Migra o estado legado (`foto_capa` em campo separado) para a galeria
 * unificada onde **a primeira foto é sempre a capa**.
 *
 * - Se `foto_capa` já está presente em `fotos`, move para a posição 0.
 * - Se não está, adiciona no início.
 * - Se `foto_capa` é vazia, devolve `fotos` sem alterações.
 *
 * Resultado: array com 0+ URLs, capa em índice 0 quando houver imagens.
 */
function mergeCapaIntoFotos(capa: string | null | undefined, fotos: string[]): string[] {
  const c = (capa ?? "").trim();
  if (!c) return fotos;
  const rest = fotos.filter((f) => f !== c);
  return [c, ...rest];
}

interface FormState {
  nome: string;
  slug: string;
  tipo: Tipo;
  status: Status;
  descricao: string;
  descricao_tea: string;
  cidade: string;
  estado: string;
  endereco: string;
  cep: string;
  telefone: string;
  email: string;
  website: string;
  tour_360_url: string;
  beneficio_tea_descricao: string;
  selo_privado_nome: string;
  latitude: string;
  longitude: string;
  foto_capa: string;
  fotos: string[];
  destaque: boolean;
  tem_beneficio_tea: boolean;
  selo_azul: boolean;
  selo_governamental: boolean;
  selo_privado: boolean;
  tem_sala_sensorial: boolean;
  tem_concierge_tea: boolean;
  tem_checkin_antecipado: boolean;
  tem_fila_prioritaria: boolean;
  tem_cardapio_visual: boolean;
  tem_caa: boolean;
}

function emptyForm(): FormState {
  return {
    nome: "",
    slug: "",
    tipo: "hotel",
    status: "ativo",
    descricao: "",
    descricao_tea: "",
    cidade: "",
    estado: "",
    endereco: "",
    cep: "",
    telefone: "",
    email: "",
    website: "",
    tour_360_url: "",
    beneficio_tea_descricao: "",
    selo_privado_nome: "",
    latitude: "",
    longitude: "",
    foto_capa: "",
    fotos: [],
    destaque: false,
    tem_beneficio_tea: false,
    selo_azul: false,
    selo_governamental: false,
    selo_privado: false,
    tem_sala_sensorial: false,
    tem_concierge_tea: false,
    tem_checkin_antecipado: false,
    tem_fila_prioritaria: false,
    tem_cardapio_visual: false,
    tem_caa: false,
  };
}

function rowToForm(r: EstabRow): FormState {
  return {
    nome: r.nome ?? "",
    slug: r.slug ?? "",
    tipo: r.tipo,
    status: toEstabStatus(r.status, "ativo"),
    descricao: r.descricao ?? "",
    descricao_tea: r.descricao_tea ?? "",
    cidade: r.cidade ?? "",
    estado: r.estado ?? "",
    endereco: r.endereco ?? "",
    cep: r.cep ?? "",
    telefone: r.telefone ?? "",
    email: r.email ?? "",
    website: r.website ?? "",
    tour_360_url: normalizeUrl(r.tour_360_url) ?? "",
    beneficio_tea_descricao: r.beneficio_tea_descricao ?? "",
    selo_privado_nome: r.selo_privado_nome ?? "",
    latitude: r.latitude != null ? String(r.latitude) : "",
    longitude: r.longitude != null ? String(r.longitude) : "",
    foto_capa: normalizeUrl(r.foto_capa) ?? "",
    fotos: mergeCapaIntoFotos(normalizeUrl(r.foto_capa), normalizeFotos(r.fotos)),
    destaque: !!r.destaque,
    tem_beneficio_tea: !!r.tem_beneficio_tea,
    selo_azul: !!r.selo_azul,
    selo_governamental: !!r.selo_governamental,
    selo_privado: !!r.selo_privado,
    tem_sala_sensorial: !!r.tem_sala_sensorial,
    tem_concierge_tea: !!r.tem_concierge_tea,
    tem_checkin_antecipado: !!r.tem_checkin_antecipado,
    tem_fila_prioritaria: !!r.tem_fila_prioritaria,
    tem_cardapio_visual: !!r.tem_cardapio_visual,
    tem_caa: !!r.tem_caa,
  };
}

function AdminEstabelecimentoForm() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const isNew = id === "novo";

  const [form, setForm] = useState<FormState>(emptyForm);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [seloInteresse, setSeloInteresse] = useState<{
    quer: boolean;
    quando: string | null;
  } | null>(null);

  useEffect(() => {
    if (isNew) return;
    void (async () => {
      setLoading(true);
      try {
        const data = await fetchEstabelecimentoAdminPorId(id);
        if (!data) {
          toast.error("Estabelecimento não encontrado");
          navigate({ to: "/admin/estabelecimentos" });
          return;
        }
        setForm(rowToForm(data));
        setSeloInteresse({
          quer: !!data.quer_selo_azul,
          quando: data.quer_selo_azul_em ?? null,
        });
      } catch (err) {
        toast.error("Erro ao carregar", {
          description: err instanceof Error ? err.message : undefined,
        });
        navigate({ to: "/admin/estabelecimentos" });
        return;
      }
      setLoading(false);
    })();
  }, [id, isNew, navigate]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  // Slug é **derivado automaticamente** do nome - não há mais edição manual.
  // Travar a UI evita que admins criem variações conflitantes (ex.: "hotel-x"
  // vs "hotel-x-2") sem motivo. A unicidade real é garantida pelo índice
  // único no banco + auto-sufixo aplicado em `ensureUniqueSlug` no submit.
  const onNomeChange = (v: string) => {
    setForm((f) => ({ ...f, nome: v, slug: slugify(v) }));
  };

  /**
   * Garante slug único antes do save.
   *
   * Faz uma busca em `estabelecimentos` por slugs que comecem com `base` e,
   * caso o exato já exista (excluindo o próprio registro em edição),
   * incrementa um sufixo `-2`, `-3`, ... até encontrar o primeiro livre.
   *
   * Como a checagem é client-side **e** o índice único cobre o banco, a
   * pior corrida possível resulta em erro `23505` no insert/update - que
   * tratamos no `handleSubmit` mostrando uma mensagem clara.
   */
  const ensureUniqueSlug = async (base: string): Promise<string> => {
    if (!base) return base;
    const { data, error } = await supabase
      .from("estabelecimentos")
      .select("slug, id")
      .like("slug", `${base}%`);
    if (error) throw error;
    const taken = new Set(
      (data ?? []).filter((r) => (isNew ? true : r.id !== id)).map((r) => r.slug),
    );
    if (!taken.has(base)) return base;
    for (let i = 2; i < 1000; i++) {
      const candidate = `${base}-${i}`;
      if (!taken.has(candidate)) return candidate;
    }
    return `${base}-${Date.now()}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Slug é sempre derivado do nome no submit - protege contra estados
    // intermediários (ex.: form recém-carregado de um registro antigo cujo
    // slug não bate exatamente com `slugify(nome)`).
    const baseSlug = slugify(form.nome);
    let finalSlug = baseSlug;
    try {
      finalSlug = await ensureUniqueSlug(baseSlug);
    } catch (err) {
      toast.error("Não foi possível validar o slug", {
        description: err instanceof Error ? err.message : undefined,
      });
      return;
    }
    if (finalSlug !== form.slug) setForm((f) => ({ ...f, slug: finalSlug }));

    const parsed = formSchema.safeParse({
      nome: form.nome,
      slug: finalSlug,
      tipo: form.tipo,
      status: form.status,
      descricao: form.descricao || null,
      descricao_tea: form.descricao_tea || null,
      cidade: form.cidade || null,
      estado: form.estado || null,
      endereco: form.endereco || null,
      cep: form.cep || null,
      telefone: form.telefone || null,
      email: form.email,
      website: form.website,
      tour_360_url: form.tour_360_url,
      beneficio_tea_descricao: form.beneficio_tea_descricao || null,
      selo_privado_nome: form.selo_privado_nome || null,
      latitude: form.latitude.trim() === "" ? null : Number(form.latitude),
      longitude: form.longitude.trim() === "" ? null : Number(form.longitude),
    });

    if (!parsed.success) {
      const flat: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const k = issue.path[0];
        if (typeof k === "string" && !flat[k]) flat[k] = issue.message;
      }
      setErrors(flat);
      toast.error("Verifique os campos destacados");
      return;
    }

    const v = parsed.data;
    const payload: EstabInsert = {
      nome: v.nome,
      slug: v.slug,
      tipo: v.tipo,
      status: v.status,
      descricao: v.descricao,
      descricao_tea: v.descricao_tea,
      cidade: v.cidade,
      estado: v.estado,
      endereco: v.endereco,
      cep: v.cep,
      telefone: v.telefone,
      email: v.email || null,
      website: v.website || null,
      tour_360_url: v.tour_360_url || null,
      beneficio_tea_descricao: v.beneficio_tea_descricao,
      selo_privado_nome: v.selo_privado_nome,
      latitude: v.latitude,
      longitude: v.longitude,
      // Capa = primeira foto da galeria. Mantemos `foto_capa` no DB por
      // compatibilidade com cards/listagens que ainda leem o campo direto,
      // mas ele agora é **derivado** - nunca editado manualmente.
      foto_capa: form.fotos[0] ?? null,
      fotos: form.fotos,
      destaque: form.destaque,
      tem_beneficio_tea: form.tem_beneficio_tea,
      selo_azul: form.selo_azul,
      selo_governamental: form.selo_governamental,
      selo_privado: form.selo_privado,
      tem_sala_sensorial: form.tem_sala_sensorial,
      tem_concierge_tea: form.tem_concierge_tea,
      tem_checkin_antecipado: form.tem_checkin_antecipado,
      tem_fila_prioritaria: form.tem_fila_prioritaria,
      tem_cardapio_visual: form.tem_cardapio_visual,
      tem_caa: form.tem_caa,
    };

    setSaving(true);
    if (isNew) {
      const { data, error } = await supabase
        .from("estabelecimentos")
        .insert(payload)
        .select("id")
        .single();
      setSaving(false);
      if (error) {
        const msg =
          error.code === "23505"
            ? "Já existe um estabelecimento com este slug. Ajuste o nome e tente novamente."
            : error.message;
        toast.error("Erro ao criar", { description: msg });
        return;
      }
      toast.success("Estabelecimento criado");
      navigate({ to: "/admin/estabelecimentos/$id", params: { id: data.id } });
    } else {
      const { error } = await supabase.from("estabelecimentos").update(payload).eq("id", id);
      setSaving(false);
      if (error) {
        const msg =
          error.code === "23505"
            ? "Já existe um estabelecimento com este slug. Ajuste o nome e tente novamente."
            : error.message;
        toast.error("Erro ao salvar", { description: msg });
        return;
      }
      toast.success("Alterações salvas");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando...
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <header className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon" className="h-9 w-9">
            <Link to="/admin/estabelecimentos" aria-label="Voltar">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">
              {isNew ? "Novo estabelecimento" : form.nome || "Editar estabelecimento"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isNew ? "Preencha os dados abaixo" : `/${form.slug}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isNew && (
            <Button asChild type="button" variant="outline" className="gap-2">
              <Link to="/admin/estabelecimentos/$id/preview" params={{ id }}>
                <Eye className="h-4 w-4" /> Pré-visualizar
              </Link>
            </Button>
          )}
          <Button type="submit" disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isNew ? "Criar" : "Salvar"}
          </Button>
        </div>
      </header>

      {/* Dados básicos */}
      <Section title="Identificação">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Nome" error={errors.nome} required>
            <Input value={form.nome} onChange={(e) => onNomeChange(e.target.value)} />
          </Field>
          <Field
            label="Slug (gerado automaticamente)"
            error={errors.slug}
            hint="Derivado do nome - sufixo numérico é adicionado se houver conflito."
          >
            <Input
              value={form.slug}
              readOnly
              disabled
              className="font-mono text-sm bg-muted/40 cursor-not-allowed"
              aria-label="Slug gerado automaticamente"
            />
          </Field>
          <Field label="Tipo" required>
            <Select value={form.tipo} onValueChange={(v) => set("tipo", v as Tipo)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ESTAB_TIPOS.map((t) => (
                  <SelectItem key={t} value={t}>
                    {ESTAB_TIPO_LABEL[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Status" required>
            <Select
              value={form.status}
              onValueChange={(v) => set("status", toEstabStatus(v, "ativo"))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ESTAB_STATUS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {ESTAB_STATUS_LABEL[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
        <div className="grid sm:grid-cols-2 gap-4 mt-4">
          <Field label="Descrição">
            <Textarea
              rows={4}
              value={form.descricao}
              onChange={(e) => set("descricao", e.target.value)}
            />
          </Field>
          <Field label="Descrição TEA" hint="Como o local acolhe famílias do espectro">
            <Textarea
              rows={4}
              value={form.descricao_tea}
              onChange={(e) => set("descricao_tea", e.target.value)}
            />
          </Field>
        </div>
        <div className="mt-4 flex items-center gap-3 rounded-xl border bg-muted/30 px-3 py-2.5">
          <StarIcon className="h-4 w-4 text-amarelo" />
          <Label htmlFor="destaque" className="flex-1 cursor-pointer text-sm">
            Marcar como destaque na home
          </Label>
          <Switch
            id="destaque"
            checked={form.destaque}
            onCheckedChange={(v) => set("destaque", v)}
          />
        </div>
      </Section>

      {/* Contato & endereço */}
      <Section title="Contato e endereço">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Telefone">
            <Input value={form.telefone} onChange={(e) => set("telefone", e.target.value)} />
          </Field>
          <Field label="E-mail" error={errors.email}>
            <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
          </Field>
          <Field label="Website" error={errors.website}>
            <Input
              type="url"
              placeholder="https://..."
              value={form.website}
              onChange={(e) => set("website", e.target.value)}
            />
          </Field>
          <Field label="CEP">
            <Input value={form.cep} onChange={(e) => set("cep", e.target.value)} />
          </Field>
          <Field label="Endereço" className="sm:col-span-2">
            <Input value={form.endereco} onChange={(e) => set("endereco", e.target.value)} />
          </Field>
          <Field label="Cidade">
            <Input value={form.cidade} onChange={(e) => set("cidade", e.target.value)} />
          </Field>
          <Field label="Estado">
            <Select
              value={form.estado || "none"}
              onValueChange={(v) => set("estado", v === "none" ? "" : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">-</SelectItem>
                {ESTADOS_BR.map((e) => (
                  <SelectItem key={e.sigla} value={e.sigla}>
                    {e.sigla} - {e.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
      </Section>

      {/* Mapa */}
      <Section
        title="Localização no mapa"
        description="Use latitude e longitude para posicionar o pino no mapa público. Você pode buscar automaticamente pelo endereço."
      >
        <GeocodeButton
          endereco={form.endereco}
          cidade={form.cidade}
          estado={form.estado}
          cep={form.cep}
          onResult={(lat, lng) => {
            set("latitude", String(lat));
            set("longitude", String(lng));
          }}
        />
        <div className="grid sm:grid-cols-2 gap-4 mt-4">
          <Field label="Latitude" error={errors.latitude} hint="Ex: -22.9711">
            <Input
              inputMode="decimal"
              value={form.latitude}
              onChange={(e) => set("latitude", e.target.value)}
            />
          </Field>
          <Field label="Longitude" error={errors.longitude} hint="Ex: -43.1822">
            <Input
              inputMode="decimal"
              value={form.longitude}
              onChange={(e) => set("longitude", e.target.value)}
            />
          </Field>
        </div>
        <MapPreview lat={form.latitude} lng={form.longitude} />
      </Section>

      {/* Selos e Tour 360 */}
      <Section title="Selos e Tour 360°">
        <div className="grid sm:grid-cols-3 gap-3">
          {SELO_KEYS.map((k) => (
            <ToggleCard
              key={k}
              checked={form[k]}
              onChange={(v) => set(k, v)}
              badge={SELO_BADGES[k]}
            />
          ))}
        </div>
        {seloInteresse?.quer && (
          <div className="mt-4 rounded-xl border border-[#c9a84c]/40 bg-[#c9a84c]/10 px-4 py-3 text-sm">
            <div className="font-medium text-[#7a5c00]">
              ✨ Estabelecimento solicitou o Selo Azul
            </div>
            <div className="text-muted-foreground mt-1">
              Interesse declarado em{" "}
              {seloInteresse.quando
                ? new Date(seloInteresse.quando).toLocaleString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "data não registrada"}
            </div>
          </div>
        )}
        <div className="grid sm:grid-cols-2 gap-4 mt-4">
          <Field
            label="Nome do selo privado"
            hint="Visível somente se o selo privado estiver ativo"
          >
            <Input
              value={form.selo_privado_nome}
              onChange={(e) => set("selo_privado_nome", e.target.value)}
              disabled={!form.selo_privado}
            />
          </Field>
          <Field label="URL do Tour 360°" error={errors.tour_360_url}>
            <Input
              type="url"
              placeholder="https://..."
              value={form.tour_360_url}
              onChange={(e) => set("tour_360_url", e.target.value)}
            />
          </Field>
        </div>
      </Section>

      {/* Recursos TEA */}
      <Section
        title="Recursos TEA"
        description="Marque os recursos sensoriais e de acolhimento disponíveis no local."
      >
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {RECURSO_KEYS.map((k) => (
            <ToggleCard
              key={k}
              checked={form[k]}
              onChange={(v) => set(k, v)}
              badge={RECURSO_BADGES[k]}
            />
          ))}
        </div>
        <div className="mt-4 grid gap-4">
          <div className="flex items-center gap-3 rounded-xl border bg-muted/30 px-3 py-2.5">
            <Label htmlFor="ben_tea" className="flex-1 cursor-pointer text-sm">
              Oferece benefício / desconto TEA
            </Label>
            <Switch
              id="ben_tea"
              checked={form.tem_beneficio_tea}
              onCheckedChange={(v) => set("tem_beneficio_tea", v)}
            />
          </div>
          <Field label="Descrição do benefício TEA">
            <Textarea
              rows={3}
              value={form.beneficio_tea_descricao}
              onChange={(e) => set("beneficio_tea_descricao", e.target.value)}
              disabled={!form.tem_beneficio_tea}
              placeholder="Ex: 15% de desconto mediante laudo na recepção."
            />
          </Field>
        </div>
      </Section>

      {/* Fotos */}
      <Section
        title="Fotos"
        description="Arraste para reordenar. A primeira foto vira a capa automaticamente."
      >
        <FotosGaleria
          value={form.fotos}
          onChange={(v) => set("fotos", v)}
          bucket="estabelecimentos-fotos"
        />
      </Section>

      {/* Histórico de alterações - só faz sentido para registros existentes */}
      {!isNew && (
        <Section
          title="Histórico de alterações"
          description="Quem editou, quando e o que mudou. Atualizado automaticamente a cada alteração salva."
        >
          <EstabAuditoriaList estabelecimentoId={id} />
        </Section>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button asChild type="button" variant="ghost">
          <Link to="/admin/estabelecimentos">Cancelar</Link>
        </Button>
        <Button type="submit" disabled={saving} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {isNew ? "Criar" : "Salvar alterações"}
        </Button>
      </div>
    </form>
  );
}

/* ----------------- helpers ----------------- */

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-card border rounded-2xl p-5 sm:p-6">
      <header className="mb-4">
        <h2 className="text-lg font-display font-semibold text-foreground">{title}</h2>
        {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
      </header>
      {children}
    </section>
  );
}

function Field({
  label,
  hint,
  error,
  required,
  className,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <Label className="text-sm font-medium text-foreground/80">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

function ToggleCard({
  checked,
  onChange,
  badge,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  badge: { icon: React.ReactNode; label: string; className: string };
}) {
  return (
    <label
      className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-left transition cursor-pointer ${
        checked ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/40"
      }`}
    >
      <Pill icon={badge.icon} label={badge.label} className={badge.className} />
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  );
}

function MapPreview({ lat, lng }: { lat: string; lng: string }) {
  const latN = Number(lat);
  const lngN = Number(lng);
  const valid =
    lat.trim() !== "" &&
    lng.trim() !== "" &&
    Number.isFinite(latN) &&
    Number.isFinite(lngN) &&
    latN >= -90 &&
    latN <= 90 &&
    lngN >= -180 &&
    lngN <= 180;

  if (!valid) {
    return (
      <div className="mt-4 rounded-xl border border-dashed bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
        <MapPin className="mx-auto h-5 w-5 mb-1" />
        Informe latitude e longitude para visualizar o pino no mapa.
      </div>
    );
  }

  const delta = 0.01;
  const bbox = `${lngN - delta},${latN - delta},${lngN + delta},${latN + delta}`;
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${latN},${lngN}`;
  const linkOut = `https://www.openstreetmap.org/?mlat=${latN}&mlon=${lngN}#map=15/${latN}/${lngN}`;

  return (
    <div className="mt-4 space-y-2">
      <div className="rounded-xl overflow-hidden border aspect-[16/8] bg-muted">
        <iframe
          title="Pré-visualização do mapa"
          src={src}
          className="w-full h-full"
          loading="lazy"
        />
      </div>
      <a
        href={linkOut}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
      >
        <MapPin className="h-3 w-3" /> Abrir no OpenStreetMap
      </a>
    </div>
  );
}

/**
 * Botão de geocodificação que consulta a API pública do Nominatim
 * (OpenStreetMap) para converter endereço em latitude/longitude.
 *
 * - Não requer chave / configuração
 * - Monta uma query estruturada (rua, cidade, estado, país, CEP)
 * - Mostra mensagens via toast e desabilita o botão durante a busca
 */
function GeocodeButton({
  endereco,
  cidade,
  estado,
  cep,
  onResult,
}: {
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  onResult: (lat: number, lng: number) => void;
}) {
  const [loading, setLoading] = useState(false);

  const canSearch = endereco?.trim() || cidade?.trim() || cep?.trim() ? true : false;

  const handleSearch = async () => {
    if (!canSearch) {
      toast.error("Preencha pelo menos endereço, cidade ou CEP.");
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({
        format: "jsonv2",
        addressdetails: "0",
        limit: "1",
        countrycodes: "br",
      });
      if (endereco?.trim()) params.set("street", endereco.trim());
      if (cidade?.trim()) params.set("city", cidade.trim());
      if (estado?.trim()) params.set("state", estado.trim());
      if (cep?.trim()) params.set("postalcode", cep.trim());

      const url = `https://nominatim.openstreetmap.org/search?${params.toString()}`;
      const res = await fetch(url, {
        headers: { Accept: "application/json" },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as Array<{ lat: string; lon: string; display_name: string }>;
      if (!data.length) {
        toast.error("Endereço não encontrado. Tente refinar os campos.");
        return;
      }
      const lat = Number(data[0].lat);
      const lng = Number(data[0].lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        toast.error("Coordenadas inválidas retornadas pelo serviço.");
        return;
      }
      onResult(lat, lng);
      toast.success("Coordenadas encontradas! Confira o pino no mapa abaixo.");
    } catch (err) {
      console.error("[geocode] erro:", err);
      toast.error("Não foi possível buscar as coordenadas. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-start justify-between gap-3 rounded-xl border bg-muted/20 px-3 py-2.5">
      <div className="text-xs text-muted-foreground">
        Use os campos de endereço acima para buscar automaticamente a latitude e longitude. Depois
        confira o pino no mapa.
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleSearch}
        disabled={loading || !canSearch}
        className="gap-2 shrink-0"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
        Buscar coordenadas
      </Button>
    </div>
  );
}
