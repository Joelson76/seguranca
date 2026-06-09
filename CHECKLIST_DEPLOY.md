# ✅ Checklist de Deploy — SafeTrack

Use este checklist para garantir que tudo está configurado antes de ir para produção.

---

## 🗄️ Banco de Dados (Supabase)

### Migrations
- [ ] Executar migration `001_enums_e_tenants.sql`
- [ ] Executar migration `002_usuarios.sql`
- [ ] Executar migration `003_funcionarios.sql`
- [ ] Executar migration `004_epis_estoque.sql`
- [ ] Executar migration `005_treinamentos.sql`
- [ ] Executar migration `006_acidentes_documentos.sql`
- [ ] Executar migration `007_assinaturas_notificacoes.sql`
- [ ] Executar migration `008_pg_cron_alertas.sql`
- [ ] Executar migration `009_seed_inicial.sql`
- [ ] Executar migration `010_indices_performance.sql`
- [ ] Executar migration `011_auditoria.sql` (se existir)
- [ ] Executar migration `012_fase3_policies_update.sql`
- [ ] Executar migration `20260608_notificacoes.sql`
- [ ] Executar migration `20260608_rpc_estoque_critico.sql`

### Storage (Buckets)
- [ ] Criar bucket `documentos` (privado)
- [ ] Criar bucket `assinaturas` (privado)
- [ ] Criar bucket `fotos-funcionario` (privado)
- [ ] Criar bucket `certificados` (privado)
- [ ] Criar bucket `logos` (público)

### Políticas RLS dos Buckets
```sql
-- Executar no SQL Editor para cada bucket privado
CREATE POLICY "acesso_tenant" ON storage.objects
  FOR ALL
  USING (bucket_id = 'NOME_DO_BUCKET' AND (storage.foldername(name))[1] = auth.tenant_id()::text);
```

- [ ] Política RLS criada para bucket `documentos`
- [ ] Política RLS criada para bucket `assinaturas`
- [ ] Política RLS criada para bucket `fotos-funcionario`
- [ ] Política RLS criada para bucket `certificados`

### Realtime
- [ ] Habilitar replicação da tabela `notificacoes`
- [ ] Testar conexão WebSocket (console do navegador)

### Authentication
- [ ] Configurar **Site URL** no Supabase (URL do Vercel)
- [ ] Adicionar **Redirect URLs**:
  - [ ] `https://app.safetrack.com.br/**`
  - [ ] `https://*.vercel.app/**`
- [ ] Habilitar **Email Confirmations** (se necessário)
- [ ] Configurar template de e-mail de convite (opcional)

---

## ⚡ Edge Functions (Supabase)

### Deploy das Funções
```bash
supabase login
supabase link --project-ref SEU_PROJECT_ID
supabase functions deploy alertas-diarios
supabase functions deploy convidar-usuario
supabase functions deploy asaas-webhook
```

- [ ] Edge Function `alertas-diarios` deployada
- [ ] Edge Function `convidar-usuario` deployada
- [ ] Edge Function `asaas-webhook` deployada (se usar Asaas)

### Secrets (Variáveis de Ambiente)
```bash
supabase secrets set RESEND_API_KEY=sua_chave_resend
supabase secrets set APP_URL=https://app.safetrack.com.br
supabase secrets set FROM_EMAIL=noreply@safetrack.com.br
```

- [ ] Secret `RESEND_API_KEY` configurado
- [ ] Secret `APP_URL` configurado
- [ ] Secret `FROM_EMAIL` configurado
- [ ] Testar envio de e-mail manualmente

### pg_cron (Agendamento)
```sql
SELECT cron.schedule(
  'alertas-diarios-safetrack',
  '0 8 * * *',
  $$
  SELECT net.http_post(
    url := 'https://SEU_PROJECT_ID.supabase.co/functions/v1/alertas-diarios',
    headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')),
    body := '{}'::jsonb
  )
  $$
);
```

- [ ] Job `alertas-diarios-safetrack` agendado
- [ ] Testar execução manual da Edge Function
- [ ] Verificar que notificações são criadas

---

## 🎨 Frontend (Vercel)

### Repositório Git
- [ ] Código commitado no GitHub/GitLab/Bitbucket
- [ ] Branch `main` atualizada
- [ ] Arquivo `vercel.json` na raiz do projeto
- [ ] Arquivo `.gitignore` configurado (não subir `.env`)

