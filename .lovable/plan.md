

## Substituir emojis por ícones Lucide

Vou trocar todos os emojis decorativos por ícones da biblioteca Lucide (já em uso no projeto), que têm aparência profissional, consistente com o resto da UI e não remetem a interfaces geradas por IA.

### Mapa de substituição

| Local | Hoje | Vai virar |
|---|---|---|
| Hotel / Pousada / Resort | 🏨 / 🌳 / 🌊 | `Hotel` (Lucide) |
| Restaurante | 🍽️ | `UtensilsCrossed` |
| Parque / Atração | 🎡 | `Trees` |
| Transporte | ✈️ | `Plane` |
| Agência | 🧳 | `Briefcase` |

### Mudanças por arquivo

**1. `src/components/EstabCard.tsx` — fallback de imagem**
- Remover função `emojiPorTipoLabel` (string).
- Criar `IconePorTipoLabel` que retorna o componente Lucide apropriado.
- No bloco de fallback (quando não há `fotoCapa`), trocar `<span className="text-5xl opacity-30">{emojiFallback}</span>` por `<Icone className="h-16 w-16 text-primary/25" strokeWidth={1.5} />`.
- Resultado: ícone de linha fina, monocromático na cor da marca, sobre o gradiente azul/teal já existente. Mantém a hierarquia visual sem o tom infantil do emoji.

**2. `src/routes/index.tsx` — chips de categoria no hero**
- Trocar o array `{ label: "🏨 Hotéis", ... }` por `{ icon: Hotel, label: "Hotéis", ... }`.
- Renderizar o ícone inline com o texto: `<Icon className="h-4 w-4" /> {label}` dentro do Link.
- Spacing: `gap-1.5` entre ícone e texto, `strokeWidth={2}` para boa leitura sobre fundo translúcido.

**3. `src/routes/index.tsx` — fallback duplicado no card destaque (linhas ~727-763)**
- Aplicar a mesma substituição feita no `EstabCard` (helper de ícone + render Lucide).
- Idealmente esse card destaque deveria reusar `EstabCard`, mas isso está fora do escopo desta mudança — apenas alinho o visual.

### Correção paralela (hidratação)

Os erros de hydration nos logs vêm de SSR cacheado servindo o HTML antigo (`py-20`, `text-3xl`, `<svg lucide-quote>`) enquanto o cliente já tem o novo. Não é um bug no código atual — vai se resolver no próximo build. Não precisa de ação.

### O que NÃO muda
- Paleta, tipografia, layout, rotas, queries Supabase, copy.
- Ícones funcionais já existentes no projeto (Star, MapPin, etc.).
- O componente `Pill` dos badges (selo azul, tour 360, etc.) — esses já usam ícones Lucide.

