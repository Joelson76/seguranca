# 🚀 CI/CD — GitHub Actions

SafeTrack possui pipeline completo de integração e deploy contínuos usando GitHub Actions.

## 📊 Workflows Configurados

### 1. CI - Testes e Build
**Arquivo:** `.github/workflows/ci.yml`  
**Trigger:** Push ou PR em `master`, `main`, `develop`

#### Jobs:
- **test** - Testes unitários e lint
  - ESLint para verificar código
  - Vitest para rodar 22 testes unitários
  - Coverage report enviado para Codecov
  
- **build** - Build de produção
  - Compila TypeScript
  - Bundling com Vite
  - Upload de artifacts (dist/) por 7 dias

#### Tempo médio: ~3-4 minutos

---

### 2. E2E - Testes End-to-End
**Arquivo:** `.github/workflows/e2e.yml`  
**Trigger:** Push ou PR em `master`, `main` + execução manual

#### Jobs:
- **test-e2e** - Testes com Playwright
  - Instala Chromium + deps do sistema
  - Roda 18 testes E2E
  - Upload de relatórios e screenshots em caso de falha

#### Tempo médio: ~8-10 minutos

**Nota:** Requer secrets `TEST_USER_EMAIL` e `TEST_USER_PASSWORD` configurados

---

### 3. Deploy - Vercel
**Arquivo:** `.github/workflows/deploy.yml`  
**Trigger:** Push em `master`/`main` + execução manual

#### Jobs:
- **deploy** - Deploy automático
  - Deploy para produção na Vercel
  - Comenta URL no PR (se for PR)

#### Tempo médio: ~2-3 minutos

**Nota:** Requer secrets Vercel configurados (opcional)

---

## 🔧 Configuração de Secrets

### Passo 1: Acessar Settings
```
Repositório → Settings → Secrets and variables → Actions
```

### Passo 2: Adicionar Secrets

#### Para Testes E2E (obrigatório se rodar E2E):
```
TEST_USER_EMAIL
  Valor: teste.e2e@safetrack.com

TEST_USER_PASSWORD
  Valor: Teste@123456
```

**Como criar usuário de teste:**
1. Acesse Supabase Dashboard → Authentication → Users
2. Add user → Email: `teste.e2e@safetrack.com`
3. Defina senha temporária
4. Faça login manual uma vez para completar onboarding
5. Use essas credenciais nos secrets

#### Para Deploy Vercel (opcional):
```
VERCEL_TOKEN
  Obter em: https://vercel.com/account/tokens

VERCEL_ORG_ID
  Encontrar em: Vercel Settings → General → Organization ID

VERCEL_PROJECT_ID
  Encontrar em: Vercel Project Settings → General → Project ID
```

---

## 📈 Status e Badges

### Adicionar Badges no README

Substitua `SEU-USUARIO` e `SafeTrack` pelo seu GitHub:

```markdown
![CI](https://github.com/SEU-USUARIO/SafeTrack/workflows/CI%20-%20Testes%20e%20Build/badge.svg)
![E2E](https://github.com/SEU-USUARIO/SafeTrack/workflows/E2E%20-%20Testes%20End-to-End/badge.svg)
![Deploy](https://github.com/SEU-USUARIO/SafeTrack/workflows/Deploy%20-%20Vercel/badge.svg)
```

### Ver Status dos Workflows
```
Repositório → Actions → Selecionar workflow
```

---

## 🔄 Fluxo de Trabalho

### Desenvolvimento Local
```bash
1. Criar branch: git checkout -b feature/nova-funcionalidade
2. Desenvolver e testar localmente: npm test
3. Commit: git commit -m "feat: nova funcionalidade"
4. Push: git push origin feature/nova-funcionalidade
```

### Automação no GitHub
```
1. GitHub Actions detecta push
2. Roda CI workflow:
   ✓ Lint
   ✓ Testes unitários (22)
   ✓ Build
3. Roda E2E workflow (se branch master/main):
   ✓ Testes E2E (18)
4. Se tudo passar: ✅ Status verde
5. Se falhar: ❌ Status vermelho + logs
```

