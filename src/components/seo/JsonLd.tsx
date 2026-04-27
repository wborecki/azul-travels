/**
 * Componente para injetar JSON-LD structured data via React.
 * O Google usa esses dados para rich snippets nos resultados de busca.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
