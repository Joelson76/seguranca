# 🗄️ Como Configurar o Banco de Dados Supabase

## ⚠️ PROBLEMA ATUAL

Você está recebendo **erro 400** ao tentar cadastrar funcionários porque:
- As tabelas não existem no banco de dados
- As políticas RLS não foram configuradas
- O banco está vazio

---

## ✅ SOLUÇÃO: Executar o Script SQL Completo

### Passo 1: Abrir o Supabase Dashboard

1. Acesse: https://supabase.com/dashboard
2. Faça login na sua conta
3. Clique no projeto: **fzgaercwkkxzkxendawm**

---

### Passo 2: Abrir o SQL Editor

1. No menu lateral esquerdo, clique em **SQL Editor**
2. Clique em **New Query** (ou "Nova consulta")

---

### Passo 3: Copiar o Script Completo

1. Abra o arquivo: **`SETUP_COMPLETO_DEFINITIVO.sql`**
2. Copie **TODO O CONTEÚDO** do arquivo (Ctrl+A, Ctrl+C)

---

### Passo 4: Colar e Executar

1. Cole o conteúdo no SQL Editor do Supabase
2. Clique em **Run** (ou "Executar") no canto inferior direito
3. Aguarde a execução (pode levar 10-30 segundos)

---

### Passo 5: Verificar se deu certo

Se tudo correu bem, você verá mensagens como:

```
Success. No rows returned
```

#### Para confirmar que as tabelas foram criadas:

1. No menu lateral, clique em **Table Editor**
2. Você deve ver as tabelas:
   - `tenants`
   - `usuarios`
   - `funcionarios`
   - `epis`
   - `entregas_epi`
   - `treinamentos`
   - `participacoes`
   - `documentos`
   - `acidentes`
   - `notificacoes`
   - `assinaturas`

---

## 🔐 Configurar Storage (Buckets)

Depois de criar as tabelas, você precisa criar os buckets:

### No Supabase Dashboard:

1. Clique em **Storage** no menu lateral
2. Clique em **New Bucket** para cada bucket abaixo:

#### Buckets privados (marque como Private):
- `documentos`
- `assinaturas`
- `fotos-funcionario`
- `certificados`

#### Bucket público (marque como Public):
- `logos`

### Configurar políticas de storage:

Para cada bucket privado, adicione as políticas RLS:

1. Clique no bucket
2. Clique em **Policies**
3. Adicione estas políticas:

**Política de Upload:**
```sql
CREATE POLICY "Usuários podem fazer upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'nome-do-bucket');
```

**Política de Select:**
```sql
CREATE POLICY "Usuários podem visualizar"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'nome-do-bucket');
```

**Política de Update:**
```sql
CREATE POLICY "Usuários podem atualizar"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'nome-do-bucket');
```

---

## 🧪 Testar no App

Depois de configurar tudo:

1. **Recarregue a página** do SafeTrack (Ctrl+F5)
2. Faça login novamente
3. Se for primeiro acesso, complete o onboarding (dados da empresa)
4. Tente cadastrar um funcionário

---

## ❌ Se ainda der erro:

### Verificar no console do navegador (F12):

- Se aparecer erro **400**: O RLS está bloqueando
- Se aparecer erro **404**: Tabela não existe
- Se aparecer erro **401**: Problema de autenticação

### Solução para erro 400 (RLS bloqueando):

O script `SETUP_COMPLETO_DEFINITIVO.sql` já inclui as políticas RLS, mas se ainda der erro, execute também:

```sql
-- Desabilitar RLS temporariamente para testar
ALTER TABLE tenants DISABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE funcionarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE epis DISABLE ROW LEVEL SECURITY;
```

⚠️ **ATENÇÃO**: Isso deixa o banco sem segurança! Use apenas para testar. Depois reabilite com:

```sql
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE funcionarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE epis ENABLE ROW LEVEL SECURITY;
```

---

## 📞 Precisa de Ajuda?

Se continuar com erro, me envie:
1. A mensagem de erro completa do console (F12)
2. Screenshot da aba Network mostrando o erro 400
3. Confirmação de que executou o script SQL

---

## 🎯 Resumo Rápido

```bash
1. Abrir Supabase Dashboard → SQL Editor
2. Colar SETUP_COMPLETO_DEFINITIVO.sql
3. Executar (Run)
4. Criar buckets no Storage
5. Recarregar app e testar
```

Boa sorte! 🚀
