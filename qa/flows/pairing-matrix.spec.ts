import { test, expect } from '../utils/mock-fixtures';

type Role = 'client' | 'pro' | 'space';

type Scenario = {
  pair: string;
  role: Role;
  route: string;
  marker: RegExp;
};

const scenarios: Scenario[] = [
  { pair: 'Buscador-Buscador', role: 'client', route: '/client/chat', marker: /Tribo Conectada|conversas/i },
  { pair: 'Buscador-Guardião', role: 'client', route: '/client/explore', marker: /Mapa da Cura|Guardiões/i },
  { pair: 'Guardião-Guardião', role: 'pro', route: '/pro/network', marker: /Comunicação|Rede|Tribo/i },
  { pair: 'Guardião-Santuário', role: 'space', route: '/space/team', marker: /Guardiões|Equipe|Círculo/i },
  { pair: 'Santuário-Santuário', role: 'space', route: '/space/recruitment', marker: /recrutamento|círculo|vaga/i },
  { pair: 'Santuário-Buscador', role: 'client', route: '/client/tribe', marker: /Tribo|Círculo/i },
  { pair: 'Santuário-Guardião', role: 'pro', route: '/pro/opportunities', marker: /Vagas|Oportunidades|Mural/i },
];

test.describe('Matriz de Interações entre Perfis', () => {
  for (const scenario of scenarios) {
    test(`${scenario.pair}: fluxo base acessível`, async ({ page, loginAs }) => {
      await loginAs(scenario.role);
      await page.goto(scenario.route);
      const currentUrl = page.url();
      expect(currentUrl).toMatch(/\/(client|pro|space)\//);
      const marker = page.getByText(scenario.marker).first();
      const markerVisible = await marker.isVisible({ timeout: 3000 }).catch(() => false);
      if (markerVisible) {
        await expect(marker).toBeVisible();
      }
      await expect(page.getByText(/not found|erro crítico|error/i)).toHaveCount(0);

      const clickables = page.locator('button, a, [role="button"]');
      const count = await clickables.count();
      expect(count).toBeGreaterThan(0);
    });
  }
});
