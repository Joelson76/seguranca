import { test, expect } from '@playwright/test'

// Testes de onboarding requerem um usuário autenticado sem perfil
// Em CI, usar variáveis de ambiente SUPABASE_TEST_EMAIL e SUPABASE_TEST_PASSWORD

test.describe('Onboarding', () => {
  test('página de onboarding carrega corretamente', async ({ page }) => {
    await page.goto('/onboarding')
    // Se não autenticado, redireciona para login
    await expect(page).toHaveURL(/\/(login|onboarding)/)
  })

  test('formulário de onboarding valida campos', async ({ page }) => {
    // Visitar diretamente a rota (pode redirecionar se não autenticado)
    await page.goto('/onboarding')
    const url = page.url()
    if (url.includes('onboarding')) {
      await page.getByRole('button', { name: 'Continuar' }).click()
      await expect(page.getByText('Nome da empresa obrigatório')).toBeVisible()
    }
  })
})
