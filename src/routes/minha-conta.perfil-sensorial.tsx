import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { TEA_NIVEIS, TEA_NIVEL_LABEL, type TeaNivel } from "@/lib/enums";

export const Route = createFileRoute("/minha-conta/perfil-sensorial")({
  component: PerfisPage,
});

interface Perfil {
  id: string;
  nome_autista: string;
  idade: number | null;
  nivel_tea: TeaNivel | null;
  precisa_sala_sensorial: boolean | null;
  precisa_checkin_antecipado: boolean | null;
  precisa_fila_prioritaria: boolean | null;
  precisa_cardapio_visual: boolean | null;
  precisa_concierge_tea: boolean | null;
  sensivel_sons: boolean | null;
  sensivel_luz: boolean | null;
}

function PerfisPage() {
  const { user } = useAuth();
  const [list, setList] = useState<Perfil[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [novoNome, setNovoNome] = useState("");
  const [novoNivel, setNovoNivel] = useState<TeaNivel>("leve");

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("perfil_sensorial")
      .select("*")
      .eq("familia_id", user.id)
      .order("criado_em");
    setList((data ?? []) as Perfil[]);
  };

  useEffect(() => {
    void load();
  }, [user]);

  const adicionar = async () => {
    if (!user || !novoNome) {
      toast.error("Informe o nome.");
      return;
    }
    const { error } = await supabase
      .from("perfil_sensorial")
      .insert({ familia_id: user.id, nome_autista: novoNome, nivel_tea: novoNivel });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Perfil adicionado!");
    setNovoNome("");
    setShowForm(false);
    void load();
  };

  const remover = async (id: string) => {
    if (!confirm("Remover este perfil?")) return;
    await supabase.from("perfil_sensorial").delete().eq("id", id);
    void load();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-primary">Perfis sensoriais</h1>
          <p className="text-sm text-muted-foreground">
            Cadastre o perfil de cada pessoa autista da família.
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} className="bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-1" /> Novo perfil
        </Button>
      </div>

      {showForm && (
        <div className="bg-card border rounded-2xl p-5 space-y-3">
          <h3 className="font-display font-semibold">Novo perfil</h3>
          <input
            value={novoNome}
            onChange={(e) => setNovoNome(e.target.value)}
            placeholder="Nome"
            className="w-full px-3 py-2 border rounded-md"
          />
          <select
            value={novoNivel}
            onChange={(e) => setNovoNivel(e.target.value as TeaNivel)}
            className="w-full px-3 py-2 border rounded-md"
          >
            {TEA_NIVEIS.map((n) => (
              <option key={n} value={n}>
                {TEA_NIVEL_LABEL[n]}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowForm(false)}>
              Cancelar
            </Button>
            <Button onClick={adicionar} className="bg-primary">
              Adicionar
            </Button>
          </div>
        </div>
      )}

      {list.length === 0 ? (
        <div className="bg-azul-claro rounded-2xl p-8 text-center text-muted-foreground">
          Nenhum perfil sensorial cadastrado ainda.
        </div>
      ) : (
        <div className="grid gap-3">
          {list.map((p) => (
            <div key={p.id} className="bg-card border rounded-2xl p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-display font-bold text-lg text-primary">{p.nome_autista}</h3>
                  <p className="text-sm text-muted-foreground">
                    {p.idade && `${p.idade} anos · `}TEA{" "}
                    {p.nivel_tea ? TEA_NIVEL_LABEL[p.nivel_tea] : "—"}
                  </p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => remover(p.id)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {p.precisa_sala_sensorial && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-roxo-suave text-roxo-suave-foreground font-medium">
                    Sala sensorial
                  </span>
                )}
                {p.precisa_concierge_tea && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground font-medium">
                    Concierge
                  </span>
                )}
                {p.precisa_checkin_antecipado && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-azul-claro text-primary font-medium">
                    Check-in antec.
                  </span>
                )}
                {p.precisa_fila_prioritaria && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-warning text-warning-foreground font-medium">
                    Fila prior.
                  </span>
                )}
                {p.precisa_cardapio_visual && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-azul-claro text-primary font-medium">
                    Cardápio visual
                  </span>
                )}
                {p.sensivel_sons && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-foreground font-medium">
                    Sensível a sons
                  </span>
                )}
                {p.sensivel_luz && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-foreground font-medium">
                    Sensível à luz
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
