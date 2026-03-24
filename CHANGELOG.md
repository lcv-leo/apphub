# Changelog — AppHub

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
