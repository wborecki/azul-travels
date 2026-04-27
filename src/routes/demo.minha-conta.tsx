import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  DEMO_PERFIL_SENSORIAL,
  DEMO_ESTABELECIMENTOS,
} from "@/data/demo";
import { DemoBreadcrumb } from "@/components/demo/DemoBreadcrumb";
import { Button } from "@/components/ui/button";
import { Heart, Calendar, CheckCircle2, Pencil } from "lucide-react";

export const Route = createFileRoute("/demo/minha-conta")({
  component: DemoMinhaConta,
});

const PERFIL_CHIPS: Array<{ key: keyof typeof DEMO_PERFIL_SENSORIAL; label: string }> = [
  { key: "sensivel_sons", label: "Sensível a sons" },
  { key: "sensivel_luz", label: "Sensível a luz" },
  { key: "sensivel_texturas", label: "Sensível a texturas" },
  { key: "sensivel_cheiros", label: "Sensível a cheiros" },
  { key: "sensivel_multidao", label: "Sensível a multidão" },
  { key: "comunicacao_verbal", label: "Comunicação verbal" },
  { key: "usa_caa", label: "Usa CAA" },
  { key: "precisa_sala_sensorial", label: "Precisa de sala sensorial" },
  { key: "precisa_checkin_antecipado", label: "Precisa de check-in antecipado" },
  { key: "precisa_fila_prioritaria", label: "Precisa de fila prioritária" },
  { key: "precisa_cardapio_visual", label: "Precisa de cardápio visual" },
  { key: "precisa_concierge_tea", label: "Precisa de concierge TEA" },
  { key: "gosta_atividades_agua", label: "Gosta de água" },
  { key: "gosta_natureza", label: "Gosta de natureza" },
  { key: "gosta_animais", label: "Gosta de animais" },
];

function DemoMinhaConta() {
  const [editando, setEditando] = useState(false);
  const reservaEstab = DEMO_ESTABELECIMENTOS[0];

  return (
    <div className="min-h-screen bg-azul-claro pb-16">
      <DemoBreadcrumb items={[{ label: "Minha conta" }]} />

      <div className="container mx-auto px-4">
        <h1 className="text-2xl md:text-3xl font-display font-bold text-primary">
          Olá, Mariana! 👋
        </h1>
        <p className="mt-1 text-muted-foreground">
          Bem-vinda de volta. Esta é uma demonstração da sua área pessoal.
        </p>

        <div className="grid lg:grid-cols-2 gap-6 mt-8">
          {/* PERFIL SENSORIAL */}
          <section className="bg-card rounded-2xl border p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary/10 text-secondary flex items-center justify-center">
                  <Heart className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-display font-bold text-primary">
                    Perfil sensorial — {DEMO_PERFIL_SENSORIAL.nome_autista}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {DEMO_PERFIL_SENSORIAL.idade} anos · TEA{" "}
                    {DEMO_PERFIL_SENSORIAL.nivel_tea}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditando((v) => !v);
                  if (!editando)
                    toast.info(
                      "Esta é apenas uma demonstração — alterações não são salvas.",
                    );
                }}
              >
                <Pencil className="h-3.5 w-3.5 mr-1" />
                {editando ? "Fechar" : "Editar perfil"}
              </Button>
            </div>

            {!editando ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {PERFIL_CHIPS.filter((c) => DEMO_PERFIL_SENSORIAL[c.key]).map(
                  (c) => (
                    <span
                      key={c.key as string}
                      className="text-xs font-medium bg-secondary/10 text-secondary rounded-full px-3 py-1"
                    >
                      {c.label}
                    </span>
                  ),
                )}
              </div>
            ) : (
              <div className="mt-4 grid sm:grid-cols-2 gap-2">
                {PERFIL_CHIPS.map((c) => (
                  <label
                    key={c.key as string}
                    className="flex items-center gap-2 text-sm bg-azul-claro p-2 rounded-lg"
                  >
                    <input
                      type="checkbox"
                      defaultChecked={Boolean(DEMO_PERFIL_SENSORIAL[c.key])}
                    />
                    {c.label}
                  </label>
                ))}
              </div>
            )}
          </section>

          {/* RESERVA */}
          <section className="bg-card rounded-2xl border p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <Calendar className="h-5 w-5" />
              </div>
              <h2 className="font-display font-bold text-primary">
                Minhas reservas
              </h2>
            </div>

            <div className="mt-4 border rounded-xl overflow-hidden">
              <Link
                to="/demo/estabelecimento/$slug"
                params={{ slug: reservaEstab.slug }}
                className="flex gap-3 hover:bg-azul-claro/50 transition"
              >
                <img
                  src={reservaEstab.foto_capa}
                  alt={reservaEstab.nome}
                  className="w-24 h-24 object-cover"
                />
                <div className="flex-1 p-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <h3 className="font-semibold text-primary">
                      {reservaEstab.nome}
                    </h3>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
                      <CheckCircle2 className="h-3 w-3" /> Confirmada
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    15 a 18 de maio de 2026
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Perfil sensorial enviado ao estabelecimento ✓
                  </p>
                </div>
              </Link>
            </div>

            <p className="mt-4 text-xs text-muted-foreground">
              Esta reserva é apenas um exemplo da demonstração.
            </p>
          </section>
        </div>

        {/* CTA REAL */}
        <div className="mt-10 bg-primary text-white rounded-2xl p-6 text-center">
          <h3 className="font-display font-bold text-xl">
            Esta é apenas uma demonstração
          </h3>
          <p className="mt-2 text-white/85 text-sm max-w-2xl mx-auto">
            Crie sua conta de verdade e seja uma das primeiras famílias a usar
            o Turismo Azul quando lançarmos.
          </p>
          <Button
            asChild
            className="mt-4 bg-amarelo text-primary hover:bg-amarelo/90 font-semibold"
          >
            <Link to="/familias">Quero me cadastrar de verdade</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
