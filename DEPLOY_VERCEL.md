# 🚀 Deploy SafeTrack — Guia Completo Vercel

## ✅ Pré-requisitos

- ✅ Projeto Supabase configurado e em produção
- ✅ Todas as migrations executadas
- ✅ Buckets de Storage criados (documentos, assinaturas, fotos-funcionario, certificados, logos)
- ✅ Edge Functions deployadas (alertas-diarios, convidar-usuario, asaas-webhook)
- ✅ Realtime habilitado para tabela `notificacoes`
- ✅ Conta na Vercel (https://vercel.com)
- ✅ Repositório Git (GitHub, GitLab ou Bitbucket)

---

## 📋 Passo 1: Preparar o Repositório

### 1.1 Criar arquivo `.gitignore` (se não existir)

```gitignore
# Dependencies
node_modules/
web/node_modules/

# Build
web/dist/
web/.vite/

# Env
.env
.env.local
.env.production
web/.env
web/.env.local
web/.env.production

# Logs
*.log
npm-debug.log*

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo

# Supabase
.branches/
.temp/
```

### 1.2 Verificar `package.json` do frontend

O arquivo `web/package.json` deve ter os scripts corretos:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0"
  }
}
```

### 1.3 Criar arquivo `vercel.json` na raiz do projeto

```json
{
  "buildCommand": "cd web && npm install && npm run build",
  "outputDirectory": "web/dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### 1.4 Commitar tudo e fazer push para o repositório

```bash
git add .
git commit -m "feat: preparar deploy Vercel - Fase 6 concluída"
git push origin main
```

---

## 📦 Passo 2: Deploy na Vercel

### 2.1 Importar Projeto

1. Acesse https://vercel.com/new
2. Clique em **"Import Git Repository"**
3. Selecione o repositório `ProjetoClaudeCode/seguranca`
4. Configure:
   - **Framework Preset:** Vite
   - **Root Directory:** `web`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

### 2.2 Configurar Variáveis de Ambiente

Na aba **Environment Variables**, adicione:

| Nome | Valor | Ambiente |
|------|-------|----------|
| `VITE_SUPABASE_URL` | `https://SEU_PROJECT_ID.supabase.co` | Production |
| `VITE_SUPABASE_ANON_KEY` | `sua_chave_anon_key_aqui` | Production |

**Como encontrar essas variáveis:**
1. Acesse o Supabase Dashboard
2. Vá em **Settings → API**
3. Copie:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** → `VITE_SUPABASE_ANON_KEY`

### 2.3 Fazer Deploy

1. Clique em **"Deploy"**
2. Aguarde o build (2-5 minutos)
3. Acesse a URL gerada (ex: `safetrack.vercel.app`)

---

## 🔧 Passo 3: Configurações Pós-Deploy

### 3.1 Configurar Domínio Customizado (Opcional)

1. No painel Vercel, vá em **Settings → Domains**
2. Adicione seu domínio (ex: `app.safetrack.com.br`)
3. Configure o DNS conforme instruções da Vercel
4. Aguarde propagação (até 48h)

### 3.2 Atualizar URLs no Supabase

No Supabase Dashboard → **Authentication → URL Configuration**:

- **Site URL:** `https://app.safetrack.com.br` (ou sua URL Vercel)
- **Redirect URLs:** Adicionar:
  - `https://app.safetrack.com.br/**`
  - `https://*.vercel.app/**`

### 3.3 Configurar CORS no Supabase

No SQL Editor, execute:

```sql
-- Permitir requisições do frontend Vercel
ALTER DATABASE postgres SET "app.settings.cors_allowed_origins" = 'https://app.safetrack.com.br,https://safetrack.vercel.app';
```

### 3.4 Atualizar URLs nas Edge Functions

Atualizar variáveis de ambiente das Edge Functions:

```bash
supabase secrets set APP_URL=https://app.safetrack.com.br
supabase secrets set FROM_EMAIL=noreply@safetrack.com.br
```

---

## ✅ Passo 4: Testes Pós-Deploy

### 4.1 Checklist de Funcionalidades

Acesse a URL de produção e teste:

- [ ] Landing page carrega corretamente
- [ ] Login com usuário existente funciona
- [ ] Dashboard exibe dados corretamente
- [ ] Upload de arquivos funciona (logo, documentos, fotos)
- [ ] Notificações em tempo real funcionam
- [ ] Geração de PDF funciona (relatórios, entregas)
- [ ] Criação de funcionário/EPI/treinamento funciona
- [ ] Sidebar e navegação funcionam
- [ ] Dark mode funciona
- [ ] Mobile responsivo funciona

### 4.2 Testar Autenticação

1. Criar nova conta via `/login`
2. Completar onboarding
3. Navegar pelas páginas
4. Fazer logout e login novamente

### 4.3 Verificar Console do Navegador

- Não deve haver erros 404 ou CORS
- Verificar que as requisições para Supabase estão funcionando
- Verificar WebSocket do Realtime conectado

---

## 🐛 Troubleshooting

### Erro: "Failed to fetch" ou CORS

**Solução:**
1. Verificar se `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` estão corretas
2. Verificar se a URL do Vercel está nas **Redirect URLs** do Supabase
3. Limpar cache do browser e fazer hard refresh (Ctrl+Shift+R)

### Build falha na Vercel

**Solução:**
1. Verificar logs do build na Vercel
2. Verificar se `web/package.json` tem todas as dependências
3. Rodar `npm run build` localmente para reproduzir o erro
4. Verificar se há imports errados ou arquivos faltando

### Página em branco após deploy

**Solução:**
1. Verificar console do navegador (F12)
2. Verificar se o arquivo `vercel.json` está configurado corretamente (rewrites)
3. Verificar se as variáveis de ambiente estão setadas

### Uploads não funcionam

**Solução:**
1. Verificar se os buckets existem no Supabase Storage
2. Verificar políticas RLS dos buckets
3. Verificar no console do navegador se há erros de permissão

### Realtime não funciona

**Solução:**
1. Verificar se Realtime está habilitado para a tabela `notificacoes`
2. Verificar no console se há erro de WebSocket
3. Testar criando notificação manualmente via SQL Editor

---

## 🔄 CI/CD Automático (Opcional)

A Vercel faz deploy automático a cada push no repositório Git.

Para configurar ambientes (staging/production):

1. **Production:** branch `main` → `app.safetrack.com.br`
2. **Staging:** branch `develop` → `staging.safetrack.vercel.app`

Configure no **Settings → Git** da Vercel.

---

## 📊 Monitoramento

### Analytics da Vercel

- Acesse **Analytics** no painel Vercel
- Monitore: page views, performance, erros

### Logs em Tempo Real

```bash
vercel logs safetrack --follow
```

### Supabase Dashboard

- **Database → Performance:** queries lentas
- **Logs → Explorer:** erros de API
- **Realtime → Inspector:** conexões WebSocket

---

## 🎉 Deploy Concluído!

Seu SafeTrack está no ar! 🚀

**Próximos passos:**
1. Configurar domínio customizado
2. Configurar billing (Stripe/Asaas)
3. Configurar monitoramento (Sentry, LogRocket)
4. Configurar backup automático do banco
5. Criar documentação de usuário
6. Planejar marketing e aquisição de clientes

---

## 📞 Suporte

- **Vercel:** https://vercel.com/support
- **Supabase:** https://supabase.com/docs
- **GitHub Issues:** Criar issue no repositório para bugs

---

**SafeTrack — Gestão SST Completa** 🛡️
