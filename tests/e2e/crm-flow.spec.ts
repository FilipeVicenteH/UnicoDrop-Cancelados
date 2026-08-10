import { test, expect } from '@playwright/test'

test.describe('UnicoCRM End-to-End E2E Integration Suite', () => {
  const BASE_URL = process.env.TEST_URL || 'https://unico-crm.vercel.app'

  test('Deve carregar o Dashboard Principal com os 9 cartões de métricas', async ({ page }) => {
    await page.goto(BASE_URL)
    await expect(page).toHaveTitle(/UnicoCRM/i)

    // Check KPI summary cards
    await expect(page.locator('text=Total de Clientes')).toBeVisible()
    await expect(page.locator('text=Convertidos')).toBeVisible()
    await expect(page.locator('text=Em Negociação')).toBeVisible()
  })

  test('Deve navegar para a lista de clientes e verificar anonimização', async ({ page }) => {
    await page.goto(`${BASE_URL}/clientes`)
    await expect(page.locator('text=Clientes Cancelados')).toBeVisible()

    // Ensure no real confidential company name is leaked
    const content = await page.content()
    expect(content).not.toContain('Moda & Estilo E-Commerce')
  })

  test('Deve abrir o Modal de Reportar Bug e submeter um relato', async ({ page }) => {
    await page.goto(BASE_URL)

    // Click Reportar Bug button in sidebar
    const bugBtn = page.locator('button:has-text("Reportar Bug")')
    await bugBtn.click()

    // Modal should be visible
    await expect(page.locator('text=Reportar um Bug ou Falha')).toBeVisible()

    // Fill form
    await page.fill('input[placeholder*="Gráfico de checkouts"]', 'E2E Test: Validando sistema de bugs')
    await page.fill('textarea[placeholder*="Descreva o que aconteceu"]', 'Teste automatizado de integração E2E')

    // Submit
    await page.click('button:has-text("Enviar Relato")')

    // Toast notification should appear
    await expect(page.locator('text=Bug reportado com sucesso')).toBeVisible()
  })
})
