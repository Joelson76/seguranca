# 🧪 Testes Automatizados — SafeTrack

## 📊 Status dos Testes

✅ **22 testes** unitários passando  
✅ **100% de coverage** nos arquivos testados  
✅ CI/CD configurado (próximo passo)

## 🛠 Stack de Testes

- **Vitest** - Test runner moderno e rápido
- **Testing Library** - Testes orientados ao comportamento do usuário
- **@vitest/ui** - Interface visual para testes
- **jsdom** - Ambiente DOM para testes de componentes React
- **@vitest/coverage-v8** - Relatórios de cobertura de código

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
npm run test:e2e        # Rodar E2E
npm run test:e2e:ui     # Interface visual E2E
```

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
├── vitest.config.ts                    # Configuração do Vitest
└── e2e/                                # Testes E2E (Playwright)
```

## 📝 Cobertura Atual

### ✅ Testado
- **Utils**: formatDate, formatDateTime, formatCPF, formatCNPJ, formatCurrency, cn
- **Componentes UI**: Button (variantes, tamanhos, disabled, onClick)
- **Componentes UI**: Card (título, descrição, conteúdo, rodapé)
- **Componentes Shared**: EmptyState (ícone, título, descrição)

### 🔜 Próximos Passos
- Testes de hooks (useFuncionarios, useEpis) com mock do Supabase
- Testes de páginas (Dashboard, Funcionários)
- Testes de integração com React Query
- Aumentar coverage para > 70%

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

## 📈 Métricas de Qualidade

| Métrica | Valor Atual | Meta |
|---------|-------------|------|
| Testes Unitários | 22 | 100+ |
| Coverage | 100%* | 70%+ |
| Testes E2E | 0 | 10+ |

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
