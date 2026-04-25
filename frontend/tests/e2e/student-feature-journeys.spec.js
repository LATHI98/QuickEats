const { test, expect } = require('@playwright/test');
const { installStudentFeatureMocks, seedStudentSession, formatDatetimeLocal } = require('./helpers/studentFeatureMocks');

test.describe('Student feature journeys', () => {
  test.beforeEach(async ({ page }) => {
    await installStudentFeatureMocks(page);
    await seedStudentSession(page);
  });

  test('food ordering journey: canteen -> menu -> cart -> place order', async ({ page }) => {
    await page.goto('/dashboard/canteens');
    await expect(page.getByRole('heading', { name: /Canteen Network/i })).toBeVisible();

    await page.getByRole('button', { name: /Explore Menu/i }).first().click();
    await expect(page).toHaveURL(/\/dashboard\/canteens\/canteen-1\/menu$/);

    await page.getByRole('button', { name: /Add to Cart/i }).first().click();
    await page.getByRole('button', { name: /Open Cart/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/cart$/);

    await page.getByRole('button', { name: /Place Order/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/payment\/order-/);
  });

  test('group order journey: create session and display share code', async ({ page }) => {
    await page.goto('/dashboard/group-order');
    await expect(page.getByRole('heading', { name: /Group Ordering/i })).toBeVisible();

    await page.getByRole('button', { name: /Create Group Session/i }).click();
    await page.getByPlaceholder(/Study Mates Lunch/i).fill('Playwright Lunch Crew');
    await page.getByRole('button', { name: /^Start$/i }).click();

    await expect(page.getByText(/Playwright Lunch Crew/i)).toBeVisible();
    await expect(page.getByText(/Step 1: Invite Friends/i)).toBeVisible();
    await expect(page.getByText(/GRP123/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Copy Code/i })).toBeVisible();
  });

  test('event catering journey: submit request and show in tracking card', async ({ page }) => {
    await page.goto('/dashboard/event-catering');
    await expect(page.getByRole('heading', { name: /Event Catering Request/i })).toBeVisible();

    const eventDate = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await page.locator('select[name="canteenId"]').selectOption('canteen-1');
    await page.locator('select[name="packageId"]').selectOption('pkg-1');
    await page.locator('input[name="eventName"]').fill('Playwright Product Launch');
    await page.locator('input[name="eventDateTime"]').fill(formatDatetimeLocal(eventDate));
    await page.locator('input[name="headcount"]').fill('120');
    await page.locator('input[name="venue"]').fill('Main Auditorium');
    await page.locator('input[name="budget"]').fill('180000');
    await page.getByRole('button', { name: /Submit Request/i }).click();

    await expect(page.getByText(/Playwright Product Launch/i)).toBeVisible();
    await expect(page.getByText(/requested/i)).toBeVisible();
  });
});
