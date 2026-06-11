# Política de Privacidade — SafeTrack

**Última atualização:** 10 de junho de 2026  
**Vigência:** A partir de 10 de junho de 2026

Esta Política de Privacidade descreve como o **SafeTrack** coleta, usa, armazena e protege seus dados pessoais, em conformidade com a **Lei Geral de Proteção de Dados (LGPD - Lei 13.709/2018)**.

---

## 1. Dados Coletados

### 1.1 Dados fornecidos por você:
- **Cadastro**: nome, email, CPF, telefone, senha (criptografada)
- **Empresa**: nome fantasia, razão social, CNPJ, endereço, telefone
- **Funcionários**: nome, CPF, cargo, setor, data de admissão, foto (opcional)
- **Documentos**: uploads de PDFs, certificados, evidências de acidentes
- **Assinatura digital**: imagem de assinatura em canvas (entregas EPI)

### 1.2 Dados coletados automaticamente:
- **Logs de acesso**: IP, data/hora, ações realizadas
- **Dados técnicos**: navegador, sistema operacional, dispositivo
- **Cookies**: sessão de autenticação, preferências de tema

### 1.3 Dados que NÃO coletamos:
- ❌ Dados sensíveis (raça, religião, opinião política)
- ❌ Dados bancários (processados por gateway de pagamento)
- ❌ Localização em tempo real

---

## 2. Finalidade do Tratamento

Utilizamos seus dados para:

### 2.1 Prestação do serviço:
- Autenticação e controle de acesso
- Gestão de funcionários, EPIs, treinamentos
- Geração de relatórios e documentos SST
- Armazenamento seguro de arquivos

### 2.2 Comunicação:
- Envio de alertas (vencimento de CA, treinamentos)
- Notificações de sistema
- Suporte técnico
- Atualizações de produto

### 2.3 Cobrança:
- Processamento de pagamentos (via Asaas)
- Emissão de notas fiscais
- Controle de inadimplência

### 2.4 Melhoria do serviço:
- Análise de uso (anonimizado)
- Correção de bugs
- Desenvolvimento de novas funcionalidades

### 2.5 Cumprimento legal:
- Atendimento a obrigações legais (NR-6, NR-7, eSocial)
- Resposta a ordens judiciais
- Auditorias trabalhistas

---

## 3. Base Legal (LGPD Art. 7)

Tratamos seus dados com base em:

- **Consentimento** (Art. 7, I): você aceita nossos termos ao criar conta
- **Execução de contrato** (Art. 7, V): necessário para fornecer o serviço
- **Obrigação legal** (Art. 7, II): compliance com NRs e legislação trabalhista
- **Legítimo interesse** (Art. 7, IX): melhoria do serviço, segurança

---

## 4. Compartilhamento de Dados

### 4.1 Com quem compartilhamos:

| Destinatário | Dados | Finalidade |
|--------------|-------|------------|
| **Supabase** | Todos os dados | Hospedagem do banco e storage |
| **Vercel** | Dados de sessão | Hospedagem da aplicação |
| **Asaas** | Nome, email, CPF, valor | Processamento de pagamentos |
| **Resend** | Email | Envio de emails transacionais |
| **Sentry** | Logs de erro | Monitoramento de bugs |

### 4.2 NÃO compartilhamos com:
- ❌ Empresas de marketing
- ❌ Redes sociais
- ❌ Corretores de dados
- ❌ Terceiros para fins comerciais

### 4.3 Transferência internacional:
Alguns de nossos fornecedores (Supabase, Vercel) podem armazenar dados em servidores fora do Brasil (EUA, Europa). Garantimos que essas empresas possuem certificações adequadas (ISO 27001, SOC 2).

---

## 5. Armazenamento e Segurança

### 5.1 Onde armazenamos:
- **Banco de dados**: Supabase (PostgreSQL criptografado)
- **Arquivos**: Supabase Storage (buckets privados)
- **Backups**: Retenção de 30 dias (PITR)

