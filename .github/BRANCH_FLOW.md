# Fluxo de branches (GitHub x Cloudflare)

## Resumo rápido
- **GitHub (origem):** `main`
- **Cloudflare Pages (destino de produção):** `production`

## Como funciona
1. Push/PR em `main` aciona os quality gates.
2. Push em `main` aciona o workflow de deploy.
3. O deploy publica em `production` no Cloudflare Pages (`branch: production`).

## Por que assim?
- Mantém o padrão do repositório em `main`.
- Preserva o ambiente de produção da Cloudflare separado e explícito.
- Evita confusão entre branch de origem (GitHub) e branch/ambiente de destino (Cloudflare).
