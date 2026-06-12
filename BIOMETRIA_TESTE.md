# Teste de Biometria — Checklist

## ✅ Pré-requisitos

- [ ] Migration `014_biometria_entregas.sql` executada no Supabase
- [ ] Dependência `@radix-ui/react-tabs` instalada
- [ ] Sistema rodando localmente ou em HTTPS (obrigatório para WebAuthn)

## 🧪 Testes

### 1. Teste de Assinatura Manual (Canvas)

**Funcionalidade**: Método padrão, deve continuar funcionando

1. Acesse: `/app/entregas`
2. Clique: **Nova Entrega**
3. Selecione um funcionário
4. Selecione um EPI com estoque
5. Aba **Assinatura** deve estar ativa
6. Desenhe uma assinatura no canvas
7. Clique: **Registrar Entrega**

**Resultado Esperado**:
- ✅ Entrega criada com sucesso
- ✅ Campo `assinatura_url` preenchido
- ✅ Campo `biometria_tipo` = `'assinatura'`
- ✅ PDF gerado mostra linha de assinatura tradicional

---

### 2. Teste de WebAuthn (Dispositivo)

**Funcionalidade**: Biometria do dispositivo (Touch ID, Windows Hello, Face ID)

**Pré-requisitos**:
- Dispositivo com sensor biométrico configurado
- HTTPS ou localhost
- Navegador moderno (Chrome, Edge, Safari, Firefox)

**Passos**:
1. Acesse: `/app/entregas` → **Nova Entrega**
2. Selecione um funcionário
3. Clique na aba **Dispositivo**
4. Deve aparecer: "Biometria do Dispositivo" + nome do sensor
5. Clique: **Capturar Biometria**
6. Sistema solicita autenticação (Touch ID, Windows Hello, etc)
7. Autentique com biometria
8. Deve aparecer: ✓ "Biometria capturada com sucesso"
9. Clique: **Registrar Entrega**

**Resultado Esperado**:
- ✅ Notificação de sucesso no sistema operacional
- ✅ Badge verde "Capturado"
- ✅ Entrega salva com `biometria_tipo` = `'webauthn'`
- ✅ Campo `biometria_hash` preenchido (64 caracteres hex)
- ✅ Campo `biometria_dispositivo` = "Touch ID" ou "Windows Hello"
- ✅ Registro em `funcionarios_credenciais_biometricas`
- ✅ PDF mostra: "✓ Autenticado via Touch ID / Windows Hello"

**Se der erro**:
- ❌ "Biometria não disponível" → Dispositivo sem sensor ou biometria não configurada
- ❌ "Permissão negada" → Usuário negou permissão, tentar novamente
- ❌ "Credencial já registrada" → Normal, vai atualizar `ultimo_uso`

---

### 3. Teste de Leitor Biométrico (Hardware)

**Funcionalidade**: Leitor USB/Ethernet externo

**Pré-requisitos**:
- Leitor biométrico conectado (USB ou Ethernet)
- SDK do fabricante instalado (ver `BIOMETRIA_HARDWARE_SETUP.md`)
- Service/plugin do SDK rodando

**Verificar SDK instalado**:
```javascript
// Abrir Console do navegador (F12)
console.log(window.DPFPDevices)     // Digital Persona
console.log(window.NBioBSP)          // Nitgen
console.log(window.ZKFinger)         // ZKTeco
console.log(window.FutronicSDK)      // Futronic
```

**Passos**:
1. Acesse: `/app/entregas` → **Nova Entrega**
2. Selecione um funcionário
3. Clique na aba **Leitor**
4. Deve mostrar: "Leitor Biométrico" + nome do SDK + ✓ verde
5. Clique: **Capturar Digital**
6. Sistema pede para posicionar dedo no leitor
7. Posicione o dedo
8. Aguarde captura (LED do leitor muda)
9. Deve aparecer: ✓ "Biometria capturada com sucesso"
10. Clique: **Registrar Entrega**

**Resultado Esperado**:
- ✅ Leitor acende/apita (feedback visual/sonoro)
- ✅ Badge verde "Capturado"
- ✅ Entrega salva com `biometria_tipo` = `'hardware'`
- ✅ Campo `biometria_hash` preenchido
- ✅ Campo `biometria_dispositivo` = nome do leitor
- ✅ Registro em `funcionarios_credenciais_biometricas`
- ✅ PDF mostra: "✓ Autenticado via Leitor Biométrico - Digital Persona"

**Se der erro**:
- ❌ "Leitor biométrico não detectado" → SDK não instalado, ver setup
- ❌ "Leitor não conectado" → USB desconectado ou driver não instalado
- ❌ "Erro ao capturar" → Dedo mal posicionado, limpar sensor e tentar novamente

