import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { GripVertical, Loader2, Star as StarIcon, Upload, X } from "lucide-react";
import { toast } from "sonner";

async function uploadToBucket(bucket: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

interface FotosGaleriaProps {
  value: string[];
  onChange: (v: string[]) => void;
  bucket: string;
  permitirUrl?: boolean;
}

export function FotosGaleria({ value, onChange, bucket, permitirUrl = true }: FotosGaleriaProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [urlInput, setUrlInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

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
        const url = await uploadToBucket(bucket, f);
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

  const count = value.length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium text-foreground/80">
          Galeria{" "}
          <Badge variant="secondary" className="ml-1">
            {count}
          </Badge>
        </Label>
        {count > 1 && (
          <span className="text-[11px] text-muted-foreground">
            Arraste as fotos para reordenar - a primeira vira a capa.
          </span>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        {permitirUrl && (
          <>
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
          </>
        )}
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
        <Button
          type="button"
          variant={permitirUrl ? "outline" : "default"}
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className={cn("gap-2", !permitirUrl && "flex-1")}
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          Enviar
        </Button>
      </div>

      {count === 0 ? (
        <div className="rounded-xl border border-dashed bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
          Nenhuma foto na galeria. A primeira foto enviada será a capa.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {value.map((url, i) => {
            const isCapa = i === 0;
            const isDragging = dragIndex === i;
            const isOver = overIndex === i && dragIndex !== null && dragIndex !== i;
            return (
              <div
                key={`${url}-${i}`}
                draggable
                onDragStart={(e) => {
                  setDragIndex(i);
                  e.dataTransfer.effectAllowed = "move";
                  e.dataTransfer.setData("text/plain", String(i));
                }}
                onDragEnter={() => setOverIndex(i)}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                }}
                onDragLeave={() => setOverIndex((curr) => (curr === i ? null : curr))}
                onDrop={(e) => {
                  e.preventDefault();
                  if (dragIndex !== null) reorder(dragIndex, i);
                  setDragIndex(null);
                  setOverIndex(null);
                }}
                onDragEnd={() => {
                  setDragIndex(null);
                  setOverIndex(null);
                }}
                className={`relative group aspect-square rounded-xl overflow-hidden border bg-muted transition ${
                  isCapa ? "ring-2 ring-amarelo ring-offset-2 ring-offset-background" : ""
                } ${isDragging ? "opacity-40" : ""} ${isOver ? "scale-[1.02] border-primary" : ""}`}
              >
                <img
                  src={url}
                  alt={isCapa ? "Foto de capa" : `Foto ${i + 1}`}
                  className="w-full h-full object-cover pointer-events-none"
                />

                <div
                  className="absolute top-1.5 left-1.5 rounded-md bg-background/90 px-1 py-1 shadow-sm cursor-grab active:cursor-grabbing"
                  title="Arraste para reordenar"
                  aria-hidden
                >
                  <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
                </div>

                {isCapa && (
                  <div className="absolute bottom-1.5 left-1.5 inline-flex items-center gap-1 rounded-md bg-amarelo px-2 py-0.5 text-[10px] font-semibold text-amarelo-foreground shadow-sm">
                    <StarIcon className="h-3 w-3" /> CAPA
                  </div>
                )}

                <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                  {!isCapa && (
                    <button
                      type="button"
                      onClick={() => promoteToCapa(i)}
                      className="rounded-full bg-background/90 text-amarelo-foreground p-1 shadow-sm hover:bg-amarelo hover:text-amarelo-foreground"
                      aria-label="Tornar esta a foto de capa"
                      title="Tornar capa"
                    >
                      <StarIcon className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => removeAt(i)}
                    className="rounded-full bg-background/90 text-destructive p-1 shadow-sm hover:bg-destructive hover:text-destructive-foreground"
                    aria-label="Remover foto"
                    title="Remover"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
