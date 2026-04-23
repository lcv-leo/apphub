# Changelog — AppHub

## [Security Publication Hardening] - 2026-04-23
### Segurança
- Memórias e contexto de agentes passaram a ser locais apenas: `.ai/`, `.aiexclude`, `.copilotignore` e `.github/copilot-instructions.md` foram adicionados ao ignore e removidos do índice Git com `git rm --cached`, preservando os arquivos no disco local.
- Regras de publicação foram endurecidas para impedir envio de `.env*`, `.dev.vars*`, `.wrangler/`, `.tmp/`, logs, bancos locais e artefatos de teste para GitHub/npm.
### Validação
- `git ls-files` confirmou ausência de memórias/artefatos locais rastreados; `npm pack --dry-run --json --ignore-scripts` não incluiu arquivos proibidos.

## [v04.00.10] - 2026-04-17
### Corrigido
- `wrangler.json` deixou de declarar `observability` por ser config de Cloudflare Pages; os logs do GitHub Actions confirmaram a incompatibilidade com `wrangler 4.83.0`.
### Motivação
- Restaurar o deploy do `apphub` sem reintroduzir configuração inválida para Pages.

## [v04.00.09] - 2026-04-17
### Alterado
- `wrangler.json` passou a declarar explicitamente `observability.logs.enabled = true`, `observability.logs.invocation_logs = true` e `observability.traces.enabled = true`.
- `src/App.tsx`, `src/main.tsx`, `src/components/ComplianceBanner.tsx`, `src/modules/compliance/LicencasModule.tsx` e `package.json` foram saneados para o Biome atual, preservando a UX intencional dos cards e removendo bloqueios preexistentes do gate local.
### Motivação
- Alinhar o baseline de telemetria Cloudflare do `apphub` ao padrão operacional do workspace.


## [v04.00.08] - 2026-04-10
### Adicionado
- **Biome 2.x**: lint + format com organizeImports
- **Vitest 4.1.4**: framework de testes adicionado (antes ausente)