### Pull Request
```
1. Criar PR no GitHub
2. CI/CD roda automaticamente
3. Revisar código + ver status dos checks
4. Merge quando todos os checks passarem
5. Deploy automático para produção (se configurado)
```

---

## 🐛 Troubleshooting

### ❌ CI falhando: "npm ci failed"
**Causa:** package-lock.json desatualizado  
**Solução:**
```bash
cd web
rm -rf node_modules package-lock.json
npm install
git add package-lock.json
git commit -m "chore: atualiza package-lock.json"
```

### ❌ E2E falhando: "Browser not found"
**Causa:** Playwright não instalado corretamente no CI  
**Solução:** Já configurado no workflow com `npx playwright install chromium --with-deps`

### ❌ E2E falhando: "Timeout waiting for baseURL"
**Causa:** Dev server não iniciou  
**Solução:** Verificar se `vite.config.ts` está configurado corretamente

### ❌ Deploy falhando: "Vercel token invalid"
**Causa:** Token expirou ou incorreto  
**Solução:** Gerar novo token em vercel.com/account/tokens

### ⚠️ Testes passam localmente mas falham no CI
**Causa:** Diferenças de ambiente (Windows local vs Linux CI)  
**Solução:** 
- Rodar testes em container Docker localmente
- Verificar case-sensitivity de arquivos
- Usar caminhos relativos, não absolutos

---

## 📊 Artifacts e Reports

### Coverage Report
- Upload automático para Codecov
- Badge mostra % de coverage
- Ver em: codecov.io/gh/SEU-USUARIO/SafeTrack

### Playwright Report
- Gerado em cada run E2E
- Download em: Actions → Run específico → Artifacts
- Válido por 7 dias

### Screenshots de Falhas
- Salvos quando teste E2E falha
- Download em: Actions → Run → playwright-screenshots
- Ajuda a debugar problemas visuais

---

## 🎯 Melhores Práticas

1. **Sempre rode testes localmente** antes de push
   ```bash
   npm test && npm run test:e2e
   ```

2. **Commits pequenos e frequentes**
   - CI roda mais rápido
   - Mais fácil identificar o que quebrou

3. **Mensagens de commit claras**
   ```
   feat: adiciona filtro por setor
   fix: corrige upload de foto
   test: adiciona teste de login
   chore: atualiza dependências
   ```

4. **Não commitar diretamente em master**
   - Sempre use branches
   - Crie PR para review
   - Aguarde CI passar antes de merge

5. **Monitorar falhas de CI**
   - Configurar notificações no GitHub
   - Corrigir imediatamente se falhar
   - Não fazer merge com CI falhando

---

## 📧 Notificações

### Configurar Notificações do GitHub
```
Perfil → Settings → Notifications
  ✓ Email notifications
  ✓ Actions workflow runs
  ✓ Failed workflow runs only (recomendado)
```

### Slack/Discord (opcional)
Adicionar webhook nos workflows:
```yaml
- name: Notificar Slack
  uses: slackapi/slack-github-action@v1
  with:
    payload: '{"text": "Build failed!"}'
```

---

## 🔐 Segurança

### ⚠️ NUNCA commitar:
- Tokens de API
- Senhas
- Service Role Keys do Supabase
- Arquivos `.env`

### ✅ Usar sempre:
- GitHub Secrets para dados sensíveis
- `.gitignore` para arquivos locais
- Variáveis de ambiente no CI

---

## 📚 Recursos

- [GitHub Actions Docs](https://docs.github.com/actions)
- [Playwright CI](https://playwright.dev/docs/ci)
- [Vercel GitHub Integration](https://vercel.com/docs/git)
- [Codecov](https://codecov.io/)

---

**SafeTrack** — CI/CD garante qualidade contínua 🛡️
