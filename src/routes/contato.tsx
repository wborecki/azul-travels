import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { Mail, Send, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/contato")({
  head: () => ({
    meta: [
      { title: "Contato — Turismo Azul" },
      {
        name: "description",
        content:
          "Fale com a equipe do Turismo Azul. Deixe sua mensagem e a gente entra em contato.",
      },
      { property: "og:title", content: "Contato — Turismo Azul" },
      {
        property: "og:description",
        content: "Fale com a equipe do Turismo Azul.",
      },
    ],
  }),
  component: ContatoPage,
});

const schema = z.object({
  nome: z.string().trim().min(2, "Informe seu nome").max(100),
  email: z.string().trim().email("E-mail inválido").max(255),
  telefone: z.string().trim().max(30).optional().or(z.literal("")),
  assunto: z.string().trim().max(120).optional().or(z.literal("")),
  mensagem: z.string().trim().min(5, "Conte um pouco mais").max(2000),
});

function ContatoPage() {
  const [form, setForm] = useState({
    nome: "",
    email: "",
    telefone: "",
    assunto: "",
    mensagem: "",
  });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Verifique os campos");
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("contatos_gerais").insert({
      nome: parsed.data.nome,
      email: parsed.data.email,
      telefone: parsed.data.telefone || null,
      assunto: parsed.data.assunto || null,
      mensagem: parsed.data.mensagem,
      origem: "contato",
    });
    setLoading(false);
    if (error) {
      toast.error("Não foi possível enviar agora. Tente novamente.");
      return;
    }
    setDone(true);
    setForm({ nome: "", email: "", telefone: "", assunto: "", mensagem: "" });
  }

  return (
    <div className="min-h-screen bg-background py-16">
      <div className="container mx-auto px-4 max-w-xl">
        <div className="text-center mb-10">
          <div className="w-14 h-14 rounded-full bg-secondary/15 text-secondary flex items-center justify-center mx-auto">
            <Mail className="h-7 w-7" />
          </div>
          <h1 className="mt-5 text-3xl md:text-4xl font-display font-bold text-primary">
            Fala com a gente
          </h1>
          <p className="mt-3 text-muted-foreground">
            Deixe seu recado e a gente responde por e-mail ou WhatsApp.
          </p>
        </div>

        {done ? (
          <div className="bg-white border rounded-2xl p-8 text-center shadow-sm">
            <CheckCircle2 className="h-12 w-12 text-secondary mx-auto" />
            <h2 className="mt-4 text-xl font-display font-bold text-primary">
              Mensagem enviada!
            </h2>
            <p className="mt-2 text-muted-foreground text-sm">
              A gente vai entrar em contato em breve. Obrigado pelo recado 💙
            </p>
            <Button
              className="mt-6"
              variant="outline"
              onClick={() => setDone(false)}
            >
              Enviar outra mensagem
            </Button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="bg-white border rounded-2xl p-6 md:p-8 shadow-sm space-y-4"
          >
            <div>
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                required
                maxLength={100}
              />
            </div>
            <div>
              <Label htmlFor="email">E-mail *</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                maxLength={255}
              />
            </div>
            <div>
              <Label htmlFor="telefone">WhatsApp / Telefone</Label>
              <Input
                id="telefone"
                value={form.telefone}
                onChange={(e) =>
                  setForm({ ...form, telefone: e.target.value })
                }
                maxLength={30}
                placeholder="(opcional)"
              />
            </div>
            <div>
              <Label htmlFor="assunto">Assunto</Label>
              <Input
                id="assunto"
                value={form.assunto}
                onChange={(e) => setForm({ ...form, assunto: e.target.value })}
                maxLength={120}
                placeholder="(opcional)"
              />
            </div>
            <div>
              <Label htmlFor="mensagem">Mensagem *</Label>
              <Textarea
                id="mensagem"
                value={form.mensagem}
                onChange={(e) =>
                  setForm({ ...form, mensagem: e.target.value })
                }
                required
                rows={5}
                maxLength={2000}
              />
            </div>
            <Button
              type="submit"
              size="lg"
              disabled={loading}
              className="w-full bg-primary hover:bg-secondary text-white min-h-[52px] font-semibold"
            >
              {loading ? "Enviando..." : (
                <>
                  Enviar mensagem <Send className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
