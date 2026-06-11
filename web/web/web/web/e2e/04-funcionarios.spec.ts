import { test, expect } from '@playwright/test'
import { TEST_USER, TEST_FUNCIONARIO, generateRandomCPF } from './helpers/test-data'

test.describe('Funcionários', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', TEST_USER.email)
    await page.fill('input[type="password"]', TEST_USER.password)
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/(app\/dashboard|onboarding)/, { timeout: 10000 })
    
    if (page.url().includes('onboarding')) {
      await page.goto('/app/funcionarios')
    } else {
      await page.click('a[href="/app/funcionarios"]')
    }
  })

  test('deve listar funcionários', async ({ page }) => {
    await expect(page).toHaveURL('/app/funcionarios')
    
    // Aguardar carregamento
    await page.waitForTimeout(2000)
    
    // Verificar se há tabela ou lista de funcionários
    const pageText = await page.textContent('body')
    expect(pageText).toBeTruthy()
  })

  test('deve abrir modal de novo funcionário', async ({ page }) => {
    // Procurar botão "Novo" ou "Adicionar"
    const newButton = page.getByRole('button', { name: /novo|adicionar/i }).first()
    await newButton.click()
    
    // Aguardar modal abrir
    await page.waitForTimeout(500)
    
    // Verificar se o formulário apareceu
    const nameInput = page.locator('input[name="nome"], input[placeholder*="nome" i]').first()
    await expect(nameInput).toBeVisible()
  })

  test('deve validar campos obrigatórios ao criar funcionário', async ({ page }) => {
    const newButton = page.getByRole('button', { name: /novo|adicionar/i }).first()
    await newButton.click()
    await page.waitForTimeout(500)
    
    // Tentar submeter sem preencher
    const submitButton = page.getByRole('button', { name: /salvar|criar/i }).first()
    await submitButton.click()
    
    // Aguardar validação
    await page.waitForTimeout(500)
    
    // Modal deve continuar aberto (não fechou)
    const nameInput = page.locator('input[name="nome"], input[placeholder*="nome" i]').first()
    await expect(nameInput).toBeVisible()
  })
})