---

### 4. Teste de Listagem e PDF

**Passos**:
1. Na lista de entregas, localize as entregas criadas
2. Para cada tipo de autenticação, clique no ícone de PDF
3. Verificar se o PDF mostra o método correto

**Resultado Esperado**:
- ✅ Assinatura: Linha de assinatura tradicional
- ✅ WebAuthn: "✓ Autenticado via Touch ID" + hash
- ✅ Hardware: "✓ Autenticado via Leitor Biométrico" + hash

---

### 5. Teste de Segurança (RLS)

**Cenário**: Funcionário não pode ver credenciais de outros tenants

**Passos**:
1. Criar entrega com biometria no tenant A
2. Fazer login em outro tenant B
3. Tentar acessar credenciais biométricas

**Query SQL para validar**:
```sql
-- No SQL Editor do Supabase
SELECT * FROM funcionarios_credenciais_biometricas;
-- Deve retornar APENAS credenciais do tenant logado
```

**Resultado Esperado**:
- ✅ RLS bloqueia acesso cross-tenant
- ✅ Erro 403 ou lista vazia ao tentar acessar outro tenant

---

### 6. Teste de Re-captura

**Cenário**: Funcionário captura biometria pela segunda vez

**Passos**:
1. Criar entrega com biometria (WebAuthn ou Hardware)
2. Criar outra entrega para o MESMO funcionário
3. Capturar biometria novamente

**Resultado Esperado**:
- ✅ Credencial existente não é duplicada
- ✅ Campo `ultimo_uso` é atualizado
- ✅ Ambas entregas tem hashes diferentes (timestamp único)

---

## 🐛 Problemas Conhecidos

### WebAuthn em HTTP
**Erro**: "Biometria não disponível"  
**Solução**: Usar HTTPS ou `localhost` (HTTP comum bloqueia WebAuthn)

### Safari em macOS Older
**Erro**: WebAuthn não funciona  
**Solução**: Atualizar macOS/Safari ou usar Chrome

### Windows Hello sem PIN
**Erro**: "Configure Windows Hello primeiro"  
**Solução**: Configurar PIN do Windows → Adicionar biometria

### Leitor USB não detectado
**Erro**: "Leitor não conectado"  
**Solução**: 
1. Verificar se USB está conectado
2. Abrir Gerenciador de Dispositivos → procurar leitor
3. Reinstalar driver
4. Testar com software do fabricante

---

## 📊 Validação no Banco de Dados

### Query: Entregas por tipo de autenticação
```sql
SELECT 
  biometria_tipo,
  COUNT(*) as total
FROM entregas_epi
GROUP BY biometria_tipo
ORDER BY total DESC;
```

### Query: Credenciais ativas
```sql
SELECT 
  f.nome as funcionario,
  c.tipo,
  c.dispositivo,
  c.criado_em,
  c.ultimo_uso
FROM funcionarios_credenciais_biometricas c
JOIN funcionarios f ON f.id = c.funcionario_id
WHERE c.ativo = true
ORDER BY c.criado_em DESC;
```

### Query: Entregas com biometria (últimas 10)
```sql
SELECT 
  f.nome as funcionario,
  e.nome as epi,
  ent.biometria_tipo,
  ent.biometria_dispositivo,
  ent.data_entrega
FROM entregas_epi ent
JOIN funcionarios f ON f.id = ent.funcionario_id
JOIN epis e ON e.id = ent.epi_id
WHERE ent.biometria_tipo IS NOT NULL
ORDER BY ent.data_entrega DESC
LIMIT 10;
```

---

## ✅ Checklist Final

### Funcionalidades
- [ ] Assinatura manual funciona
- [ ] WebAuthn funciona em dispositivo com biometria
- [ ] Hardware funciona com leitor instalado
- [ ] PDFs mostram método correto
- [ ] RLS protege credenciais cross-tenant

### Performance
- [ ] Captura de biometria < 3 segundos
- [ ] Listagem de entregas carrega rápido
- [ ] PDF gera sem delay

### Segurança
- [ ] Hashes SHA-256 únicos
- [ ] RLS ativo e funcionando
- [ ] Templates não reversíveis
- [ ] Metadados salvos (auditoria)

### UX
- [ ] Mensagens de erro claras
- [ ] Loading states visíveis
- [ ] Feedback visual após captura
- [ ] Documentação acessível

---

**Data do Teste**: __________  
**Testador**: __________  
**Versão**: 1.0  
**Status**: [ ] Aprovado [ ] Reprovado
