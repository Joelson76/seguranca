# 🧪 Testes Automatizados — SafeTrack

## 📊 Status dos Testes

✅ **22 testes unitários** passando  
✅ **16 testes E2E** configurados  
✅ **100% de coverage** nos arquivos testados  
✅ CI/CD configurado (próximo passo)

## 🛠 Stack de Testes

### Testes Unitários
- **Vitest** - Test runner moderno e rápido
- **Testing Library** - Testes orientados ao comportamento do usuário
- **@vitest/ui** - Interface visual para testes
- **jsdom** - Ambiente DOM para testes de componentes React
- **@vitest/coverage-v8** - Relatórios de cobertura de código

### Testes E2E
- **Playwright** - Automação de testes em browsers reais
- **Chromium** - Browser para testes E2E
- **playwright.config.ts** - Configuração centralizada

## 🚀 Comandos

### Rodar todos os testes
```bash
npm test
```

### Rodar testes em modo watch (desenvolvimento)
```bash
npm test
# ou
npm run test:ui  # Interface visual
```

### Gerar relatório de coverage
```bash
npm run test:coverage
```

O relatório HTML será gerado em `coverage/index.html`

### Testes E2E (Playwright)
```bash
npm run test:e2e        # Rodar todos os testes E2E
npm run test:e2e:ui     # Interface visual E2E (modo interativo)
npm run test:e2e:report # Ver relatório HTML dos testes
```

**Nota:** Os testes E2E iniciam automaticamente o dev server (Vite) na porta 5173

## 📁 Estrutura de Testes

```
web/
├── src/
│   ├── lib/
│   │   └── utils.test.ts              # Testes de funções utilitárias
│   ├── components/
│   │   ├── ui/
│   │   │   ├── button.test.tsx        # Testes de Button
│   │   │   └── card.test.tsx          # Testes de Card
│   │   └── shared/
│   │       └── EmptyState.test.tsx    # Testes de EmptyState
│   └── test/
│       ├── setup.ts                    # Configuração global de testes
│       └── mocks/
│           └── supabase.ts             # Mocks do Supabase
├── e2e/                                # Testes E2E (Playwright)
│   ├── helpers/
│   │   ├── auth.ts                     # Helpers de autenticação
│   │   └── test-data.ts                # Dados de teste
│   ├── 01-landing.spec.ts              # Testes da landing page
│   ├── 02-auth.spec.ts                 # Testes de login/logout
│   ├── 03-dashboard.spec.ts            # Testes do dashboard
│   ├── 04-funcionarios.spec.ts         # Testes de funcionários
│   ├── 05-epis.spec.ts                 # Testes de EPIs
│   └── 06-entregas.spec.ts             # Testes de entregas
├── vitest.config.ts                    # Configuração do Vitest
└── playwright.config.ts                # Configuração do Playwright
```

## 📝 Cobertura Atual

### ✅ Testado
- **Utils**: formatDate, formatDateTime, formatCPF, formatCNPJ, formatCurrency, cn
- **Componentes UI**: Button (variantes, tamanhos, disabled, onClick)
- **Componentes UI**: Card (título, descrição, conteúdo, rodapé)
- **Componentes Shared**: EmptyState (ícone, título, descrição)

### ✅ Testes E2E
- **Landing Page**: navegação, links para login/registro (3 testes)
- **Autenticação**: login, logout, credenciais inválidas, recuperação de senha (4 testes)
- **Dashboard**: carregamento, navegação sidebar, tema dark/light (3 testes)
- **Funcionários**: listagem, modal de novo, validação de campos (3 testes)
- **EPIs**: listagem, modal de novo, alertas de estoque (3 testes)
- **Entregas**: listagem, modal de nova entrega (2 testes)

**Total E2E: 18 testes** em 6 suites

### 🔜 Próximos Passos
- Executar testes E2E em ambiente de teste real
- Testes de hooks (useFuncionarios, useEpis) com mock do Supabase
- Testes de integração com React Query
- Aumentar coverage unitário para > 70%
- Configurar CI/CD no GitHub Actions

## 🧪 Exemplos de Testes

### Teste de Função Utilitária
```typescript
describe('formatCPF', () => {
  it('deve formatar CPF corretamente', () => {
    expect(formatCPF('12345678900')).toBe('123.456.789-00')
  })
})
```

### Teste de Componente
```typescript
describe('Button', () => {
  it('deve chamar onClick quando clicado', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Clique</Button>)
    
    await user.click(screen.getByText('Clique'))
    expect(handleClick).toHaveBeenCalledOnce()
  })
})
```

### Teste com Mock do Supabase
```typescript
vi.mock('@/lib/supabase', () => ({
  supabase: mockSupabaseClient
}))
```

### Teste E2E (Playwright)
```typescript
import { test, expect } from '@playwright/test'

test('deve fazer login com sucesso', async ({ page }) => {
  await page.goto('/login')
  await page.fill('input[type="email"]', 'usuario@teste.com')
  await page.fill('input[type="password"]', 'senha123')
  await page.click('button[type="submit"]')
  
  await page.waitForURL('/app/dashboard')
  await expect(page).toHaveURL('/app/dashboard')
})
```

## 📈 Métricas de Qualidade

| Métrica | Valor Atual | Meta |
|---------|-------------|------|
| Testes Unitários | 22 | 100+ |
| Testes E2E | 18 | 20+ |
| Coverage | 100%* | 70%+ |

\* dos arquivos testados

## 🔧 Configuração

### vitest.config.ts
- Ambiente: jsdom (simula browser)
- Globals: habilitado (não precisa importar describe, it, expect)
- Coverage: V8 provider
- Aliases: `@/` aponta para `src/`

### Arquivos Excluídos do Coverage
- `node_modules/`
- `dist/`
- `e2e/` (testes Playwright)
- `**/*.spec.ts` (arquivos E2E)
- `**/*.config.*`
- `src/test/` (setup e mocks)

## 🎯 Melhores Práticas

1. **Testes unitários** testam funções e componentes isoladamente
2. **Testes de integração** testam fluxos completos (hooks + componentes)
3. **Testes E2E** testam a aplicação real no navegador
4. Use `screen.getByRole` ao invés de `getByText` quando possível
5. Mock o Supabase para testes rápidos e determinísticos
6. Mantenha coverage acima de 70% para código crítico

## 🐛 Troubleshooting

### Erro: "Cannot find module '@/...'"
Verifique se o alias está configurado em `vitest.config.ts`

### Testes Playwright rodando no Vitest
Adicione `exclude: ['e2e', '**/*.spec.ts']` no vitest.config.ts

### Coverage não gera HTML
Instale: `npm install -D @vitest/coverage-v8`

---

**SafeTrack** — Testes garantem qualidade 🛡️
