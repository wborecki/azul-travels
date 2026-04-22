import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { fetchEstabelecimentosView, type EstabelecimentoView } from "@/lib/queries";
import { Gift, MapPin, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TIPO_LABEL } from "@/lib/brazil";

export const Route = createFileRoute("/beneficios-tea")({
  head: () => ({
    meta: [
      { title: "Benefícios TEA — Turismo Azul" },
      { name: "description", content: "Estabelecimentos com entrada gratuita, descontos e privilégios para pessoas autistas." },
    ],
  }),
  component: Beneficios,
});

function Beneficios() {
  const [list, setList] = useState<EstabelecimentoView[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const data = await fetchEstabelecimentosView({ apenasComBeneficio: true });
      setList(data);
      setLoading(false);
    })();
  }, []);

  return (
    <div>
      <section className="gradient-teal text-white py-16 md:py-20">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <Gift className="h-12 w-12 mx-auto text-amarelo" />
          <h1 className="mt-4 text-4xl md:text-5xl font-display font-extrabold">
            Benefícios especiais para famílias TEA
          </h1>
          <p className="mt-4 text-lg text-white/85">
            Estabelecimentos parceiros que oferecem entrada gratuita, descontos e privilégios
            exclusivos para pessoas autistas.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12">
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => <div key={i} className="aspect-[4/3] bg-muted animate-pulse rounded-2xl" />)}
          </div>
        ) : list.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">Em breve mais estabelecimentos com benefícios.</div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {list.map((e) => (
              <Link
                key={e.id}
                to="/estabelecimento/$slug"
                params={{ slug: e.slug }}
                className="group bg-card rounded-2xl overflow-hidden shadow-soft hover:shadow-elegant transition border animate-fade-up flex flex-col"
              >
                <div className="aspect-[4/3] overflow-hidden bg-muted">
                  {e.foto_capa && <img src={e.foto_capa} alt={e.nome} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />}
                </div>
                <div className="p-5 flex-1 flex flex-col gap-3">
                  <div>
                    <h3 className="font-display font-bold text-lg text-primary group-hover:text-secondary transition">{e.nome}</h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <span>{TIPO_LABEL[e.tipo]}</span> · <MapPin className="h-3 w-3" /> {e.cidade}, {e.estado}
                    </p>
                  </div>
                  <div className="bg-success/10 border border-success/20 rounded-xl p-3 flex items-start gap-2">
                    <Gift className="h-4 w-4 text-success shrink-0 mt-0.5" />
                    <p className="text-sm text-foreground">{e.beneficio_tea_descricao}</p>
                  </div>
                  <span className="mt-auto text-secondary font-semibold text-sm flex items-center gap-1">
                    Ver estabelecimento <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-14 bg-azul-claro rounded-2xl p-8 text-center">
          <h3 className="font-display font-bold text-xl text-primary">É um estabelecimento e quer oferecer benefícios TEA?</h3>
          <p className="mt-2 text-muted-foreground">Entre em contato e faça parte da nossa rede.</p>
          <Button className="mt-4">Quero participar</Button>
        </div>
      </section>
    </div>
  );
}
