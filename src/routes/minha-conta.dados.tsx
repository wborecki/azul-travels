import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/minha-conta/dados")({
  component: DadosPage,
});

function DadosPage() {
  const { user } = useAuth();
  const meta = (user?.user_metadata ?? {}) as Record<string, string>;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-display font-bold text-primary">Dados da conta</h1>
        <p className="text-sm text-muted-foreground">Suas informações cadastrais.</p>
      </div>
      <div className="bg-card border rounded-2xl p-6 space-y-3 text-sm">
        <Row label="Nome" v={meta.nome_responsavel} />
        <Row label="Email" v={user?.email ?? ""} />
        <Row label="Telefone" v={meta.telefone} />
        <Row label="Cidade" v={meta.cidade} />
        <Row label="Estado" v={meta.estado} />
      </div>
    </div>
  );
}

function Row({ label, v }: { label: string; v: string | undefined }) {
  return (
    <div className="flex justify-between border-b last:border-0 pb-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{v || "—"}</span>
    </div>
  );
}
