# PADRÕES DE COMMIT UTILIZADOS NO PROJETO

🎉 start: Inicial  
📚 docs: Atualiza README  
🐛 fix: Corrige loop na 50  
✨ feat: Adiciona login  
💄 feat: Estiliza formulário  
🧱 ci: Modifica Dockerfile  
♻️ refactor: Refatora para arrow functions  
⚡ perf: Melhora resposta  
💥 fix: Reverte mudanças  
🧪 test: Adiciona teste  
💡 docs: Comenta função  
🗃️ raw: Adiciona dados RAW  
🧹 cleanup: Limpa validação  
🗑️ remove: Remove arquivos inúteis

# COMMITS NO GIT HUB

bunx npm version minor --no-git-tag-version --no-git-checks
git init
git add .
git commit -m "✨ feat: "
git push -u origin producao

# COMANDOS DO WRANGLER:

npx wrangler d1 execute backend-assinatura --file=./schema.sql --local

npx wrangler d1 execute backend-assinatura --file=./schema.sql --remote

wrangler logout

wrangler login

# PADRÃO DO CRUD NAS CONTROLLERS E MODELS

```plaintext
POST::  criar
GET::   buscar_pelo_filtro
GET::   buscar_pelo_id
PATCH:: atualizar_pelo_id
DELETE:: deletar_pelo_id
```

### DESCOBRIR O IP DA PESSOA

https://cloudflare.com/cdn-cgi/trace

# Versionamento semântico (SemVer): Use o padrão X.Y.Z (Major.Minor.Patch)

X (Major): Primeiro número - aumentado quando ocorrem mudanças incompatíveis com versões anteriores (breaking changes)
Y (Minor): Número do meio - aumentado quando adicionados novos recursos compatíveis com versões anteriores
Z (Patch): Último número - aumentado para correções de bugs e pequenos ajustes que não alteram a funcionalidade existente

# START PROJETO

"start": "npm run build:worker && concurrently \"npm run dev:frontend\" \"npm run dev:worker\"",

# ENV DO FRONT-END

#BASE URL:
PUBLIC_BASE_URL_FRONTEND=http://127.0.0.1:8787
PUBLIC_BASE_URL_BACKEND=http://127.0.0.1:8787
PUBLIC_BASE_URL_BUCKET=http://127.0.0.1:8787

PUBLIC_NODE_ENV=localhost

PUBLIC_PUSHER_APP_KEY=c2d55ac16d409c9cfee3
PUBLIC_PUSHER_APP_CLUSTER=sa1+
