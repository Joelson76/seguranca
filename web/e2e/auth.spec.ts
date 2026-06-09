import { test, expect } from '@playwright/test'

test.describe('Autenticação', () => {
  test('página de login carrega corretamente', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByText('Entrar na plataforma')).toBeVisible()
    await expect(page.getByPlaceholder('voce@empresa.com')).toBeVisible()
    await expect(page.getByPlaceholder('••••••••')).toBeVisible()
  })

  test('exibe erro com credenciais inválidas', async ({ page }) => {
    await page.goto('/login')
    await page.getByPlaceholder('voce@empresa.com').fill('invalido@teste.com')
    await page.getByPlaceholder('••••••••').fill('senhaerrada')
    await page.getByRole('button', { name: 'Entrar' }).click()
    await expect(page.getByText('E-mail ou senha incorretos')).toBeVisible({ timeout: 8000 })
  })

  test('valida campos obrigatórios', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('button', { name: 'Entrar' }).click()
    await expect(page.getByText('E-mail inválido')).toBeVisible()
  })

  test('página de recuperação de senha funciona', async ({ page }) => {
    await page.goto('/login')
    await page.getByText('Esqueci minha senha').click()
    await expect(page).toHaveURL('/recuperar-senha')
    await expect(page.getByText('Recuperar senha')).toBeVisible()
  })

  test('rota protegida redireciona para login', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL('/login')
  })
})
