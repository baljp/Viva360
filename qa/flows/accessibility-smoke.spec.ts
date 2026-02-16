import { test, expect } from '../utils/mock-fixtures';

const targetRoutes: Array<{ role: 'client' | 'pro' | 'space'; route: string }> = [
  { role: 'client', route: '/client/home' },
  { role: 'pro', route: '/pro/home' },
  { role: 'space', route: '/space/home' },
];

test.describe('Acessibilidade smoke', () => {
  test('landmarks básicos e imagens com alt', async ({ page, loginAs }) => {
    for (const target of targetRoutes) {
      await loginAs(target.role);
      await page.goto(target.route, { waitUntil: 'domcontentloaded' });

      const headingCount = await page.locator('h1, h2, h3, [role="heading"]').count();
      const landmarkCount = await page.locator('main, [role="main"], nav, [role="navigation"], section, article').count();
      expect(headingCount + landmarkCount).toBeGreaterThan(0);

      const interactiveNamedCount = await page
        .locator('button:visible, [role="button"]:visible, a[href]:visible')
        .evaluateAll((nodes) => {
          const getName = (node: Element) => {
            const aria = (node.getAttribute('aria-label') || '').trim();
            const title = (node.getAttribute('title') || '').trim();
            const text = (node.textContent || '').trim();
            return aria || title || text;
          };
          return nodes.filter((node) => getName(node).length > 0).length;
        });
      expect(interactiveNamedCount).toBeGreaterThan(0);

      const imagesWithoutAlt = await page.locator('img').evaluateAll((nodes) => {
        return nodes.filter((img) => !img.hasAttribute('alt')).length;
      });
      expect(imagesWithoutAlt).toBe(0);
    }
  });
});
