# 🔍 DEBUG - Login Travando

## Problema
Site fica "rodando" infinitamente ao tentar logar.

## Causas Prováveis

### 1. Tabela `usuarios` não existe
### 2. RLS bloqueando leitura da tabela `usuarios`
### 3. Função `auth.tenant_id()` não configurada
### 4. Trigger de auto-criação não rodou

---

## 🛠️ SOLUÇÃO RÁPIDA

### Passo 1: Verificar no Supabase SQL Editor

```sql
-- Verificar se tabela usuarios existe
SELECT COUNT(*) FROM usuarios;

-- Se der erro "relation does not exist", executar migration 002
```

### Passo 2: Verificar se função auth.tenant_id() existe

```sql
-- Testar função
SELECT auth.tenant_id();

-- Se der erro, criar função:
CREATE OR REPLACE FUNCTION auth.tenant_id()
RETURNS UUID
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    (SELECT tenant_id FROM public.usuarios WHERE user_id = auth.uid() LIMIT 1),
    '00000000-0000-0000-0000-000000000000'::uuid
  );
$$;
```

### Passo 3: Verificar RLS na tabela usuarios

```sql
-- Ver políticas RLS
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'usuarios';

-- Se não houver políticas ou estiverem muito restritivas, executar:
DROP POLICY IF EXISTS "usuarios_select" ON usuarios;
DROP POLICY IF EXISTS "usuarios_insert" ON usuarios;
DROP POLICY IF EXISTS "usuarios_update" ON usuarios;

CREATE POLICY "usuarios_select" ON usuarios
  FOR SELECT
  USING (user_id = auth.uid() OR auth.role() = 'service_role');

CREATE POLICY "usuarios_insert" ON usuarios
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "usuarios_update" ON usuarios
  FOR UPDATE
  USING (user_id = auth.uid());
```

### Passo 4: Criar usuário manualmente (TEMPORÁRIO para testar)

```sql
-- Primeiro, criar uma conta no Supabase Auth (pela interface ou SQL)
-- Depois vincular à tabela usuarios:

-- Descobrir seu user_id
SELECT id, email FROM auth.users ORDER BY created_at DESC LIMIT 5;

-- Criar tenant (se não existir)
INSERT INTO tenants (nome, tipo, ativo)
VALUES ('Minha Empresa', 'trial', true)
RETURNING id;

-- Copiar o ID do tenant retornado acima e usar abaixo:
INSERT INTO usuarios (user_id, tenant_id, nome, email, perfil)
VALUES (
  'SEU_USER_ID_AQUI',  -- ID do auth.users
  'SEU_TENANT_ID_AQUI', -- ID do tenant criado acima
  'Seu Nome',
  'seu@email.com',
  'admin'
);
```

---

## 🧪 TESTE RÁPIDO NO CONSOLE

Abra o console do navegador (F12) e cole:

```javascript
// Verificar variáveis de ambiente
console.log('URL:', import.meta.env.VITE_SUPABASE_URL)
console.log('Key:', import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅' : '❌')

// Verificar conexão Supabase
const { createClient } = await import('@supabase/supabase-js')
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

// Testar auth
const { data, error } = await supabase.auth.getSession()
console.log('Sessão:', data)
console.log('Erro:', error)

// Se tiver sessão, testar tabela usuarios
if (data.session) {
  const { data: perfil, error: erroPerfil } = await supabase
    .from('usuarios')
    .select('*')
    .eq('user_id', data.session.user.id)
    .single()
  
  console.log('Perfil:', perfil)
  console.log('Erro perfil:', erroPerfil)
}
```

---

## ✅ SOLUÇÃO DEFINITIVA

Execute este script SQL completo no Supabase SQL Editor:

```sql
-- ================================================
-- FIX COMPLETO: Login SafeTrack
-- ================================================

-- 1. Criar função auth.tenant_id() se não existir
CREATE OR REPLACE FUNCTION auth.tenant_id()
RETURNS UUID
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    (SELECT tenant_id FROM public.usuarios WHERE user_id = auth.uid() LIMIT 1),
    '00000000-0000-0000-0000-000000000000'::uuid
  );
$$;

-- 2. Garantir que RLS está ativo mas não muito restritivo
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "usuarios_select" ON usuarios;
DROP POLICY IF EXISTS "usuarios_insert" ON usuarios;
DROP POLICY IF EXISTS "usuarios_update" ON usuarios;

CREATE POLICY "usuarios_select" ON usuarios
  FOR SELECT
  USING (
    user_id = auth.uid() 
    OR auth.role() = 'service_role'
    OR auth.role() = 'authenticated'
  );

CREATE POLICY "usuarios_insert" ON usuarios
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "usuarios_update" ON usuarios
  FOR UPDATE
  USING (user_id = auth.uid());

-- 3. Criar trigger de auto-criação (se não existir)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  tenant_id_novo UUID;
BEGIN
  -- Verificar se já existe registro
  IF EXISTS (SELECT 1 FROM public.usuarios WHERE user_id = NEW.id) THEN
    RETURN NEW;
  END IF;

  -- Criar tenant automático se for primeiro usuário
  INSERT INTO public.tenants (nome, tipo, ativo)
  VALUES (
    COALESCE(NEW.raw_user_meta_data->>'empresa', 'Empresa Padrão'),
    'trial',
    true
  )
  RETURNING id INTO tenant_id_novo;

  -- Criar registro de usuário
  INSERT INTO public.usuarios (user_id, tenant_id, nome, email, perfil)
  VALUES (
    NEW.id,
    tenant_id_novo,
    COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)),
    NEW.email,
    'admin'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remover trigger antigo se existir
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Criar trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 4. Verificar se há usuários sem registro na tabela usuarios
DO $$
DECLARE
  auth_user RECORD;
  tenant_id_novo UUID;
BEGIN
  FOR auth_user IN 
    SELECT au.id, au.email, au.raw_user_meta_data
    FROM auth.users au
    LEFT JOIN public.usuarios u ON u.user_id = au.id
    WHERE u.id IS NULL
  LOOP
    RAISE NOTICE 'Corrigindo usuário: %', auth_user.email;
    
    -- Criar tenant
    INSERT INTO public.tenants (nome, tipo, ativo)
    VALUES (
      COALESCE(auth_user.raw_user_meta_data->>'empresa', 'Empresa Padrão'),
      'trial',
      true
    )
    RETURNING id INTO tenant_id_novo;

    -- Criar registro de usuário
    INSERT INTO public.usuarios (user_id, tenant_id, nome, email, perfil)
    VALUES (
      auth_user.id,
      tenant_id_novo,
      COALESCE(auth_user.raw_user_meta_data->>'nome', split_part(auth_user.email, '@', 1)),
      auth_user.email,
      'admin'
    );
  END LOOP;
END $$;

-- 5. Verificar resultado
SELECT 
  u.nome,
  u.email,
  u.perfil,
  t.nome as tenant,
  u.criado_em
FROM usuarios u
JOIN tenants t ON t.id = u.tenant_id
ORDER BY u.criado_em DESC;
```

---

## 📱 DEPOIS DE EXECUTAR O FIX

1. **Limpe o cache do navegador** (Ctrl+Shift+Delete)
2. **Feche todas as abas** do site
3. **Abra em aba anônima** para testar
4. Tente fazer login novamente

---

## 🆘 SE AINDA NÃO FUNCIONAR

Execute no console do navegador para ver o erro exato:

```javascript
localStorage.clear()
location.reload()
```

E envie os erros que aparecerem no console (F12 → Console).
