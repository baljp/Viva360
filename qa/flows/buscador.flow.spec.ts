import { test, expect } from '../utils/mock-fixtures';

test.describe('Jornada: Buscador (Client)', () => {
  
  test.beforeEach(async ({ loginAs, injectMockData }) => {
    await injectMockData();
    await loginAs('client');
  });

  test('Ritual Diário: Início e Humor', async ({ page }) => {
    await expect(page.getByText('Sua Jornada até aqui,')).toBeVisible();

    const gardenCard = page.locator('#hero-garden');
    await gardenCard.scrollIntoViewIfNeeded();
    await gardenCard.click();

    await expect(page.getByText('Jardim da Alma')).toBeVisible({ timeout: 10000 });

    const journeyModal = page.getByText('Escolha seu Caminho');
    if (await journeyModal.isVisible()) {
        await page.getByText('Cura Emocional').click();
        await expect(journeyModal).not.toBeVisible();
    }

    await page.getByRole('button', { name: /Regar com Intenção/i }).click();
    await expect(page.getByText('Presença Viva')).toBeVisible({ timeout: 10000 });

    const uploadInput = page.locator('input[type="file"]');
    if (await uploadInput.count()) {
        await uploadInput.setInputFiles('dist/logo.png');
    }

    await expect(page.getByText('Como você se sente neste momento?')).toBeVisible({ timeout: 10000 });
  });

  test('Tribo: Interação e Convite', async ({ page }) => {
    const tribeCard = page.locator('#portal-tribe');
    await tribeCard.scrollIntoViewIfNeeded();
    await tribeCard.click();
    await expect(page.getByText('Minha Tribo')).toBeVisible({ timeout: 10000 });

    const inviteBtn = page.getByText('Convidar Externo');
    if (await inviteBtn.isVisible()) {
        await inviteBtn.click();
        await expect(page.getByText('Expandir Círculo')).toBeVisible({ timeout: 10000 });
    }
  });

  test('Mapa da Cura: Busca Básica', async ({ page }) => {
    const mapCard = page.locator('#portal-map');
    await mapCard.scrollIntoViewIfNeeded();
    await mapCard.click();

    await expect(page.getByText('Mapa da Cura')).toBeVisible({ timeout: 10000 });
    await expect(page.getByPlaceholder('Busque por técnica ou guardião...')).toBeVisible();
  });

});