### 5.2 Medidas de segurança:
- ✅ Criptografia em trânsito (HTTPS/TLS)
- ✅ Criptografia em repouso (AES-256)
- ✅ Autenticação multifator disponível
- ✅ Row Level Security (RLS) - isolamento por empresa
- ✅ Logs de auditoria
- ✅ Backups automáticos diários
- ✅ Monitoramento 24/7

### 5.3 Retenção de dados:
- **Conta ativa**: enquanto a assinatura estiver vigente
- **Conta cancelada**: 90 dias após cancelamento (para recuperação)
- **Dados anonimizados**: indefinidamente (compliance trabalhista)
- **Logs de auditoria**: 5 anos (obrigação legal)

---

## 6. Seus Direitos (LGPD Art. 18)

Você tem direito a:

### 6.1 Confirmação e acesso:
- Confirmar se tratamos seus dados
- Acessar seus dados a qualquer momento

### 6.2 Correção:
- Corrigir dados incompletos, inexatos ou desatualizados

### 6.3 Anonimização, bloqueio ou eliminação:
- Solicitar anonimização de dados desnecessários
- Bloquear dados tratados de forma irregular
- Excluir sua conta (direito ao esquecimento)

### 6.4 Portabilidade:
- **Exportar seus dados** em formato JSON
- Acessível em: Configurações → Exportar Dados

### 6.5 Revogação de consentimento:
- Revogar consentimento a qualquer momento
- Solicitar por email: privacidade@safetrack.com.br

### 6.6 Oposição:
- Opor-se ao tratamento de dados

**Como exercer seus direitos:**
1. Acesse **Configurações → Privacidade e Dados**
2. Ou envie email para: **privacidade@safetrack.com.br**

---

## 7. Cookies

### 7.1 Cookies que usamos:

| Nome | Tipo | Finalidade | Duração |
|------|------|------------|---------|
| `sb-access-token` | Essencial | Autenticação | Sessão |
| `sb-refresh-token` | Essencial | Manter login | 7 dias |
| `theme` | Funcional | Preferência dark/light | 1 ano |

### 7.2 Como gerenciar:
Você pode bloquear cookies nas configurações do seu navegador, mas isso pode afetar a funcionalidade do SafeTrack.

---

## 8. Menores de Idade

O SafeTrack é destinado a **empresas** e **maiores de 18 anos**. Não coletamos intencionalmente dados de menores.

---

## 9. Incidentes de Segurança

### 9.1 Em caso de vazamento de dados:
- Notificaremos você em até **48 horas**
- Informaremos a ANPD (Autoridade Nacional)
- Tomaremos medidas corretivas imediatas

### 9.2 Relatar incidente:
Email: **seguranca@safetrack.com.br**

---

## 10. DPO - Encarregado de Dados

**Nome**: [SEU NOME ou nome do DPO]  
**Email**: privacidade@safetrack.com.br  
**Telefone**: [SEU TELEFONE]

O DPO é responsável por:
- Atender solicitações de titulares
- Orientar sobre proteção de dados
- Comunicar incidentes à ANPD

---

## 11. Alterações nesta Política

Podemos atualizar esta Política periodicamente. Você será notificado por email com **30 dias de antecedência** sobre mudanças significativas.

**Versão atual**: 1.0  
**Data da última alteração**: 10 de junho de 2026

---

## 12. Lei Aplicável e Foro

Esta Política é regida pelas leis brasileiras. Foro: São Paulo/SP.

---

## 13. Contato

**SafeTrack LTDA**  
CNPJ: [SEU CNPJ]  
Email: privacidade@safetrack.com.br  
Endereço: [SEU ENDEREÇO]

**Dúvidas sobre privacidade?**  
Entre em contato: privacidade@safetrack.com.br

---

**Documento gerado em conformidade com:**
- Lei 13.709/2018 (LGPD)
- Marco Civil da Internet (Lei 12.965/2014)
- Código de Defesa do Consumidor (Lei 8.078/1990)

**SafeTrack** — Seus dados protegidos por design 🛡️
