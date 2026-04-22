import js from "@eslint/js";
import eslintPluginPrettier from "eslint-plugin-prettier/recommended";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist", ".output", ".vinxi"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
  // ──────────────────────────────────────────────────────────────────────────
  // Build check estática: TODA leitura Supabase (`.from(...).select(...)`)
  // precisa nascer em `src/lib/queries/**`. Isso garante que cada payload
  // exposto à UI tenha tipo nomeado (e que os guards em
  // `src/integrations/supabase/core-payloads.guard.ts` consigam travar
  // regressões). Writes (`insert`/`update`/`delete`) e contagens
  // (`{ head: true }`) também ficam centralizados — sem exceção.
  //
  // Os guards de tipo são úteis depois que a query existe; esta regra
  // existe para impedir o passo zero (escrever uma query nova sem tipo
  // nomeado).
  // ──────────────────────────────────────────────────────────────────────────
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: [
      "src/lib/queries/**",
      "src/integrations/supabase/**", // client gerado, guards e auth-middleware
    ],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "CallExpression[callee.object.callee.property.name='from'][callee.property.name='select']",
          message:
            "Não chame supabase.from(...).select(...) fora de src/lib/queries/. Crie/reuse um fetcher tipado lá (ex: fetchEstabelecimentosAdmin) e importe de @/lib/queries. Isso garante payload tipado e cobertura dos guards.",
        },
        {
          selector:
            "CallExpression[callee.object.callee.property.name='from'][callee.property.name='insert']:not([callee.object.callee.object.name='supabase'][callee.object.callee.property.name='storage'] *)",
          message:
            "Inserts diretos via supabase.from(...).insert(...) só são permitidos em src/lib/queries/ ou em rotas auth/admin que constroem o payload via Zod/TablesInsert. Se for um fluxo novo, crie um fetcher tipado em /lib/queries.",
        },
      ],
    },
  },
  // Rotas que constroem TablesInsert via Zod ficam dispensadas do bloqueio
  // de insert (mas continuam bloqueadas para `.select(...)`). Lista
  // pequena e auditável — não cresce sem decisão consciente.
  {
    files: [
      "src/routes/cadastro.tsx",
      "src/routes/admin.reservas.tsx",
      "src/routes/admin.estabelecimentos.$id.tsx",
      "src/routes/admin.conteudo.$id.tsx",
      "src/routes/minha-conta.perfil-sensorial.tsx",
    ],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "CallExpression[callee.object.callee.property.name='from'][callee.property.name='select']",
          message:
            "Selects continuam proibidos fora de src/lib/queries/. Use um fetcher de @/lib/queries.",
        },
      ],
    },
  },
  eslintPluginPrettier,
);
