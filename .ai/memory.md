# AI Memory Log - apphub

## 2026-03-28 — AppHub v04.00.00 — Migração Arquitetural Completa (React 19 + TypeScript + Vite)
### Alterado (MAJOR)
- **Stack**: migrado de HTML estático + JS vanilla + CSS para **React 19 + TypeScript 5.9 + Vite 8**.
- **Componentização**: `public/app.js` + `public/index.html` decompostos em `src/App.tsx` + `src/types.ts` + `src/main.tsx`.
- **CSS preservado**: design system tiptap.dev (Google Blue) portado 1:1 para `src/App.css`.
- **Build**: 194KB JS (61KB gzip), 6.5KB CSS (2KB gzip), 16 módulos, <1s.
- **Deploy**: `deploy.yml` com `setup-node` + `npm ci` + `npm run build`.
- **Dependabot**: seção `npm` adicionada ao `dependabot.yml`.
### Removido
- `public/app.js`, `public/index.html`, `public/styles.css`.
### Preservado
- `functions/api/config.js`, `public/cards.json`, `public/favicon.svg`, `public/_headers`.
### Controle de versão
- `apphub`: APP v03.04.00 → APP v04.00.00

## 2026-03-26 — AdminHub v01.05.00 + AppHub v03.04.00 — UI/UX Redesign (tiptap.dev, Google Blue)

### Escopo
- **Ambos apps** receberam redesign completo do CSS seguindo design language do tiptap.dev.
- Paleta: violet/pink → Google Blue `#1a73e8`. Background: warm gray `#f5f4f4`. Texto: `#0d0d0d`.
- Glassmorphism pesado removido → superfícies sólidas brancas com shadows `0 1px 3px`.
- Hero/footer pill-shaped (100px radius). Cards 30px radius. Orbs mais sutis (opacity 0.25, blur 100px).
- `Inter` via Google Fonts adicionada a ambos `index.html`.
- Favicon admin SVG (gear+monitor) adicionado a ambos.
- WCAG/eMAG: focus-visible `#1a73e8`, skip-link, reduced-motion, dark mode preservados.

### Controle de versão
- `adminhub`: v01.04.02 → v01.05.00.
- `apphub`: v03.03.01 → v03.04.00.
