import { test, expect } from '../utils/mock-fixtures';

test.describe('Audit Parity - P0/P1/P2 Regression Suite', () => {

    // 1. Admin Features (P0/P1)
    test('Admin: User Search & Block', async ({ page, loginAs }) => {
        // Mock Admin Data
        await page.route('**/api/admin/dashboard', async route => {
            await route.fulfill({ json: { totalUsers: 14, activeUsers: 8, revenue: 450000, systemHealth: { status: 'healthy', uptime: 99 } } });
        });
        await page.route('**/api/admin/users', async route => {
            await route.fulfill({
                json: [
                    { id: 'u1', name: 'Maria Silva', email: 'maria@email.com', role: 'CLIENT', status: 'active' },
                    { id: 'u2', name: 'João Santos', email: 'joao@email.com', role: 'PROFESSIONAL', status: 'active' }
                ]
            });
        });
        await page.route('**/api/admin/users/*/block', async route => {
            await route.fulfill({ json: { success: true } });
        });

        await loginAs('admin');

        // Navigate to Users
        await page.getByRole('button', { name: 'Usuários' }).click();

        // Search
        const searchBar = page.getByPlaceholder('Buscar por e-mail, nome ou ID...');
        await expect(searchBar).toBeVisible();
        await searchBar.fill('Maria');
        await expect(page.getByText('Maria Silva')).toBeVisible();

        // Block
        await page.locator('button:has(svg.lucide-ban)').first().click();
        // Toast can have multiple elements with same text (title/message)
        await expect(page.getByText('Usuário Bloqueado').first()).toBeVisible();
    });

    test('Guardian: Update Appointment', async ({ page, loginAs }) => {
        // Use YYYY/MM/DD to force local timezone parsing in browser
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const d = String(now.getDate()).padStart(2, '0');
        const todayLocal = `${y}/${m}/${d} 14:00:00`;

        // Mock Appointment Data - Set to pending to trigger the Edit flow
        await page.route('**/api/appointments*', async route => {
            await route.fulfill({
                json: [
                    {
                        id: 'a1',
                        clientId: 'client_0',
                        client_id: 'client_0',
                        clientName: 'Ana Luz',
                        client_name: 'Ana Luz',
                        professionalId: 'pro_0',
                        professional_id: 'pro_0',
                        professionalName: 'Mestre Sol',
                        date: todayLocal,
                        time: '14:00',
                        status: 'pending',
                        serviceName: 'Atendimento Prânico',
                        price: 150
                    }
                ]
            });
        });
        await page.route('**/api/appointments/*', async route => {
            await route.fulfill({ json: { success: true } });
        });

        await loginAs('pro'); // This is pro_0

        await page.getByText('Minha Agenda').first().click();

        // Ensure we are inside the Agenda Dialog to avoid collision with Dashboard summary
        const agendaDialog = page.getByRole('dialog', { name: 'Agenda de Luz' });
        await expect(agendaDialog).toBeVisible({ timeout: 10000 });

        // Scope to specific appointment card INSIDE THE AGENDA using the unique 'group' class
        const card = agendaDialog.locator('div[class*="group"]').filter({ hasText: 'Ana Luz' }).filter({ hasText: '14:00' }).first();
        await expect(card).toBeVisible({ timeout: 10000 });

        // The more button is specifically for pending appointments in AgendaView
        const moreBtn = card.locator('button').first();
        await expect(moreBtn).toBeVisible({ timeout: 10000 });
        await moreBtn.click({ force: true });

        // After transition to AgendaConfirmScreen
        await expect(page.getByRole('heading', { name: 'Confirmar Ritual' })).toBeVisible({ timeout: 15000 });

        // Go to Edit
        await page.getByRole('button', { name: 'Editar Agendamento' }).click();
        await expect(page.getByRole('heading', { name: 'Editar Ritual' })).toBeVisible({ timeout: 10000 });

        await page.getByRole('button', { name: 'Salvar Alterações' }).click();
        // Toast message contains "sucesso"
        await expect(page.getByText(/alterado com sucesso/i).first()).toBeVisible({ timeout: 10000 });
    });

    test('Guardian: Patient Evolution View Hygiene', async ({ page, loginAs }) => {
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const d = String(now.getDate()).padStart(2, '0');
        const todayLocal = `${y}/${m}/${d} 14:00:00`;

        // Patients are derived from appointments in PatientsList.tsx
        await page.route('**/api/appointments*', async route => {
            await route.fulfill({
                json: [
                    {
                        id: 'a1',
                        clientId: 'client_0',
                        client_id: 'client_0',
                        clientName: 'Buscador Sol',
                        client_name: 'Buscador Sol',
                        professionalId: 'pro_0',
                        date: todayLocal,
                        time: '14:00',
                        status: 'confirmed'
                    }
                ]
            });
        });
        await page.route('**/api/links*', async route => {
            await route.fulfill({ json: [] });
        });
        await page.route('**/api/records/client_0', async route => {
            await route.fulfill({ json: [] });
        });
        await page.route('**/api/users/client_0/evolution/metrics', async route => {
            await route.fulfill({ json: { totalSessions: 1, avgMood: 4 } });
        });
        await page.route('**/api/clinical/interventions*', async route => {
            await route.fulfill({
                json: [
                    { id: 'i1', patient_id: 'client_0', title: 'Respiração Holotrópica', outcome: 'Estabilidade emocional aumentada', type: 'pratica' }
                ]
            });
        });

        await loginAs('pro');

        await page.getByText('Almas em Cuidado').first().click();

        // Ensure we are inside the Garden Dialog
        const gardenDialog = page.getByRole('dialog', { name: 'Meu Jardim' });
        await expect(gardenDialog).toBeVisible({ timeout: 10000 });

        // Wait for the patient to appear with the Correct Name inside the Garden
        const patientHeading = gardenDialog.getByRole('heading', { name: 'Buscador Sol' });
        await expect(patientHeading).toBeVisible({ timeout: 20000 });
        await patientHeading.click({ force: true });

        // PatientProfile.tsx has "Prontuário Evolutivo"
        await expect(page.getByText('Prontuário Evolutivo').first()).toBeVisible({ timeout: 15000 });

        // Go to Evolution View (Timeline)
        await page.getByRole('button', { name: /Prontuário Evolutivo/i }).click();
        await expect(page.getByText('Linha da Vida')).toBeVisible({ timeout: 10000 });

        // Check interventions tab
        await page.getByText('Intervenções', { exact: true }).click();
        await expect(page.getByText('Respiração Holotrópica')).toBeVisible({ timeout: 10000 });
    });

    test('Space: Dashboard Metrics & Loading', async ({ page, loginAs }) => {
        // Mock Space Data
        await page.route('**/api/spaces/patients', async route => {
            await route.fulfill({ json: { patients: [] } });
        });
        await page.route('**/api/finance/transactions', async route => {
            await route.fulfill({ json: [] });
        });

        await loginAs('space');

        // Radiance Drilldown - Click the hero card
        await page.getByText('Radiance Score').click();
        await expect(page.getByText('Radiância Vital')).toBeVisible();
        await expect(page.getByText('Altares em Fluxo')).toBeVisible();

        // Close Modal to unblock dashboard
        await page.getByRole('button', { name: 'Fechar' }).click();

        // Tabs Navigation
        await page.getByRole('button', { name: 'Ritmos do Templo', exact: true }).click();
        await expect(page.getByText('Meta Coletiva')).toBeVisible();
    });

});
