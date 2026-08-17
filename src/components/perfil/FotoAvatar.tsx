import { cn } from "@/lib/utils";

/** Foto do perfil, com a inicial do nome como fallback. */
export function FotoAvatar({
  nome,
  fotoUrl,
  tamanho = "h-10 w-10",
}: {
  nome: string;
  fotoUrl: string | null | undefined;
  tamanho?: string;
}) {
  const inicial = nome.trim().charAt(0).toUpperCase() || "?";
  return (
    <div
      className={cn(
        tamanho,
        "rounded-full overflow-hidden bg-azul-claro grid place-items-center shrink-0 border border-border",
      )}
    >
      {fotoUrl ? (
        <img src={fotoUrl} alt={`Foto de ${nome}`} className="h-full w-full object-cover" />
      ) : (
        <span className="font-display font-bold text-primary">{inicial}</span>
      )}
    </div>
  );
}
