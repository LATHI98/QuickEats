# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: features.spec.js >> QuickEats Core Features >> Ratings and Reviews Submission
- Location: tests\features.spec.js:61:3

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /.*dashboard/
Received string:  "http://localhost:3000/login"
Timeout: 5000ms

Call log:
  - Expect "toHaveURL" with timeout 5000ms
    8 × unexpected value "http://localhost:3000/login"

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - generic [ref=e3]:
    - generic [ref=e5]:
      - generic [ref=e6]:
        - link "QuickEats" [ref=e7] [cursor=pointer]:
          - /url: /
        - heading "Welcome Back" [level=1] [ref=e8]
      - generic [ref=e9]:
        - generic [ref=e10]:
          - generic [ref=e11]: Login As
          - generic [ref=e12]:
            - button "Student" [ref=e13] [cursor=pointer]:
              - img [ref=e14]
              - generic [ref=e17]: Student
            - button "Admin" [ref=e18] [cursor=pointer]:
              - img [ref=e19]
              - generic [ref=e21]: Admin
            - button "University Staff" [ref=e22] [cursor=pointer]:
              - img [ref=e23]
              - generic [ref=e25]: University Staff
            - button "Canteen Staff" [ref=e26] [cursor=pointer]:
              - img [ref=e27]
              - generic [ref=e30]: Canteen Staff
        - generic [ref=e31]:
          - generic [ref=e32]:
            - img [ref=e33]
            - textbox "name@university.edu" [ref=e36]: student@quickeats.com
          - generic [ref=e37]:
            - img [ref=e38]
            - textbox "••••••••" [ref=e41]: student123
        - link "Forgot Password?" [ref=e43] [cursor=pointer]:
          - /url: /forgot-password
        - button "Signing in..." [disabled] [ref=e44]
      - generic [ref=e45]:
        - text: New here?
        - link "Create Account" [ref=e46] [cursor=pointer]:
          - /url: /register
    - img "Smart Dining" [ref=e48]
  - region "Notifications Alt+T"
