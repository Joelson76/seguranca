import { test, expect } from '@playwright/test'

test.describe('Landing Page', () => {
  test('deve carregar a landing page corretamente', async ({ page }) => {
    await page.goto('/')
    
    // Verificar título
    await expect(page).toHaveTitle(/SafeTrack/)
    
    // Verificar elementos principais
    await expect(page.getByText('SafeTrack')).toBeVisible()
  })

  test('deve navegar para página de login', async ({ page }) => {
    await page.goto('/')
    
    // Clicar em botão de login (pode ser "Entrar" ou "Login")
    const loginButton = page.getByRole('link', { name: /entrar|login/i }).first()
    await loginButton.click()
    
    await expect(page).toHaveURL(/\/login/)
  })

  test('deve navegar para página de registro', async ({ page }) => {
    await page.goto('/')
    
    const registerButton = page.getByRole('link', { name: /criar conta|registr/i }).first()
    await registerButton.click()
    
    await expect(page).toHaveURL(/\/registro/)
  })
})
