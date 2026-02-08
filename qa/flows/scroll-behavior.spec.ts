import { test, expect } from '../utils/mock-fixtures';

test.describe('Scroll Behavior', () => {
  test('troca de navegação deve voltar ao topo do container principal', async ({ page, loginAs }) => {
    await loginAs('client');

    await page.evaluate(() => {
      const container = document.getElementById('viva360-main-scroll');
      if (container) container.scrollTop = 700;
    });

    await page.getByRole('button', { name: 'Jornada' }).first().click();

    await expect.poll(async () => {
      return await page.evaluate(() => {
        const container = document.getElementById('viva360-main-scroll');
        return container?.scrollTop ?? 999;
      });
    }).toBeLessThan(40);
  });
});
