async function installApiMocks(page) {
  const corsHeaders = {
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'access-control-allow-headers': 'Content-Type, Authorization',
  };

  const fulfillPreflight = async (route) => {
    if (route.request().method() !== 'OPTIONS') return false;
    await route.fulfill({
      status: 204,
      headers: corsHeaders,
      body: '',
    });
    return true;
  };

  await page.route('**/api/auth/login', async (route) => {
    if (await fulfillPreflight(route)) return;

    const requestBody = route.request().postDataJSON();
    const role = requestBody?.role || 'student';

    const user = {
      _id: `user-${role}`,
      name: `Playwright ${role}`,
      email: requestBody?.email || `${role}@example.com`,
      role,
    };

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: corsHeaders,
      body: JSON.stringify({
        token: `test-token-${role}`,
        user,
      }),
    });
  });

  await page.route('**/api/auth/me', async (route) => {
    if (await fulfillPreflight(route)) return;

    const authHeader = route.request().headers().authorization || '';
    let role = 'student';

    if (authHeader.includes('admin')) role = 'admin';
    if (authHeader.includes('canteenStaff')) role = 'canteenStaff';

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: corsHeaders,
      body: JSON.stringify({
        user: {
          _id: `restored-${role}`,
          name: `Restored ${role}`,
          email: `${role}@example.com`,
          role,
        },
      }),
    });
  });

  await page.route('**/api/canteens', async (route) => {
    if (await fulfillPreflight(route)) return;

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: corsHeaders,
      body: JSON.stringify([
        {
          _id: 'canteen-1',
          name: 'Main Canteen',
          owner: 'QuickEats',
          openHours: '8:00 AM - 8:00 PM',
          description: 'Playwright mock canteen',
        },
      ]),
    });
  });

}

module.exports = {
  installApiMocks,
};
