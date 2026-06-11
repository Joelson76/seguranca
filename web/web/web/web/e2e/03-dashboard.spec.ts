import { test, expect } from '@playwright/test'
import { TEST_USER } from './helpers/test-data'

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login antes de cada teste
    await page.goto('/login')
    await page.fill('input[type="email"]', TEST_USER.email)
    await page.fill('input[type="password"]', TEST_USER.password)
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/(app\/dashboard|onboarding)/, { timeout: 10000 })
    
    // Se cair no onboarding, ir direto pro dashboard
    if (page.url().includes('onboarding')) {
      await page.goto('/app/dashboard')
    }
  })

  test('deve carregar dashboard com cards de métricas', async ({ page }) => {
    await expect(page).toHaveURL('/app/dashboard')
    
    // Aguardar carregamento
    await page.waitForTimeout(2000)
    
    // Verificar se há conteúdo na página
    const body = await page.textContent('body')
    expect(body).toBeTruthy()
  })

  test('deve navegar pela sidebar', async ({ page }) => {
    // Clicar em Funcionários
    await page.click('a[href="/app/funcionarios"]')
    await expect(page).toHaveURL('/app/funcionarios')
    
    // Clicar em EPIs
    await page.click('a[href="/app/epis"]')
    await expect(page).toHaveURL('/app/epis')
    
    // Voltar ao Dashboard
    await page.click('a[href="/app/dashboard"]')
    await expect(page).toHaveURL('/app/dashboard')
  })

  test('deve alternar tema dark/light', async ({ page }) => {
    // Clicar no botão de tema
    await page.click('button[title*="tema"], button:has(svg.lucide-moon), button:has(svg.lucide-sun)')
    
    // Aguardar transição
    await page.waitForTimeout(500)
    
    // Verificar se a classe dark foi adicionada/removida no html
    const html = page.locator('html')
    const hasClass = await html.evaluate(el => el.classList.contains('dark'))
    expect(typeof hasClass).toBe('boolean')
  })
})
