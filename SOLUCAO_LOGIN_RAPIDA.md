# ✅ SOLUÇÃO RÁPIDA - Login Travando

## 🎯 Problema
Site fica "rodando" infinitamente ao tentar logar.

**Erro**: `function auth.tenant_id() does not exist`

---

## 🚀 SOLUÇÃO EM 3 PASSOS

### Passo 1: Abrir Supabase SQL Editor
1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto **SafeTrack**
3. No menu lateral, clique em **SQL Editor**

### Passo 2: Executar o Script
1. Copie **TODO** o conteúdo do arquivo: `FIX_DEFINITIVO_LOGIN.sql`
2. Cole no SQL Editor
3. Clique em **Run** (ou pressione Ctrl+Enter)
4. Aguarde aparecer "Success" ✅

### Passo 3: Limpar Cache e Testar
1. No navegador, pressione **Ctrl + Shift + Delete**
2. Marque **"Cookies"** e **"Cached images and files"**
3. Clique em **Clear data**
4. Feche **todas as abas** do SafeTrack
5. Abra em **nova aba anônima** (Ctrl + Shift + N)
6. Acesse o site e tente fazer login

---

## ✅ Deve Funcionar Agora!

Se ainda não funcionar, me envie:
1. Print do **console** (F12 → aba Console)
2. Resultado do último SELECT do script SQL

---

## 📝 O Que o Script Faz

1. ✅ Cria a função `auth.tenant_id()` que estava faltando
2. ✅ Ajusta as políticas RLS para serem menos restritivas
3. ✅ Cria trigger para auto-criar perfil de novos usuários
4. ✅ Corrige usuários existentes que não têm perfil
5. ✅ Mostra lista de usuários no final

---

## 🆘 Alternativa: Criar Usuário Manualmente

Se mesmo assim não funcionar, crie manualmente:

```sql
-- 1. Ver seu user_id
SELECT id, email FROM auth.users ORDER BY created_at DESC LIMIT 1;

-- 2. Criar tenant
INSERT INTO tenants (nome, tipo, ativo)
VALUES ('Minha Empresa', 'trial', true)
RETURNING id;

-- 3. Criar usuário (substituir IDs abaixo)
INSERT INTO usuarios (id, tenant_id, nome, perfil)
VALUES (
  'SEU_USER_ID_AQUI',    -- ID do passo 1
  'SEU_TENANT_ID_AQUI',  -- ID do passo 2
  'Seu Nome',
  'admin'
);
```

---

**Qualquer dúvida, me avise!** 🚀
