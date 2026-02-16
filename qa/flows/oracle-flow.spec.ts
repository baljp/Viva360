import { test, expect } from '../utils/mock-fixtures';

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

    const revealButton = page.getByRole('button', { name: /revelar carta do dia/i });
    const openButton = page.getByRole('button', { name: /ver carta revelada/i });

    if (await revealButton.isVisible()) {
      await revealButton.click();
    } else {
      await openButton.click();
    }

    await expect(page.getByText('Toque para Sintonizar').or(page.getByRole('button', { name: /receber e fechar/i }))).toBeVisible({ timeout: 15000 });

    if (await page.getByText('Toque para Sintonizar').isVisible()) {
      await page.getByText('Toque para Sintonizar').click();
      await expect(page.getByRole('button', { name: /receber e fechar/i })).toBeVisible({ timeout: 15000 });
    }
  });
});
