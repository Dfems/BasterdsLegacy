# Copilot Instructions — BasterdsLegacy

> **Operazioni su file — OBBLIGO SHELL**
>
> - Per **rinominare/spostare/cancellare/creare** file o cartelle usa **sempre la shell**.
> - Comandi tipici: `git mv <from> <to>`, `git rm -r <path>`, `rm -rf <path>`, `mkdir -p <dir>`, `touch <file>`.
> - Su Windows usa PowerShell equivalenti (`Move-Item`, `Remove-Item -Recurse -Force`), oppure comandi Git.
> - Niente drag&drop manuale dall’editor: evita residui e assicurati che i rename siano **tracciati da Git**.
> - Dopo ogni modifica ai percorsi, **aggiorna gli import** e lancia `npm run format:check && npm run lint && npm run type-check`.

> **Lingua e comportamento**
>
> - Rispondi **sempre in italiano**.
> - **Non fermarti** finché _tutte_ le funzionalità richieste non sono state **implementate e verificate**.
> - Se uno step fallisce, correggi e ripeti fino a ottenere tutti gli esiti **verdi**.

---

## 1) Obiettivo del progetto

Standardizzare e mantenere il progetto **React + TypeScript + Vite** con:

- Componenti come **arrow function** soltanto (vietato `React.FC`).
- Tipizzazione rigorosa **(no `any`)** e controllo tipi continuo.
- **Prettier + ESLint (flat, type-aware) + EditorConfig** per formato e qualità.
- Alias Vite `@` su `./src`, struttura cartelle chiara (FSD “lite”).
- **Vitest + React Testing Library** per test unitari, **Husky + lint-staged** per pre-commit.
- **CI GitHub Actions**: format:check, lint, type-check, test, build.
- Documentazione aggiornata e _Definition of Done_ chiara.

---

## 2) Regole di codice (non negoziabili)

- **Arrow Function Components only:** `const MyComp = (props: Props) => { ... }`.
- **Non usare `React.FC`.**
- Tipizza sempre **props, stato, return**. Evita `any`; usa `unknown` + _type guards_ quando serve.
- Esporta **named** (niente `default`) per favorire refactor e coerenza import.
- **Import assoluti** tramite alias `@` (es. `@/shared/components/Button`).
- Funzioni e componenti **piccoli**: componenti ≤ 200 righe, funzioni ≤ 80 righe.
- **A11y**: semantica corretta, `alt` per media, gestione focus per modali/dialog.
- **Side-effects** fuori dal render: usa `useEffect` con dipendenze corrette o estrai in hook.
- **Preferisci Composition over Inheritance**; evita _God component_ e _prop drilling_ eccessivo (usa context mirati).

---

## 3) Struttura cartelle (FSD “lite”)

```
src/
  app/            # bootstrap app, router, store (se presente)
  pages/          # pagine di routing (una cartella per pagina)
  widgets/        # blocchi UI composti (header, sidebar, nav, ...)
  features/       # unità funzionali (search, auth, upload, ...)
  entities/       # modelli dominio (User, Post, ...)
  shared/
    components/   # UI riutilizzabile (Button, Input, ...)
    hooks/        # hook comuni (useDebounce, useMediaQuery, ...)
    libs/         # utilities (http client, zod, date, i18n, ...)
    styles/       # css/global vars, reset, theme tokens
  types/          # tipi condivisi globali (index.ts esposto)
assets/           # immagini, svg, font
```

**Regola import “top-down”:** `shared → entities → features → widgets → pages → app` (mai il contrario).  
**Tutti i tipi e le interfacce riutilizzabili vanno in `src/types`.**

---

## 4) Tooling obbligatorio

- **TypeScript strict** con opzioni aggiuntive:
  - `noUncheckedIndexedAccess: true`
  - `exactOptionalPropertyTypes: true`
  - `useUnknownInCatchVariables: true`
  - `noFallthroughCasesInSwitch: true`
- **ESLint flat config** (type-aware) con plugin React e igiene import.
- **Prettier** con ordinamento import (plugin) + EditorConfig coerente.
- **Vitest** (env `jsdom`) + **@testing-library/react** + `@testing-library/jest-dom`.
- **Husky + lint-staged**: pre-commit che lancia format:check, lint, type-check, test.
- **CI GitHub Actions**: su push/PR esegue format:check, lint, type-check, test, build.

---

## 5) Configurazioni attese (sintesi)

### TypeScript

- `baseUrl: "."`, `paths: { "@/*": ["./src/*"] }`
- `jsx: "react-jsx"`
- `include: ["src"]`, `exclude: ["dist", "node_modules"]`

### Vite

- Alias `@` → `./src`
- Dev server `:5173`
- **Proxy `/api`** verso backend locale (es. `http://localhost:3000`)
- Variabili env: `VITE_*` per configurazioni FE (es. `VITE_API_URL`)

### ESLint (flat, type-aware)

- Estendi config type-checked di `typescript-eslint`
- Plugin: `eslint-plugin-import`, `eslint-plugin-react-x`, `eslint-plugin-react-dom`
- Regole chiave: no `any`, import/order, explicit return types (sulle funzioni non triviali)

