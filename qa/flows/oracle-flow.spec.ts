import { test, expect } from '../utils/mock-fixtures';

test.describe('Oracle Flow', () => {
  test('deve abrir e revelar carta mesmo sem backend online', async ({ page, loginAs }) => {
    await loginAs('client');

    await page.evaluate(() => {
      window.localStorage.removeItem('viva360.oracle.history');
    });
    await page.reload();

    await page.getByText('Revelar Mensagem').first().click({ force: true });
    await expect(page.getByText('Guia Diário')).toBeVisible({ timeout: 15000 });

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
