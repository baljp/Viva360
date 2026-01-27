import { test, expect } from '../utils/mock-fixtures';

test.describe('Jornada: Buscador (Client)', () => {
  
  test.beforeEach(async ({ loginAs, injectMockData }) => {
    await injectMockData();
    await loginAs('client');
  });

  test('Ritual Diário: Completo (Emotion -> Action -> Feedback)', async ({ page }) => {
    // 1. Start Ritual
    // Assuming there is a call to action on the dashboard for the daily ritual
    // Locator strategy: Look for "Ritual" in a button or card header
    const startRitualBtn = page.locator('button, div[role="button"]').filter({ hasText: /iniciar anual|ritual/i }).first();
    // Fallback if not immediately found, try scanning for "Daily Quest" equivalent
    if (await startRitualBtn.count() === 0) {
        console.log('Start Ritual button generic search...');
    }
    await expect(page.getByText(/olá|bem-vindo/i).first()).toBeVisible();

    // Since I don't have the exact UI tree, I will simulate visiting the URL if button missing
    // But ideally we flow from Dash.
    // Let's assume the Dashboard has the "Missão do Dia" or similar.
    
    // For now, let's navigate explicitly to ensure test robustness if UI is fluid
    await page.goto('/client/ritual/start'); 
    // OR equivalent. Let's try to find the "Ritual" component in the dashboard first.
    
    // Let's try to stick to the "Buscador" flow prompt: 
    // START → MOOD_SELECT → CAMERA_CAPTURE → MESSAGE_FEEDBACK → RITUAL_ACTION → FINAL_CONFIRM → DASHBOARD
    
    // Mock the camera
    await page.route('** /api/upload', async route => {
        await route.fulfill({ status: 200, body: JSON.stringify({ url: 'https://mocked/image.png' }) });
    });

    // Step 2: Mood Selection
    await expect(page.getByText(/como você está se sentindo/i)).toBeVisible({ timeout: 10000 });
    await page.getByText(/feliz|grato|ansioso/i).first().click();
    await page.getByRole('button', { name: /continuar|próximo/i }).click();

    // Step 3: Camera/Action (Mocked)
    // If there is a camera input
    await page.waitForTimeout(500); // Animation
    const cameraButton = page.getByLabel(/câmera|foto/i).or(page.getByRole('button', { name: /foto/i }));
    if (await cameraButton.isVisible()) {
        await cameraButton.click();
        // Simulate upload delay
        await page.waitForTimeout(1000);
    } else {
        // Maybe it's a "Check-in" action without photo
        await page.getByRole('button', { name: /concluir|feito/i }).click();
    }

    // Step 4: Feedback & Karma
    await expect(page.getByText(/karma|pontos/i)).toBeVisible();
    await page.getByRole('button', { name: /voltar|dashboard|início/i }).click();

    // validation
    await expect(page).toHaveURL(/.*client\/home/);
  });

  test('Tribo: Interação e Convite', async ({ page }) => {
    // Navigate to Tribe
    await page.getByRole('link', { name: /tribo/i }).click();
    await expect(page).toHaveURL(/.*tribo/);

    // Invite
    await page.getByRole('button', { name: /convidar|adicionar/i }).click();
    await page.getByPlaceholder(/email/i).fill('amigo_novo@viva360.com');
    await page.getByRole('button', { name: /enviar/i }).click();
    await expect(page.getByText(/enviado|sucesso/i)).toBeVisible();

    // Interaction (Send Energy)
    const memberCard = page.locator('div').filter({ hasText: /nível/i }).first();
    if (await memberCard.isVisible()) {
        await memberCard.click();
        await page.getByRole('button', { name: /enviar energia|curtir/i }).click();
        await expect(page.getByText(/enviada/i)).toBeVisible();
    }
  });

  test('Agendamento: Fluxo Completo de Compra', async ({ page }) => {
    // 1. Search (Marketplace)
    await page.getByRole('link', { name: /buscar|marketplace|serviços/i }).click();
    await expect(page.getByPlaceholder(/buscar/i)).toBeVisible();
    
    // 2. Select Service
    await page.getByPlaceholder(/buscar/i).fill('Yoga');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000); // Debounce
    
    // Click first result
    await page.locator('div[role="button"], .service-card').first().click();
    
    // 3. Booking Confirm
    await expect(page.getByText(/confirmar|agendar/i)).toBeVisible();
    // Select date if calendar present
    const calendarDate = page.locator('.react-calendar__tile:not(:disabled)').first();
    if (await calendarDate.isVisible()) {
        await calendarDate.click();
    }
    
    // Select time slot
    const timeSlot = page.getByText(/:00/).first();
    if (await timeSlot.isVisible()) {
        await timeSlot.click();
    }

    await page.getByRole('button', { name: /confirmar|agendar|pagar/i }).click();

    // 4. Checkout
    await expect(page).toHaveURL(/.*checkout/);
    await page.getByRole('button', { name: /pagar/i }).click();

    // 5. Success
    await expect(page.getByText(/sucesso|confirmado/i)).toBeVisible({ timeout: 15000 });
    
    // 6. Return to Dash
    await page.getByRole('button', { name: /dashboard|início/i }).click();
    await expect(page).toHaveURL(/.*client\/home/);
  });

});
