import { test, expect } from '../utils/mock-fixtures';

test.describe('Tribo Support Room (Persistent Chat)', () => {
  test.setTimeout(120000);

  test('should send a message and keep it after reload', async ({ page, loginAs }) => {
    await loginAs('client');

    await page.goto('/client/tribe');
    await expect(page.getByRole('heading', { name: /Minha Tribo/i }).first()).toBeVisible({ timeout: 20000 });

    await page.getByRole('button', { name: /Sala de Apoio Coletivo/i }).click();
    await expect(page.getByText('Sala de Apoio Coletivo')).toBeVisible({ timeout: 20000 });
    await expect(page.getByTestId('tribo-room-ready')).toBeVisible({ timeout: 20000 });

    const msg = `e2e-${Date.now()} suporte`;
    const input = page.getByPlaceholder('Compartilhe sua luz...');
    await input.fill(msg);
    await input.press('Enter');

    // Message can take a moment to appear due to polling; wait a bit longer.
    await expect(page.getByText(msg).first()).toBeVisible({ timeout: 45000 });

    await page.reload();
    // After reload, the internal Flow Engine resets to the Tribo dashboard (same URL),
    // so we re-enter the room to validate persistence.
    await expect(page.getByRole('heading', { name: /Minha Tribo/i }).first()).toBeVisible({ timeout: 20000 });
    await page.getByRole('button', { name: /Sala de Apoio Coletivo/i }).click();
    await expect(page.getByText('Sala de Apoio Coletivo')).toBeVisible({ timeout: 20000 });
    await expect(page.getByTestId('tribo-room-ready')).toBeVisible({ timeout: 20000 });
    await expect(page.getByText(msg).first()).toBeVisible({ timeout: 45000 });
  });
});
