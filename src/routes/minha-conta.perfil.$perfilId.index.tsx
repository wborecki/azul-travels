import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Camera, Eye, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
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
import {
  atualizarPerfilSensorial,
  excluirPerfilSensorial,
  fetchPerfilPorId,
  uploadFotoPerfil,
  type PerfilSensorial,
} from "@/lib/queries";
import { BLOCOS } from "@/lib/perfil/blocos";
import { percentualPerfil, statusBloco } from "@/lib/perfil/tipos";
import { CardBloco } from "@/components/perfil/CardBloco";
import { FotoAvatar } from "@/components/perfil/FotoAvatar";
import { ProgressoPerfil } from "@/components/perfil/ProgressoPerfil";
import { SkeletonHubPerfil } from "@/components/perfil/Skeletons";

export const Route = createFileRoute("/minha-conta/perfil/$perfilId/")({
  component: HubPerfilPage,
});

function HubPerfilPage() {
  const { perfilId } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [perfil, setPerfil] = useState<PerfilSensorial | null>(null);
  const [loading, setLoading] = useState(true);
  const [enviandoFoto, setEnviandoFoto] = useState(false);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);
  const fotoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let alive = true;
    fetchPerfilPorId(perfilId)
      .then((p) => {
        if (alive) setPerfil(p);
      })
      .catch((err: unknown) => {
        toast.error("Erro ao carregar o perfil", {
          description: err instanceof Error ? err.message : undefined,
        });
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [perfilId]);

  async function trocarFoto(file: File) {
    if (!user || !perfil) return;
    setEnviandoFoto(true);
    try {
      const url = await uploadFotoPerfil(user.id, file);
      const atualizado = await atualizarPerfilSensorial(perfil.id, { foto_url: url });
      setPerfil(atualizado);
      toast.success("Foto atualizada!");
    } catch (err) {
      toast.error("Erro ao enviar a foto", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setEnviandoFoto(false);
    }
  }

  async function excluir() {
    if (!perfil) return;
    try {
      await excluirPerfilSensorial(perfil.id);
      toast.success("Perfil excluído.");
      await navigate({ to: "/minha-conta/perfil" });
    } catch (err) {
      toast.error("Erro ao excluir o perfil", {
        description: err instanceof Error ? err.message : undefined,
      });
      setConfirmandoExclusao(false);
    }
  }

  if (loading) return <SkeletonHubPerfil blocos={BLOCOS.length} />;

  if (!perfil) {
    return (
      <div className="space-y-3">
        <p className="text-muted-foreground">Perfil não encontrado.</p>
        <Link to="/minha-conta/perfil" className="text-secondary hover:underline text-sm">
          Voltar para os Perfis TEA
        </Link>
      </div>
    );
  }

  const status = BLOCOS.map((b) => ({ bloco: b, s: statusBloco(b, perfil) }));
  const pct = percentualPerfil(BLOCOS, perfil);
  const completos = status.filter((x) => x.s.completo).length;
  // O "próximo" é o bloco incompleto de maior peso, não o próximo da lista.
  const proximo = status.filter((x) => !x.s.completo).sort((a, b) => b.bloco.peso - a.bloco.peso)[0]
    ?.bloco.id;

  return (
    <div className="space-y-6">
      <Link
        to="/minha-conta/perfil"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" /> Perfis TEA
      </Link>

      <header className="flex items-center gap-4">
        <FotoAvatar nome={perfil.nome_autista} fotoUrl={perfil.foto_url} tamanho="h-20 w-20" />
        <div className="min-w-0">
          <h1 className="text-3xl font-display font-bold text-primary truncate">
            {perfil.nome_autista}
          </h1>
          <p className="text-sm text-muted-foreground">
            {perfil.idade != null ? `${perfil.idade} anos` : "Idade não informada"}
            {perfil.nivel_tea ? ` · Nível ${perfil.nivel_tea}` : ""}
          </p>
          <input
            ref={fotoInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void trocarFoto(file);
              e.target.value = "";
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-2"
            disabled={enviandoFoto}
            onClick={() => fotoInputRef.current?.click()}
          >
            {enviandoFoto ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> Enviando…
              </>
            ) : (
              <>
                <Camera className="h-4 w-4 mr-1.5" />
                {perfil.foto_url ? "Trocar foto" : "Adicionar foto"}
              </>
            )}
          </Button>
        </div>
      </header>

      <ProgressoPerfil
        pct={pct}
        nome={perfil.nome_autista}
        blocosCompletos={completos}
        blocosTotal={BLOCOS.length}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        {status.map(({ bloco, s }) => (
          <CardBloco
            key={bloco.id}
            bloco={bloco}
            status={s}
            perfilId={perfil.id}
            destaque={bloco.id === proximo}
          />
        ))}
      </div>

      <div className="flex items-center justify-between gap-2 flex-wrap pt-2">
        <Link
          to="/minha-conta/perfil/$perfilId/revisao"
          params={{ perfilId: perfil.id }}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-secondary hover:underline"
        >
          <Eye className="h-4 w-4" /> Ver o que o hotel vai receber
        </Link>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={() => setConfirmandoExclusao(true)}
        >
          <Trash2 className="h-4 w-4 mr-1.5" /> Excluir perfil
        </Button>
      </div>

      <AlertDialog open={confirmandoExclusao} onOpenChange={setConfirmandoExclusao}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir o perfil de {perfil.nome_autista}?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita. O perfil deixa de aparecer nas próximas reservas — as
              já enviadas não mudam.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => void excluir()}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