### Prettier

- `printWidth: 100`, `singleQuote: true`, `semi: false`, `trailingComma: "all"`
- Plugin: `prettier-plugin-packagejson`, `@trivago/prettier-plugin-sort-imports`

---

## 6) Test

- **Vitest** + **@testing-library/react** con `setupTests.ts` che importa `@testing-library/jest-dom`.
- Copri almeno: componenti condivisi critici, util libs, hook con logica.
- `npm run test` (CI: produce coverage `lcov`).

---

## 7) Git workflow

- **Commit atomici in inglese** (Conventional Commits): `feat: ...`, `fix: ...`, `refactor: ...`, `chore: ...`, `test: ...`, `docs: ...`.
- Per rimuovere file/dir, **usa shell** (`rm -rf` o `git rm -r`), mai lasciare residui.

---

## 8) Automazioni

- **Husky** (`pre-commit`): `format:check && lint && type-check && test`
- **lint-staged**: format + eslint --fix su file toccati.
- **GitHub Actions**: Node 20, `npm ci`, poi `format:check`, `lint`, `type-check`, `test`, `build`.

---

## 9) Definition of Done (DoD)

- Build locale e CI **verdi**.
- **Zero `any`** non motivati; **zero `@ts-ignore`** non motivati.
- Import ordinati, codice formattato, **nessun warning** ESLint.
- Test di base presenti e passanti; copertura significativa per unità critiche.
- Documentazione **aggiornata** (README: setup, scripts, struttura, convenzioni).

---

## 10) Checklist operativa (esegui nell’ordine)

1. **Imposta alias `@`** in Vite + TS, aggiorna import relativi.
2. **Configura TypeScript strict** (opzioni sopra) e correggi eventuali errori.
3. **Aggiungi ESLint flat type-aware** e fissa le violazioni.
4. **Aggiungi Prettier** + plugin import, crea `.editorconfig`.
5. **Integra Vitest + RTL** e `setupTests.ts`.
6. **Installa Husky + lint-staged** e crea hook `pre-commit`.
7. **Crea CI** (`.github/workflows/ci.yml`).
8. **Sposta tipi condivisi** in `src/types`, elimina duplicazioni e aggiorna import.
9. **Implementa proxy `/api`** in `vite.config.ts` se è presente un backend locale.
10. **Aggiorna README** (comandi, struttura, convenzioni, DoD).
11. Esegui: `npm run format:check && npm run lint && npm run type-check && npm run test && npm run build`.

---

## 11) Script NPM attesi

```jsonc
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "type-check": "tsc -b --pretty",
    "lint": "eslint .",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "test": "vitest --run",
    "test:watch": "vitest",
    "prepare": "husky install",
  },
}
```

---

## 12) Snippet pronti all’uso (appendice)

### `vite.config.ts` (alias + proxy)

```ts
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  server: {
    port: 5173,
    open: true,
    proxy: {
      '/api': { target: 'http://localhost:3000', changeOrigin: true },
    },
  },
})
```

### `vitest.config.ts`

```ts
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    coverage: { reporter: ['text', 'lcov'], all: true, include: ['src/**/*.{ts,tsx}'] },
  },
})
```

### `src/setupTests.ts`

```ts
import '@testing-library/jest-dom'
```

### `.prettierrc`

```json
{
  "$schema": "https://json.schemastore.org/prettierrc",
  "printWidth": 100,
  "singleQuote": true,
  "trailingComma": "all",
  "semi": false,
  "arrowParens": "always",
  "endOfLine": "lf",
  "plugins": ["prettier-plugin-packagejson", "@trivago/prettier-plugin-sort-imports"],
  "importOrder": ["^react$", "^@?\\w", "^@/(.*)$", "^[./]"],
  "importOrderSeparation": true,
  "importOrderBuiltinModulesToTop": true
}
```

### `eslint.config.js` (flat, type-aware, sintesi)

```js
import importPlugin from 'eslint-plugin-import'
import reactDom from 'eslint-plugin-react-dom'
import reactX from 'eslint-plugin-react-x'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  ...tseslint.configs.recommendedTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.node },
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: { 'react-x': reactX, 'react-dom': reactDom, import: importPlugin },
    rules: {
      ...reactX.configs['recommended-typescript'].rules,
      ...reactDom.configs.recommended.rules,
      'import/first': 'error',
      'import/newline-after-import': 'error',
      'import/no-duplicates': 'error',
      'import/order': [
        'error',
        {
          'newlines-between': 'always',
          alphabetize: { order: 'asc' },
          pathGroups: [{ pattern: '@/**', group: 'internal' }],
        },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
      '@typescript-eslint/explicit-function-return-type': ['error', { allowExpressions: true }],
    },
  },
)
```

---

## 13) Note finali

- Mantieni **coerenza**: qualunque nuova feature deve rispettare struttura, regole e DoD.
- In caso di dubbio, **ottimizza la leggibilità** e la **manutenibilità** prima delle micro‑ottimizzazioni.
