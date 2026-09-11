import { useRef, useState } from "react";
import { ExternalLink, FileText, FileUp, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { uploadToBucket } from "@/lib/upload";
import { Button } from "@/components/ui/button";

const LIMITE_BYTES = 10 * 1024 * 1024;

export const BUCKET_DOCUMENTOS = "estabelecimentos-documentos";

interface DocumentoUploadProps {
  value: string;
  onChange: (url: string) => void;
  prefixo?: string;
  nomeDoDocumento: string;
}

export function DocumentoUpload({
  value,
  onChange,
  prefixo,
  nomeDoDocumento,
}: DocumentoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [enviando, setEnviando] = useState(false);
  const [arquivoSobre, setArquivoSobre] = useState(false);

  const enviar = async (file: File) => {
    if (file.type !== "application/pdf") {
      toast.error("Só aceitamos PDF aqui", {
        description: "Se o seu cardápio é uma imagem, exporte como PDF antes de enviar.",
      });
      return;
    }
    if (file.size > LIMITE_BYTES) {
      toast.error("Arquivo grande demais", {
        description: `O limite é 10 MB e este tem ${(file.size / 1024 / 1024).toFixed(1)} MB.`,
      });
      return;
    }

    setEnviando(true);
    try {
      const url = await uploadToBucket(BUCKET_DOCUMENTOS, file, prefixo, "pdf");
      onChange(url);
      toast.success("Documento enviado");
    } catch (e) {
      toast.error("Falha no envio", {
        description: e instanceof Error ? e.message : undefined,
      });
    } finally {
      setEnviando(false);
    }
  };

  if (value) {
    return (
      <div className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
          <FileText className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">{nomeDoDocumento}</p>
          <a
            href={value}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs font-medium text-secondary hover:underline"
          >
            Abrir PDF <ExternalLink className="h-3 w-3" />
          </a>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="shrink-0 text-muted-foreground hover:text-destructive"
          onClick={() => onChange("")}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Remover documento</span>
        </Button>
      </div>
    );
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setArquivoSobre(true);
      }}
      onDragLeave={() => setArquivoSobre(false)}
      onDrop={(e) => {
        e.preventDefault();
        setArquivoSobre(false);
        const f = e.dataTransfer.files?.[0];
        if (f) void enviar(f);
      }}
      className={cn(
        "rounded-xl border border-dashed px-4 py-6 text-center transition-colors",
        arquivoSobre ? "border-secondary bg-azul-claro/40" : "bg-muted/20",
      )}
    >
      <FileUp className="mx-auto h-5 w-5 text-muted-foreground" />
      <p className="mt-2 text-sm text-foreground/70">Arraste o PDF aqui ou</p>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-2 border-primary text-primary hover:bg-azul-claro"
        disabled={enviando}
        onClick={() => inputRef.current?.click()}
      >
        {enviando ? (
          <>
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Enviando…
          </>
        ) : (
          "Escolher arquivo"
        )}
      </Button>
      <p className="mt-2 text-xs text-muted-foreground">PDF, até 10 MB</p>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void enviar(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}
