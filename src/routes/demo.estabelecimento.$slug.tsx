import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  DEMO_ESTABELECIMENTOS,
  DEMO_AVALIACOES,
  DEMO_PERFIL_SENSORIAL,
  TIPO_LABEL,
} from "@/data/demo";
import { DemoBreadcrumb } from "@/components/demo/DemoBreadcrumb";
import { Button } from "@/components/ui/button";
import {
  Star,
  MapPin,
  Box,
  Award,
  ShieldCheck,
  Sparkles,
  X,
  Check,
} from "lucide-react";

export const Route = createFileRoute("/demo/estabelecimento/$slug")({
  component: DemoDetalhe,
  loader: ({ params }) => {
    const estab = DEMO_ESTABELECIMENTOS.find((e) => e.slug === params.slug);
    if (!estab) throw notFound();
    return { estab };
  },
  notFoundComponent: () => (
    <div className="container mx-auto px-4 py-20 text-center">
      <h1 className="text-2xl font-display font-bold text-primary">
        Estabelecimento de demonstração não encontrado
      </h1>
      <Link
        to="/demo/explorar"
        className="mt-4 inline-block text-secondary underline"
      >
        Voltar para explorar
      </Link>
    </div>
  ),
});

const RECURSOS_LABEL: Array<{ key: keyof typeof DEMO_ESTABELECIMENTOS[number]; label: string }> = [
  { key: "tem_sala_sensorial", label: "Sala sensorial" },
  { key: "tem_concierge_tea", label: "Concierge TEA" },
  { key: "tem_checkin_antecipado", label: "Check-in antecipado" },
  { key: "tem_fila_prioritaria", label: "Fila prioritária" },
  { key: "tem_cardapio_visual", label: "Cardápio visual" },
  { key: "tem_caa", label: "CAA (Comunicação Alternativa)" },
];

