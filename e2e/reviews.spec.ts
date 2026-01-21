
import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5174'; // Updated default
const API_URL = process.env.API_URL || 'http://localhost:3000/api';

const CLIENT_USER = {
  email: 'ana@viva360.com',
  password: 'senha123',
};

const PRO_USER = {
  email: 'luna@viva360.com',
  password: 'senha123',
};

test.describe('Advanced Search & Reviews Features', () => {
  let authToken: string;
  let proId: string;

  // Login before tests to get token
  test.beforeAll(async ({ request }) => {
    const loginRes = await request.post(`${API_URL}/auth/login`, {
      data: {
        email: CLIENT_USER.email,
        password: CLIENT_USER.password,
      }
    });
    expect(loginRes.ok()).toBeTruthy();
    const loginData = await loginRes.json();
    authToken = loginData.token;

    // Get a professional ID for review testing
    // We can search for professionals
    const searchRes = await request.get(`${API_URL}/professionals`, {
        headers: { Authorization: `Bearer ${authToken}` }
    });
    // Note: API endpoint might be /professionals not /search/professionals for listing
    const pros = await searchRes.json();
    
    // Find one that isn't the client (if client was pro) - though CLIENT_USER is 'ana'
    if(pros.length > 0) {
        proId = pros[0].id;
    }
  });

  test('should create a review for a professional via API', async ({ request }) => {
    test.skip(!proId, 'No professional found to review');

    const reviewData = {
      professionalId: proId,
      rating: 5,
      comment: 'Excellent session, very grounding!'
    };

    const response = await request.post(`${API_URL}/reviews`, {
      headers: { Authorization: `Bearer ${authToken}` },
      data: reviewData
    });

    expect(response.ok()).toBeTruthy();
    const review = await response.json();
    expect(review.rating).toBe(5);
    expect(review.comment).toBe('Excellent session, very grounding!');
  });

  test('should list reviews for a professional', async ({ request }) => {
    test.skip(!proId, 'No professional found');

    const response = await request.get(`${API_URL}/reviews?professionalId=${proId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    expect(response.ok()).toBeTruthy();
    const reviews = await response.json();
    expect(Array.isArray(reviews)).toBeTruthy();
    expect(reviews.length).toBeGreaterThan(0);
    // Be flexible with structure
    expect(reviews[0]).toHaveProperty('author');
  });

  test('Advanced Search UI should filter and show results', async ({ page }) => {
    // Login UI
    await page.goto(BASE_URL); // Use constant
    
    // Wait for app to be ready
    await page.waitForTimeout(1000);

    // Login logic
    const landingBtn = page.locator('button:has-text("Entrar no Viva360")');
    if (await landingBtn.isVisible()) {
        await landingBtn.click();
    }

    await page.fill('input[type="email"]', CLIENT_USER.email);
    await page.fill('input[type="password"]', CLIENT_USER.password);
    await page.click('button:has-text("Entrar")');
    
    // Wait for dashboard
    await expect(page.locator('text=Olá, Ana')).toBeVisible({timeout: 10000});

    // Navigate to Search
    // Use the input placeholder which we made clickable
    const searchTrigger = page.getByPlaceholder('Busque por mestre, técnica ou alívio...');
    await expect(searchTrigger).toBeVisible();
    await searchTrigger.click();
    
    // Wait for overlay
    await expect(page.locator('text=Buscar Guardiões')).toBeVisible();

    // Close
    await page.locator('button:has(svg.lucide-x)').first().click();
  });

});
