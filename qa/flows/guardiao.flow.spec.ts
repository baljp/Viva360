import { test, expect } from '../utils/mock-fixtures';

test.describe('Jornada: Guardião (Professional)', () => {

  test.beforeEach(async ({ loginAs, injectMockData }) => {
    await injectMockData();
    await loginAs('pro');
  });

  test('Agenda: Visualização e Gestão de Pacientes', async ({ page }) => {
    // 1. Dashboard -> Agenda View
    // Expecting a calendar or "Próximos atendimentos"
    await expect(page.getByText(/agenda|calendário/i)).toBeVisible();
    await page.getByRole('link', { name: /agenda/i }).first().click(); // Assuming nav link
    
    // 2. Agenda View - Check appointments
    await expect(page.locator('.fc-event, .appointment-card').first()).toBeVisible({ timeout: 10000 });
    
    // 3. Drill down to Patient Profile
    // Click on an appointment or patient name
    await page.locator('.appointment-card').first().click();
    await expect(page.getByText(/detalhes|perfil/i)).toBeVisible();
    
    // 4. Validate Patient Data (Mocked)
    await expect(page.getByText(/Constelação|Histórico/i)).toBeVisible();
    
    // 5. Back to Dash
    await page.getByRole('link', { name: /dashboard|início/i }).click();
    await expect(page).toHaveURL(/.*pro\/home/);
  });

  test('Escambo: Proposta e Mercado', async ({ page }) => {
    // 1. Access Market
    await page.goto('/pro/escambo'); // Shortcut if link is buried
    // Or
    // await page.getByRole('link', { name: /escambo|trocas/i }).click();
    
    await expect(page.getByText(/mercado de escambo|ofertas/i)).toBeVisible();

    // 2. Propose Swap
    // Find an offer
    const offerCard = page.locator('.offer-card').first();
    await expect(offerCard).toBeVisible();
    await offerCard.getByRole('button', { name: /propor|trocar|interesse/i }).click();

    // 3. Confirm Proposal
    await page.getByPlaceholder(/mensagem|proposta/i).fill('Tenho interesse em trocar por consultoria.');
    await page.getByRole('button', { name: /enviar|confirmar/i }).click();

    // 4. Success Feedback
    await expect(page.getByText(/proposta enviada|sucesso/i)).toBeVisible();
  });

  test('Financeiro: Overview e Detalhes', async ({ page }) => {
    // 1. Dashboard -> Finance
    await page.getByRole('link', { name: /financeiro|carteira/i }).click();
    
    // 2. Validate Balance
    await expect(page.getByText(/saldo|faturamento/i)).toBeVisible();
    // Check if numbers are visible (regex for currency)
    await expect(page.getByText(/R\$\s*\d+/).first()).toBeVisible();

    // 3. Transaction Details
    await expect(page.getByText(/histórico|transações/i)).toBeVisible();
    const transactions = page.locator('.transaction-item');
    // Ensure at least one transaction from seeds
    await expect(transactions.first()).toBeVisible();
  });

});
