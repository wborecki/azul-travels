import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { GripVertical, ImagePlus, Loader2, Star as StarIcon, Upload, X } from "lucide-react";
import { toast } from "sonner";

async function uploadToBucket(bucket: string, file: File, prefixo?: string): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const nome = `${crypto.randomUUID()}.${ext}`;
  const path = prefixo ? `${prefixo}/${nome}` : nome;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/** Distingue arrastar arquivo de fora (upload) de arrastar foto da grade (reordenar). */
function ehArrastoDeArquivo(e: React.DragEvent): boolean {
  return Array.from(e.dataTransfer.types).includes("Files");
}

interface FotosGaleriaProps {
  value: string[];
  onChange: (v: string[]) => void;
  bucket: string;
  permitirUrl?: boolean;
  /**
   * Pasta dentro do bucket. Sem ela o upload vai para a raiz.
   *
   * O bucket `estabelecimentos-fotos` exige o prefixo: a policy só deixa o
   * dono escrever sob `<auth.uid()>/` (migration 20260804140000), justamente
   * para que um dono não alcance o arquivo de outro.
   */
  prefixo?: string;
}

export function FotosGaleria({
  value,
  onChange,
  bucket,
  permitirUrl = true,
  prefixo,
}: FotosGaleriaProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [urlInput, setUrlInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [arquivoSobre, setArquivoSobre] = useState(false);

  const addUrl = () => {
    const u = urlInput.trim();
    if (!u) return;
    onChange([...value, u]);
    setUrlInput("");
  };

  const onFiles = async (files: FileList) => {
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const f of Array.from(files)) {
        const url = await uploadToBucket(bucket, f, prefixo);
        urls.push(url);
      }
      onChange([...value, ...urls]);
      toast.success(`${urls.length} foto(s) adicionada(s)`);
    } catch (e) {
      toast.error("Falha no upload", {
        description: e instanceof Error ? e.message : undefined,
      });
    } finally {
      setUploading(false);
    }
  };

  const removeAt = (i: number) => onChange(value.filter((_, idx) => idx !== i));

  const reorder = (from: number, to: number) => {
    if (from === to || from < 0 || to < 0 || from >= value.length || to >= value.length) return;
    const next = value.slice();
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  };

  const promoteToCapa = (i: number) => {
    if (i === 0) return;
    reorder(i, 0);
    toast.success("Capa atualizada");
  };

  const abrirSeletor = () => inputRef.current?.click();

  /** Handlers de reordenação, compartilhados entre a capa e as miniaturas. */
  const dragProps = (i: number) => ({
    draggable: true,
    onDragStart: (e: React.DragEvent) => {
      setDragIndex(i);
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", String(i));
    },
    onDragEnter: () => {
      if (dragIndex !== null) setOverIndex(i);
    },
    onDragOver: (e: React.DragEvent) => {
      // Arquivo vindo de fora não é reordenação: deixa borbulhar para a
      // área externa, que trata o upload.
      if (ehArrastoDeArquivo(e)) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
    },
    onDragLeave: () => setOverIndex((curr) => (curr === i ? null : curr)),
    onDrop: (e: React.DragEvent) => {
      if (ehArrastoDeArquivo(e)) return;
      e.preventDefault();
      if (dragIndex !== null) reorder(dragIndex, i);
      setDragIndex(null);
      setOverIndex(null);
    },
    onDragEnd: () => {
      setDragIndex(null);
      setOverIndex(null);
    },
  });

  const estadoDaGrade = (i: number) => ({
    arrastando: dragIndex === i,
    alvo: overIndex === i && dragIndex !== null && dragIndex !== i,
  });

  const count = value.length;
  const capa = value[0];
  const resto = value.slice(1);

  return (
    <div
      className="space-y-3"
      onDragOver={(e) => {
        if (!ehArrastoDeArquivo(e)) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
        setArquivoSobre(true);
      }}
      onDragLeave={(e) => {
        if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
        setArquivoSobre(false);
      }}
      onDrop={(e) => {
        if (!ehArrastoDeArquivo(e)) return;
        e.preventDefault();
        setArquivoSobre(false);
        const fs = e.dataTransfer.files;
        if (fs && fs.length) void onFiles(fs);
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <Label className="text-sm font-medium text-foreground/80">
          Galeria{" "}
          <Badge variant="secondary" className="ml-1">
            {count}
          </Badge>
        </Label>
        {count > 1 && (
          <span className="text-[11px] text-muted-foreground text-right">
            Arraste para reordenar - solte sobre a capa para trocá-la.
          </span>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          const fs = e.target.files;
          if (fs && fs.length) void onFiles(fs);
          e.target.value = "";
        }}
      />

      {count === 0 ? (
        <button
          type="button"
          onClick={abrirSeletor}
          disabled={uploading}
          className={cn(
            "w-full rounded-2xl border-2 border-dashed bg-muted/20 px-6 py-12 text-center transition",
            "hover:border-primary/50 hover:bg-azul-claro/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
            arquivoSobre ? "border-primary bg-azul-claro/40" : "border-muted-foreground/25",
          )}
        >
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-azul-claro text-primary">
            {uploading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <ImagePlus className="h-5 w-5" />
            )}
          </span>
          <span className="mt-3 block text-sm font-medium text-foreground">
            {uploading ? "Enviando…" : "Arraste as fotos aqui ou clique para escolher"}
          </span>
          <span className="mt-1 block text-xs text-muted-foreground">
            JPG, PNG ou WEBP. A primeira foto vira a capa.
          </span>
        </button>
      ) : (
        <div className={cn("space-y-3", arquivoSobre && "rounded-2xl ring-2 ring-primary/40")}>
          <div
            {...dragProps(0)}
            className={cn(
              "group relative aspect-[16/10] sm:aspect-[21/9] overflow-hidden rounded-2xl border bg-muted transition",
              estadoDaGrade(0).arrastando && "opacity-40",
              estadoDaGrade(0).alvo && "border-primary ring-2 ring-primary/40",
            )}
          >
            <img
              src={capa}
              alt="Foto de capa"
              className="pointer-events-none h-full w-full object-cover"
            />

            <div
              className="absolute top-2 left-2 cursor-grab rounded-md bg-background/90 p-1 shadow-sm active:cursor-grabbing"
              title="Arraste para reordenar"
              aria-hidden
            >
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>

            <div className="absolute bottom-2 left-2 inline-flex items-center gap-1.5 rounded-lg bg-amarelo px-2.5 py-1 text-[11px] font-semibold text-amarelo-foreground shadow-sm">
              <StarIcon className="h-3.5 w-3.5" /> CAPA
            </div>

            <button
              type="button"
              onClick={() => removeAt(0)}
              className="absolute top-2 right-2 rounded-full bg-background/90 p-1.5 text-destructive opacity-0 shadow-sm transition hover:bg-destructive hover:text-destructive-foreground group-hover:opacity-100"
              aria-label="Remover foto de capa"
              title="Remover"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-3">
            {resto.map((url, idx) => {
              const i = idx + 1;
              const { arrastando, alvo } = estadoDaGrade(i);
              return (
                <div
                  key={`${url}-${i}`}
                  {...dragProps(i)}
                  className={cn(
                    "group relative aspect-square overflow-hidden rounded-xl border bg-muted transition",
                    arrastando && "opacity-40",
                    alvo && "border-primary ring-2 ring-primary/40",
                  )}
                >
                  <img
                    src={url}
                    alt={`Foto ${i + 1}`}
                    className="pointer-events-none h-full w-full object-cover"
                  />

                  <div
                    className="absolute top-1.5 left-1.5 cursor-grab rounded-md bg-background/90 p-1 shadow-sm active:cursor-grabbing"
                    title="Arraste para reordenar"
                    aria-hidden
                  >
                    <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>

                  <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 transition group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => promoteToCapa(i)}
                      className="rounded-full bg-background/90 p-1 text-amarelo-foreground shadow-sm hover:bg-amarelo"
                      aria-label="Tornar esta a foto de capa"
                      title="Tornar capa"
                    >
                      <StarIcon className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeAt(i)}
                      className="rounded-full bg-background/90 p-1 text-destructive shadow-sm hover:bg-destructive hover:text-destructive-foreground"
                      aria-label="Remover foto"
                      title="Remover"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}

            <button
              type="button"
              onClick={abrirSeletor}
              disabled={uploading}
              className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-muted-foreground/25 bg-muted/20 text-muted-foreground transition hover:border-primary/50 hover:bg-azul-claro/25 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              aria-label="Adicionar fotos"
            >
              {uploading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <ImagePlus className="h-5 w-5" />
              )}
              <span className="text-[11px] font-medium">
                {uploading ? "Enviando…" : "Adicionar"}
              </span>
            </button>
          </div>
        </div>
      )}

      {permitirUrl && (
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            placeholder="https://... (cole uma URL)"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addUrl();
              }
            }}
          />
          <Button type="button" variant="outline" onClick={addUrl}>
            Adicionar URL
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={abrirSeletor}
            disabled={uploading}
            className="gap-2"
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            Enviar
          </Button>
        </div>
      )}
    </div>
  );
}
