
import { test, expect } from '../utils/mock-fixtures';

test.describe('Buscador Flow Stabilization', () => {
  test('should navigate through all main dashboard portals via Flow Engine', async ({ page, loginAs }) => {
    // 1. Login as Buscador
    await loginAs('client');
    
    // Handle Daily Blessing if it appears
    const dailyBlessing = page.getByText('Bênção do Dia');
    if (await dailyBlessing.isVisible()) {
        await page.getByText('Sintonizar Agora').click();
    }

    await expect(page.getByText('Boa Jornada,')).toBeVisible();

    // 2. Garden Hero Card -> GARDEN_VIEW
    await page.getByText('Semente da Essência').click(); // Hero Card Title
    await expect(page.getByText('Jardim da Alma')).toBeVisible();
    await expect(page.getByText('Vitalidade')).toBeVisible();
    
    // Back to Dashboard
    await page.getByRole('button', { name: 'Voltar' }).first().click(); // PortalView back button
    await expect(page.getByText('Boa Jornada,')).toBeVisible();

    // 3. Mapa da Cura -> BOOKING_SEARCH
    await page.getByText('Mapa da Cura').click();
    await expect(page.getByText('Onde você precisa de luz hoje?')).toBeVisible();
    await page.getByRole('button', { name: 'Voltar' }).first().click();

    // 4. Metamorfose -> METAMORPHOSIS_CHECKIN
    await page.getByText('Metamorfose', { exact: true }).click();
    // Metamorfose Wizard should appear
    await expect(page.getByText('Registro Diário')).toBeVisible();
    // Cancel/Close wizard usually X button or Back
    await page.getByRole('button').first().click(); // Assuming back/close is first button in header or portal
    
    // 5. Minha Tribo -> TRIBE_DASH
    await page.getByText('Minha Tribo').click();
    await expect(page.getByText('SINCRO-ESTELAR')).toBeVisible();
    await page.getByRole('button', { name: 'Voltar' }).first().click();

    // 6. Bazar -> MARKETPLACE (Mapped to BookingSearch placeholder currently, but distinct click)
    await page.getByText('Bazar').click();
    // Should see BookingSearch or Marketplace placeholder
    await expect(page.getByText('Onde você precisa de luz hoje?')).toBeVisible(); // Since it maps to BookingSearch
    await page.getByRole('button', { name: 'Voltar' }).first().click();

    // 7. Oráculo -> ORACLE_PORTAL
    await page.getByText('Oráculo').click();
    await expect(page.getByText('Mensagem do Universo')).toBeVisible(); // Oracle View title
    await page.getByRole('button', { name: 'Voltar' }).first().click();

    // 8. Settings -> SETTINGS
    // Avatar click
    await page.locator('.relative.group').first().click(); 
    // Mapped to ChatRoomScreen placeholder or SettingsView if resolved.
    // If ChatRoomScreen placeholder => "Sala de Conversa" or similar?
    // Let's check what ChatRoomScreen renders. Or just check for navigation away from Dashboard.
    await expect(page.getByText('Boa Jornada,')).not.toBeVisible();
  });
});
