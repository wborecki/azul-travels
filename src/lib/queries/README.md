# `src/lib/queries` — Camada central de payloads tipados

Toda leitura de dados do Supabase passa por aqui. Nenhum componente,
hook ou rota deve chamar `supabase.from(...).select(...)` diretamente —
o ESLint (`no-restricted-syntax` em `eslint.config.js`) bloqueia.

```ts
// ✅ correto
import { fetchEstabelecimentosView, type EstabelecimentoView } from "@/lib/queries";

// ❌ erro de lint
const { data } = await supabase.from("estabelecimentos").select("*");
```

## Arquitetura em 3 camadas

```
┌──────────────────────────────────────────────────────────────────────┐
│ 1. QUERIES        Row do Supabase tipada (joins + select fixo)      │
│    avaliacoes.ts, estabelecimentos.ts, reservas.ts, perfis.ts,      │
│    admin.ts                                                          │
├──────────────────────────────────────────────────────────────────────┤
│ 2. MAPPERS        Row → ViewModel (puro, sync, sem deps externas)   │
│    mappers.ts → AvaliacaoVM, EstabCardVM, ReservaVM                 │
├──────────────────────────────────────────────────────────────────────┤
│ 3. COMPONENT      Props derivadas dos VMs (Pick/Omit)               │
│    PROPS          component-props.ts → EstabCardProps,              │
│                   AvaliacaoCardProps, ErrorBannerProps, …           │
└──────────────────────────────────────────────────────────────────────┘
```

Os guards em `src/integrations/supabase/types.guard.ts` e
`core-payloads.guard.ts` travam o build se qualquer payload regredir
para `any`/`unknown` ou divergir do shape esperado.

---

## 1. Payloads de leitura (Row → UI)

### `AvaliacaoComFamilia` — `avaliacoes.ts`

Avaliação pública com `nome_responsavel` da família embutido.

```ts
type AvaliacaoComFamilia = Tables<"avaliacoes"> & {
  familia_profiles: Pick<Tables<"familia_profiles">, "nome_responsavel"> | null;
};
```

**Uso:**
```ts
import { fetchAvaliacoesPublicasPorEstab } from "@/lib/queries";
const avaliacoes = await fetchAvaliacoesPublicasPorEstab(estabId);
// avaliacoes: AvaliacaoComFamilia[]
```

---

### `EstabelecimentoView` — `estabelecimentos.ts`

Subset unificado para listagem, cards e detalhe-resumo. Inclui
identificação, localização, capa, todos os selos, Tour 360°, recursos
sensoriais, benefício TEA e flag de destaque.

```ts
type EstabelecimentoView = Pick<
  EstabelecimentoFull,
  "id" | "slug" | "nome" | "tipo" | "cidade" | "estado"
  | "foto_capa" | "tour_360_url"
  | "selo_azul" | "selo_governamental" | "selo_privado" | …
  | "tem_beneficio_tea" | "tem_sala_sensorial" | "tem_caa" | …
  | "destaque"
>;
```

**Uso:**
```ts
import {
  fetchEstabelecimentosView,
  fetchEstabelecimentosViewPaginated,
  ESTAB_PAGE_SIZE_DEFAULT,
  type EstabelecimentosViewPage,
} from "@/lib/queries";

// Sem paginação visual — passar pagina/tamanhoPagina ainda funciona
// (mais explícito do que o antigo `limite`).
const destaques = await fetchEstabelecimentosView({
  apenasDestaque: true,
  pagina: 1,
  tamanhoPagina: 6,
});

// Com paginação tipada (offset/limit) + total — usado em /explorar.
const page: EstabelecimentosViewPage = await fetchEstabelecimentosViewPaginated({
  busca: "florianopolis",
  tipos: ["hotel", "pousada"],
  pagina: 2,
  tamanhoPagina: ESTAB_PAGE_SIZE_DEFAULT, // 24, clampado em [1, 100]
});
// page.items, page.total, page.pagina, page.tamanhoPagina, page.totalPaginas
```

---

### `EstabelecimentoFull` / `EstabelecimentoNormalized` — `estabelecimentos.ts`

`Full` é a row completa (`Tables<"estabelecimentos">`).
`Normalized` adiciona garantias de UI:

