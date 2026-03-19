# Como adicionar um novo card (modo simples)

Edite **somente** o arquivo `public/cards.json`.

## Estrutura
- `open`: cards de acesso liberado
- `restricted`: cards de acesso restrito

Cada card deve conter:
- `name`
- `description`
- `url` (obrigatoriamente `https://`)
- `icon` (emoji)
- `badge` (ex.: `Abrir App` ou `Autenticar`)

## Exemplo
```json
{
  "name": "Novo App",
  "description": "Descrição curta do app.",
  "url": "https://novo-app.exemplo.com",
  "icon": "🆕",
  "badge": "Abrir App"
}
```

## Validação rápida local
- `node .github/scripts/audit-static.mjs`
- `node .github/scripts/audit-external-links.mjs --timeout=4500 --concurrency=3`
- `node .github/scripts/audit-structure-snapshot.mjs --update`
- `node .github/scripts/audit-structure-snapshot.mjs`
