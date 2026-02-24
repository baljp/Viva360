import { test, expect } from '../utils/mock-fixtures';

const clickOraclePrimaryAction = async (page: import('@playwright/test').Page) => {
  const actionPattern = /revelar carta do dia|ver carta revelada/i;
  let lastError: unknown;

  for (let attempt = 1; attempt <= 4; attempt += 1) {
    const actionButton = page.getByRole('button', { name: actionPattern }).first();
    try {
      await expect(actionButton).toBeVisible({ timeout: 5000 });
      await actionButton.click({ timeout: 5000 });
      return;
    } catch (error) {
      lastError = error;
      if (attempt === 4) break;
      await page.waitForTimeout(200);
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Falha ao clicar ação do Oráculo');
};

test.describe('Oracle Flow', () => {
  test('deve abrir e revelar carta mesmo sem backend online', async ({ page, loginAs }) => {
    await loginAs('client');
    await expect(page.getByText('Revelar Mensagem')).toBeVisible({ timeout: 15000 });

    await page.evaluate(() => {
      window.localStorage.removeItem('viva360.oracle.history');
    });
    await page.reload();

    const oracleCard = page.locator('#portal-oracle');
    await oracleCard.click({ force: true });
    await expect(
      page.getByRole('heading', { name: /Guia Diário|Oráculo Viva360/i }).first()
    ).toBeVisible({ timeout: 15000 });

    await clickOraclePrimaryAction(page);

    await expect(page.getByText('Toque para Sintonizar').or(page.getByRole('button', { name: /receber e fechar/i }))).toBeVisible({ timeout: 15000 });

    if (await page.getByText('Toque para Sintonizar').isVisible()) {
      await page.getByText('Toque para Sintonizar').click();
      await expect(page.getByRole('button', { name: /receber e fechar/i })).toBeVisible({ timeout: 15000 });
    }
  });
});
