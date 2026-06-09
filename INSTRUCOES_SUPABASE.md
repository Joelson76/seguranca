# Instruções para Configuração do Supabase

## 1. Executar Migrations no SQL Editor

Acesse o SQL Editor do seu projeto Supabase e execute **na ordem**:

### Migration 001 - Enums e Tenants
```sql
-- Arquivo: supabase/migrations/001_enums_e_tenants.sql
```
Cria os tipos enumerados (plano, perfil_usuario, status, etc.) e a tabela `tenants`.

### Migration 002 - Usuários
```sql
-- Arquivo: supabase/migrations/002_usuarios.sql
```
Cria a tabela `usuarios` com RLS habilitado.

### Migration 003 - Funcionários
```sql
-- Arquivo: supabase/migrations/003_funcionarios.sql
```
Cria a tabela `funcionarios` com RLS habilitado.

### Migrations Restantes (para próximas fases)
- 004_epis_estoque.sql
- 005_treinamentos.sql
- 006_acidentes_documentos.sql
- 007_assinaturas_notificacoes.sql
- 008_pg_cron_alertas.sql
- 009_seed_inicial.sql
- 010_indices_performance.sql
- 011_auditoria.sql

## 2. Criar Buckets no Supabase Storage

Acesse **Storage** no painel do Supabase e crie os seguintes buckets:

### Buckets Privados
- `fotos-funcionario`
- `documentos`
- `assinaturas`
- `certificados`

### Buckets Públicos
- `logos`

Para cada bucket privado:
1. Clique em "New bucket"
2. Nome do bucket (ex: `fotos-funcionario`)
3. **Marque** "Private bucket"
4. Create

Para bucket público:
1. Nome: `logos`
2. **Desmarque** "Private bucket"
3. Create

## 3. Criar Políticas RLS para Storage (Fase 1)

Execute no SQL Editor para o bucket `fotos-funcionario`:

```sql
-- Permitir upload de fotos (usuários autenticados do mesmo tenant)
CREATE POLICY "Upload fotos funcionários"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'fotos-funcionario' AND
  (storage.foldername(name))[1] = (SELECT tenant_id::text FROM usuarios WHERE id = auth.uid())
);

-- Permitir leitura de fotos (usuários do mesmo tenant)
CREATE POLICY "Ver fotos funcionários"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'fotos-funcionario' AND
  (storage.foldername(name))[1] = (SELECT tenant_id::text FROM usuarios WHERE id = auth.uid())
);

-- Permitir deletar fotos (usuários do mesmo tenant)
CREATE POLICY "Deletar fotos funcionários"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'fotos-funcionario' AND
  (storage.foldername(name))[1] = (SELECT tenant_id::text FROM usuarios WHERE id = auth.uid())
);
```

## 4. Seed Inicial (Dados de Teste)

Execute a migration `009_seed_inicial.sql` para criar:
- Tenant de demonstração
- Usuário admin inicial
- Dados de exemplo (funcionários, EPIs, etc.)

## 5. Verificar Configuração

### Testar no SQL Editor:
```sql
-- Ver tenants criados
SELECT * FROM tenants;

-- Ver usuários
SELECT * FROM usuarios;

-- Ver funcionários
SELECT * FROM funcionarios;
```

### Testar autenticação:
1. No painel do Supabase, vá em **Authentication > Users**
2. Crie um usuário de teste
3. Na aplicação web, faça login com esse usuário

## ✅ Checklist Fase 1

- [ ] Migration 001 executada (enums e tenants)
- [ ] Migration 002 executada (usuarios)
- [ ] Migration 003 executada (funcionarios)
- [ ] Bucket `fotos-funcionario` criado (privado)
- [ ] Políticas RLS do bucket configuradas
- [ ] Seed inicial executado (opcional para testes)
- [ ] Primeiro usuário criado via Authentication
- [ ] Login testado na aplicação

## Próximos Passos

Após concluir a Fase 1, você pode:
- Testar o cadastro de funcionários
- Fazer upload de fotos
- Navegar pelas telas criadas
- Partir para a **Fase 2: EPIs + Estoque + Entregas**
