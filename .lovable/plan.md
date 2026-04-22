

## Versão da logo para fundo branco

Hoje a logo no header (fundo branco) usa um traço azul-claro/ciano (`oklch(0.66 0.10 195)`) que se confunde com o branco da barra. Vou criar uma variante "para fundo claro" mantendo exatamente o mesmo desenho — só ajustando as cores para garantir contraste.

### O que muda

- **Mantido**: formato dos dois traços ondulados, espaçamento, fonte "Turismo Azul", peso e tamanho.
- **Ajustado** (apenas para fundo branco):
  - Onda inferior: continua em `hsl(var(--primary))` (azul forte) — já tem bom contraste.
  - Onda superior: troca de `oklch(0.66 0.10 195)` (ciano claro) por um **azul-secundário mais escuro/saturado** que contraste com o branco. Usaremos `hsl(var(--secondary))` (mesma cor do "Azul" no texto, criando coerência visual) ou um tom 1 grau mais escuro se o secondary atual estiver muito claro.
  - Opacidade da onda superior sobe de `0.85` para `1`.

A versão `light` (header escuro/hero) continua igual — traços brancos.

### Implementação

1. **`src/components/Logo.tsx`**
   - Manter a prop `light?: boolean` (já existe, usada no Footer/hero escuros).
   - Substituir o `stroke` hard-coded `oklch(0.66 0.10 195)` da segunda onda por `hsl(var(--secondary))` quando `!light`, e manter `#fff` quando `light`.
   - Remover o `opacity="0.85"` no modo claro (ou reduzir para `0.95`) para reforçar o contraste.

2. **Verificação visual**
   - Header (`src/components/Header.tsx`) usa `<Logo />` sem prop → pega a nova versão clara.
   - Footer / qualquer hero escuro que use `<Logo light />` permanece intacto.

### Detalhes técnicos

```tsx
// src/components/Logo.tsx — onda superior
<path
  d="M2 13c3-2 5-2 8 0s5 2 8 0 5-2 8 0"
  stroke={light ? "#fff" : "hsl(var(--secondary))"}
  strokeWidth="2.5"
  strokeLinecap="round"
  opacity={light ? 0.85 : 1}
/>
```

Nenhum token de cor novo precisa ser criado — reaproveitamos `--secondary` que já é o azul usado na palavra "Azul" do wordmark, garantindo harmonia.

### Arquivos afetados

- `src/components/Logo.tsx` (editado)

