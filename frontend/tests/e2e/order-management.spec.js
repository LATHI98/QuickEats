const { test, expect } = require('@playwright/test');
const { installOrderManagementMocks, seedAdminSession } = require('./helpers/orderManagementMocks');

test.describe('Order management journeys', () => {
  test.beforeEach(async ({ page }) => {
    await installOrderManagementMocks(page);
    await seedAdminSession(page);
    await page.goto('/admin/orders');
    await expect(page.getByRole('heading', { name: /Orders Management/i })).toBeVisible();
  });

  test('admin can filter orders by status', async ({ page }) => {
    await expect(page.getByText(/Queue #101/i)).toBeVisible();
    await expect(page.getByText(/Queue #102/i)).toBeVisible();

    await page.getByRole('button', { name: /^Pending$/i }).click();

    await expect(page.getByText(/Queue #101/i)).toBeVisible();
    await expect(page.getByText(/Queue #102/i)).toHaveCount(0);
  });

  test('expired tab supports bulk cancel flow', async ({ page }) => {
    await page.getByRole('button', { name: /Expired/i }).click();

    await expect(page.getByText(/1 order need attention/i)).toBeVisible();
    await page.getByRole('button', { name: /Cancel All Expired/i }).click();

    await expect(page.getByRole('heading', { name: /Cancel 1 expired order/i })).toBeVisible();
    await page.getByRole('button', { name: /Cancel 1 Order/i }).click();

    await expect(page.getByText(/No stale orders/i)).toBeVisible();
  });

  test('pickup code confirmation marks ready order delivered', async ({ page }) => {
    await page.getByPlaceholder(/Enter pickup code/i).fill('QK82F2');
    await page.getByRole('button', { name: /Confirm Delivery/i }).click();

    await page.getByRole('button', { name: /^Ready$/i }).click();
    await expect(page.getByText(/Queue #102/i)).toHaveCount(0);
  });
});
