# 🗄️ Como Executar as Migrations no Supabase

## ⚠️ IMPORTANTE: Execute NESTA ORDEM!

Abra o **SQL Editor** no Supabase Dashboard e execute cada arquivo **UM POR VEZ**.

---

## 📋 Ordem de Execução

### 1️⃣ **Enums e Tenants** (ESSENCIAL)
Arquivo: `supabase/migrations/001_enums_e_tenants.sql`

**O que faz:** Cria os tipos (enums) e a tabela de empresas (tenants)

**Como executar:**
1. Abra o arquivo `001_enums_e_tenants.sql`
2. Copie TODO o conteúdo
3. Cole no SQL Editor do Supabase
4. Clique em **"RUN"** (ou Ctrl+Enter)
5. ✅ Deve aparecer "Success. No rows returned"

---

### 2️⃣ **Usuários**
Arquivo: `supabase/migrations/002_usuarios.sql`

**O que faz:** Cria a tabela de usuários vinculados aos tenants

**Executar:** Mesmo processo (copiar → colar → run)

---

### 3️⃣ **Funcionários**
Arquivo: `supabase/migrations/003_funcionarios.sql`

---

### 4️⃣ **EPIs e Estoque**
Arquivo: `supabase/migrations/004_epis_estoque.sql`

---

### 5️⃣ **Treinamentos**
Arquivo: `supabase/migrations/005_treinamentos.sql`

---

### 6️⃣ **Acidentes e Documentos**
Arquivo: `supabase/migrations/006_acidentes_documentos.sql`

---

### 7️⃣ **Assinaturas e Notificações**
Arquivo: `supabase/migrations/007_assinaturas_notificacoes.sql`

---

### 8️⃣ **Seed Inicial** (OPCIONAL - cria usuário teste)
Arquivo: `supabase/migrations/009_seed_inicial.sql`

⚠️ **Pule este** por enquanto (vai dar erro porque você não tem usuário no auth ainda)

---

### 9️⃣ **Índices de Performance**
Arquivo: `supabase/migrations/010_indices_performance.sql`

---

### 🔟 **Políticas da Fase 3**
Arquivo: `supabase/migrations/012_fase3_policies_update.sql`

---

### 1️⃣1️⃣ **Notificações (Fase 5)**
Arquivo: `supabase/migrations/20260608_notificacoes.sql`

---

### 1️⃣2️⃣ **RPC Estoque Crítico**
Arquivo: `supabase/migrations/20260608_rpc_estoque_critico.sql`

---

## ✅ Verificação Final

Depois de executar TODAS as migrations, execute este SQL para verificar:

```sql
-- Verificar se as tabelas foram criadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

Você deve ver pelo menos estas tabelas:
- ✅ tenants
- ✅ usuarios
- ✅ funcionarios
- ✅ epis
- ✅ entregas_epi
- ✅ treinamentos
- ✅ funcionario_treinamentos
- ✅ acidentes
- ✅ documentos
- ✅ assinaturas
- ✅ notificacoes

---

## 🚨 Se Der Erro

### Erro: "relation already exists"
**Solução:** Tabela já existe, pode pular esta migration.

### Erro: "type already exists"
**Solução:** Enum já existe, pode pular esta migration.

### Erro: "syntax error"
**Solução:** 
1. Certifique-se de copiar TODO o conteúdo do arquivo
2. Cole tudo de uma vez
3. Não execute linha por linha

### Erro: "permission denied"
**Solução:** Você precisa ser owner do projeto Supabase.

---

## ⚡ Atalho Rápido (Avançado)

Se você está confortável com SQL, pode executar tudo de uma vez criando um script único.

**NÃO RECOMENDADO para iniciantes** - melhor fazer um por um para detectar erros.

---

## 📞 Após Executar Todas

Quando terminar:
1. Volte para: http://localhost:5173/registro
2. Preencha o formulário
3. Clique em "Criar Conta Grátis"
4. Agora deve funcionar! ✅

---

**Comece pela migration 001 e vá seguindo a ordem!** 🚀
