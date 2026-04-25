const { test, expect } = require('@playwright/test');
const { installApiMocks } = require('./helpers/authMocks');

test.describe('Auth and access journeys', () => {
  test.beforeEach(async ({ page }) => {
    await installApiMocks(page);
    await page.context().clearCookies();
    await page.addInitScript(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('public home page is reachable', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveURL('/');
    await expect(page.getByRole('heading', { name: /QuickEats Smart Campus Dining/i })).toBeVisible();
  });

  test('unauthenticated user is redirected to login for protected student route', async ({ page }) => {
    await page.goto('/dashboard');

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('button', { name: /Sign In/i })).toBeVisible();
  });

  test('student login navigates to student dashboard', async ({ page }) => {
    await page.goto('/login');

    await page.getByPlaceholder('name@university.edu').fill('student@example.com');
    await page.getByPlaceholder('••••••••').fill('password123');
    await page.getByRole('button', { name: /Sign In/i }).click();

    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test('admin login navigates to admin dashboard', async ({ page }) => {
    await page.goto('/login');

    await page.getByRole('button', { name: /Admin/i }).click();
    await page.getByPlaceholder('name@university.edu').fill('admin@example.com');
    await page.getByPlaceholder('••••••••').fill('password123');
    await page.getByRole('button', { name: /Sign In/i }).click();

    await expect(page).toHaveURL(/\/admin\/dashboard$/);
  });

  test('canteen staff login navigates to canteen selection', async ({ page }) => {
    await page.goto('/login');

    await page.getByRole('button', { name: /Canteen Staff/i }).click();
    await page.getByPlaceholder('name@university.edu').fill('staff@example.com');
    await page.getByPlaceholder('••••••••').fill('password123');
    await page.getByRole('button', { name: /Sign In/i }).click();

    await expect(page).toHaveURL(/\/admin\/select-canteen$/);
    await expect(page.getByText(/Available canteens/i)).toBeVisible();
  });
});
