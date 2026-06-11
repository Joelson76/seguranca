
## 🌐 Testes E2E — Detalhes

### Como Funcionam

Os testes E2E (End-to-End) testam a aplicação completa rodando em um browser real (Chromium). O Playwright:
1. Inicia automaticamente o dev server (`npm run dev`)
2. Abre um browser headless
3. Navega pelas páginas como um usuário real
4. Valida comportamentos e fluxos completos

### Configuração de Ambiente

Para rodar testes E2E, você precisa de um usuário de teste no Supabase:

```bash
# Opção 1: Usar variáveis de ambiente
export TEST_USER_EMAIL="teste.e2e@safetrack.com"
export TEST_USER_PASSWORD="Teste@123456"

# Opção 2: Criar arquivo .env.test
echo 'TEST_USER_EMAIL=teste.e2e@safetrack.com' >> web/.env.test
echo 'TEST_USER_PASSWORD=Teste@123456' >> web/.env.test
```

### Executando Testes E2E

```bash
# Rodar todos os testes E2E (headless)
npm run test:e2e

# Modo interativo com UI visual
npm run test:e2e:ui

# Rodar teste específico
npx playwright test e2e/02-auth.spec.ts

# Rodar em modo debug (passo a passo)
npx playwright test --debug

# Ver relatório HTML
npm run test:e2e:report
```

### Estrutura de um Teste E2E

```typescript
import { test, expect } from '@playwright/test'
import { TEST_USER } from './helpers/test-data'

test.describe('Nome da Suite', () => {
  test.beforeEach(async ({ page }) => {
    // Setup antes de cada teste (ex: fazer login)
    await page.goto('/login')
    // ... login
  })

  test('deve realizar ação X', async ({ page }) => {
    // Navegar
    await page.goto('/app/funcionarios')
    
    // Interagir
    await page.click('button')
    await page.fill('input', 'valor')
    
    // Validar
    await expect(page).toHaveURL('/esperado')
    await expect(page.getByText('Sucesso')).toBeVisible()
  })
})
```

### Helpers Disponíveis

#### `e2e/helpers/auth.ts`
- `login(page, email, password)` - Faz login
- `logout(page)` - Faz logout
- `register(page, ...)` - Cria nova conta

#### `e2e/helpers/test-data.ts`
- `TEST_USER` - Dados do usuário de teste
- `TEST_FUNCIONARIO` - Dados de funcionário fake
- `TEST_EPI` - Dados de EPI fake
- `generateRandomEmail()` - Gera email único
- `generateRandomCPF()` - Gera CPF fake

### Debugging de Testes E2E

```bash
# Modo debug com Playwright Inspector
npx playwright test --debug

# Ver trace de teste falhado
npx playwright show-trace trace.zip

# Screenshots de falhas
# Salvos automaticamente em test-results/
```

### Boas Práticas E2E

1. **Use seletores semânticos**: `getByRole`, `getByLabel` ao invés de classes CSS
2. **Aguarde elementos**: Use `waitForTimeout` com moderação, prefira `waitForSelector`
3. **Isole testes**: Cada teste deve ser independente
4. **Cleanup**: Remova dados de teste após execução (se necessário)
5. **Timeouts**: Testes E2E podem ser lentos, configure timeouts adequados

### Troubleshooting

#### Erro: "Timeout waiting for baseURL"
O dev server não iniciou. Verifique se a porta 5173 está livre:
```bash
netstat -ano | findstr :5173  # Windows
lsof -i :5173                  # Mac/Linux
```

#### Erro: "Browser not found"
Instale os browsers do Playwright:
```bash
npx playwright install chromium
```

#### Testes falhando por timing
Aumente timeouts em `playwright.config.ts`:
```typescript
use: {
  actionTimeout: 10000,  // 10s para cada ação
}
```

---

**SafeTrack** — Testes E2E garantem qualidade real 🛡️
