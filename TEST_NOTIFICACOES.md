# 🧪 Teste Manual — Sistema de Notificações

## Pré-requisitos
1. ✅ Migrations executadas no Supabase
2. ✅ Realtime habilitado para tabela `notificacoes`
3. ✅ Frontend rodando (`npm run dev`)
4. ✅ Usuário logado no sistema

---

## Teste 1: Criar Notificação Manual (via SQL Editor)

Execute no Supabase SQL Editor para simular uma notificação:

```sql
-- Primeiro, encontre o user_id do usuário logado
SELECT id, email FROM auth.users LIMIT 5;

-- Depois, insira uma notificação de teste
INSERT INTO notificacoes (tenant_id, usuario_id, titulo, mensagem, tipo, lida)
VALUES (
  (SELECT tenant_id FROM usuarios WHERE user_id = 'SEU_USER_ID_AQUI' LIMIT 1),
  'SEU_USER_ID_AQUI',
  'Teste de Notificação 🔔',
  'Esta é uma notificação de teste para verificar o sistema Realtime',
  'info',
  false
);
```

**Resultado esperado:**
- ✅ Toast aparece no canto superior direito
- ✅ Badge no sino do Header incrementa
- ✅ Notificação aparece no dropdown do sino
- ✅ Notificação aparece na página `/app/notificacoes`

---

## Teste 2: Marcar Como Lida (Individual)

1. Clique no sino no Header
2. Clique no ícone ✓ ao lado de uma notificação
3. A notificação deve desaparecer do dropdown
4. O badge deve decrementar

**Verificação no banco:**
```sql
SELECT id, titulo, lida FROM notificacoes
WHERE usuario_id = 'SEU_USER_ID_AQUI'
ORDER BY criado_em DESC;
```

---

## Teste 3: Marcar Todas Como Lidas

1. Clique no sino no Header
2. Clique em "Marcar todas como lidas"
3. Todas as notificações devem desaparecer
4. Badge deve zerar

**Verificação no banco:**
```sql
SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE lida = false) as nao_lidas
FROM notificacoes
WHERE usuario_id = 'SEU_USER_ID_AQUI';
```

---

## Teste 4: Página de Notificações

1. Navegue para `/app/notificacoes`
2. Verifique que todas as notificações aparecem (lidas e não lidas)
3. Notificações não lidas devem ter:
   - Borda esquerda azul
   - Badge "Nova"
   - 100% de opacidade
4. Notificações lidas devem ter 60% de opacidade

---

## Teste 5: Tipos de Notificação

Insira uma de cada tipo para verificar cores e ícones:

```sql
-- Tipo: info (azul)
INSERT INTO notificacoes (tenant_id, usuario_id, titulo, mensagem, tipo, lida)
VALUES (
  (SELECT tenant_id FROM usuarios WHERE user_id = 'SEU_USER_ID' LIMIT 1),
  'SEU_USER_ID',
  'Informação Geral',
  'Tipo: info',
  'info',
  false
);

-- Tipo: alerta (amarelo)
INSERT INTO notificacoes (tenant_id, usuario_id, titulo, mensagem, tipo, lida)
VALUES (
  (SELECT tenant_id FROM usuarios WHERE user_id = 'SEU_USER_ID' LIMIT 1),
  'SEU_USER_ID',
  'Atenção Necessária',
  'Tipo: alerta',
  'alerta',
  false
);

-- Tipo: critico (vermelho)
INSERT INTO notificacoes (tenant_id, usuario_id, titulo, mensagem, tipo, lida)
VALUES (
  (SELECT tenant_id FROM usuarios WHERE user_id = 'SEU_USER_ID' LIMIT 1),
  'SEU_USER_ID',
  'Situação Crítica',
  'Tipo: critico',
  'critico',
  false
);

-- Tipo: sucesso (verde)
INSERT INTO notificacoes (tenant_id, usuario_id, titulo, mensagem, tipo, lida)
VALUES (
  (SELECT tenant_id FROM usuarios WHERE user_id = 'SEU_USER_ID' LIMIT 1),
  'SEU_USER_ID',
  'Operação Bem-Sucedida',
  'Tipo: sucesso',
  'sucesso',
  false
);
```

**Verificar:**
- ✅ Toast com cor apropriada
- ✅ Ícone correto no dropdown e na página
- ✅ Cor de fundo do card correspondente

---

## Teste 6: Edge Function (Alertas Diários)

### Invocar manualmente:

```bash
# Via Supabase CLI
supabase functions invoke alertas-diarios --no-verify-jwt

# Via curl
curl -X POST https://SEU_PROJECT_ID.supabase.co/functions/v1/alertas-diarios \
  -H "Authorization: Bearer SEU_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json"
```

### Pré-condições para gerar alertas:

1. **EPI com estoque crítico:**
```sql
-- Criar um EPI com estoque abaixo do mínimo
INSERT INTO epis (tenant_id, nome, ca, estoque_minimo, quantidade_atual, ativo)
VALUES (
  'SEU_TENANT_ID',
  'Capacete Teste',
  '12345',
  50,
  10,  -- Abaixo do mínimo!
  true
);
```