function DemoDetalhe() {
  const { estab } = Route.useLoaderData();
  const avaliacoes = DEMO_AVALIACOES.filter(
    (a) => a.estabelecimento_id === estab.id,
  );
  const [tour, setTour] = useState(false);
  const [enviado, setEnviado] = useState(false);

  function enviar() {
    setEnviado(true);
    toast.success("Reserva de demonstração enviada!", {
      description: `Na plataforma real, ${estab.nome} receberia o perfil sensorial do ${DEMO_PERFIL_SENSORIAL.nome_autista} e retornaria em até 48h.`,
    });
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <DemoBreadcrumb
        items={[
          { label: "Explorar", to: "/demo/explorar" },
          { label: estab.nome },
        ]}
      />

      {/* GALERIA */}
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-3">
          <div className="md:col-span-2 aspect-[16/9] rounded-2xl overflow-hidden bg-azul-claro">
            <img
              src={estab.foto_capa}
              alt={estab.nome}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="grid grid-rows-2 gap-3">
            {(estab.fotos.length > 0 ? estab.fotos : [estab.foto_capa])
              .slice(0, 2)
              .map((src, i) => (
                <div
                  key={i}
                  className="aspect-video rounded-2xl overflow-hidden bg-azul-claro"
                >
                  <img
                    src={src}
                    alt={`${estab.nome} ${i + 2}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 mt-8 grid lg:grid-cols-[1fr_380px] gap-8">
        <div>
          {/* CABEÇALHO */}
          <div className="flex flex-wrap gap-2 mb-3">
            {estab.selo_azul && (
              <span className="text-xs font-semibold bg-primary text-primary-foreground rounded-full px-3 py-1 inline-flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5" /> Selo Azul
              </span>
            )}
            {estab.tour_360_url && (
              <span className="text-xs font-semibold bg-secondary text-secondary-foreground rounded-full px-3 py-1 inline-flex items-center gap-1">
                <Box className="h-3.5 w-3.5" /> Tour 360°
              </span>
            )}
            {estab.tem_beneficio_tea && (
              <span className="text-xs font-semibold bg-amber-500 text-white rounded-full px-3 py-1 inline-flex items-center gap-1">
                <Award className="h-3.5 w-3.5" /> Benefício TEA
              </span>
            )}
          </div>

          <h1 className="text-3xl md:text-4xl font-display font-bold text-primary">
            {estab.nome}
          </h1>
          <p className="mt-2 text-muted-foreground flex items-center gap-2">
            <span className="font-medium">{TIPO_LABEL[estab.tipo]}</span>
            <span>·</span>
            <MapPin className="h-4 w-4" /> {estab.cidade}, {estab.estado}
            <span>·</span>
            <Star className="h-4 w-4 fill-amarelo text-amarelo" />
            <span className="font-semibold text-foreground">
              {estab.nota_media.toFixed(1)}
            </span>
            <span>({estab.total_avaliacoes} avaliações)</span>
          </p>

          {estab.tour_360_url && (
            <Button
              onClick={() => setTour(true)}
              className="mt-5 bg-secondary hover:bg-secondary/90 text-white"
            >
              <Box className="mr-2 h-4 w-4" /> Abrir Tour 360°
            </Button>
          )}

          <p className="mt-6 text-foreground leading-relaxed">
            {estab.descricao}
          </p>

          {/* SOBRE TEA */}
          <section className="mt-10">
            <h2 className="text-xl font-display font-bold text-primary mb-3 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-secondary" /> Como cuidamos de
              famílias TEA
            </h2>
            <p className="text-foreground leading-relaxed bg-azul-claro p-5 rounded-2xl border">
              {estab.descricao_tea}
            </p>
          </section>

          {/* RECURSOS */}
          <section className="mt-10">
            <h2 className="text-xl font-display font-bold text-primary mb-4">
              Recursos disponíveis
            </h2>
            <div className="grid sm:grid-cols-2 gap-2">
              {RECURSOS_LABEL.map((r) => {
                const tem = Boolean(estab[r.key]);
                return (
                  <div
                    key={r.key as string}
                    className={`flex items-center gap-2 p-3 rounded-lg border ${
                      tem
                        ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                        : "bg-gray-50 border-gray-200 text-gray-400"
                    }`}
                  >
                    {tem ? (
                      <Check className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <X className="h-4 w-4" />
                    )}
                    <span className="text-sm font-medium">{r.label}</span>
                  </div>
                );
              })}
            </div>
          </section>

          {estab.tem_beneficio_tea && estab.beneficio_tea_descricao && (
            <section className="mt-10 bg-amber-50 border border-amber-200 rounded-2xl p-5">
              <h2 className="text-lg font-display font-bold text-amber-900 mb-1 flex items-center gap-2">
                <Award className="h-5 w-5" /> Benefício TEA
              </h2>
              <p className="text-amber-900 text-sm">
                {estab.beneficio_tea_descricao}
              </p>
            </section>
          )}

          {/* AVALIAÇÕES */}
          <section className="mt-10">
            <h2 className="text-xl font-display font-bold text-primary mb-4">
              Avaliações de famílias TEA
            </h2>
            {avaliacoes.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Ainda sem avaliações para este estabelecimento.
              </p>
            ) : (
              <div className="space-y-4">
                {avaliacoes.map((a) => (
                  <div
                    key={a.id}
                    className="bg-card border rounded-2xl p-5 shadow-sm"
                  >
                    <div className="flex items-center gap-1 text-amarelo mb-2">
                      {Array.from({ length: a.nota_geral }).map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-amarelo" />
                      ))}
                    </div>
                    <p className="italic text-foreground leading-relaxed">
                      “{a.comentario}”
                    </p>
                    <p className="mt-3 text-sm font-semibold text-primary">
                      {a.nome_responsavel}{" "}
                      <span className="text-muted-foreground font-normal">
                        · {a.cidade}
                      </span>
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* RESERVA */}
        <aside className="lg:sticky lg:top-28 h-fit">
          <div className="bg-card border rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-display font-bold text-primary">
              Solicitar reserva (demo)
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Esta plataforma conecta você ao estabelecimento. O pagamento é
              feito diretamente com eles.
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground">
                  Check-in
                </label>
                <input
                  type="date"
                  className="mt-1 w-full px-3 py-2 border border-border rounded-lg text-sm"
                  defaultValue="2026-05-15"
                  disabled={enviado}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">
                  Check-out
                </label>
                <input
                  type="date"
                  className="mt-1 w-full px-3 py-2 border border-border rounded-lg text-sm"
                  defaultValue="2026-05-18"
                  disabled={enviado}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">
                  Adultos
                </label>
                <input
                  type="number"
                  defaultValue={2}
                  min={1}
                  className="mt-1 w-full px-3 py-2 border border-border rounded-lg text-sm"
                  disabled={enviado}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">
                  Crianças
                </label>
                <input
                  type="number"
                  defaultValue={1}
                  min={0}
                  className="mt-1 w-full px-3 py-2 border border-border rounded-lg text-sm"
                  disabled={enviado}
                />
              </div>
            </div>

            <p className="mt-4 text-xs text-muted-foreground bg-azul-claro p-3 rounded-lg">
              Ao confirmar, autorizo o envio do perfil sensorial do{" "}
              <strong>{DEMO_PERFIL_SENSORIAL.nome_autista}</strong> para este
              estabelecimento.
            </p>

            {!enviado ? (
              <Button
                onClick={enviar}
                className="w-full mt-4 bg-secondary hover:bg-secondary/90 text-white"
                size="lg"
              >
                Solicitar reserva
              </Button>
            ) : (
              <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-sm text-emerald-900">
                ✓ Reserva de demonstração enviada! Na plataforma real,{" "}
                {estab.nome} receberia o perfil sensorial e retornaria em até
                48h.
              </div>
            )}

            <div className="mt-4 pt-4 border-t">
              <p className="text-xs text-muted-foreground mb-2">
                Quer fazer isso de verdade?
              </p>
              <Button
                asChild
                variant="outline"
                className="w-full border-primary text-primary"
              >
                <Link to="/familias">Quero me cadastrar de verdade</Link>
              </Button>
            </div>
          </div>
        </aside>
      </div>

      {/* MODAL TOUR 360 */}
      {tour && estab.tour_360_url && (
        <div
          className="fixed inset-0 z-[70] bg-black/80 flex items-center justify-center p-4"
          onClick={() => setTour(false)}
        >
          <div
            className="bg-white rounded-2xl overflow-hidden w-full max-w-5xl aspect-video relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setTour(false)}
              className="absolute top-3 right-3 z-10 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100"
              aria-label="Fechar tour"
            >
              <X className="h-5 w-5" />
            </button>
            <iframe
              src={estab.tour_360_url}
              title={`Tour 360° ${estab.nome}`}
              className="w-full h-full"
              allow="fullscreen; xr-spatial-tracking; gyroscope; accelerometer"
            />
          </div>
        </div>
      )}
    </div>
  );
}
