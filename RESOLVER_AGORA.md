# 🔥 RESOLVER ERRO 406/403 - AGORA

## ✅ PASSO 1: Desabilitar RLS no Supabase

### Abra o SQL Editor:
👉 https://supabase.com/dashboard/project/fzgaercwkkxzkxendawm/sql/new

### Cole e Execute:
Abra o arquivo **`DESABILITAR_RLS_AGORA.sql`** e execute TODO o conteúdo.

**Ou copie diretamente:**
```sql
ALTER TABLE IF EXISTS tenants DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS usuarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS funcionarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS epis DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS movimentacoes_estoque DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS entregas_epi DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS treinamentos DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS funcionario_treinamentos DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS acidentes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS documentos DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS assinaturas DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notificacoes DISABLE ROW LEVEL SECURITY;
```

---

## ✅ PASSO 2: Limpar Cache do Navegador

1. **Ctrl + Shift + Delete**
2. Marque: Cookies + Cache
3. Clique em "Limpar"

**OU:**

Abra aba anônima/privada: **Ctrl + Shift + N**

---

## ✅ PASSO 3: Acessar Novamente

1. Acesse: **http://localhost:5173**
2. Faça logout (se estiver logado)
3. Crie uma NOVA conta
4. Complete o onboarding

---

## ⚠️ O QUE FOI CORRIGIDO NO CÓDIGO

1. ✅ Hook de autenticação agora usa `.maybeSingle()` em vez de `.single()`
2. ✅ Trata erro 406 quando perfil não existe
3. ✅ Script SQL remove todas as políticas RLS

---

## 🎯 RESULTADO ESPERADO

Depois de executar:
- ❌ Sem erro 406
- ❌ Sem erro 403
- ✅ Login funciona
- ✅ Onboarding funciona
- ✅ Dashboard carrega
- ✅ Pode cadastrar funcionários

---

## 📞 SE AINDA DER ERRO

Me envie:
1. Print do console (F12)
2. Mensagem de erro completa
3. Resultado da query:
```sql
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
```

---

**EXECUTE AGORA OS 3 PASSOS!** 🚀