### Alterado
- **vite**: 8.0.7 → 8.0.8
- **Dependabot groups**: @vitest/* e @biomejs/* adicionados

## [v04.00.07] - 2026-04-08
### Corrigido
- **Card URL Status Bar**: Restaurada funcionalidade que impede exibição da URL na barra de status do browser ao passar o mouse sobre os cards. Componente `Card` migrado de `<a href>` para `<div role="link">` com `onClick` via `window.open()`, mantendo acessibilidade (tabIndex, onKeyDown Enter/Space).

### Controle de versão
- `apphub`: APP v04.00.06 → APP v04.00.07

## [v04.00.06] - 2026-04-07
### Segurança
- **Vite 8.0.3 → 8.0.7**: Correção de 3 CVEs de severidade alta/média.

### Controle de versão
- `apphub`: APP v04.00.05 → APP v04.00.06

## [v04.00.05] - 2026-04-02
### Controle de versão
- `apphub`: APP v04.00.04 → APP v04.00.05

## [v04.00.04] - 2026-03-31
### Corrigido
- **Compliance - docs legais locais em runtime**: o `LicencasModule` passou a carregar `LICENSE`, `NOTICE` e `THIRDPARTY` a partir de `public/legal/*` via `BASE_URL`, eliminando dependência de `raw.githubusercontent.com` no browser e removendo os 404 recorrentes em produção.

### Controle de versão
- `apphub`: APP v04.00.03 → APP v04.00.04

## [v04.00.03] - 2026-03-31
### Corrigido
- **Compliance - GNU AGPLv3**: corrigido erro 404 no conteúdo descarregado do arquivo LICENSE, publicando o texto integral e atualizado da licença (~34KB) em conformidade técnica e jurídica.

### Controle de versão
- `apphub`: APP v04.00.02   APP v04.00.03

## [v04.00.02] — 2026-03-31
### Alterado
- **Fluxo indireto `preview` padronizado**: branch operacional `preview` adotado no repositório para promoções consistentes para `main`.
- **Automação de promoção**: workflow `.github/workflows/preview-auto-pr.yml` adicionado/atualizado para abrir/reusar PR `preview -> main`, habilitar auto-merge e tentar merge imediato quando elegível.
- **Permissões do GitHub Actions**: ajuste para permitir criação/aprovação de PR por workflow, eliminando falhas 403 operacionais.

### Controle de versão
- `apphub`: APP v04.00.01 → APP v04.00.02

## [v04.00.01] — 2026-03-29
### Alterado
- **CI/CD branch standardization**: workflow de deploy padronizado para publicar no branch `main` na Cloudflare Pages, com trigger GitHub em `main` e `concurrency.group` atualizado para `deploy-main`.

### Controle de versão
- `apphub`: APP v04.00.00 → APP v04.00.01

## [v04.00.00] — 2026-03-28
### Migração Arquitetural Completa (React 19 + TypeScript + Vite)
- **Stack**: migrado de HTML estático + JS vanilla + CSS para **React 19 + TypeScript 5.9 + Vite 8**.
- **Componentização**: `public/app.js` + `public/index.html` decompostos em `src/App.tsx` (componente React) + `src/types.ts` (interfaces tipadas) + `src/main.tsx` (entry point).
- **CSS preservado**: design system tiptap.dev (Google Blue) portado 1:1 de `public/styles.css` para `src/App.css`.
- **Build**: saída em `dist/` (Vite) — 194KB JS (61KB gzip), 6.5KB CSS (2KB gzip), 16 módulos, <1s.
- **Deploy**: `deploy.yml` atualizado com steps `setup-node`, `npm ci`, `npm run build`.
### Removido
- `public/app.js`, `public/index.html`, `public/styles.css` (substituídos por componentes React).
### Preservado
- `functions/api/config.js` — backend Pages Function (permanece vanilla JS).
- `public/cards.json` — fallback de dados.
- `public/favicon.svg` — asset estático.
- `public/_headers` — CSP policy (app público).

## [v03.04.00] — 2026-03-26
### UI/UX Redesign — tiptap.dev Style (Google Blue)
- **Design Tokens**: paleta primária de `#8ab4f8` (light blue) para `#1a73e8` (Google Blue). Background `#f5f4f4` (warm gray). Texto `#0d0d0d`. Bordas warm `rgba(0,0,0,0.08)`.
- **Tipografia**: `Inter` via Google Fonts.
- **Superfícies**: glassmorphism `backdrop-filter` removido → sólido branco limpo. Shadows de `0 10px 30px` → `0 1px 3px`.
- **Hero/Footer**: pill-shaped (`border-radius: 100px`).
- **Cards**: radius `1rem` → `30px`. Hover sutil. Card-icon com background `rgba(26,115,232,0.08)`.
- **Orbs de fundo**: opacidade 0.55 → 0.25, blur 88px → 100px (mais sutis e clean).
- **Favicon**: custom admin SVG (gear+monitor, Google Blue).
- **WCAG/eMAG**: focus-visible `#1a73e8`, skip-link, reduced-motion preservados. Dark mode com `#16171d` / `#d1d5db`.

## [v03.03.01] — 2026-03-24
### Alterado
- `public/_headers` atualizado para política CSP estável em runtime (`script-src` com `'unsafe-inline'`), eliminando dependência de hash inline volátil.
- Workflow de deploy ajustado para compatibilidade com Wrangler 4.77+ (`pages deploy` sem flags legadas `--functions` e `--config`).

### Corrigido
- Falha de deploy no GitHub Actions causada por flags removidas no Wrangler 4.77+.
- Bloqueio de script inline por CSP após deploy.

## [v03.03.00] — 2026-03-24
### Alterado
- Arquitetura de leitura migrada para API local `GET /api/config` via Cloudflare Pages Functions.
- Leitura agora usa binding D1 nativo (`BIGDATA_DB`) direto na `bigdata_db`, sem chamada a `admin.lcv.app.br`.
- `public/app.js` atualizado para consumir endpoint local (`/api/config`) com fallback para `cards.json`.
- Deploy atualizado para publicar `functions/` com `wrangler.json` e binding D1.
- CSP ajustada para reduzir ruído de inline script no navegador.

## [v03.02.00] — 2026-03-24
### Alterado
- Migração de configurações para bigdata_db centralizado
- Cards agora carregam do endpoint `/api/apphub/config` em admin-app com fallback para local
- Adicionadas funções `loadCardsFromApi()` e `loadCardsFromLocal()` com strategy de retry

## [v03.01.00] — 2026-03-22
### Alterado
- Padronização do sistema de versão para formato APP v00.00.00
- Cabeçalho de código adicionado (app.js)
- Rodapé simplificado — versão via variável APP_VERSION

## [v03.00.00] — Anterior
### Histórico
- Catálogo público de apps com validação de cards e URLs
