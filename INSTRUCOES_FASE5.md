# 📋 Instruções de Deploy — Fase 5

## ✅ Checklist de Implementação

### 1. Migrations do Banco de Dados

Execute no **SQL Editor do Supabase** (na ordem):

1. `supabase/migrations/20260608_notificacoes.sql`
2. `supabase/migrations/20260608_rpc_estoque_critico.sql`

### 2. Configuração do Supabase CLI (local)

```bash
# Instalar Supabase CLI globalmente
npm install -g supabase

# Navegar para o projeto
cd C:\ProjetoClaudeCode\seguranca

# Inicializar (se ainda não foi feito)
supabase init

# Login no Supabase
supabase login

# Linkar com o projeto remoto
supabase link --project-ref SEU_PROJECT_ID
```

**Como encontrar o PROJECT_ID:**
- Acesse o Supabase Dashboard
- Vá em Settings → General
- Copie o "Reference ID"

### 3. Deploy da Edge Function

```bash
# Fazer deploy da função alertas-diarios
supabase functions deploy alertas-diarios

# Configurar secrets (variáveis de ambiente)
supabase secrets set RESEND_API_KEY=sua_chave_resend_aqui
supabase secrets set APP_URL=https://app.safetrack.com.br
supabase secrets set FROM_EMAIL=alertas@safetrack.com.br
```

**Obter chave do Resend (para envio de e-mails):**
1. Acesse https://resend.com
2. Crie uma conta (plano gratuito: 3000 emails/mês)
3. Gere uma API key
4. Configure o domínio de envio

### 4. Agendar Execução Diária com pg_cron

Execute no **SQL Editor do Supabase**:

```sql
-- Habilitar extensão pg_cron (se não estiver habilitada)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Agendar execução diária às 8h da manhã
SELECT cron.schedule(
  'alertas-diarios-safetrack',
  '0 8 * * *',  -- Todo dia às 8h (horário UTC)
  $$
  SELECT net.http_post(
    url := 'https://SEU_PROJECT_ID.supabase.co/functions/v1/alertas-diarios',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  )
  $$
);

-- Verificar jobs agendados
SELECT * FROM cron.job;
```

**⚠️ Importante:** Substitua `SEU_PROJECT_ID` pelo ID real do projeto Supabase.

### 5. Habilitar Realtime para Notificações

No Supabase Dashboard:
1. Vá em Database → Replication
2. Ative a replicação para a tabela `notificacoes`
3. Marque as colunas: `id`, `titulo`, `mensagem`, `tipo`, `lida`, `criado_em`

### 6. Testar a Edge Function Manualmente

No terminal:

```bash
# Invocar a função manualmente para testar
supabase functions invoke alertas-diarios --no-verify-jwt

# Ou via curl
curl -X POST https://SEU_PROJECT_ID.supabase.co/functions/v1/alertas-diarios \
  -H "Authorization: Bearer SEU_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json"
```

### 7. Verificar Logs da Edge Function

```bash
# Ver logs em tempo real
supabase functions logs alertas-diarios --tail

# Ver logs históricos
supabase functions logs alertas-diarios
```

## 🎯 Funcionalidades Implementadas

### Frontend
- ✅ Hook `useNotificacoes` com Realtime
- ✅ Sino de notificações no Header com badge de contagem
- ✅ Dropdown de notificações no Header
- ✅ Página completa `/app/notificacoes`
- ✅ Toast automático para novas notificações

### Backend
- ✅ Tabela `notificacoes` com RLS
- ✅ RPC `epis_estoque_critico()`
- ✅ RPC `marcar_todas_notificacoes_lidas()`
- ✅ Edge Function `alertas-diarios`
- ✅ Agendamento com pg_cron

### Alertas Automatizados
1. **EPIs com estoque crítico** (quantidade ≤ estoque_minimo)
2. **Treinamentos vencendo** (próximos 30 dias)
3. **Documentos vencendo** (próximos 60 dias)
4. **E-mail consolidado** (via Resend) para admins de cada tenant
5. **Notificações in-app** em tempo real

## 🔧 Troubleshooting

### Notificações não aparecem em tempo real
- Verificar se a replicação está habilitada no Supabase
- Verificar console do navegador por erros de WebSocket
- Verificar se o usuário tem permissão de SELECT em `notificacoes`

### Edge Function não executa
- Verificar logs: `supabase functions logs alertas-diarios`
- Verificar se os secrets foram configurados
- Testar invocação manual

### E-mails não são enviados
- Verificar se `RESEND_API_KEY` está configurada
- Verificar domínio de envio no Resend
- Verificar logs da Edge Function

### pg_cron não agenda
- Verificar se a extensão está habilitada: `SELECT * FROM pg_extension WHERE extname = 'pg_cron';`
- Verificar se o job foi criado: `SELECT * FROM cron.job;`
- Verificar horário (pg_cron usa UTC)

## 📚 Próximos Passos

Com a Fase 5 concluída, o sistema SafeTrack tem:
- ✅ Autenticação multi-tenant
- ✅ Gestão de funcionários e EPIs
- ✅ Controle de entregas e treinamentos
- ✅ Registro de acidentes e documentos
- ✅ Dashboard e relatórios
- ✅ **Notificações em tempo real e alertas por e-mail**

**Fase 6 (próxima):** Billing, Admin e Deploy em produção