```

# Test source

```ts
  1   | const { test, expect } = require('@playwright/test');
  2   | 
  3   | /**
  4   |  * Playwright tests for QuickEats key features:
  5   |  * 1. Meal Pass Request Form Submission
  6   |  * 2. Ratings & Reviews Submission
  7   |  * 3. Meal Budget Exceed Notification
  8   |  */
  9   | 
  10  | test.describe('QuickEats Core Features', () => {
  11  |   
  12  |   // Login helper - assuming standard student credentials for test environment
  13  |   test.beforeEach(async ({ page }) => {
  14  |     await page.goto('/login');
  15  |     
  16  |     // Fill credentials
  17  |     // Note: In a real test environment, these would come from environment variables
  18  |     await page.fill('input[type="email"]', 'student@quickeats.com');
  19  |     await page.fill('input[type="password"]', 'student123');
  20  |     
  21  |     // Select Role
  22  |     await page.click('button:has-text("Student")');
  23  |     
  24  |     // Submit Login
  25  |     await page.click('button[type="submit"]');
  26  |     
  27  |     // Verify successful login by checking dashboard URL
> 28  |     await expect(page).toHaveURL(/.*dashboard/);
      |                        ^ Error: expect(page).toHaveURL(expected) failed
  29  |   });
  30  | 
  31  |   test('Meal Pass Request Submission', async ({ page }) => {
  32  |     // Navigate to Meal Pass page
  33  |     await page.goto('/dashboard/meal-pass');
  34  |     
  35  |     // Wait for meals to load and select the first one
  36  |     const mealCard = page.locator('.group').filter({ hasText: 'Get Pass' }).first();
  37  |     await expect(mealCard).toBeVisible();
  38  |     await mealCard.click();
  39  |     
  40  |     // The Purchase Modal should appear
  41  |     await expect(page.locator('h2', { hasText: 'Meal Pass' })).toBeVisible();
  42  |     
  43  |     // Fill the mandatory fields in the form
  44  |     await page.fill('input[placeholder="John Doe"]', 'Playwright Tester');
  45  |     await page.fill('input[placeholder="STU-12345"]', 'STU-PLAY-001');
  46  |     await page.fill('input[placeholder="07XXXXXXXX"]', '0771234567');
  47  |     
  48  |     // Choose "Pay Cash" to bypass online payment validation for simplicity
  49  |     await page.click('button:has-text("Pay Cash")');
  50  |     
  51  |     // Submit the form
  52  |     await page.click('button:has-text("Proceed to Pay")');
  53  |     
  54  |     // Should redirect to "My Passes" page
  55  |     await expect(page).toHaveURL(/.*my-passes/);
  56  |     
  57  |     // Check for success notification
  58  |     await expect(page.locator('text=Purchase request sent')).toBeVisible();
  59  |   });
  60  | 
  61  |   test('Ratings and Reviews Submission', async ({ page }) => {
  62  |     // Navigate to Canteens list
  63  |     await page.goto('/dashboard/canteens');
  64  |     
  65  |     // Pick the first canteen (adjusting selector to match the list item)
  66  |     const canteenLink = page.locator('h3').first();
  67  |     await canteenLink.click();
  68  |     
  69  |     // We should now be on the Menu page
  70  |     await expect(page).toHaveURL(/.*menu/);
  71  |     
  72  |     // Find an item and click "Rate"
  73  |     const rateBtn = page.locator('button:has-text("Rate")').first();
  74  |     await rateBtn.click();
  75  |     
  76  |     // This opens ReviewListModal. Click "Add Rating" inside it.
  77  |     await page.click('button:has-text("Add Rating")');
  78  |     
  79  |     // Now ReviewModal is open. Select 5 stars.
  80  |     const starBtn = page.locator('button').filter({ has: page.locator('.lucide-star') }).nth(4);
  81  |     await starBtn.click({ force: true }); 
  82  |     
  83  |     // Submit Rating
  84  |     await page.click('button:has-text("Post Rating")');
  85  |     
  86  |     // Verify success message in the modal
  87  |     await expect(page.locator('text=Rating Submitted!')).toBeVisible();
  88  |     
  89  |     // Close modal if it doesn't close automatically (code has 2s timeout)
  90  |     await page.waitForTimeout(2500); 
  91  |     
  92  |     // Now test Review submission
  93  |     const reviewBtn = page.locator('button:has-text("Reviews")').first();
  94  |     await reviewBtn.click();
  95  |     
  96  |     // Click "Add Review" in ReviewListModal
  97  |     await page.click('button:has-text("Add Review")');
  98  |     
  99  |     // Fill the comment
  100 |     await page.fill('textarea', 'Automated test: The food was great and service was fast!');
  101 |     
  102 |     // Submit Review
  103 |     await page.click('button:has-text("Post Review")');
  104 |     
  105 |     // Verify success
  106 |     await expect(page.locator('text=Review Submitted!')).toBeVisible();
  107 |   });
  108 | 
  109 |   test('Meal Budget Exceed Notification', async ({ page }) => {
  110 |     // Go to Budget management page
  111 |     await page.goto('/dashboard/budget');
  112 |     
  113 |     // 1. Set a very low budget first
  114 |     await page.click('button:has-text("Update Budget")');
  115 |     await page.fill('input[placeholder="0.00"]', '100');
  116 |     await page.click('button:has-text("Confirm Budget")');
  117 |     
  118 |     // 2. Add an expense that goes over the 100 limit
  119 |     await page.click('button:has-text("Add Spend")');
  120 |     
  121 |     // Fill expense details (Spent Amount section)
  122 |     await page.fill('input[placeholder="0"]', '120');
  123 |     await page.selectOption('select', 'Breakfast');
  124 |     await page.fill('input[placeholder="e.g. Chicken Rice Combo"]', 'Expensive Morning Meal');
  125 |     
  126 |     // Submit the spend
  127 |     await page.click('button:has-text("Confirm Spending")');
  128 |     
```