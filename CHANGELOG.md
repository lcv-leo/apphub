# Changelog — AppHub

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
