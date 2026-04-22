import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { Pill, SELO_BADGES, RECURSO_BADGES } from "@/components/Badges";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { TIPO_LABEL, formatDateBR } from "@/lib/brazil";
import { Camera, MapPin, Phone, Star, Gift, Globe } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/estabelecimento/$slug")({
  component: EstabPage,
});

interface PerfilOpt { id: string; nome_autista: string }

type Estab = Tables<"estabelecimentos">;
type Avaliacao = Tables<"avaliacoes"> & {
  familia_profiles: { nome_responsavel: string | null } | null;
};

function EstabPage() {
  const { slug } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [estab, setEstab] = useState<Estab | null>(null);
  const [loading, setLoading] = useState(true);
  const [perfis, setPerfis] = useState<PerfilOpt[]>([]);
  const [perfilSel, setPerfilSel] = useState<string>("");
  const [checkin, setCheckin] = useState("");
  const [checkout, setCheckout] = useState("");
  const [adultos, setAdultos] = useState(2);
  const [autistas, setAutistas] = useState(1);
  const [mensagem, setMensagem] = useState("");
  const [autoriza, setAutoriza] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [avals, setAvals] = useState<Avaliacao[]>([]);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      const { data } = await supabase.from("estabelecimentos").select("*").eq("slug", slug).maybeSingle();
      setEstab(data ?? null);
      if (data) {
        const { data: a } = await supabase
          .from("avaliacoes")
          .select("*, familia_profiles(nome_responsavel)")
          .eq("estabelecimento_id", data.id)
          .eq("publica", true)
          .order("criado_em", { ascending: false });
        setAvals(a ?? []);
      }
      setLoading(false);
    })();
  }, [slug]);

  useEffect(() => {
    if (!user) return;
    void (async () => {
      const { data } = await supabase.from("perfil_sensorial").select("id, nome_autista").eq("familia_id", user.id);
      setPerfis(data ?? []);
      if (data && data.length > 0) setPerfilSel(data[0].id);
    })();
  }, [user]);

  if (loading)
    return <div className="container mx-auto px-4 py-12"><div className="aspect-[16/9] bg-muted animate-pulse rounded-2xl max-w-5xl mx-auto" /></div>;

  if (!estab)
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-display font-bold text-primary">Estabelecimento não encontrado</h1>
        <Button asChild className="mt-4"><Link to="/explorar">Explorar outros</Link></Button>
      </div>
    );

  const e = estab;
  const recursoKeys = ["tem_sala_sensorial","tem_concierge_tea","tem_checkin_antecipado","tem_fila_prioritaria","tem_cardapio_visual","tem_caa"] as const;
  const recursosAtivos = recursoKeys.filter((k) => e[k]);

  const enviarReserva = async () => {
    if (!user) {
      navigate({ to: "/login" });
      return;
    }
    if (!perfilSel) {
      toast.error("Cadastre um perfil sensorial antes.");
      return;
    }
    if (!checkin || !checkout) {
      toast.error("Selecione as datas de check-in e check-out.");
      return;
    }
    setEnviando(true);
    const { error } = await supabase.from("reservas").insert({
      familia_id: user.id,
      estabelecimento_id: e.id,
      perfil_sensorial_id: perfilSel,
      data_checkin: checkin,
      data_checkout: checkout,
      num_adultos: adultos,
      num_autistas: autistas,
      mensagem,
      status: "pendente",
      perfil_enviado_ao_estabelecimento: autoriza,
    });
    setEnviando(false);
    if (error) {
      toast.error("Erro ao enviar reserva: " + error.message);
      return;
    }
    toast.success("Reserva solicitada! O estabelecimento entrará em contato.");
    navigate({ to: "/minha-conta/reservas" });
  };

  const fotos: string[] = Array.isArray(e.fotos) ? (e.fotos as string[]) : [];
  const fotoCapa = e.foto_capa ?? "";

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Galeria */}
      <div className="grid lg:grid-cols-3 gap-3 mb-8 max-h-[480px]">
        <div className="lg:col-span-2 relative rounded-2xl overflow-hidden bg-muted">
          {fotoCapa && <img src={fotoCapa} alt={e.nome} className="w-full h-full object-cover" />}
          {e.tour_360_url && (
            <a
              href={e.tour_360_url}
              target="_blank"
              rel="noreferrer"
              className="absolute bottom-4 right-4 bg-amarelo text-amarelo-foreground rounded-xl px-4 py-2 font-semibold text-sm flex items-center gap-2 shadow-elegant hover:scale-105 transition"
            >
              <Camera className="h-4 w-4" /> Tour 360° dos ambientes
            </a>
          )}
        </div>
        <div className="hidden lg:grid grid-rows-2 gap-3">
          {[fotos[0], fotos[1]].map((f, i) => (
            <div key={i} className="bg-muted rounded-2xl overflow-hidden">
              {f && <img src={f} alt="" className="w-full h-full object-cover" />}
            </div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-10">
        {/* Conteúdo */}
        <div className="lg:col-span-2 space-y-8">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-secondary">{TIPO_LABEL[e.tipo]}</span>
            <h1 className="mt-1 text-3xl md:text-4xl font-display font-bold text-primary">{e.nome}</h1>
            <p className="mt-1 text-muted-foreground flex items-center gap-1">
              <MapPin className="h-4 w-4" /> {e.cidade}, {e.estado}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {e.selo_azul && <Pill {...SELO_BADGES.selo_azul} />}
              {e.selo_governamental && <Pill {...SELO_BADGES.selo_governamental} />}
              {e.selo_privado && <Pill {...SELO_BADGES.selo_privado} label={e.selo_privado_nome || "Selo Privado"} />}
              {e.tour_360_url && <Pill {...SELO_BADGES.tour_360} />}
              {e.tem_beneficio_tea && <Pill {...SELO_BADGES.beneficio_tea} />}
            </div>
          </div>

          <section>
            <h2 className="font-display font-bold text-xl text-primary">Sobre o local para famílias TEA</h2>
            <p className="mt-3 text-foreground leading-relaxed">{e.descricao_tea || e.descricao}</p>
          </section>

          {recursosAtivos.length > 0 && (
            <section>
              <h3 className="font-display font-bold text-lg text-primary mb-3">Recursos disponíveis</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {recursosAtivos.map((k) => (
                  <div key={k} className="flex items-start gap-3 p-3 bg-azul-claro rounded-xl">
                    <Pill {...RECURSO_BADGES[k]} />
                  </div>
                ))}
              </div>
            </section>
          )}

          {e.tem_beneficio_tea && (
            <section className="bg-teal-claro border border-secondary/20 rounded-2xl p-6">
              <div className="flex items-center gap-2 text-secondary font-display font-bold text-lg">
                <Gift className="h-5 w-5" /> Benefício especial para pessoas autistas
              </div>
              <p className="mt-2 text-foreground">{e.beneficio_tea_descricao}</p>
            </section>
          )}

          <section>
            <h3 className="font-display font-bold text-lg text-primary mb-3">Selos e certificações</h3>
            <ul className="space-y-2 text-sm">
              {e.selo_azul && (
                <li className="flex justify-between py-2 border-b">
                  <span className="font-semibold">Selo Azul (Absoluto Educacional)</span>
                  {e.selo_azul_validade && <span className="text-muted-foreground">Válido até {formatDateBR(e.selo_azul_validade)}</span>}
                </li>
              )}
              {e.selo_governamental && <li className="py-2 border-b font-semibold">Certificado Governamental</li>}
              {e.selo_privado && <li className="py-2 border-b font-semibold">{e.selo_privado_nome || "Selo Privado"}</li>}
            </ul>
          </section>

          <section>
            <h3 className="font-display font-bold text-lg text-primary mb-3">Contato</h3>
            <div className="space-y-2 text-sm">
              {e.telefone && <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-secondary" /> {e.telefone}</p>}
              {e.website && <p className="flex items-center gap-2"><Globe className="h-4 w-4 text-secondary" /> <a href={e.website} target="_blank" rel="noreferrer" className="text-secondary hover:underline">{e.website}</a></p>}
              {e.endereco && <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-secondary" /> {e.endereco}</p>}
            </div>
          </section>

          <section>
            <h3 className="font-display font-bold text-lg text-primary mb-4">Avaliações de famílias TEA</h3>
            {avals.length === 0 ? (
              <div className="bg-muted/40 rounded-xl p-6 text-center text-sm text-muted-foreground">
                Ainda não há avaliações para este estabelecimento.
              </div>
            ) : (
              <div className="space-y-3">
                {avals.map((a) => {
                  const nome = a.familia_profiles?.nome_responsavel?.split(" ")[0] ?? "Família";
                  return (
                    <div key={a.id} className="bg-card border rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold">{nome}</p>
                        <div className="flex items-center gap-1 text-amarelo">
                          {Array.from({ length: a.nota_geral ?? 0 }).map((_, i) => (
                            <Star key={i} className="h-4 w-4 fill-current" />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">{formatDateBR(a.criado_em)}</p>
                      {a.comentario && <p className="mt-2 text-sm">{a.comentario}</p>}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* Reserva */}
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <div className="bg-card rounded-2xl border shadow-elegant p-6 space-y-4">
            <h3 className="font-display font-bold text-lg text-primary">Solicitar Reserva</h3>

            {!user ? (
              <div className="text-center space-y-3 py-2">
                <p className="text-sm text-muted-foreground">Faça login para solicitar reserva.</p>
                <Button asChild className="w-full"><Link to="/login">Entrar</Link></Button>
                <Button variant="outline" asChild className="w-full"><Link to="/cadastro">Cadastrar</Link></Button>
              </div>
            ) : (
              <>
                <div>
                  <Label>Perfil sensorial</Label>
                  {perfis.length === 0 ? (
                    <p className="mt-1 text-sm">
                      <Link to="/minha-conta/perfil-sensorial" className="text-secondary hover:underline">
                        Criar perfil sensorial
                      </Link>
                    </p>
                  ) : (
                    <Select value={perfilSel} onValueChange={setPerfilSel}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {perfis.map((p) => <SelectItem key={p.id} value={p.id}>{p.nome_autista}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>Check-in</Label>
                    <Input type="date" value={checkin} onChange={(e) => setCheckin(e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label>Check-out</Label>
                    <Input type="date" value={checkout} onChange={(e) => setCheckout(e.target.value)} className="mt-1" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>Adultos</Label>
                    <Input type="number" min={1} value={adultos} onChange={(e) => setAdultos(+e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label>Autistas</Label>
                    <Input type="number" min={1} value={autistas} onChange={(e) => setAutistas(+e.target.value)} className="mt-1" />
                  </div>
                </div>

                <div>
                  <Label>Mensagem (opcional)</Label>
                  <Textarea value={mensagem} onChange={(e) => setMensagem(e.target.value)} className="mt-1" rows={3} placeholder="Necessidades específicas, dúvidas..." />
                </div>

                <label className="flex items-start gap-2 text-xs cursor-pointer">
                  <Checkbox checked={autoriza} onCheckedChange={(v) => setAutoriza(!!v)} className="mt-0.5" />
                  <span>Autorizo o envio do meu perfil sensorial ao estabelecimento.</span>
                </label>

                <Button onClick={enviarReserva} disabled={enviando} className="w-full bg-primary hover:bg-primary/90">
                  {enviando ? "Enviando..." : "Solicitar Reserva"}
                </Button>

                <p className="text-[11px] text-muted-foreground leading-snug">
                  Ao confirmar, o estabelecimento receberá seu perfil sensorial e assumirá o
                  compromisso de atender suas necessidades declaradas.
                </p>
              </>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
