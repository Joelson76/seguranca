# Configuração de Leitores Biométricos — SafeTrack

O SafeTrack suporta **3 métodos de autenticação** para entregas de EPI:

1. **Assinatura manual** (canvas) — método padrão, funciona em qualquer dispositivo
2. **Biometria do dispositivo** (WebAuthn) — Touch ID, Face ID, Windows Hello
3. **Leitor biométrico externo** (hardware) — leitores USB/Ethernet

---

## 1. Biometria do Dispositivo (WebAuthn)

### ✅ Funciona automaticamente!

Não requer instalação. Usa a biometria nativa do dispositivo:

- **Windows**: Windows Hello (impressão digital ou reconhecimento facial)
- **macOS**: Touch ID / Face ID
- **Android**: Biometria do sistema (impressão digital)
- **iOS/iPadOS**: Touch ID / Face ID

### Requisitos

- Navegador moderno (Chrome, Edge, Safari, Firefox)
- Dispositivo com sensor biométrico configurado
- Conexão HTTPS (obrigatório para WebAuthn)

### Como usar

1. Selecione o funcionário
2. Clique na aba "Dispositivo"
3. Clique em "Capturar Biometria"
4. Autentique usando o sensor do dispositivo

---

## 2. Leitor Biométrico Externo (Hardware)

Para usar leitores USB/Ethernet profissionais, é necessário instalar o SDK do fabricante.

### Leitores Suportados

#### Digital Persona U.are.U
- **Modelos**: U.are.U 4500, 5000, 5100, 5160
- **SDK**: [Digital Persona Web SDK](https://www.digitalpersona.com/support/downloads/)
- **Versão mínima**: 4.0

**Instalação:**
```bash
# Baixar e instalar o Digital Persona Web SDK
# https://www.digitalpersona.com/download/

# Após instalação, o objeto global estará disponível:
# window.DPFPDevices
```

#### Nitgen Hamster
- **Modelos**: Hamster Plus, Hamster DX, Hamster Pro
- **SDK**: [Nitgen NBioBSP](https://www.nitgen.com/eng/product/sdk.html)
- **Versão mínima**: 5.0

**Instalação:**
```bash
# Baixar e instalar Nitgen NBioBSP SDK
# https://www.nitgen.com/eng/download/sdk.html

# Após instalação, o objeto global estará disponível:
# window.NBioBSP
```

#### ZKTeco
- **Modelos**: ZK9500, ZK4500, ZK6500
- **SDK**: [ZKFinger SDK](https://www.zkteco.com/en/download)
- **Versão mínima**: 10.0

**Instalação:**
```bash
# Baixar e instalar ZKFinger SDK
# https://www.zkteco.com/en/product_detail/117.html

# Após instalação, o objeto global estará disponível:
# window.ZKFinger
```

#### Futronic FS Series
- **Modelos**: FS80, FS88, FS90
- **SDK**: [Futronic SDK](http://www.futronic-tech.com/download.html)
- **Versão mínima**: 6.0

**Instalação:**
```bash
# Baixar e instalar Futronic SDK
# http://www.futronic-tech.com/download.html

# Após instalação, o objeto global estará disponível:
# window.FutronicSDK
```

---

## 3. Verificando a Instalação

Após instalar o SDK, abra o console do navegador (F12) e verifique:

```javascript
// Verificar Digital Persona
console.log(window.DPFPDevices)

// Verificar Nitgen
console.log(window.NBioBSP)

// Verificar ZKTeco
console.log(window.ZKFinger)

// Verificar Futronic
console.log(window.FutronicSDK)
```

Se o objeto global estiver disponível, o SafeTrack detectará automaticamente o leitor.

---

## 4. Resolução de Problemas

### "Leitor biométrico não detectado"

**Causa**: SDK não instalado ou navegador não detectou o plugin

**Solução**:
1. Reinstale o SDK do fabricante
2. Reinicie o navegador após a instalação
3. Verifique se o serviço do SDK está rodando (Task Manager → Serviços)
4. Tente outro navegador (alguns SDKs funcionam melhor no Chrome/Edge)

### "Leitor não conectado"

**Causa**: Leitor USB não conectado ou driver não instalado

**Solução**:
1. Conecte o leitor USB
2. Verifique no Gerenciador de Dispositivos se o driver está instalado
3. Teste o leitor usando o software do fabricante (geralmente vem com utilitário de teste)

### "Erro ao capturar biometria"

**Causa**: Falha na leitura ou dedo mal posicionado

**Solução**:
1. Limpe o sensor do leitor
2. Certifique-se de posicionar o dedo corretamente
3. Aguarde a mensagem do sistema antes de remover o dedo
4. Tente outro dedo se persistir

---

## 5. Segurança e Privacidade

### Dados Armazenados

- **Assinatura manual**: Imagem PNG armazenada no bucket `assinaturas` (Supabase Storage)
- **Biometria WebAuthn**: Hash SHA-256 + chave pública (não armazena imagem biométrica)
- **Biometria Hardware**: Template biométrico (hash SHA-256, não reversível)

### LGPD

✅ **Conformidade total**:
- Templates biométricos são hashes irreversíveis
- Dados sensíveis armazenados com criptografia
- Funcionário pode solicitar remoção a qualquer momento
- Consentimento explícito antes da primeira captura

### Prevenção de Fraudes

- WebAuthn: Usa contadores e previne replay attacks
- Hardware: Salva hash + timestamp + IP para auditoria
- Todas capturas geram hash único e rastreável

---

## 6. Recomendações por Cenário

### Pequenas Empresas (até 50 funcionários)
**Recomendação**: Biometria do dispositivo (WebAuthn)
- Sem custo adicional de hardware
- Funciona em qualquer notebook/tablet moderno
- Setup zero

### Médias Empresas (50-200 funcionários)
**Recomendação**: Mix de WebAuthn + 1-2 leitores USB
- Leitores USB nas recepções/almoxarifados
- WebAuthn para colaboradores externos
- Custo: ~R$ 300-800 por leitor

### Grandes Empresas (200+ funcionários)
**Recomendação**: Leitores biométricos dedicados
- Digital Persona U.are.U 5160 (melhor custo-benefício)
- ZKTeco ZK9500 (alta durabilidade)
- Setup em múltiplas estações
- Custo: ~R$ 500-1.500 por leitor

---

## 7. Suporte

Para dúvidas sobre configuração de leitores biométricos:

📧 **Email**: joelson76@gmail.com  
📱 **WhatsApp**: Disponível no painel Admin  
📚 **Documentação**: `/CLAUDE.md` e `/README.md`

---

**Desenvolvido por SafeTrack** — Sistema completo de gestão SST  
Versão 1.0 — Junho 2026
