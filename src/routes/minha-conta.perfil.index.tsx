import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronRight, Plus } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { fetchPerfisCompletos, type PerfilSensorial } from "@/lib/queries";
import { BLOCOS } from "@/lib/perfil/blocos";
import { percentualPerfil, statusBloco } from "@/lib/perfil/tipos";
import { FotoAvatar } from "@/components/perfil/FotoAvatar";
import { SkeletonListaPerfis } from "@/components/perfil/Skeletons";

export const Route = createFileRoute("/minha-conta/perfil/")({
  component: ListaPerfisPage,
});

function ListaPerfisPage() {
  const { user } = useAuth();
  const [perfis, setPerfis] = useState<PerfilSensorial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let alive = true;
    fetchPerfisCompletos(user.id)
      .then((data) => {
        if (alive) setPerfis(data);
      })
      .catch((err: unknown) => {
        toast.error("Erro ao carregar perfis", {
          description: err instanceof Error ? err.message : undefined,
        });
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [user]);

  if (loading) return <SkeletonListaPerfis />;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-display font-bold text-primary">Perfis TEA</h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
          Um perfil para cada pessoa autista da família. Preenchido uma vez, ele é reaproveitado em
          todas as reservas — e o hotel só vê o que vocês autorizarem.
        </p>
      </header>

      {perfis.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed bg-white p-8 text-center">
          <h2 className="font-display font-bold text-primary text-lg">Vamos começar pelo básico</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
            São 6 perguntas, cerca de 2 minutos. Depois disso o perfil já funciona, e vocês
            completam o resto quando quiserem.
          </p>
          <Link
            to="/minha-conta/perfil/novo"
            className="mt-4 inline-flex items-center gap-1.5 bg-secondary hover:bg-secondary/90 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition"
          >
            <Plus className="h-4 w-4" /> Criar o primeiro perfil
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {perfis.map((p) => (
            <LinhaPerfil key={p.id} perfil={p} />
          ))}

          <Link
            to="/minha-conta/perfil/novo"
            className="w-full rounded-2xl border-2 border-dashed border-border hover:border-secondary/50 bg-white p-4 flex items-center gap-3 text-muted-foreground transition"
          >
            <span className="h-10 w-10 rounded-full bg-azul-claro grid place-items-center shrink-0">
              <Plus className="h-4 w-4 text-secondary" />
            </span>
            <span className="font-medium text-sm">Adicionar outra pessoa</span>
          </Link>
        </div>
      )}
    </div>
  );
}

function LinhaPerfil({ perfil }: { perfil: PerfilSensorial }) {
  const pct = percentualPerfil(BLOCOS, perfil);
  const completos = BLOCOS.filter((b) => statusBloco(b, perfil).completo).length;

  return (
    <Link
      to="/minha-conta/perfil/$perfilId"
      params={{ perfilId: perfil.id }}
      className="group rounded-2xl border bg-white p-4 flex items-center gap-4 hover:border-secondary/50 transition"
    >
      <FotoAvatar nome={perfil.nome_autista} fotoUrl={perfil.foto_url} tamanho="h-14 w-14" />

      <div className="flex-1 min-w-0">
        <h2 className="font-display font-bold text-primary truncate">{perfil.nome_autista}</h2>
        <p className="text-xs text-muted-foreground">
          {perfil.idade != null ? `${perfil.idade} anos` : "Idade não informada"}
          {perfil.nivel_tea ? ` · Nível ${perfil.nivel_tea}` : ""}
        </p>
        <div className="mt-2 flex items-center gap-2">
          <div className="h-1.5 w-28 bg-azul-claro rounded-full overflow-hidden">
            <div className="h-full bg-secondary" style={{ width: `${Math.max(pct, 2)}%` }} />
          </div>
          <span className="text-xs text-muted-foreground">
            {pct}% · {completos} de {BLOCOS.length} blocos
          </span>
        </div>
      </div>

      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 group-hover:translate-x-0.5 transition-transform" />
    </Link>
  );
}
