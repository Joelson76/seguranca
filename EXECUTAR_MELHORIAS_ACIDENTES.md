# 🚀 Como Aplicar as Melhorias do Módulo de Acidentes

## Passo 1️⃣: Rodar a Migration no Supabase

### Opção A: Supabase Dashboard (Recomendado)

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto **SafeTrack**
3. Menu lateral: **SQL Editor**
4. Clique em **New Query**
5. Copie todo o conteúdo do arquivo:
   ```
   supabase/migrations/020_melhorias_acidentes.sql
   ```
6. Cole no editor
7. Clique em **Run** (Ctrl+Enter)
8. Aguarde conclusão (deve mostrar "Success")

### Opção B: Via Supabase CLI

```bash
cd C:\ProjetoClaudeCode\seguranca
supabase db push
```

### ✅ Verificar se funcionou

Execute esta query no SQL Editor:

```sql
-- Deve retornar as novas tabelas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('acidente_testemunhas', 'acidente_acoes_corretivas', 'acidente_checklist');

-- Deve retornar as novas views
SELECT table_name 
FROM information_schema.views 
WHERE table_schema = 'public' 
  AND table_name IN ('vw_indicadores_sesmt', 'vw_acidentes_recorrencia');
```

Se retornar as 3 tabelas e 2 views → **✅ Sucesso!**

---

## Passo 2️⃣: Instalar Dependências do Frontend (se necessário)

```bash
cd web
npm install
```

Pacotes já devem estar instalados:
- `jspdf` (geração de PDF)
- `jspdf-autotable` (tabelas no PDF)
- `date-fns` (formatação de datas)
- `recharts` (gráficos)

---

## Passo 3️⃣: Testar Localmente

```bash
cd web
npm run dev
```

Acesse: http://localhost:5173

### Fluxo de Teste:

1. **Login** no sistema
2. Menu lateral → **Acidentes**
3. Clique em **Registrar Ocorrência**
4. Preencha os campos (agora tem muito mais campos!)
5. Salve
6. Clique no ícone **Checklist** (ListChecks) para abrir investigação detalhada
7. Na página de detalhes:
   - Adicione testemunhas
   - Adicione ações corretivas
   - Preencha checklist NR-1
   - Clique em **Gerar Relatório PDF**
8. Menu lateral → **Indicadores SESMT**
   - Veja TF, TG, CAI
   - Analise gráficos
   - Confira recorrências

---

## Passo 4️⃣: Deploy da Edge Function de Alertas (OPCIONAL)

Esta Edge Function envia notificações sobre:
- CAT não emitida em 24h
- Investigação atrasada (>15 dias)
- Ações corretivas vencidas

### Deploy:

```bash
cd C:\ProjetoClaudeCode\seguranca
supabase functions deploy alertas-acidentes
```

### Configurar Cron Job (rodar diariamente às 8h):

No Supabase Dashboard → Database → Cron Jobs → **Create a new cron job**:

```sql
SELECT cron.schedule(
  'alertas-acidentes-diarios',
  '0 8 * * *',  -- Todos os dias às 8h
  $$
  SELECT
    net.http_post(
      url := current_setting('app.settings.supabase_url') || '/functions/v1/alertas-acidentes',
      headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'))
    )
  $$
);
```

**OU manualmente chamar a função:**

```bash
curl -X POST https://SEU_PROJETO.supabase.co/functions/v1/alertas-acidentes \
  -H "Authorization: Bearer SEU_ANON_KEY"
```

---

## Passo 5️⃣: Testar em Produção (após deploy)

Após fazer deploy no Vercel/Netlify:

1. Acesse a URL de produção
2. Navegue até **Acidentes**
3. Teste criação de acidente completo
4. Teste investigação detalhada
5. Gere PDF
6. Acesse **Indicadores SESMT**

---

## 🐛 Troubleshooting

### Erro: "relation does not exist"
**Causa:** Migration não rodou  
**Solução:** Execute o Passo 1 novamente

### Erro: "tenant_id não encontrado"
**Causa:** Sessão antiga  
**Solução:** Faça logout e login novamente

### PDF não gera
**Causa:** Falta biblioteca jsPDF  
**Solução:**
```bash
cd web
npm install jspdf jspdf-autotable
```

### Gráficos não aparecem
**Causa:** Falta recharts  
**Solução:**
```bash
cd web
npm install recharts
```

### View vazia (sem dados)
**Causa:** Não há acidentes cadastrados nos últimos 12 meses  
**Solução:** Crie alguns acidentes de teste com datas recentes

---

## 📊 Dados de Teste

Para popular com dados de exemplo:

```sql
-- Inserir acidente de teste (ajuste o funcionario_id e tenant_id)
INSERT INTO acidentes (
  tenant_id,
  funcionario_id,
  tipo,
  data_ocorrencia,
  hora_ocorrencia,
  local_ocorrencia,
  descricao,
  gravidade,
  cat,
  status
) VALUES (
  'SEU_TENANT_ID',  -- Pegar do perfil
  'SEU_FUNCIONARIO_ID',  -- Pegar da tabela funcionarios
  'acidente_com_afastamento',
  CURRENT_DATE - INTERVAL '10 days',
  '14:30',
  'Setor de Produção - Linha 2',
  'Funcionário escorregou em piso molhado ao transportar material',
  4,
  true,
  'em_investigacao'
);
```

---

## ✅ Checklist de Conclusão

- [ ] Migration rodada com sucesso
- [ ] Tabelas criadas (acidente_testemunhas, acidente_acoes_corretivas, acidente_checklist)
- [ ] Views criadas (vw_indicadores_sesmt, vw_acidentes_recorrencia)
- [ ] Dependências instaladas (jspdf, recharts)
- [ ] Frontend iniciado sem erros
- [ ] Testado registro de acidente com novos campos
- [ ] Testado página de investigação detalhada
- [ ] Testado geração de PDF
- [ ] Testado página Indicadores SESMT
- [ ] Edge Function de alertas deployada (opcional)
- [ ] Cron job configurado (opcional)

---

## 🎉 Pronto!

Agora você tem um módulo de Acidentes **completo e profissional** com:

✅ Investigação conforme NR-1  
✅ Gestão de CAT com prazos  
✅ Testemunhas e ações corretivas  
✅ Checklist obrigatório  
✅ Relatórios PDF  
✅ Indicadores SESMT (TF, TG, CAI)  
✅ Análise de recorrência  
✅ Alertas automáticos  

**Qualquer dúvida, consulte:** `MELHORIAS_ACIDENTES.md`