2. **Treinamento vencendo:**
```sql
-- Criar treinamento vencendo em 20 dias
INSERT INTO funcionario_treinamentos (
  tenant_id,
  funcionario_id,
  treinamento_id,
  data_realizacao,
  data_vencimento,
  status
)
VALUES (
  'SEU_TENANT_ID',
  'ID_FUNCIONARIO',
  'ID_TREINAMENTO',
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '20 days',  -- Vence em 20 dias
  'valido'
);
```

3. **Documento vencendo:**
```sql
-- Criar documento vencendo em 45 dias
INSERT INTO documentos (tenant_id, nome, tipo, validade)
VALUES (
  'SEU_TENANT_ID',
  'ASO - Teste',
  'ASO',
  CURRENT_DATE + INTERVAL '45 days'  -- Vence em 45 dias
);
```

**Resultado esperado:**
- ✅ Notificações criadas para admins do tenant
- ✅ E-mail enviado (se Resend configurado)
- ✅ Logs mostram execução bem-sucedida

---

## Teste 7: Realtime (Múltiplas Abas)

1. Abra o app em duas abas/navegadores diferentes
2. Faça login com o mesmo usuário
3. Insira uma notificação via SQL (Teste 1)
4. **Ambas as abas** devem receber a notificação simultaneamente

---

## Teste 8: RLS (Segurança Multi-tenant)

```sql
-- Criar usuário em outro tenant
-- Tentar inserir notificação para tenant diferente
INSERT INTO notificacoes (tenant_id, usuario_id, titulo, mensagem, tipo)
VALUES (
  'OUTRO_TENANT_ID',
  'SEU_USER_ID',
  'Teste Cross-Tenant',
  'Esta notificação NÃO deve aparecer',
  'info'
);
```

**Resultado esperado:**
- ❌ INSERT bloqueado por RLS (apenas service_role pode inserir)
- ❌ Se inserido via service_role, notificação não aparece para o usuário (RLS de SELECT)

---

## Teste 9: Performance

Criar 100 notificações e verificar performance:

```sql
DO $$
BEGIN
  FOR i IN 1..100 LOOP
    INSERT INTO notificacoes (tenant_id, usuario_id, titulo, mensagem, tipo, lida)
    VALUES (
      (SELECT tenant_id FROM usuarios WHERE user_id = 'SEU_USER_ID' LIMIT 1),
      'SEU_USER_ID',
      'Notificação ' || i,
      'Teste de performance - ' || i,
      CASE WHEN i % 4 = 0 THEN 'critico' 
           WHEN i % 4 = 1 THEN 'alerta'
           WHEN i % 4 = 2 THEN 'sucesso'
           ELSE 'info' END,
      CASE WHEN i % 3 = 0 THEN true ELSE false END
    );
  END LOOP;
END $$;
```

**Verificar:**
- ✅ Página carrega rápido (< 1s)
- ✅ Scroll suave
- ✅ Badge atualiza corretamente
- ✅ Dropdown mostra apenas as 10 mais recentes não lidas

---

## Teste 10: pg_cron (Agendamento)

```sql
-- Verificar job agendado
SELECT * FROM cron.job WHERE jobname = 'alertas-diarios-safetrack';

-- Verificar histórico de execuções
SELECT * FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'alertas-diarios-safetrack')
ORDER BY start_time DESC
LIMIT 10;

-- Executar manualmente (simular cron)
SELECT cron.schedule(
  'teste-manual-alertas',
  '* * * * *',  -- A cada minuto (APENAS PARA TESTE!)
  $$
  SELECT net.http_post(
    url := 'https://SEU_PROJECT_ID.supabase.co/functions/v1/alertas-diarios',
    headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')),
    body := '{}'::jsonb
  )
  $$
);

-- Aguardar 1 minuto e verificar se notificações foram criadas

-- Remover job de teste
SELECT cron.unschedule('teste-manual-alertas');
```

---

## ✅ Checklist de Testes

- [ ] Notificação criada via SQL aparece no frontend
- [ ] Toast exibido com tipo correto (info/alerta/crítico/sucesso)
- [ ] Badge do sino atualiza corretamente
- [ ] Dropdown mostra notificações não lidas
- [ ] Marcar individual como lida funciona
- [ ] Marcar todas como lidas funciona
- [ ] Página `/app/notificacoes` exibe histórico completo
- [ ] Notificações lidas ficam com opacidade reduzida
- [ ] Realtime funciona em múltiplas abas
- [ ] RLS impede acesso cross-tenant
- [ ] Edge Function executa sem erros
- [ ] E-mail é enviado (se Resend configurado)
- [ ] pg_cron agenda corretamente

---

## 🐛 Problemas Comuns

### Notificação não aparece em tempo real
- Verificar console: erros de WebSocket?
- Verificar Supabase Dashboard → Database → Replication
- Verificar se usuário está autenticado

### Badge não atualiza
- Verificar `useNotificacoes.ts`: `naoLidas` calculado corretamente?
- Force refresh da query: invalidate no QueryClient

### Edge Function falha
- Verificar logs: `supabase functions logs alertas-diarios`
- Verificar secrets: `RESEND_API_KEY`, `APP_URL`
- Testar queries individualmente no SQL Editor

### E-mail não enviado
- Verificar API key do Resend
- Verificar domínio de envio configurado
- Verificar logs da Edge Function
