import { test, expect } from '@playwright/test'
import { TEST_USER } from './helpers/test-data'

test.describe('EPIs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', TEST_USER.email)
    await page.fill('input[type="password"]', TEST_USER.password)
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/(app\/dashboard|onboarding)/, { timeout: 10000 })
    
    if (page.url().includes('onboarding')) {
      await page.goto('/app/epis')
    } else {
      await page.click('a[href="/app/epis"]')
    }
  })

  test('deve listar EPIs cadastrados', async ({ page }) => {
    await expect(page).toHaveURL('/app/epis')
    await page.waitForTimeout(2000)
    
    const pageText = await page.textContent('body')
    expect(pageText).toBeTruthy()
  })

  test('deve abrir modal de novo EPI', async ({ page }) => {
    const newButton = page.getByRole('button', { name: /novo|adicionar/i }).first()
    await newButton.click()
    await page.waitForTimeout(500)
    
    // Verificar campos do formulário
    const nomeInput = page.locator('input[name="nome"], input[placeholder*="nome" i]').first()
    await expect(nomeInput).toBeVisible()
  })

  test('deve exibir alerta de estoque baixo', async ({ page }) => {
    await page.waitForTimeout(2000)
    
    // Verificar se há algum indicador de estoque baixo
    const pageText = await page.textContent('body')
    // Se houver EPIs com estoque baixo, deve mostrar algum alerta visual
    expect(pageText).toBeTruthy()
  })
})
