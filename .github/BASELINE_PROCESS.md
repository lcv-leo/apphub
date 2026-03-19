# Processo de atualização de baseline estrutural

## Objetivo
Evitar regressões no catálogo de cards (`open` e `restricted`) sem bloquear mudanças legítimas.

## Regra
- O CI padrão (`quality-gates.yml`) apenas valida snapshot.
- Atualização do baseline deve ser manual e justificada.

## Como atualizar
1. Ajuste intencionalmente `public/app.js` e/ou `public/index.html`.
2. Rode localmente:
   - `node .github/scripts/audit-structure-snapshot.mjs --update`
   - `node .github/scripts/audit-structure-snapshot.mjs`
3. Commit o baseline atualizado.

## Opção no GitHub Actions
Use o workflow manual `Baseline Refresh (Manual)` com o campo `reason` preenchido.

## Evidência de auditoria
O baseline salvo contém:
- `signature`
- `updatedAt`
- contagem de cards por seção
