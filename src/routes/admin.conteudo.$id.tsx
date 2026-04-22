import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";
import {
  CONTEUDO_CATEGORIAS,
  CONTEUDO_CATEGORIA_LABEL,
  isConteudoCategoria,
  type ConteudoCategoria,
} from "@/lib/enums";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Loader2, Save, Upload, Eye } from "lucide-react";
import { toast } from "sonner";
// CATEGORIA_LABEL/CATEGORIAS importados de `@/lib/enums` no topo.

export const Route = createFileRoute("/admin/conteudo/$id")({
  component: AdminConteudoForm,
});

type ConteudoRow = Tables<"conteudo_tea">;
type ConteudoInsert = TablesInsert<"conteudo_tea">;

const BUCKET = "conteudo-capas";

const formSchema = z.object({
  titulo: z.string().trim().min(2, "Título obrigatório").max(200),
  slug: z
    .string()
    .trim()
    .min(2, "Slug obrigatório")
    .max(160)
    .regex(/^[a-z0-9-]+$/, "Use apenas letras minúsculas, números e hífen"),
  categoria: z.enum(CONTEUDO_CATEGORIAS).nullable(),
  autor: z.string().max(120).optional().nullable(),
  resumo: z.string().max(500).optional().nullable(),
  conteudo: z.string().max(50_000).optional().nullable(),
  foto_capa: z.string().url("URL inválida").max(500).optional().or(z.literal("")),
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

interface FormState {
  titulo: string;
  slug: string;
  categoria: ConteudoCategoria | "";
  autor: string;
  resumo: string;
  conteudo: string;
  foto_capa: string;
  publicado: boolean;
}

function emptyForm(): FormState {
  return {
    titulo: "",
    slug: "",
    categoria: "",
    autor: "",
    resumo: "",
    conteudo: "",
    foto_capa: "",
    publicado: false,
  };
}

function rowToForm(r: ConteudoRow): FormState {
  return {
    titulo: r.titulo ?? "",
    slug: r.slug ?? "",
    categoria: r.categoria ?? "",
    autor: r.autor ?? "",
    resumo: r.resumo ?? "",
    conteudo: r.conteudo ?? "",
    foto_capa: r.foto_capa ?? "",
    publicado: !!r.publicado,
  };
}

async function uploadCapa(file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

function AdminConteudoForm() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const isNew = id === "novo";

  const [form, setForm] = useState<FormState>(emptyForm);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const slugTouched = useRef(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isNew) return;
    void (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("conteudo_tea")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error || !data) {
        toast.error("Artigo não encontrado");
        navigate({ to: "/admin/conteudo" });
        return;
      }
      setForm(rowToForm(data));
      slugTouched.current = true;
      setLoading(false);
    })();
  }, [id, isNew, navigate]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const onTituloChange = (v: string) => {
    setForm((f) => ({
      ...f,
      titulo: v,
      slug: slugTouched.current ? f.slug : slugify(v),
    }));
  };

  const onFile = async (file: File) => {
    setUploading(true);
    try {
      const url = await uploadCapa(file);
      set("foto_capa", url);
      toast.success("Capa enviada");
    } catch (e) {
      toast.error("Falha no upload", {
        description: e instanceof Error ? e.message : undefined,
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const parsed = formSchema.safeParse({
      titulo: form.titulo,
      slug: form.slug,
      categoria: form.categoria || null,
      autor: form.autor || null,
      resumo: form.resumo || null,
      conteudo: form.conteudo || null,
      foto_capa: form.foto_capa,
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
    const payload: ConteudoInsert = {
      titulo: v.titulo,
      slug: v.slug,
      categoria: v.categoria,
      autor: v.autor,
      resumo: v.resumo,
      conteudo: v.conteudo,
      foto_capa: v.foto_capa || null,
      publicado: form.publicado,
    };

    setSaving(true);
    if (isNew) {
      const { data, error } = await supabase
        .from("conteudo_tea")
        .insert(payload)
        .select("id")
        .single();
      setSaving(false);
      if (error) {
        toast.error("Erro ao criar", { description: error.message });
        return;
      }
      toast.success("Artigo criado");
      navigate({ to: "/admin/conteudo/$id", params: { id: data.id } });
    } else {
      const { error } = await supabase.from("conteudo_tea").update(payload).eq("id", id);
      setSaving(false);
      if (error) {
        toast.error("Erro ao salvar", { description: error.message });
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
            <Link to="/admin/conteudo" aria-label="Voltar">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">
              {isNew ? "Novo artigo" : form.titulo || "Editar artigo"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isNew ? "Preencha os dados abaixo" : `/${form.slug}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isNew && form.publicado && (
            <Button asChild variant="outline" className="gap-2">
              <Link to="/conteudo/$slug" params={{ slug: form.slug }}>
                <Eye className="h-4 w-4" /> Ver no site
              </Link>
            </Button>
          )}
          <Button type="submit" disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isNew ? "Criar" : "Salvar"}
          </Button>
        </div>
      </header>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Conteúdo principal */}
        <div className="lg:col-span-2 space-y-6">
          <Section title="Conteúdo">
            <Field label="Título" error={errors.titulo} required>
              <Input value={form.titulo} onChange={(e) => onTituloChange(e.target.value)} />
            </Field>
            <Field
              label="Slug"
              error={errors.slug}
              required
              hint="Usado na URL pública: /conteudo/seu-slug"
              className="mt-4"
            >
              <Input
                value={form.slug}
                onChange={(e) => {
                  slugTouched.current = true;
                  set("slug", slugify(e.target.value));
                }}
              />
            </Field>
            <Field
              label="Resumo"
              error={errors.resumo}
              hint="Aparece em listagens e no preview de redes sociais"
              className="mt-4"
            >
              <Textarea
                rows={3}
                value={form.resumo}
                onChange={(e) => set("resumo", e.target.value)}
              />
            </Field>
            <Field
              label="Conteúdo"
              error={errors.conteudo}
              hint="Texto completo do artigo (Markdown ou HTML simples)"
              className="mt-4"
            >
              <Textarea
                rows={16}
                value={form.conteudo}
                onChange={(e) => set("conteudo", e.target.value)}
                className="font-mono text-sm"
              />
            </Field>
          </Section>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Section title="Publicação">
            <div className="flex items-center gap-3 rounded-xl border bg-muted/30 px-3 py-2.5">
              <div className="flex-1">
                <Label htmlFor="pub" className="cursor-pointer text-sm font-medium">
                  Publicado
                </Label>
                <p className="text-xs text-muted-foreground">
                  {form.publicado ? "Visível no site público" : "Apenas no painel admin"}
                </p>
              </div>
              <Switch
                id="pub"
                checked={form.publicado}
                onCheckedChange={(v) => set("publicado", v)}
              />
            </div>

            <Field label="Categoria" className="mt-4">
              <Select
                value={form.categoria || "none"}
                onValueChange={(v) =>
                  set("categoria", v === "none" ? "" : isConteudoCategoria(v) ? v : "")
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Sem categoria</SelectItem>
                  {CONTEUDO_CATEGORIAS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {CONTEUDO_CATEGORIA_LABEL[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Autor" className="mt-4">
              <Input
                value={form.autor}
                onChange={(e) => set("autor", e.target.value)}
                placeholder="Nome do autor"
              />
            </Field>
          </Section>

          <Section title="Foto de capa">
            <div className="space-y-3">
              <div className="aspect-[16/10] rounded-xl border bg-muted overflow-hidden flex items-center justify-center">
                {form.foto_capa ? (
                  <img src={form.foto_capa} alt="Capa" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs text-muted-foreground">Sem capa</span>
                )}
              </div>
              <Input
                placeholder="https://... (cole uma URL)"
                value={form.foto_capa}
                onChange={(e) => set("foto_capa", e.target.value)}
              />
              {errors.foto_capa && <p className="text-xs text-destructive">{errors.foto_capa}</p>}
              <div className="flex items-center gap-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void onFile(f);
                    e.target.value = "";
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="gap-2"
                >
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  Enviar imagem
                </Button>
                {form.foto_capa && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() => set("foto_capa", "")}
                  >
                    Remover
                  </Button>
                )}
              </div>
            </div>
          </Section>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button asChild type="button" variant="ghost">
          <Link to="/admin/conteudo">Cancelar</Link>
        </Button>
        <Button type="submit" disabled={saving} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {isNew ? "Criar artigo" : "Salvar alterações"}
        </Button>
      </div>
    </form>
  );
}

/* ---------------- helpers ---------------- */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-card border rounded-2xl p-5 sm:p-6">
      <h2 className="text-lg font-display font-semibold text-foreground mb-4">{title}</h2>
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
