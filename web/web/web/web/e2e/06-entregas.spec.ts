import { test, expect } from '@playwright/test'
import { TEST_USER } from './helpers/test-data'

test.describe('Entregas de EPI', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', TEST_USER.email)
    await page.fill('input[type="password"]', TEST_USER.password)
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/(app\/dashboard|onboarding)/, { timeout: 10000 })
    
    if (page.url().includes('onboarding')) {
      await page.goto('/app/entregas')
    } else {
      await page.click('a[href="/app/entregas"]')
    }
  })

  test('deve listar entregas realizadas', async ({ page }) => {
    await expect(page).toHaveURL('/app/entregas')
    await page.waitForTimeout(2000)
    
    const pageText = await page.textContent('body')
    expect(pageText).toBeTruthy()
  })

  test('deve abrir modal de nova entrega', async ({ page }) => {
    const newButton = page.getByRole('button', { name: /nova|adicionar/i }).first()
    await newButton.click()
    await page.waitForTimeout(500)
    
    // Verificar se modal abriu
    const dialog = page.locator('[role="dialog"]').first()
    await expect(dialog).toBeVisible({ timeout: 2000 })
  })
})
