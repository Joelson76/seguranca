# SafeTrack — SaaS de Gestão SST

![CI](https://github.com/SEU-USUARIO/SafeTrack/workflows/CI%20-%20Testes%20e%20Build/badge.svg)
![E2E](https://github.com/SEU-USUARIO/SafeTrack/workflows/E2E%20-%20Testes%20End-to-End/badge.svg)
![Deploy](https://github.com/SEU-USUARIO/SafeTrack/workflows/Deploy%20-%20Vercel/badge.svg)
[![codecov](https://codecov.io/gh/SEU-USUARIO/SafeTrack/branch/master/graph/badge.svg)](https://codecov.io/gh/SEU-USUARIO/SafeTrack)

Plataforma completa de Segurança e Saúde no Trabalho (SST) para o mercado brasileiro.
Multi-tenant, responsivo, com isolamento total de dados por empresa via RLS do Supabase.

**🧪 40 testes automatizados** | **✅ 100% coverage** | **🚀 CI/CD no GitHub Actions**

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 18 + Vite + TypeScript |
| Estilização | TailwindCSS + shadcn/ui |
| Backend | Supabase (PostgreSQL + Auth + Storage + Realtime) |
| Edge Functions | Deno (Supabase Functions) |
| Estado | Zustand |
| Cache/Queries | TanStack Query v5 |
| Formulários | React Hook Form + Zod |
| Gráficos | Recharts |
| PDF | jsPDF + jspdf-autotable |
| Excel | xlsx |
| E-mail | Resend |
| Billing | Asaas |

## Módulos

- **Dashboard** — métricas em tempo real, alertas, gráficos de acidentes e EPIs
- **Funcionários** — CRUD, foto, ficha completa, filtro por setor
- **EPIs** — catálogo, controle de estoque, histórico de movimentos, alertas de CA
- **Entregas de EPI** — assinatura digital (canvas), comprovante PDF, filtros, devolução
- **Treinamentos** — tipos, NRs, participações, upload de certificado, vencimentos
- **Acidentes** — registro, fluxo de investigação, upload de evidências
- **Documentos** — PCMSO, PGR, PPRA, LTCAT e outros, alertas de validade
- **Relatórios** — PDF e Excel: funcionários, estoque, treinamentos vencidos, acidentes, ficha EPI
- **Configurações** — dados da empresa, logo, setores, usuários, senha, assinatura
- **Super Admin** — visão global de todos os tenants
- **Landing page** — planos, FAQ, depoimentos, CTA

## Configuração inicial

### 1. Criar projeto no Supabase
Acesse [supabase.com](https://supabase.com) e crie um projeto. Anote:
- Project URL
- Anon Key
- Service Role Key (para Edge Functions)

### 2. Variáveis de ambiente
```bash
# web/.env.local
VITE_SUPABASE_URL=https://SEU_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=seu_anon_key
```

### 3. Banco de dados
Execute as migrations em ordem no SQL Editor do Supabase:
```
supabase/migrations/001_enums_e_tenants.sql
supabase/migrations/002_usuarios.sql
supabase/migrations/003_funcionarios.sql
supabase/migrations/004_epis_estoque.sql
supabase/migrations/005_treinamentos.sql
supabase/migrations/006_acidentes_documentos.sql
supabase/migrations/007_assinaturas_notificacoes.sql
supabase/migrations/009_seed_inicial.sql  ← editar com seus dados
supabase/migrations/010_indices_performance.sql
```

### 4. Primeiro usuário
1. Crie o usuário no Supabase Dashboard → Authentication → Users
2. Edite `009_seed_inicial.sql` com o UUID do usuário e execute

### 5. Executar localmente
```bash
cd web
npm install
npm run dev
```
Acesse: http://localhost:5173

## Edge Functions

```bash
# Instalar Supabase CLI
npm install -g supabase

# Deploy das functions
supabase functions deploy alertas-diarios
supabase functions deploy asaas-webhook

# Variáveis de ambiente das functions
supabase secrets set RESEND_API_KEY=re_xxxxx
supabase secrets set FROM_EMAIL=alertas@seudominio.com.br
supabase secrets set APP_URL=https://app.safetrack.com.br
supabase secrets set ASAAS_WEBHOOK_TOKEN=seu_token
```

### pg_cron (alertas diários)
Execute no SQL Editor após habilitar as extensões `pg_cron` e `pg_net`:
```sql
-- Configurar URL e key
ALTER DATABASE postgres SET app.supabase_url = 'https://SEU_PROJECT.supabase.co';
ALTER DATABASE postgres SET app.service_role_key = 'SEU_SERVICE_ROLE_KEY';

-- Executar migration 008
```

## Deploy (Vercel)

```bash
# Na raiz do projeto
vercel --cwd web

# Ou conecte o repositório no painel da Vercel
# Build command: npm run build
# Output dir: dist
# Root dir: web
```

## Variáveis de ambiente Vercel
```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

## Regras de desenvolvimento

1. **Nunca filtrar por `tenant_id` no frontend** — o RLS do Supabase faz automaticamente
2. **Uploads sempre via Supabase Storage** — nunca armazenar localmente
3. **Autenticação exclusivamente via Supabase Auth** — sem JWT manual
4. **Interface em português (pt-BR)** — datas em dd/MM/yyyy, moeda em BRL
5. **Alias `@/`** aponta para `web/src/`

## Estrutura de buckets (Supabase Storage)

| Bucket | Acesso | Conteúdo |
|--------|--------|----------|
| `documentos` | Privado | PDFs SST, evidências de acidentes |
| `assinaturas` | Privado | Assinaturas digitais de EPI |
| `fotos-funcionario` | Privado | Fotos de perfil |
| `certificados` | Privado | Certificados de treinamento |
| `logos` | Público | Logos das empresas |

## Testes

SafeTrack possui suite completa de testes automatizados:

```bash
# Testes unitários (Vitest)
cd web
npm test                # 22 testes
npm run test:coverage   # Com coverage report

# Testes E2E (Playwright)
npm run test:e2e        # 18 testes
npm run test:e2e:ui     # Modo visual interativo
```

**Cobertura:**
- ✅ 22 testes unitários (componentes, utils)
- ✅ 18 testes E2E (fluxos completos)
- ✅ 100% coverage nos arquivos testados
- ✅ CI/CD roda automaticamente em cada push/PR

Ver documentação completa: [`web/TESTES.md`](web/TESTES.md)

## CI/CD

GitHub Actions configurado com 3 workflows:

1. **CI - Testes e Build** (`ci.yml`)
   - Roda em cada push/PR
   - ESLint + testes unitários + build
   - Upload de coverage para Codecov

2. **E2E - Testes End-to-End** (`e2e.yml`)
   - Roda em push/PR para master/main
   - Testes com Playwright no Chromium
   - Screenshots de falhas como artifacts

3. **Deploy - Vercel** (`deploy.yml`)
   - Deploy automático quando merged na main
   - Comentário com URL no PR

### Configurar Secrets no GitHub

Para habilitar CI/CD completo:

```
Settings → Secrets and variables → Actions → New repository secret

# Para testes E2E
TEST_USER_EMAIL = teste.e2e@safetrack.com
TEST_USER_PASSWORD = Teste@123456

# Para deploy Vercel (opcional)
VERCEL_TOKEN = seu_token_vercel
VERCEL_ORG_ID = org_xxxxx
VERCEL_PROJECT_ID = prj_xxxxx
```
