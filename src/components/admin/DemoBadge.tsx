import { FlaskConical } from "lucide-react";

/**
 * Badge visual para marcar registros criados em demonstração / testes.
 * Use sempre que listar leads, famílias ou estabelecimentos no painel admin
 * para diferenciar cadastros reais de fakes.
 */
export function DemoBadge({ className = "" }: { className?: string }) {
  return (
    <span
      title="Registro criado em demonstração / testes (não é real)"
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-orange-100 text-orange-800 border border-orange-300 ${className}`}
    >
      <FlaskConical className="h-2.5 w-2.5" />
      Demo
    </span>
  );
}
