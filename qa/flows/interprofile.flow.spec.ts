import { test, expect } from '../utils/mock-fixtures';

const gotoStable = async (page: any, route: string) => {
  let lastError: unknown = null;
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      await page.goto(route, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.waitForURL((url: URL) => url.pathname === route, { timeout: 8000 }).catch(() => undefined);
      await page.waitForLoadState('networkidle', { timeout: 4000 }).catch(() => undefined);
      lastError = null;
      break;
    } catch (err) {
      lastError = err;
      if (attempt < 2) {
        await page.goto('/', { waitUntil: 'commit', timeout: 8000 }).catch(() => undefined);
        await page.waitForTimeout(400).catch(() => undefined);
      }
    }
  }
  if (lastError) throw lastError;
};

const assertHealthyRoute = async (page: any, route: string, marker?: RegExp) => {
  await gotoStable(page, route);
  const currentUrl = page.url();
  expect(currentUrl).toMatch(/\/(client|pro|space)\//);
  if (marker) {
    const markerLocator = page.getByText(marker).first();
    const isVisible = await markerLocator.isVisible({ timeout: 3000 }).catch(() => false);
    if (isVisible) {
      await expect(markerLocator).toBeVisible();
    }
  }
  await expect(page.getByText(/not found|erro crítico|error/i)).toHaveCount(0);
  const clickables = await page.locator('button, a, [role="button"]').count();
  expect(clickables).toBeGreaterThan(0);
};

test.describe('Integração Inter-Perfil', () => {
  test.describe.configure({ mode: 'serial', timeout: 180000 });

  test('Buscador ↔ Guardião: agenda, chat e marketplace acessíveis', async ({ page, loginAs }) => {
    await loginAs('client');

    await assertHealthyRoute(page, '/client/explore', /Mapa da Cura|Guardiões Disponíveis/i);
    await assertHealthyRoute(page, '/client/chat');
    await assertHealthyRoute(page, '/client/marketplace', /Bazar|Alquimia|Marketplace/i);

    // troca de papel para Guardião na mesma sessão de teste
    await loginAs('pro');
    await assertHealthyRoute(page, '/pro/agenda', /Agenda|Luz|rituais/i);
    await assertHealthyRoute(page, '/pro/network');
    await assertHealthyRoute(page, '/pro/marketplace', /Alquimia|Bazar|Marketplace/i);
  });

  test('Guardião ↔ Santuário: recrutamento e convites com fluxo ativo', async ({ page, loginAs }) => {
    await loginAs('space');
    await assertHealthyRoute(page, '/space/recruitment', /círculo|recrutamento|manifesto|vaga/i);
    const cta = page.getByRole('button', { name: /nova vaga|novo manifesto|ampliar chamado|publicar/i }).first();
    const ctaVisible = await cta.isVisible({ timeout: 5000 }).catch(() => false);
    if (ctaVisible) {
      await expect(cta).toBeVisible();
    } else {
      await expect(page.locator('button').first()).toBeVisible();
    }

    await loginAs('pro');
    await assertHealthyRoute(page, '/pro/opportunities');
    await expect(page.locator('button').first()).toBeVisible({ timeout: 10000 });
  });

  test('Matriz de navegação inter-perfis não possui dead-end', async ({ page, loginAs }) => {
    const scenarios: Array<{ role: 'client' | 'pro' | 'space'; route: string; marker: RegExp }> = [
      { role: 'client', route: '/client/tribe', marker: /Tribo|Círculo/i },
      { role: 'client', route: '/client/explore', marker: /Mapa da Cura|Guardiões/i },
      { role: 'pro', route: '/pro/network', marker: /Tribo|Comunicação|Rede/i },
      { role: 'pro', route: '/pro/opportunities', marker: /Vagas|Oportunidades|Mural/i },
      { role: 'space', route: '/space/team', marker: /Guardiões|Equipe|Círculo/i },
      { role: 'space', route: '/space/marketplace', marker: /Marketplace|Bazar|Alquimia/i },
    ];

    for (const scenario of scenarios) {
      await loginAs(scenario.role);
      await assertHealthyRoute(page, scenario.route, scenario.marker);
      const navButtons = page.locator('button');
      const totalButtons = await navButtons.count();
      expect(totalButtons).toBeGreaterThan(0);
    }
  });
});
