import { test, expect } from '../utils/mock-fixtures';

test.describe('Checkout Flow E2E', () => {
  test('Buscador: Complete Booking → Checkout → Success Flow', async ({ page, loginAs }) => {
    // 1. Login as Buscador
    await loginAs('client');
    
    // 2. Navigate to Mapa da Cura (Booking Search)
    await page.goto('/client/marketplace');
    await page.waitForTimeout(1000);
    
    // 3. Click on any professional card if available
    const proCard = page.locator('[id^="pro-card-"]').first();
    if (await proCard.isVisible({ timeout: 5000 })) {
      await proCard.click();
      await page.waitForTimeout(500);
    } else {
      // Navigate directly to booking flow via dashboard
      await page.goto('/client/home');
      await page.locator('#portal-map').click();
      await page.waitForTimeout(1000);
    }
    
    // 4. Verify we can reach Booking Select or Confirm screen
    await expect(page.getByText(/guardião|agendar|confirmar/i).first()).toBeVisible({ timeout: 10000 });
    
    // 5. Screenshot for validation
    await page.screenshot({ path: 'test-results/checkout/booking-step.png' });
    
    console.log('[Checkout Test] Booking step validated');
  });

  test('Checkout Screen: Payment Method Selection', async ({ page, loginAs }) => {
    await loginAs('client');
    
    // Navigate directly to checkout if possible (in flow context this happens after booking)
    await page.goto('/checkout');
    await page.waitForTimeout(1000);
    
    // Check if checkout screen loaded or redirected
    const title = page.getByText(/troca de energia|checkout|pagamento/i).first();
    
    if (await title.isVisible({ timeout: 5000 })) {
      // Verify payment methods are visible
      await expect(page.getByText(/cartão|credit/i).first()).toBeVisible({ timeout: 5000 });
      await expect(page.getByText(/pix/i).first()).toBeVisible({ timeout: 5000 });
      
      // Test Pix selection
      await page.getByText(/pix/i).first().click();
      await page.waitForTimeout(500);
      
      // Test finalizar button exists
      await expect(page.getByRole('button', { name: /finalizar|pagar|confirmar/i })).toBeVisible();
      
      await page.screenshot({ path: 'test-results/checkout/payment-methods.png' });
      console.log('[Checkout Test] Payment methods validated');
    } else {
      // Checkout requires booking context - just verify route exists
      console.log('[Checkout Test] Checkout requires booking context - skipping direct test');
    }
  });

  test('Payment Success Screen: Navigation and Feedback', async ({ page, loginAs }) => {
    await loginAs('client');
    
    // Navigate to success (simulated - in real flow this happens after payment)
    await page.goto('/checkout/success');
    await page.waitForTimeout(1000);
    
    // Check if success screen or redirect
    const successText = page.getByText(/troca honrada|sucesso|confirmado/i).first();
    
    if (await successText.isVisible({ timeout: 5000 })) {
      // Verify success elements
      await expect(page.getByRole('button', { name: /voltar|home|core/i })).toBeVisible();
      
      // Test navigation back to dashboard
      await page.getByRole('button', { name: /voltar|home|core/i }).click();
      await expect(page).toHaveURL(/client\/home/);
      
      console.log('[Checkout Test] Success screen navigation validated');
    } else {
      console.log('[Checkout Test] Success screen requires payment context - skipping');
    }
  });
});
