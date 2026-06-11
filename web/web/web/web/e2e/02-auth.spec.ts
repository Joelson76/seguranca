import { test, expect } from '@playwright/test'
import { TEST_USER } from './helpers/test-data'

test.describe('Autenticação', () => {
  test('deve exibir erro com credenciais inválidas', async ({ page }) => {
    await page.goto('/login')
    
    await page.fill('input[type="email"]', 'invalido@teste.com')
    await page.fill('input[type="password"]', 'senhaerrada')
    await page.click('button[type="submit"]')
    
    // Aguardar toast de erro aparecer
    await page.waitForTimeout(1000)
    
    // Deve continuar na página de login
    await expect(page).toHaveURL(/\/login/)
  })

  test('deve fazer login com credenciais válidas', async ({ page }) => {
    await page.goto('/login')
    
    await page.fill('input[type="email"]', TEST_USER.email)
    await page.fill('input[type="password"]', TEST_USER.password)
    await page.click('button[type="submit"]')
    
    // Deve redirecionar para dashboard ou onboarding
    await page.waitForURL(/\/(app\/dashboard|onboarding)/, { timeout: 10000 })
    
    const url = page.url()
    expect(url).toMatch(/\/(app\/dashboard|onboarding)/)
  })

  test('deve fazer logout com sucesso', async ({ page }) => {
    // Fazer login primeiro
    await page.goto('/login')
    await page.fill('input[type="email"]', TEST_USER.email)
    await page.fill('input[type="password"]', TEST_USER.password)
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/(app\/dashboard|onboarding)/, { timeout: 10000 })
    
    // Se estiver no onboarding, pular
    if (page.url().includes('onboarding')) {
      await page.goto('/app/dashboard')
    }
    
    // Fazer logout
    await page.click('button[title="Sair"]')
    await page.waitForURL('/login')
    
    await expect(page).toHaveURL('/login')
  })

  test('deve acessar página de recuperação de senha', async ({ page }) => {
    await page.goto('/login')
    
    const forgotLink = page.getByText(/esqueceu|recuperar/i)
    await forgotLink.click()
    
    await expect(page).toHaveURL(/\/recuperar-senha/)
  })
})
