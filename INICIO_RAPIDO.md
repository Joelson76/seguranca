# 🚀 SafeTrack — Início Rápido

Guia para desenvolvedores que querem rodar o SafeTrack localmente em **menos de 10 minutos**.

---

## ⚡ TL;DR

```bash
# 1. Clonar e instalar
git clone <repository-url>
cd seguranca/web
npm install

# 2. Configurar Supabase
cp .env.example .env.local
# Editar .env.local com suas credenciais

# 3. Rodar
npm run dev
```

Acesse `http://localhost:5173`

---

## 📋 Pré-requisitos

- **Node.js 18+** ([nodejs.org](https://nodejs.org))
- **npm** ou **pnpm**
- **Conta no Supabase** ([supabase.com](https://supabase.com)) — plano gratuito

---

## 🛠️ Setup em 5 Passos

### 1️⃣ Criar Projeto no Supabase

1. Acesse https://supabase.com
2. Clique em **"New Project"**
3. Escolha:
   - **Nome:** SafeTrack (ou qualquer nome)
   - **Database Password:** anote a senha
   - **Region:** South America (São Paulo)
4. Aguarde ~2 minutos (criação do projeto)

### 2️⃣ Executar Migrations

No Supabase Dashboard, vá em **SQL Editor** e execute **na ordem**:

1. `supabase/migrations/001_enums_e_tenants.sql`
2. `supabase/migrations/002_usuarios.sql`
3. `supabase/migrations/003_funcionarios.sql`
4. `supabase/migrations/004_epis_estoque.sql`
5. `supabase/migrations/005_treinamentos.sql`
6. `supabase/migrations/006_acidentes_documentos.sql`
7. `supabase/migrations/007_assinaturas_notificacoes.sql`
8. `supabase/migrations/009_seed_inicial.sql` ⭐ **(importante — cria tenant e usuário admin)**
9. `supabase/migrations/010_indices_performance.sql`
10. `supabase/migrations/012_fase3_policies_update.sql`
11. `supabase/migrations/20260608_notificacoes.sql`
12. `supabase/migrations/20260608_rpc_estoque_critico.sql`

**Dica:** Cole todo o conteúdo de cada arquivo e clique em **"Run"**. Se der erro, leia a mensagem e corrija.

### 3️⃣ Criar Buckets de Storage

No Supabase Dashboard, vá em **Storage** e crie os seguintes buckets:

| Nome | Público? |
|------|----------|
| `documentos` | ❌ Privado |
| `assinaturas` | ❌ Privado |
| `fotos-funcionario` | ❌ Privado |
| `certificados` | ❌ Privado |
| `logos` | ✅ Público |

**Importante:** Para cada bucket **privado**, adicione a seguinte política RLS:

```sql
-- No SQL Editor
CREATE POLICY "acesso_tenant" ON storage.objects
  FOR ALL
  USING (
    bucket_id = 'NOME_DO_BUCKET' 
    AND (storage.foldername(name))[1] = auth.tenant_id()::text
  );
```

Substitua `NOME_DO_BUCKET` por: `documentos`, `assinaturas`, `fotos-funcionario`, `certificados`.

### 4️⃣ Configurar Frontend

```bash
cd web

# Copiar arquivo de exemplo
cp .env.example .env.local

# Editar .env.local
nano .env.local  # ou abrir no editor de texto
```

No Supabase Dashboard, vá em **Settings → API** e copie:

- **Project URL** → `VITE_SUPABASE_URL`
- **anon public** → `VITE_SUPABASE_ANON_KEY`

Exemplo de `.env.local`:

```env
VITE_SUPABASE_URL=https://abc123.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 5️⃣ Rodar o Projeto

```bash
npm install
npm run dev
```

Acesse: `http://localhost:5173`

---

## 🔐 Primeiro Acesso

### Login com Usuário Seed

A migration `009_seed_inicial.sql` cria um tenant e um usuário admin:

- **E-mail:** `admin@exemplo.com`
- **Senha:** `senha123`

**⚠️ IMPORTANTE:** Altere a senha imediatamente em **Configurações → Segurança**.

### Ou Criar Nova Empresa

1. Na tela de login, clique em **"Criar conta"**
2. Preencha:
   - Nome da empresa
   - CNPJ
   - Seu nome
   - E-mail
   - Senha
3. Complete o onboarding
4. Pronto! Você tem um novo tenant criado.

---

## 🧪 Testar Funcionalidades

### Dashboard
- Acesse `/app/dashboard`
- Verá cards com estatísticas (inicialmente zeradas)

### Criar Funcionário
1. Acesse `/app/funcionarios`
2. Clique em **"Novo funcionário"**
3. Preencha os dados
4. Faça upload de uma foto (opcional)
5. Salvar

### Criar EPI
1. Acesse `/app/epis`
2. Clique em **"Novo EPI"**
3. Preencha:
   - Nome (ex: Capacete de Segurança)
   - CA (ex: 12345)
   - Estoque mínimo (ex: 10)
   - Quantidade atual (ex: 50)
4. Salvar

### Criar Entrega de EPI
1. Acesse `/app/entregas`
2. Clique em **"Nova entrega"**
3. Selecione funcionário e EPI
4. Assine com o mouse/touch no canvas
5. Salvar
6. Baixe o comprovante PDF

### Ver Relatórios
1. Acesse `/app/relatorios`
2. Escolha um tipo (ex: "Funcionários ativos")
3. Clique em **"Gerar PDF"**
4. PDF será baixado automaticamente

---

## 🐛 Problemas Comuns

### Erro: "Failed to fetch"

**Causa:** Variáveis de ambiente erradas ou Supabase não configurado.

**Solução:**
1. Verificar `.env.local` está correto
2. Verificar que migrations foram executadas
3. Limpar cache: `Ctrl+Shift+R` no navegador

### Erro: "Invalid token"

**Causa:** Token JWT expirado ou RLS bloqueou.

**Solução:**
1. Fazer logout e login novamente
2. Verificar que as policies RLS estão criadas

### Upload de arquivo não funciona

**Causa:** Buckets não criados ou RLS errado.

**Solução:**
1. Verificar que os 5 buckets existem
2. Verificar políticas RLS dos buckets privados
3. Testar com bucket público (`logos`) primeiro

### Página em branco

**Causa:** Erro no JavaScript.

**Solução:**
1. Abrir console do navegador (F12)
2. Verificar erros
3. Rodar `npm run build` para ver erros de TypeScript

---

## 📚 Próximos Passos

Agora que está rodando:

1. **Explorar o sistema:**
   - Criar treinamentos
   - Registrar acidentes
   - Upload de documentos
   - Gerar relatórios

2. **Customizar:**
   - Alterar logo da empresa
   - Criar setores e cargos
   - Convidar usuários

3. **Testar notificações:**
   - Ver `TEST_NOTIFICACOES.md` para guia completo

4. **Deploy:**
   - Ver `DEPLOY_VERCEL.md` quando estiver pronto

---

## 📞 Ajuda

- **Documentação:** Ver arquivos `.md` na raiz do projeto
- **Supabase Docs:** https://supabase.com/docs
- **React Docs:** https://react.dev
- **shadcn/ui:** https://ui.shadcn.com

---

## 🎉 Pronto!

Você tem o SafeTrack rodando localmente! 🚀

Explore, customize e divirta-se desenvolvendo! 💻

---

**SafeTrack — Gestão SST Completa** 🛡️
