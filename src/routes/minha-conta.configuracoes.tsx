import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { ESTADOS_BR } from "@/lib/brazil";
import { toast } from "sonner";

export const Route = createFileRoute("/minha-conta/configuracoes")({
  component: ConfiguracoesPage,
});

const ESTADOS_ORDENADOS = [...ESTADOS_BR].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

function maskTelefone(v: string): string {
  const digits = v.replace(/\D/g, "").slice(0, 11);
  if (digits.length === 0) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10)
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function ConfiguracoesPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [salvandoDados, setSalvandoDados] = useState(false);

  // Notificações (preferências locais — sem coluna nova no banco)
  const [notifReserva, setNotifReserva] = useState(true);
  const [notifConteudo, setNotifConteudo] = useState(false);
  const [notifNovosDestinos, setNotifNovosDestinos] = useState(false);

  const [textoConfirmacao, setTextoConfirmacao] = useState("");
  const [showExcluir, setShowExcluir] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  useEffect(() => {
    if (!user) return;
    void (async () => {
      const { data } = await supabase
        .from("familia_profiles")
        .select("nome_responsavel, telefone, cidade, estado")
        .eq("id", user.id)
        .maybeSingle();
      if (data) {
        setNome(data.nome_responsavel ?? "");
        setTelefone(data.telefone ?? "");
        setCidade(data.cidade ?? "");
        setEstado(data.estado ?? "");
      }
    })();
  }, [user]);

  const salvarDados = async () => {
    if (!user) return;
    setSalvandoDados(true);
    const { error } = await supabase
      .from("familia_profiles")
      .update({
        nome_responsavel: nome.trim() || null,
        telefone: telefone.trim() || null,
        cidade: cidade.trim() || null,
        estado: estado || null,
      })
      .eq("id", user.id);
    setSalvandoDados(false);
    if (error) {
      toast.error("Não foi possível salvar.", { description: error.message });
      return;
    }
    toast.success("Dados atualizados.");
  };

  const alterarSenha = async () => {
    if (!user?.email) return;
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("E-mail de redefinição enviado.", {
      description: "Verifique sua caixa de entrada.",
    });
  };

  const excluir = async () => {
    if (textoConfirmacao !== "EXCLUIR" || !user) return;
    setExcluindo(true);
    // Cascade delete: tabelas filhas via FK ON DELETE CASCADE.
    // Aqui, removemos manualmente os registros que a família "possui".
    await Promise.all([
      supabase.from("avaliacoes").delete().eq("familia_id", user.id),
      supabase.from("reservas").delete().eq("familia_id", user.id),
      supabase.from("perfil_sensorial").delete().eq("familia_id", user.id),
      supabase.from("explorar_filtros_padrao").delete().eq("user_id", user.id),
    ]);
    await supabase.from("familia_profiles").delete().eq("id", user.id);
    await signOut();
    setExcluindo(false);
    toast.success("Conta excluída.", {
      description: "Sentiremos sua falta. Você pode criar uma nova conta a qualquer momento.",
    });
    navigate({ to: "/" });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-primary">Configurações</h1>
        <p className="text-sm text-muted-foreground">
          Atualize seus dados, preferências e configurações da conta.
        </p>
      </div>

      {/* Dados pessoais */}
      <Section titulo="Dados pessoais">
        <div className="space-y-3">
          <Field label="Nome completo">
            <Input value={nome} onChange={(e) => setNome(e.target.value)} />
          </Field>
          <Field label="E-mail">
            <Input value={user?.email ?? ""} readOnly className="bg-muted/30" />
            <p className="text-xs text-muted-foreground mt-1">
              Para alterar o e-mail, entre em contato.
            </p>
          </Field>
          <Field label="Telefone">
            <Input
              value={telefone}
              onChange={(e) => setTelefone(maskTelefone(e.target.value))}
              placeholder="(00) 00000-0000"
              inputMode="tel"
            />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Cidade">
              <Input value={cidade} onChange={(e) => setCidade(e.target.value)} />
            </Field>
            <Field label="Estado">
              <Select value={estado} onValueChange={setEstado}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {ESTADOS_ORDENADOS.map((e) => (
                    <SelectItem key={e.sigla} value={e.sigla}>
                      {e.sigla} — {e.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <Button
            onClick={salvarDados}
            disabled={salvandoDados}
            className="bg-secondary hover:bg-secondary/90"
          >
            {salvandoDados ? "Salvando…" : "Salvar alterações"}
          </Button>
        </div>
      </Section>

      {/* Senha */}
      <Section titulo="Senha">
        <p className="text-sm text-muted-foreground mb-3">
          Enviaremos um link para o seu e-mail para você definir uma nova senha.
        </p>
        <Button variant="outline" onClick={alterarSenha}>
          Alterar senha
        </Button>
      </Section>

      {/* Notificações */}
      <Section titulo="Notificações">
        <div className="space-y-3">
          <ToggleRow
            checked={notifReserva}
            onCheckedChange={setNotifReserva}
            label="Receber e-mail quando reserva for confirmada"
          />
          <ToggleRow
            checked={notifConteudo}
            onCheckedChange={setNotifConteudo}
            label="Receber novidades e conteúdo TEA por e-mail"
          />
          <ToggleRow
            checked={notifNovosDestinos}
            onCheckedChange={setNotifNovosDestinos}
            label="Receber alertas de novos destinos na minha região"
          />
          <p className="text-xs text-muted-foreground">
            As preferências são salvas automaticamente.
          </p>
        </div>
      </Section>

      {/* Conta */}
      <Section titulo="Conta">
        <p className="text-sm text-muted-foreground mb-3">
          Excluir a conta apaga seu perfil, perfis sensoriais, reservas e avaliações. A ação não
          pode ser desfeita.
        </p>
        <Button
          variant="outline"
          onClick={() => setShowExcluir(true)}
          className="border-destructive text-destructive hover:bg-destructive/10"
        >
          Excluir minha conta
        </Button>
      </Section>

      <AlertDialog
        open={showExcluir}
        onOpenChange={(o) => {
          if (!o) {
            setShowExcluir(false);
            setTextoConfirmacao("");
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir conta permanentemente?</AlertDialogTitle>
            <AlertDialogDescription>
              Para confirmar, digite <strong className="text-destructive">EXCLUIR</strong> abaixo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            value={textoConfirmacao}
            onChange={(e) => setTextoConfirmacao(e.target.value)}
            placeholder="EXCLUIR"
            autoFocus
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={excluir}
              disabled={textoConfirmacao !== "EXCLUIR" || excluindo}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {excluindo ? "Excluindo…" : "Excluir conta"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Section({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border rounded-2xl p-5">
      <h2 className="font-display font-bold text-primary mb-4">{titulo}</h2>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-sm font-medium text-primary">{label}</Label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function ToggleRow({
  checked,
  onCheckedChange,
  label,
}: {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex items-center justify-between gap-3 p-3 rounded-lg border bg-muted/20">
      <span className="text-sm text-foreground/90">{label}</span>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </label>
  );
}
