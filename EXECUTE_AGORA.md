# 🚨 EXECUTE AGORA - FIX LOGIN

## ⚡ 2 Comandos SQL para Copiar e Colar

### 1️⃣ PRIMEIRO SCRIPT (Copie TUDO abaixo)

```sql
-- ================================================
-- SCRIPT 1: Criar função e corrigir usuários
-- ================================================

CREATE OR REPLACE FUNCTION public.get_my_tenant_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (SELECT tenant_id FROM public.usuarios WHERE id = auth.uid() LIMIT 1),
    '00000000-0000-0000-0000-000000000000'::uuid
  );
$$;

GRANT EXECUTE ON FUNCTION public.get_my_tenant_id() TO anon, authenticated, service_role;

DROP POLICY IF EXISTS "usuarios_tenant_isolation" ON usuarios;
DROP POLICY IF EXISTS "usuarios_select" ON usuarios;
DROP POLICY IF EXISTS "usuarios_insert" ON usuarios;
DROP POLICY IF EXISTS "usuarios_update" ON usuarios;

CREATE POLICY "usuarios_select" ON usuarios
  FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "usuarios_insert" ON usuarios
  FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "usuarios_update" ON usuarios
  FOR UPDATE
  USING (id = auth.uid());

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  tenant_id_novo UUID;
BEGIN
  IF EXISTS (SELECT 1 FROM public.usuarios WHERE id = NEW.id) THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.tenants (nome, tipo, ativo)
  VALUES (
    COALESCE(NEW.raw_user_meta_data->>'empresa', 'Empresa Padrão'),
    'trial',
    true
  )
  RETURNING id INTO tenant_id_novo;

  INSERT INTO public.usuarios (id, tenant_id, nome, perfil)
  VALUES (
    NEW.id,
    tenant_id_novo,
    COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)),
    'admin'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

DO $$
DECLARE
  auth_user RECORD;
  tenant_id_novo UUID;
BEGIN
  FOR auth_user IN
    SELECT au.id, au.email, au.raw_user_meta_data
    FROM auth.users au
    LEFT JOIN public.usuarios u ON u.id = au.id
    WHERE u.id IS NULL
  LOOP
    INSERT INTO public.tenants (nome, tipo, ativo)
    VALUES (
      COALESCE(auth_user.raw_user_meta_data->>'empresa', 'Empresa ' || split_part(auth_user.email, '@', 1)),
      'trial',
      true
    )
    RETURNING id INTO tenant_id_novo;

    INSERT INTO public.usuarios (id, tenant_id, nome, perfil)
    VALUES (
      auth_user.id,
      tenant_id_novo,
      COALESCE(auth_user.raw_user_meta_data->>'nome', split_part(auth_user.email, '@', 1)),
      'admin'
    );
  END LOOP;
END $$;

SELECT
  u.nome,
  u.perfil,
  t.nome as tenant
FROM usuarios u
JOIN tenants t ON t.id = u.tenant_id
ORDER BY u.criado_em DESC;
```

**👆 Copie TODO o código acima, cole no Supabase SQL Editor e clique em RUN**

---

### 2️⃣ SEGUNDO SCRIPT (Depois que o primeiro rodar, copie TUDO abaixo)

```sql
-- ================================================
-- SCRIPT 2: Atualizar todas as políticas RLS
-- ================================================

DROP POLICY IF EXISTS "funcionarios_tenant" ON funcionarios;
CREATE POLICY "funcionarios_tenant" ON funcionarios
  USING (tenant_id = public.get_my_tenant_id());

DROP POLICY IF EXISTS "funcionarios_insert" ON funcionarios;
CREATE POLICY "funcionarios_insert" ON funcionarios
  FOR INSERT WITH CHECK (tenant_id = public.get_my_tenant_id());

DROP POLICY IF EXISTS "epis_tenant" ON epis;
CREATE POLICY "epis_tenant" ON epis
  USING (tenant_id = public.get_my_tenant_id());

DROP POLICY IF EXISTS "epis_insert" ON epis;
CREATE POLICY "epis_insert" ON epis
  FOR INSERT WITH CHECK (tenant_id = public.get_my_tenant_id());

DROP POLICY IF EXISTS "estoque_tenant" ON estoque_movimentos;
CREATE POLICY "estoque_tenant" ON estoque_movimentos
  USING (tenant_id = public.get_my_tenant_id());

DROP POLICY IF EXISTS "entregas_tenant" ON entregas_epi;
CREATE POLICY "entregas_tenant" ON entregas_epi
  USING (tenant_id = public.get_my_tenant_id());

DROP POLICY IF EXISTS "entregas_insert" ON entregas_epi;
CREATE POLICY "entregas_insert" ON entregas_epi
  FOR INSERT WITH CHECK (tenant_id = public.get_my_tenant_id());

DROP POLICY IF EXISTS "treinamentos_tenant" ON treinamentos;
CREATE POLICY "treinamentos_tenant" ON treinamentos
  USING (tenant_id = public.get_my_tenant_id());

DROP POLICY IF EXISTS "documentos_tenant" ON documentos;
CREATE POLICY "documentos_tenant" ON documentos
  USING (tenant_id = public.get_my_tenant_id());

DROP POLICY IF EXISTS "acidentes_tenant" ON acidentes;
CREATE POLICY "acidentes_tenant" ON acidentes
  USING (tenant_id = public.get_my_tenant_id());

DROP POLICY IF EXISTS "notificacoes_tenant" ON notificacoes;
CREATE POLICY "notificacoes_tenant" ON notificacoes
  USING (tenant_id = public.get_my_tenant_id());

SELECT 'RLS atualizado com sucesso!' as status;
```

**👆 Copie TODO o código acima, cole no Supabase SQL Editor e clique em RUN**

---

## ✅ Depois de Executar os 2 Scripts

1. **Limpe o cache**: Ctrl + Shift + Delete
2. **Feche todas as abas** do SafeTrack
3. **Abra em aba anônima**
4. **Tente fazer login**

---

## 🎯 Deve Funcionar!

Se não funcionar, me envie:
- Screenshot do console (F12)
- Resultado dos 2 scripts SQL