### Vercel — Importar Projeto
- [ ] Criar conta na Vercel (https://vercel.com)
- [ ] Importar repositório Git
- [ ] Configurar:
  - **Framework:** Vite
  - **Root Directory:** `web`
  - **Build Command:** `npm run build`
  - **Output Directory:** `dist`

### Variáveis de Ambiente na Vercel
- [ ] Adicionar `VITE_SUPABASE_URL` (Production)
- [ ] Adicionar `VITE_SUPABASE_ANON_KEY` (Production)

### Deploy
- [ ] Clicar em **"Deploy"**
- [ ] Aguardar build (~2-5 min)
- [ ] Verificar que deploy foi bem-sucedido
- [ ] Acessar URL gerada (ex: `safetrack.vercel.app`)

### Domínio Customizado (Opcional)
- [ ] Adicionar domínio no painel Vercel
- [ ] Configurar DNS (A/CNAME)
- [ ] Aguardar propagação
- [ ] Verificar certificado SSL ativo

---

## 🧪 Testes Pós-Deploy

### Landing Page
- [ ] Página `/` carrega corretamente
- [ ] Todos os links funcionam
- [ ] Botões "Entrar" e "Começar grátis" redirecionam para `/login`
- [ ] FAQ abre/fecha corretamente
- [ ] Footer com links
- [ ] Mobile responsivo

### Autenticação
- [ ] Login com usuário existente funciona
- [ ] Redirect para `/app/dashboard` após login
- [ ] Logout funciona
- [ ] Recuperação de senha funciona (recebe e-mail)
- [ ] Onboarding de novo tenant funciona
- [ ] Convite de usuário funciona (recebe e-mail)

### Funcionalidades Core
- [ ] Dashboard exibe dados corretos
- [ ] Criar funcionário funciona
- [ ] Upload de foto de funcionário funciona
- [ ] Criar EPI funciona
- [ ] Criar entrega de EPI funciona
- [ ] Assinatura digital funciona (canvas)
- [ ] Download de comprovante PDF funciona
- [ ] Criar treinamento funciona
- [ ] Upload de certificado funciona
- [ ] Criar acidente funciona
- [ ] Upload de documentos funciona
- [ ] Gerar relatório PDF funciona
- [ ] Notificações em tempo real funcionam

### Notificações
- [ ] Sino no Header exibe badge com contador
- [ ] Dropdown de notificações funciona
- [ ] Página `/app/notificacoes` funciona
- [ ] Marcar como lida funciona
- [ ] Marcar todas como lidas funciona
- [ ] Toast aparece ao receber nova notificação
- [ ] Realtime funciona (testar em 2 abas diferentes)

### Configurações
- [ ] Alterar nome da empresa funciona
- [ ] Upload de logo funciona
- [ ] Logo aparece em relatórios PDF
- [ ] Convidar usuário funciona
- [ ] Alterar perfil de usuário funciona
- [ ] Desativar usuário funciona
- [ ] Alterar senha funciona
- [ ] Plano atual exibido corretamente

### Super Admin (apenas se super_admin)
- [ ] Página `/admin` acessível apenas para super_admin
- [ ] Lista de tenants exibida
- [ ] Suspender tenant funciona
- [ ] Reativar tenant funciona
- [ ] Métricas globais corretas

### Performance e UX
- [ ] Páginas carregam em < 2s
- [ ] Dark mode funciona
- [ ] Sidebar colapsável funciona
- [ ] Mobile funciona (testar em celular real)
- [ ] Toasts de feedback aparecem
- [ ] Loading states aparecem
- [ ] Não há erros no console do navegador
- [ ] Não há warnings no console

---

## 🔐 Segurança

- [ ] HTTPS habilitado (certificado SSL)
- [ ] Variáveis de ambiente não estão expostas no código
- [ ] Service Role Key não está no frontend
- [ ] RLS testado (usuário de um tenant não vê dados de outro)
- [ ] Políticas de Storage testadas (não consegue acessar arquivos de outro tenant)
- [ ] Redirect URLs configuradas corretamente (evita phishing)

---

## 📊 Monitoramento

### Vercel
- [ ] Configurar alertas de erro (opcional)
- [ ] Verificar Analytics (após alguns dias de uso)

### Supabase
- [ ] Verificar uso de banda (Database → Usage)
- [ ] Verificar logs de Edge Functions (se houver erros)
- [ ] Configurar alertas de uso (opcional)

### Externo (Opcional)
- [ ] Configurar Sentry para tracking de erros
- [ ] Configurar Google Analytics ou Plausible
- [ ] Configurar Uptime monitoring (ex: UptimeRobot)

---

## 💰 Billing (Pós-Deploy)

### Integração de Pagamento
- [ ] Criar conta no Stripe ou Asaas
- [ ] Configurar produtos e planos
- [ ] Integrar webhook de pagamento
- [ ] Testar fluxo de assinatura end-to-end
- [ ] Configurar e-mails de cobrança
- [ ] Testar downgrade/upgrade de plano
- [ ] Testar cancelamento de assinatura

---

## 📚 Documentação

- [ ] Documentação de usuário criada (opcional)
- [ ] Vídeos de onboarding gravados (opcional)
- [ ] Base de conhecimento (FAQ) publicada (opcional)
- [ ] Termos de uso e política de privacidade publicados

---

## 🚀 Marketing e Lançamento

- [ ] Landing page com SEO otimizado
- [ ] Meta tags (title, description, og:image)
- [ ] Google Search Console configurado
- [ ] Favicon adicionado
- [ ] Anúncio de lançamento preparado
- [ ] Lista de early adopters contatada
- [ ] Redes sociais criadas (LinkedIn, Instagram)

---

## ✅ Checklist Final

Antes de anunciar publicamente:

- [ ] ✅ Todas as migrations executadas
- [ ] ✅ Todos os buckets criados e com RLS
- [ ] ✅ Edge Functions deployadas e testadas
- [ ] ✅ Frontend deployado na Vercel
- [ ] ✅ Domínio customizado configurado (opcional)
- [ ] ✅ Variáveis de ambiente corretas
- [ ] ✅ Testes end-to-end passando
- [ ] ✅ Notificações em tempo real funcionando
- [ ] ✅ E-mails sendo enviados
- [ ] ✅ Segurança verificada (RLS, HTTPS)
- [ ] ✅ Monitoramento configurado
- [ ] ✅ Billing integrado (se for cobrar desde o início)
- [ ] ✅ Documentação de usuário pronta

---

## 🎉 Parabéns!

Se todos os itens acima estão ✅, o **SafeTrack está pronto para produção**!

**Próximo passo:** Anunciar e começar a vender! 🚀

---

**SafeTrack — Gestão SST Completa** 🛡️
