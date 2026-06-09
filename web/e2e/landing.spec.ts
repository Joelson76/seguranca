import { test, expect } from '@playwright/test'

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('exibe o título principal', async ({ page }) => {
    await expect(page.getByText('Gerencie a segurança da sua equipe')).toBeVisible()
  })

  test('exibe os três planos de preço', async ({ page }) => {
    await expect(page.getByText('Básico')).toBeVisible()
    await expect(page.getByText('Profissional')).toBeVisible()
    await expect(page.getByText('Enterprise')).toBeVisible()
  })

  test('link de login funciona', async ({ page }) => {
    await page.getByRole('link', { name: 'Entrar' }).first().click()
    await expect(page).toHaveURL('/login')
  })

  test('FAQ abre e fecha', async ({ page }) => {
    const pergunta = page.getByText('O SafeTrack é adequado para empresas de qualquer porte?')
    await pergunta.click()
    await expect(page.getByText('Sim! Temos planos')).toBeVisible()
    await pergunta.click()
    await expect(page.getByText('Sim! Temos planos')).not.toBeVisible()
  })
})
