import { Page } from '@playwright/test'

export async function login(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', password)
  await page.click('button[type="submit"]')
  await page.waitForURL('/app/dashboard', { timeout: 10000 })
}

export async function logout(page: Page) {
  // Clicar no botão de logout (ícone LogOut no header)
  await page.click('button[title="Sair"]')
  await page.waitForURL('/login')
}

export async function register(page: Page, nome: string, email: string, password: string, empresa: string) {
  await page.goto('/registro')
  await page.fill('input[name="nome"]', nome)
  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', password)
  await page.fill('input[name="empresa"]', empresa)
  await page.click('button[type="submit"]')
}
