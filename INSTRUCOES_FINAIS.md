# 🆘 INSTRUÇÕES FINAIS - Resolver Erro 400

## 📋 FAÇA EXATAMENTE ISSO:

### 1️⃣ Execute o Diagnóstico

**Abra o SQL Editor:**
https://supabase.com/dashboard/project/fzgaercwkkxzkxendawm/sql/new

**Cole TODO o conteúdo de:** `DIAGNOSTICO_COMPLETO.sql`

**Clique em RUN**

---

### 2️⃣ Me Envie os Resultados

Depois de executar, você verá várias tabelas com resultados.

**Me envie (copie e cole aqui):**

1. **Resultado de "TABELAS EXISTENTES"** - mostra quais tabelas existem e se RLS está ON/OFF
2. **Resultado de "COLUNAS - funcionarios"** - mostra se a coluna `quantidade_atual` existe
3. **Resultado de "COLUNAS - epis"** - mostra se a coluna `validade_ca` existe  
4. **Resultado de "POLÍTICAS RLS"** - mostra se há políticas ativas bloqueando

---

### 3️⃣ Enquanto Isso, Verifique o Console

No navegador (F12 → Console), quando der erro 400:

**Clique na requisição que falhou** (a linha vermelha com "400")

Você verá algo assim:
```
Request URL: https://fzgaercwkkxzkxendawm.supabase.co/rest/v1/funcionarios?select=*
Request Method: GET
Status Code: 400 Bad Request
```

**Me envie:**
- A URL completa da requisição
- A resposta (aba "Response")

---

## 🎯 COM ESSAS INFORMAÇÕES EU VOU:

1. ✅ Descobrir se o problema é:
   - Tabela não existe
   - Coluna não existe
   - RLS bloqueando
   - Query mal formada

2. ✅ Te dar o SQL EXATO para corrigir

---

## ⚡ IMPORTANTE

**NÃO tente criar nada manualmente ainda!**

Aguarde os resultados do diagnóstico para eu ver o estado REAL do banco e dar a solução definitiva.

---

**Execute o DIAGNOSTICO_COMPLETO.sql e me envie os resultados!** 🚀
