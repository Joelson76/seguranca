# Implementação de Biometria — SafeTrack

## ✅ Implementação Completa

Sistema de autenticação biométrica para entregas de EPI com **3 métodos**:

1. ✍️ **Assinatura Manual** — Canvas (método atual, mantido)
2. 👆 **Biometria do Dispositivo** — WebAuthn (Touch ID, Face ID, Windows Hello)
3. 🔍 **Leitor Biométrico** — Hardware externo (Digital Persona, Nitgen, ZKTeco, Futronic)

---

## 📁 Arquivos Criados

### Migration SQL
- `supabase/migrations/014_biometria_entregas.sql`
  - Adiciona colunas: `biometria_hash`, `biometria_tipo`, `biometria_dispositivo`, `biometria_metadata`
  - Cria tabela `funcionarios_credenciais_biometricas`
  - Políticas RLS e índices de performance

### Componentes React
- `web/src/components/biometria/BiometriaWebAuthn.tsx` — Captura via WebAuthn
- `web/src/components/biometria/BiometriaHardware.tsx` — Captura via leitores USB/Ethernet
- `web/src/components/biometria/BiometriaSeletor.tsx` — Seletor entre os 3 métodos
- `web/src/components/biometria/index.ts` — Exports centralizados
- `web/src/components/ui/tabs.tsx` — Componente Tabs (shadcn/ui)

### Arquivos Modificados
- `web/src/pages/Entregas.tsx` — Integração dos componentes de biometria
- `web/src/hooks/useEntregas.ts` — Suporte a campos de biometria no tipo e mutation

### Documentação
- `BIOMETRIA_HARDWARE_SETUP.md` — Guia completo de configuração de leitores
- `BIOMETRIA_IMPLEMENTACAO.md` — Este arquivo (resumo técnico)

---

## 🔧 Como Usar

### 1. Executar Migration

```sql
-- No Supabase SQL Editor, executar:
-- supabase/migrations/014_biometria_entregas.sql
```

### 2. Instalar Dependência (se necessário)

```bash
cd web
npm install @radix-ui/react-tabs
```

### 3. Testar no Sistema

1. Acesse **Entregas de EPI** → **Nova Entrega**
2. Selecione um funcionário
3. Escolha entre as 3 abas:
   - **Assinatura** — Desenhe com mouse/toque
   - **Dispositivo** — Use biometria nativa (Touch ID, Windows Hello)
   - **Leitor** — Use leitor biométrico USB (requer SDK instalado)

---

## 🎯 Fluxo de Autenticação

### Assinatura Manual
```
1. Usuário desenha no canvas
2. Converte para base64 PNG
3. Upload para bucket 'assinaturas'
4. Salva URL no campo assinatura_url
5. biometria_tipo = 'assinatura'
```

### Biometria WebAuthn
```
1. Navegador solicita biometria do dispositivo
2. Captura credencial (PublicKeyCredential)
3. Gera hash SHA-256 único
4. Salva credencial na tabela funcionarios_credenciais_biometricas
5. Salva hash no campo biometria_hash
6. biometria_tipo = 'webauthn'
```

### Biometria Hardware
```
1. Detecta SDK instalado (Digital Persona, Nitgen, etc)
2. Solicita captura no leitor
3. Recebe template biométrico
4. Gera hash SHA-256 único
5. Salva credencial na tabela funcionarios_credenciais_biometricas
6. Salva hash no campo biometria_hash
7. biometria_tipo = 'hardware'
```

---

## 🗄️ Estrutura do Banco

### Tabela: entregas_epi (colunas adicionadas)
```sql
biometria_hash TEXT              -- Hash SHA-256 da captura
biometria_tipo VARCHAR(20)       -- 'webauthn' | 'hardware' | 'assinatura'
biometria_dispositivo TEXT       -- Nome do dispositivo/leitor
biometria_metadata JSONB         -- Timestamp, IP, userAgent, etc
```

### Tabela: funcionarios_credenciais_biometricas (nova)
```sql
id UUID PRIMARY KEY
tenant_id UUID NOT NULL
funcionario_id UUID NOT NULL
credential_id TEXT UNIQUE        -- ID da credencial WebAuthn ou hash hardware
public_key TEXT                  -- Chave pública (WebAuthn) ou template (hardware)
counter INTEGER                  -- Contador de uso (anti-replay)
tipo VARCHAR(20)                 -- 'webauthn' | 'hardware'
dispositivo TEXT                 -- Informações do dispositivo
criado_em TIMESTAMPTZ
ultimo_uso TIMESTAMPTZ
ativo BOOLEAN
```

---

## 🔒 Segurança

### Dados Sensíveis
- ✅ Templates biométricos armazenados como **hash SHA-256 irreversível**
- ✅ Chaves públicas (não privadas) para WebAuthn
- ✅ RLS ativo em todas tabelas
- ✅ Bucket 'assinaturas' privado (apenas tenant acessa)

### Conformidade LGPD
- ✅ Consentimento explícito (funcionário precisa autorizar biometria)
- ✅ Dados biométricos não compartilhados entre tenants
- ✅ Direito ao esquecimento (pode remover credenciais)
- ✅ Auditoria completa (timestamp, IP, dispositivo)

### Anti-Fraude
- ✅ **Replay Attack**: Counter incrementado a cada uso (WebAuthn)
- ✅ **Hash único**: Cada captura gera hash diferente (timestamp incluído)
- ✅ **Device binding**: Credencial vinculada ao dispositivo
- ✅ **Audit trail**: Metadados salvos para investigação

---

## 📊 Relatórios e PDF

### Comprovante de Entrega

O PDF gerado agora mostra:

**Assinatura manual**:
```
Declaro ter recebido o EPI acima em perfeito estado.
_________________________________
Assinatura do Funcionário
```

**Biometria (WebAuthn ou Hardware)**:
```
✓ Autenticado via Touch ID / Windows Hello
Hash: a3f5c8d2e1b4f9a7c2d8e5f1a6b9c3d7e2f8...
```

---

## 🚀 Próximos Passos

### Funcionalidades Futuras (Opcional)

1. **Dashboard de Auditoria**
   - Relatório de entregas por tipo de autenticação
   - Gráfico: assinatura vs biometria
   - Alertas de múltiplas tentativas falhadas

2. **Re-autenticação**
   - Validar biometria ao devolver EPI
   - Confirmar que é o mesmo funcionário

3. **Foto + Biometria**
   - Tirar foto no momento da entrega
   - Armazenar foto_url junto com biometria

4. **Modo Offline**
   - Capturar biometria offline
   - Sincronizar quando voltar online

5. **Exportação de Auditoria**
   - CSV com todas entregas + método usado
   - Relatório para compliance

---

## 📞 Suporte

**Desenvolvedor**: Joelson  
**Email**: joelson76@gmail.com  
**Projeto**: SafeTrack — Sistema SST  
**Data**: Junho 2026  
**Versão**: 1.0

---

## ✅ Checklist de Deploy

- [ ] Executar migration `014_biometria_entregas.sql` no Supabase
- [ ] Instalar `@radix-ui/react-tabs` (se não instalado)
- [ ] Testar assinatura manual (deve continuar funcionando)
- [ ] Testar WebAuthn em dispositivo com biometria
- [ ] (Opcional) Configurar leitor biométrico USB + SDK
- [ ] Testar geração de PDF com cada método
- [ ] Verificar RLS (funcionário só vê suas credenciais)
- [ ] Documentar uso no manual do cliente

---

**🎉 Implementação concluída com sucesso!**
