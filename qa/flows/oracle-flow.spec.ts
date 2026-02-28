import { test, expect } from '../utils/mock-fixtures';

const dismissBlessingOverlayIfPresent = async (page: import('@playwright/test').Page) => {
  const blessingHeading = page.getByText(/Ben[cç][aã]o Matinal/i).first();
  if (!(await blessingHeading.isVisible().catch(() => false))) return;

  const receiveBlessing = page.getByRole('button', { name: /receber ben[cç][aã]o/i }).first();
  if (await receiveBlessing.isVisible().catch(() => false)) {
    await receiveBlessing.click({ timeout: 5000 });
  } else {
    // Fallback for icon-only close buttons rendered in banner variants.
    await page.keyboard.press('Escape').catch(() => undefined);
  }

  await blessingHeading.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => undefined);
  await page.waitForTimeout(200);
};

const openOracleCard = async (page: import('@playwright/test').Page) => {
  let lastError: unknown;

  for (let attempt = 1; attempt <= 4; attempt += 1) {
    await dismissBlessingOverlayIfPresent(page);
    const oracleCard = page.getByRole('button', { name: /revelar mensagem do or[aá]culo/i }).first();

    try {
      await expect(oracleCard).toBeVisible({ timeout: 5000 });
      await oracleCard.click({ timeout: 5000 });
      return;
    } catch (error) {
      lastError = error;
      if (attempt === 4) break;
      await page.waitForTimeout(250);
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Falha ao abrir card do Oráculo');
};

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

const waitForOracleCardStage = async (page: import('@playwright/test').Page) => {
  const portalPrompt = page.getByText('Toque para Sintonizar');
  const closeAction = page.getByRole('button', { name: /receber e fechar/i });

  for (let attempt = 1; attempt <= 12; attempt += 1) {
    if (await portalPrompt.isVisible().catch(() => false)) return;
    if (await closeAction.isVisible().catch(() => false)) return;

    // The draw action can resolve into "Ver Carta Revelada" first (rerender race with daily-card fetch).
    // In that state, we need one more explicit click to open the premium card modal.
    const revealButton = page.getByRole('button', { name: /ver carta revelada/i }).first();
    if (await revealButton.isVisible().catch(() => false)) {
      await revealButton.click({ timeout: 5000 });
      await page.waitForTimeout(500);
      continue;
    }

    const drawButton = page.getByRole('button', { name: /revelar carta do dia/i }).first();
    if (await drawButton.isVisible().catch(() => false)) {
      await drawButton.click({ timeout: 5000 });
      await page.waitForTimeout(500);
      continue;
    }

    await page.waitForTimeout(500);
  }

  throw new Error('Oráculo não entrou no estágio de carta (portal/revelado) após tentativas');
};

test.describe('Oracle Flow', () => {
  test('deve abrir e revelar carta mesmo sem backend online', async ({ page, loginAs }) => {
    await loginAs('client');
    await expect(page.getByText('Revelar Mensagem')).toBeVisible({ timeout: 15000 });

    await page.evaluate(() => {
      window.localStorage.removeItem('viva360.oracle.history');
    });
    await page.reload();

    await openOracleCard(page);
    await expect(
      page.getByRole('heading', { name: /Guia Diário|Oráculo Viva360/i }).first()
    ).toBeVisible({ timeout: 15000 });

    await clickOraclePrimaryAction(page);
    await waitForOracleCardStage(page);

    if (await page.getByText('Toque para Sintonizar').isVisible()) {
      await page.getByText('Toque para Sintonizar').click();
      await expect(page.getByRole('button', { name: /receber e fechar/i })).toBeVisible({ timeout: 15000 });
    }
  });
});
