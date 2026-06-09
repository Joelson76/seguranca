# 🔴 SOLUÇÃO para Erro 400 - RLS Bloqueando Acesso

## Problema
O erro 400 ao acessar `/funcionarios` significa que o **Row Level Security (RLS)** está bloqueando as queries.

Isso acontece porque:
1. O RLS está habilitado nas tabelas
2. A função `get_my_tenant_id()` não está encontrando o tenant do usuário
3. As políticas RLS estão impedindo o acesso

---

## ✅ SOLUÇÃO RÁPIDA (Desabilitar RLS temporariamente)

### Passo 1: Abra o SQL Editor
https://supabase.com/dashboard/project/fzgaercwkkxzkxendawm/sql/new

### Passo 2: Cole e Execute

```sql
-- Desabilitar RLS em todas as tabelas (TEMPORÁRIO)
ALTER TABLE tenants DISABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE funcionarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE epis DISABLE ROW LEVEL SECURITY;
ALTER TABLE movimentacoes_estoque DISABLE ROW LEVEL SECURITY;
ALTER TABLE entregas_epi DISABLE ROW LEVEL SECURITY;
ALTER TABLE treinamentos DISABLE ROW LEVEL SECURITY;
ALTER TABLE funcionario_treinamentos DISABLE ROW LEVEL SECURITY;
ALTER TABLE acidentes DISABLE ROW LEVEL SECURITY;
ALTER TABLE documentos DISABLE ROW LEVEL SECURITY;
ALTER TABLE assinaturas DISABLE ROW LEVEL SECURITY;
ALTER TABLE notificacoes DISABLE ROW LEVEL SECURITY;
```

### Passo 3: Recarregar o App
- Ctrl+F5 no navegador
- Testar cadastro de funcionário

---

## ⚠️ IMPORTANTE

**Desabilitar RLS remove a segurança multi-tenant!**

Isso significa:
- ❌ Qualquer usuário pode ver dados de todas as empresas
- ❌ Não há isolamento entre tenants
- ✅ Mas o app vai funcionar para testes

---

## 🔒 SOLUÇÃO DEFINITIVA (Depois que testar)

Depois de confirmar que funciona sem RLS, vamos implementar políticas RLS corretas.

### Opção 1: RLS Simples (Permitir tudo para autenticados)

```sql
-- Reabilitar RLS
ALTER TABLE funcionarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE epis ENABLE ROW LEVEL SECURITY;
-- ... (todas as tabelas)

-- Política simples: usuários autenticados podem fazer tudo
CREATE POLICY "allow_authenticated" ON funcionarios
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "allow_authenticated" ON epis
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Repetir para todas as tabelas
```

### Opção 2: RLS Multi-tenant (Mais seguro)

Isso requer:
1. Garantir que todo usuário tem `tenant_id` na tabela `usuarios`
2. Implementar função `get_my_tenant_id()` que funcione
3. Políticas que filtram por tenant

```sql
-- Função para pegar tenant_id do usuário
CREATE OR REPLACE FUNCTION get_my_tenant_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT tenant_id 
  FROM usuarios 
  WHERE user_id = auth.uid() 
  LIMIT 1;
$$;

-- Política multi-tenant
CREATE POLICY "tenant_isolation" ON funcionarios
  FOR ALL
  TO authenticated
  USING (tenant_id = get_my_tenant_id())
  WITH CHECK (tenant_id = get_my_tenant_id());
```

---

## 🎯 Recomendação

**Para desenvolvimento:**
1. Desabilite RLS agora (comando acima)
2. Teste tudo
3. Quando estiver funcionando 100%, implemente RLS correto

**Para produção:**
1. SEMPRE use RLS habilitado
2. Implemente políticas multi-tenant
3. Teste com múltiplos usuários/empresas

---

## 📝 Próximos Passos

1. Execute o SQL para desabilitar RLS
2. Teste o cadastro de funcionário
3. Me avise se funcionou
4. Depois implementamos RLS corretamente

---

**Execute o SQL agora e me avise o resultado!** 🚀
