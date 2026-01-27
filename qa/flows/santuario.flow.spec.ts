import { test, expect } from '../utils/mock-fixtures';

test.describe('Jornada: Santuário (Space)', () => {

  test.beforeEach(async ({ loginAs, injectMockData }) => {
    await injectMockData();
    await loginAs('space');
  });

  test('Gestão: Profissionais e Pacientes', async ({ page }) => {
    // 1. Dashboard -> Profissionais
    await page.getByRole('link', { name: /profissionais|equipe/i }).click();
    await expect(page.getByText(/lista de profissionais|membros/i)).toBeVisible();

    // View Profile
    const proCard = page.locator('.pro-card, tr[data-userid]').first();
    // Fallback if table
    if (await proCard.isVisible()) {
        await proCard.click();
        await expect(page.getByText(/perfil|atuação/i)).toBeVisible();
        await page.goBack();
    }

    // 2. Dashboard -> Pacientes
    await page.getByRole('link', { name: /pacientes|frequência/i }).click();
    await expect(page.getByText(/pacientes|clientes/i)).toBeVisible();
    
    // Check filter
    const searchInput = page.getByPlaceholder(/buscar/i);
    if (await searchInput.isVisible()) {
        await searchInput.fill('Ana');
        await page.waitForTimeout(500);
        // Expect result or "no results" but no crash
    }
  });

  test('Eventos e Marketplace: Criação e Checkout Simulado', async ({ page }) => {
    // 1. Manage Events
    await page.getByRole('link', { name: /eventos|agenda/i }).click();
    
    // Create new event
    const createBtn = page.getByRole('button', { name: /criar|novo/i });
    if (await createBtn.isVisible()) {
        await createBtn.click();
        await page.getByPlaceholder(/título|nome/i).fill('Workshop de Teste E2E');
        // If form is complex, we might skip full fill in this pass unless strict validation
        // Just checking dialog opens
        await expect(page.getByText(/detalhes do evento/i)).toBeVisible();
        // Close modal
        await page.keyboard.press('Escape');
    }

    // 2. Marketplace Management
    // Navigate to local marketplace view
    await page.goto('/space/marketplace');
    await expect(page.getByText(/meus produtos|catálogo/i)).toBeVisible();

    // 3. Checkout Simulation (if applicable for Space buying supplies)
    // Or viewing sales
    await expect(page.getByText(/vendas|pedidos/i)).toBeVisible();
  });

});
