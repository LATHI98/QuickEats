const { test, expect } = require('@playwright/test');

/**
 * Playwright tests for QuickEats key features:
 * 1. Meal Pass Request Form Submission
 * 2. Ratings & Reviews Submission
 * 3. Meal Budget Exceed Notification
 */

test.describe('QuickEats Core Features', () => {
  
  // Login helper - assuming standard student credentials for test environment
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    
    // Fill credentials
    // Note: In a real test environment, these would come from environment variables
    await page.fill('input[type="email"]', 'student@example.com');
    await page.fill('input[type="password"]', 'password123');
    
    // Select Role
    await page.selectOption('select', 'student');
    
    // Submit Login
    await page.click('button[type="submit"]');
    
    // Verify successful login by checking dashboard URL
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('Meal Pass Request Submission', async ({ page }) => {
    // Navigate to Meal Pass page
    await page.goto('/dashboard/meal-pass');
    
    // Wait for meals to load and select the first one
    const mealCard = page.locator('.group').filter({ hasText: 'Get Pass' }).first();
    await expect(mealCard).toBeVisible();
    await mealCard.click();
    
    // The Purchase Modal should appear
    await expect(page.locator('h2', { hasText: 'Meal Pass' })).toBeVisible();
    
    // Fill the mandatory fields in the form
    await page.fill('input[placeholder="John Doe"]', 'Playwright Tester');
    await page.fill('input[placeholder="STU-12345"]', 'STU-PLAY-001');
    await page.fill('input[placeholder="07XXXXXXXX"]', '0771234567');
    
    // Choose "Pay Cash" to bypass online payment validation for simplicity
    await page.click('button:has-text("Pay Cash")');
    
    // Submit the form
    await page.click('button:has-text("Proceed to Pay")');
    
    // Should redirect to "My Passes" page
    await expect(page).toHaveURL(/.*my-passes/);
    
    // Check for success notification
    await expect(page.locator('text=Purchase request sent')).toBeVisible();
  });

  test('Ratings and Reviews Submission', async ({ page }) => {
    // Navigate to Canteens list
    await page.goto('/dashboard/canteens');
    
    // Pick the first canteen (adjusting selector to match the list item)
    const canteenLink = page.locator('h3').first();
    await canteenLink.click();
    
    // We should now be on the Menu page
    await expect(page).toHaveURL(/.*menu/);
    
    // Find an item and click "Rate"
    const rateBtn = page.locator('button:has-text("Rate")').first();
    await rateBtn.click();
    
    // This opens ReviewListModal. Click "Add Rating" inside it.
    await page.click('button:has-text("Add Rating")');
    
    // Now ReviewModal is open. Select 5 stars.
    const stars = page.locator('button >> .lucide-star');
    await stars.nth(4).click(); // 5th star
    
    // Submit Rating
    await page.click('button:has-text("Post Rating")');
    
    // Verify success message in the modal
    await expect(page.locator('text=Rating Submitted!')).toBeVisible();
    
    // Close modal if it doesn't close automatically (code has 2s timeout)
    await page.waitForTimeout(2500); 
    
    // Now test Review submission
    const reviewBtn = page.locator('button:has-text("Reviews")').first();
    await reviewBtn.click();
    
    // Click "Add Review" in ReviewListModal
    await page.click('button:has-text("Add Review")');
    
    // Fill the comment
    await page.fill('textarea', 'Automated test: The food was great and service was fast!');
    
    // Submit Review
    await page.click('button:has-text("Post Review")');
    
    // Verify success
    await expect(page.locator('text=Review Submitted!')).toBeVisible();
  });

  test('Meal Budget Exceed Notification', async ({ page }) => {
    // Go to Budget management page
    await page.goto('/dashboard/budget');
    
    // 1. Set a very low budget first
    await page.click('button:has-text("Update Budget")');
    await page.fill('input[placeholder="0.00"]', '100');
    await page.click('button:has-text("Confirm Budget")');
    
    // 2. Add an expense that goes over the 100 limit
    await page.click('button:has-text("Add Spend")');
    
    // Fill expense details (Spent Amount section)
    await page.fill('input[placeholder="0"]', '120');
    await page.selectOption('select', 'Breakfast');
    await page.fill('input[placeholder="e.g. Chicken Rice Combo"]', 'Expensive Morning Meal');
    
    // Submit the spend
    await page.click('button:has-text("Confirm Spending")');
    
    // 3. Verify "! Over Budget" notification is visible
    const overBudgetBadge = page.locator('text=! Over Budget');
    await expect(overBudgetBadge).toBeVisible();
    
    // Verify the badge has the appropriate styling (red color)
    await expect(overBudgetBadge).toHaveClass(/text-red-500/);
    
    // Verify balance is negative or zero (depending on UI logic)
    const balanceText = page.locator('text=Current Balance').locator('..');
    await expect(balanceText).toContainText('RS');
  });

});
