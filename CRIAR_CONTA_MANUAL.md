# 🔧 Como Criar Conta Manualmente no SafeTrack

Se o onboarding não está funcionando, use este método garantido:

## Passo 1: Criar Usuário no Supabase

1. Acesse: https://supabase.com/dashboard
2. Abra seu projeto SafeTrack
3. Vá em: **Authentication** → **Users**
4. Clique em: **"Add user"** (botão verde no topo direito)
5. Preencha:
   ```
   Email: seu.email@exemplo.com
   Password: SuaSenha123!
   ```
6. ✅ **IMPORTANTE:** Marque a opção **"Auto Confirm User"**
7. Clique em **"Create user"**
8. **ANOTE O E-MAIL E SENHA** que você criou!

## Passo 2: Pegar o ID do Usuário

1. Ainda em **Authentication** → **Users**
2. Clique no usuário que você acabou de criar
3. Você verá o **UUID** (exemplo: `550e8400-e29b-41d4-a716-446655440000`)
4. **COPIE este UUID** (você vai precisar no próximo passo)

## Passo 3: Executar SQL no Supabase

1. No Supabase Dashboard, vá em: **SQL Editor** (menu lateral esquerdo)
2. Clique em **"New query"**
3. Cole o SQL abaixo **SUBSTITUINDO** os valores:

```sql
-- ============================================================
-- CRIAR CONTA COMPLETA
-- ============================================================

-- IMPORTANTE: Substitua os valores entre aspas simples:
-- 'COLE_SEU_EMAIL_AQUI' → o e-mail que você criou
-- 'COLE_UUID_DO_USUARIO_AQUI' → o UUID que você copiou

DO $$
DECLARE
  v_tenant_id uuid;
  v_user_id uuid := 'COLE_UUID_DO_USUARIO_AQUI'::uuid;  -- ⬅️ SUBSTITUA AQUI
  v_email text := 'COLE_SEU_EMAIL_AQUI';                 -- ⬅️ SUBSTITUA AQUI
BEGIN
  -- 1. Criar tenant (empresa)
  INSERT INTO tenants (nome, cnpj, plano, ativo)
  VALUES ('Minha Empresa', '12.345.678/0001-00', 'profissional', true)
  RETURNING id INTO v_tenant_id;

  RAISE NOTICE '✅ Tenant criado: %', v_tenant_id;

  -- 2. Vincular usuário ao tenant
  INSERT INTO usuarios (user_id, tenant_id, nome, email, perfil, ativo)
  VALUES (
    v_user_id,
    v_tenant_id,
    'Administrador',
    v_email,
    'admin',
    true
  );

  RAISE NOTICE '✅ Usuário vinculado';

  -- 3. Criar assinatura trial
  INSERT INTO assinaturas (tenant_id, plano, valor_mensal, data_inicio, data_proximo_pag, status)
  VALUES (
    v_tenant_id,
    'profissional',
    349.00,
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '30 days',
    'trial'
  );

  RAISE NOTICE '✅ Assinatura criada';
  RAISE NOTICE '🎉 Conta pronta! Faça login com: %', v_email;

END $$;

-- Verificar se deu certo
SELECT
  u.nome,
  u.email,
  u.perfil,
  t.nome as empresa,
  a.plano,
  a.status
FROM usuarios u
JOIN tenants t ON t.id = u.tenant_id
LEFT JOIN assinaturas a ON a.tenant_id = u.tenant_id
WHERE u.email = 'COLE_SEU_EMAIL_AQUI';  -- ⬅️ SUBSTITUA AQUI
```

4. Clique em **"Run"** (ou pressione Ctrl+Enter)
5. Você verá mensagens verdes:
   ```
   ✅ Tenant criado: 550e8400-...
   ✅ Usuário vinculado
   ✅ Assinatura criada
   🎉 Conta pronta! Faça login com: seu.email@exemplo.com
   ```

## Passo 4: Fazer Login

1. Volte para: http://localhost:5173/login
2. Digite:
   - **E-mail:** (o que você criou)
   - **Senha:** (a que você criou)
3. Clique em **"Entrar"**
4. **Pronto!** Você estará dentro do SafeTrack 🎉

---

## 🆘 Se der erro no SQL

### Erro: "duplicate key value violates unique constraint"
**Solução:** O usuário já foi vinculado. Tente fazer login direto.

### Erro: "insert or update on table violates foreign key constraint"
**Solução:** O UUID do usuário está errado. Copie novamente do Dashboard.

### Erro: "syntax error"
**Solução:** Você esqueceu de substituir os valores. Veja os comentários ⬅️

---

## ✅ Verificação Final

Após executar o SQL, rode esta query para confirmar:

```sql
-- Ver sua conta criada
SELECT
  u.nome,
  u.email,
  u.perfil,
  t.nome as empresa,
  a.plano,
  a.status
FROM usuarios u
JOIN tenants t ON t.id = u.tenant_id
LEFT JOIN assinaturas a ON a.tenant_id = u.tenant_id
ORDER BY u.criado_em DESC
LIMIT 1;
```

Você deve ver uma linha com seus dados!

---

**Pronto! Sua conta está criada e você pode fazer login.** 🚀