| Campo            | `Full`      | `Normalized`                    |
| ---------------- | ----------- | ------------------------------- |
| `fotos`          | `Json\|null`| `string[]` (sempre)             |
| `foto_capa`      | `string\|null` | `string\|null` (vazio→null)  |
| `tour_360_url`   | `string\|null` | `string\|null` (vazio→null)  |
| `website`        | `string\|null` | `string\|null` (sanitizado)  |
| `latitude/longitude` | `number\|null` | `number\|null` (NaN→null) |

**Uso:**
```ts
import { fetchEstabelecimentoPorSlug } from "@/lib/queries";
const estab = await fetchEstabelecimentoPorSlug("hotel-acolhedor");
// estab: EstabelecimentoNormalized | null
```

---

### `EstabelecimentoDetalhe` — `estabelecimentos.ts`

Payload composto para a rota `/estabelecimento/:slug` — estab
normalizado + avaliações em um único fetch tipado.

```ts
interface EstabelecimentoDetalhe {
  estabelecimento: EstabelecimentoNormalized;
  avaliacoes: AvaliacaoComFamilia[];
}
```

**Uso:**
```ts
import { fetchEstabelecimentoDetalhe } from "@/lib/queries";
const detalhe = await fetchEstabelecimentoDetalhe(slug);
if (!detalhe) notFound();
```

---

### `ReservaComContexto` — `reservas.ts`

Reserva com joins leves (estabelecimento + perfil sensorial).

```ts
type ReservaComContexto = Reserva & {
  estabelecimentos: Pick<Tables<"estabelecimentos">,
    "id"|"slug"|"nome"|"cidade"|"estado"|"foto_capa"|"tipo"> | null;
  perfil_sensorial: Pick<Tables<"perfil_sensorial">,
    "id"|"nome_autista"|"nivel_tea"> | null;
};
```

**Uso:**
```ts
import { fetchReservasDaFamilia } from "@/lib/queries";
const reservas = await fetchReservasDaFamilia(familiaId);
```

---

### `PerfilOption` / `PerfilSensorial` — `perfis.ts`

`PerfilOption` é o subset enxuto para selects (`id`, `nome_autista`).
`PerfilSensorial` é a row completa para edição.

```ts
import { fetchPerfisDaFamilia, fetchPerfisCompletos } from "@/lib/queries";
const opts = await fetchPerfisDaFamilia(familiaId);  // PerfilOption[]
const full = await fetchPerfisCompletos(familiaId);  // PerfilSensorial[]
```

---

### Payloads admin — `admin.ts`

| Tipo                  | Fetcher                              | Uso                          |
| --------------------- | ------------------------------------ | ---------------------------- |
| `EstabAdminRow`       | `fetchEstabelecimentosAdmin()`       | `/admin/estabelecimentos`    |
| `ConteudoAdminRow`    | `fetchConteudosAdmin()`              | `/admin/conteudo`            |
| `ReservaAdminRow`     | `fetchReservasAdmin()`               | `/admin/reservas`            |
| `AuditoriaRow`        | `fetchAuditoriaPorReserva(id)`       | drawer de auditoria          |
| `PerfilSensorialRow`  | `fetchPerfisSensoriaisDaFamilia(id)` | `/minha-conta/perfil-sensorial` |
| `AdminCounts`         | `fetchAdminCounts()`                 | dashboard `/admin`           |
| `ConteudoCard`        | `fetchConteudosPublicados()`         | `/conteudo`                  |
| `ConteudoPublico`     | `fetchConteudoPorSlug(slug)`         | `/conteudo/:slug`            |
| `FamiliaStats`        | `fetchFamiliaStats(familiaId)`       | `/minha-conta`               |

---

## 2. View Models (`mappers.ts`)

Mapeadores **puros** que transformam Row → ViewModel pronto para JSX.
Sem lógica de UI; sem `async`; sem deps externas.

### `AvaliacaoVM`

```ts
interface AvaliacaoVM {
  id: string;
  nomeExibicao: string;       // "Maria" — fallback "Família"
  dataFormatada: string;      // "15/01/2025" — pt-BR
  nota: number;               // 0–5 (nunca null)
  comentario: string | null;  // trimado, vazio→null
}
```

**Uso:**
```ts
import { mapAvaliacoes } from "@/lib/queries";
const vms = mapAvaliacoes(rows);  // AvaliacaoVM[]
```

