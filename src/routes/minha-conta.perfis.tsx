import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Plus, Pencil, Trash2, Compass } from "lucide-react";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";
import {
  PerfilSensorialForm,
  DEFAULT_PERFIL_DRAFT,
  perfilToDraft,
  RECURSO_KEYS_ORDENADAS,
  RECURSO_LABELS,
  type PerfilSensorialDraft,
  type PerfilBoolKey,
} from "@/components/PerfilSensorialForm";
import { TEA_NIVEL_LABEL } from "@/lib/enums";

export const Route = createFileRoute("/minha-conta/perfis")({
  component: PerfisPage,
});

type Perfil = Tables<"perfil_sensorial">;

function PerfisPage() {
  const { user } = useAuth();
  const [list, setList] = useState<Perfil[]>([]);
  const [loading, setLoading] = useState(false);
  const [editTarget, setEditTarget] = useState<Perfil | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [draft, setDraft] = useState<PerfilSensorialDraft>(DEFAULT_PERFIL_DRAFT);
  const [confirmDelete, setConfirmDelete] = useState<Perfil | null>(null);

  const load = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("perfil_sensorial")
      .select("*")
      .eq("familia_id", user.id)
      .order("criado_em", { ascending: true });
    if (error) {
      toast.error("Erro ao carregar perfis", { description: error.message });
      return;
    }
    setList(data ?? []);
  };

  useEffect(() => {
    void load();
  }, [user]);

  const abrirCriar = () => {
    setDraft(DEFAULT_PERFIL_DRAFT);
    setShowCreate(true);
  };
  const abrirEditar = (p: Perfil) => {
    setDraft(perfilToDraft(p));
    setEditTarget(p);
  };

  const salvarNovo = async () => {
    if (!user) return;
    setLoading(true);
    const { error } = await supabase
      .from("perfil_sensorial")
      .insert({ ...draft, familia_id: user.id });
    setLoading(false);
    if (error) {
      toast.error("Não foi possível adicionar.", { description: error.message });
      return;
    }
    toast.success(`Perfil de ${draft.nome_autista} adicionado.`);
    setShowCreate(false);
    await load();
  };

  const salvarEdicao = async () => {
    if (!editTarget) return;
    setLoading(true);
    const { error } = await supabase
      .from("perfil_sensorial")
      .update(draft)
      .eq("id", editTarget.id);
    setLoading(false);
    if (error) {
      toast.error("Não foi possível salvar.", { description: error.message });
      return;
    }
    toast.success(`Perfil do ${draft.nome_autista} atualizado.`);
    setEditTarget(null);
    await load();
  };

  const excluir = async () => {
    if (!confirmDelete) return;
    const { error } = await supabase
      .from("perfil_sensorial")
      .delete()
      .eq("id", confirmDelete.id);
    if (error) {
      toast.error("Não foi possível excluir.", { description: error.message });
      return;
    }
    toast.success("Perfil excluído.");
    setConfirmDelete(null);
    await load();
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold text-primary">Perfis sensoriais</h1>
          <p className="text-sm text-muted-foreground">
            Cada filho pode ter o seu próprio perfil.
          </p>
        </div>
        <Button onClick={abrirCriar} className="bg-secondary hover:bg-secondary/90">
          <Plus className="h-4 w-4 mr-1" /> Adicionar outro filho
        </Button>
      </div>

      {list.length === 0 ? (
        <div className="bg-azul-claro rounded-2xl p-8 text-center">
          <p className="text-muted-foreground mb-3">Nenhum perfil cadastrado ainda.</p>
          <Button onClick={abrirCriar} className="bg-secondary hover:bg-secondary/90">
            <Plus className="h-4 w-4 mr-1" /> Criar primeiro perfil
          </Button>
        </div>
      ) : (
        <div className="grid gap-3">
          {list.map((p) => (
            <PerfilRow
              key={p.id}
              perfil={p}
              onEditar={() => abrirEditar(p)}
              onExcluir={() => setConfirmDelete(p)}
            />
          ))}
        </div>
      )}

      {/* Modal criar */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-primary">Adicionar filho</DialogTitle>
            <DialogDescription>
              Preencha as informações abaixo. Você pode editar depois.
            </DialogDescription>
          </DialogHeader>
          <PerfilSensorialForm
            draft={draft}
            onChange={setDraft}
            onSubmit={salvarNovo}
            onCancel={() => setShowCreate(false)}
            submitLabel="Adicionar perfil"
            loading={loading}
            compact
          />
        </DialogContent>
      </Dialog>

      {/* Modal editar */}
      <Dialog open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-primary">
              Editar perfil de {editTarget?.nome_autista}
            </DialogTitle>
            <DialogDescription>Atualize as informações deste perfil.</DialogDescription>
          </DialogHeader>
          <PerfilSensorialForm
            draft={draft}
            onChange={setDraft}
            onSubmit={salvarEdicao}
            onCancel={() => setEditTarget(null)}
            submitLabel="Salvar alterações"
            loading={loading}
            compact
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir perfil de {confirmDelete?.nome_autista}?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. As reservas vinculadas a este perfil permanecerão,
              mas sem referência sensorial.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={excluir}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function PerfilRow({
  perfil,
  onEditar,
  onExcluir,
}: {
  perfil: Perfil;
  onEditar: () => void;
  onExcluir: () => void;
}) {
  const ativos = RECURSO_KEYS_ORDENADAS.filter((k) => perfil[k] === true);
  const nivelTxt = perfil.nivel_tea ? `Nível ${TEA_NIVEL_LABEL[perfil.nivel_tea]}` : null;

  return (
    <div className="bg-card border rounded-2xl p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-display font-bold text-lg text-primary">{perfil.nome_autista}</h3>
          <p className="text-xs text-muted-foreground">
            {perfil.idade ? `${perfil.idade} anos` : "Idade não informada"}
            {nivelTxt ? ` · ${nivelTxt}` : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={onEditar}>
            <Pencil className="h-3.5 w-3.5 mr-1" /> Editar
          </Button>
          <Button asChild size="sm" className="bg-secondary hover:bg-secondary/90">
            <Link to="/explorar" search={{ perfil: perfil.id } as never}>
              <Compass className="h-3.5 w-3.5 mr-1" /> Explorar destinos pra ele
            </Link>
          </Button>
        </div>
      </div>
      {ativos.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {ativos.map((k) => (
            <span
              key={k}
              className="text-xs px-2 py-0.5 rounded-full bg-azul-claro text-primary font-medium"
            >
              {RECURSO_LABELS[k as PerfilBoolKey]}
            </span>
          ))}
        </div>
      )}
      <button
        type="button"
        onClick={onExcluir}
        className="mt-3 text-xs text-destructive hover:underline inline-flex items-center gap-1"
      >
        <Trash2 className="h-3 w-3" /> Excluir perfil
      </button>
    </div>
  );
}