### `EstabCardVM`

```ts
interface EstabCardVM {
  id: string;
  slug: string;
  nome: string;
  tipoLabel: string;                       // "Hotel"
  localidade: string | null;               // "Florianópolis, SC"
  media: EstabMedia;                       // { fotoCapa, tour360Url, fotos[] }
  recursosAtivos: ReadonlyArray<RecursoKey>;
  temSeloAzul: boolean;
  temBeneficioTea: boolean;
  temTour360: boolean;
}
```

**Uso:**
```ts
import { mapEstabCard } from "@/lib/queries";
const vm = mapEstabCard(estab);
<EstabCard vm={vm} />
```

### `ReservaVM`

```ts
interface ReservaVM {
  id: string;
  status: ReservaStatus;       // fallback "pendente"
  statusLabel: string;         // "Pendente"
  estabelecimento: { slug; nome; localidade } | null;
  periodoFormatado: string;    // "10/01/2025 → 14/01/2025"
}
```

---

## 3. Props de componentes (`component-props.ts`)

Tipos derivados dos VMs via `Pick`/`Omit`. Garantem que componentes
nunca recebem campos que não existem no payload.

### Cards
- `EstabCardProps` — `{ vm: EstabCardVM; maxRecursos?: number }`
- `AvaliacaoCardProps` — `{ avaliacao: AvaliacaoVM }`
- `ReservaCardProps` — `{ reserva: ReservaVM }`

### Banners
- `EstabBannerProps` — subset de `EstabCardVM` para faixas/heroes
- `ErrorBannerProps` — `{ title; message; onRetry? }`
- `EmptyBannerProps` — `{ message; ctaLabel?; onCtaClick? }`

### Modais
- `CancelarReservaModalProps` — `{ open, onOpenChange, reserva, onConfirm }`
- `AvaliacaoDetalheModalProps` — `{ open, onOpenChange, avaliacao }`
- `EstabPreviewModalProps` — `{ open, onOpenChange, …subset do card }`

### Mixins
- `WithRetry` — `{ onRetry?: () => void }`
- `WithOpenChange` — `{ open: boolean; onOpenChange: (b: boolean) => void }`

**Exemplo de extensão:**
```ts
import type { EstabCardProps } from "@/lib/queries";

interface MeuCardCustomProps extends EstabCardProps {
  className?: string;
  onFavoritar?: (id: string) => void;
}
```

---

## Helpers utilitários

### Mídia (`@/lib/media`, re-exportado daqui)
- `pickEstabMedia(row)` — extrai `{ fotoCapa, tour360Url, fotos[] }` do estab.
- `normalizeFotos(json)` — `Json` → `string[]` saneado.
- `normalizeUrl(s)` — string → `string|null` (vazio/whitespace→null).

### Inserts tipados
- `buildReservaPayload(formInput)` — única função autorizada a montar
  `TablesInsert<"reservas">`. Use sempre — nunca monte o objeto na mão.

```ts
import { buildReservaPayload, criarReserva, type ReservaFormInput } from "@/lib/queries";

const input: ReservaFormInput = { /* form */ };
await criarReserva(buildReservaPayload(input));
```

---

## Checklist ao criar uma nova feature de dados

1. **Precisa de uma leitura nova?** Adicione um `fetchXxx` aqui em
   `src/lib/queries/` (não inline na rota).
2. **Tem derivação para a UI** (formatação, fallback, label)?
   Adicione um `mapXxx` em `mappers.ts` e exporte o `XxxVM`.
3. **Componente novo consumindo o VM?** Defina suas props em
   `component-props.ts` (Pick/Omit do VM).
4. **Build trava?** Provavelmente o guard em `core-payloads.guard.ts`
   pegou uma regressão — leia a mensagem do `AssertEqual`/`AssertNotAny`
   e ajuste o payload em vez de "casitar" o tipo na UI.

---

## Referências cruzadas

- ESLint rule: `eslint.config.js` (`no-restricted-syntax`)
- Guards de tipo: `src/integrations/supabase/types.guard.ts`
- Guards de payload: `src/integrations/supabase/core-payloads.guard.ts`
- Testes de regressão: `src/lib/queries/__tests__/avaliacoes.regression.test.ts`
