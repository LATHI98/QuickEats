const { installApiMocks } = require('./authMocks');

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function createSeedOrders() {
  const now = Date.now();

  return [
    {
      _id: 'order-101',
      queueNumber: 101,
      status: 'pending',
      payment: { status: 'unpaid' },
      student: { name: 'Alice Student', studentId: 'IT1001', email: 'alice@example.com' },
      items: [{ name: 'Chicken Rice', quantity: 1, unitPrice: 450 }],
      totalPrice: 450,
      createdAt: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
      canteen: { _id: 'canteen-1', name: 'Main Canteen' },
      pickupVerified: false,
      pickupCode: '',
      activityLogs: [],
    },
    {
      _id: 'order-102',
      queueNumber: 102,
      status: 'ready',
      payment: { status: 'verified' },
      student: { name: 'Bob Student', studentId: 'IT1002', email: 'bob@example.com' },
      items: [{ name: 'Kottu', quantity: 1, unitPrice: 700 }],
      totalPrice: 700,
      createdAt: new Date(now - 45 * 60 * 1000).toISOString(),
      canteen: { _id: 'canteen-1', name: 'Main Canteen' },
      pickupVerified: false,
      pickupCode: 'QK82F2',
      activityLogs: [],
    },
    {
      _id: 'order-103',
      queueNumber: 103,
      status: 'preparing',
      payment: { status: 'unpaid' },
      student: { name: 'Carol Student', studentId: 'IT1003', email: 'carol@example.com' },
      items: [{ name: 'Noodles', quantity: 2, unitPrice: 350 }],
      totalPrice: 700,
      createdAt: new Date(now - (ONE_DAY_MS + 2 * 60 * 60 * 1000)).toISOString(),
      canteen: { _id: 'canteen-1', name: 'Main Canteen' },
      pickupVerified: false,
      pickupCode: '',
      activityLogs: [],
    },
    {
      _id: 'order-104',
      queueNumber: 104,
      status: 'cancelled',
      payment: { status: 'rejected' },
      student: { name: 'Dan Student', studentId: 'IT1004', email: 'dan@example.com' },
      items: [{ name: 'Paratha', quantity: 1, unitPrice: 200 }],
      totalPrice: 200,
      createdAt: new Date(now - 3 * ONE_DAY_MS).toISOString(),
      canteen: { _id: 'canteen-1', name: 'Main Canteen' },
      pickupVerified: false,
      pickupCode: '',
      activityLogs: [],
    },
  ];
}

function isStaleOrder(order) {
  const age = Date.now() - new Date(order.createdAt).getTime();
  return ['pending', 'preparing'].includes(order.status) && order.payment?.status !== 'verified' && age > ONE_DAY_MS;
}

function parseOrderIdFromPath(pathname, suffix) {
  const marker = `/api/orders/`;
  const idx = pathname.indexOf(marker);
  if (idx < 0) return null;
  const tail = pathname.slice(idx + marker.length);
  if (!tail.endsWith(suffix)) return null;
  return tail.slice(0, tail.length - suffix.length);
}

async function installOrderManagementMocks(page) {
  await installApiMocks(page);

  const corsHeaders = {
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'access-control-allow-headers': 'Content-Type, Authorization',
  };

  const fulfillJson = async (route, payload, status = 200) => {
    await route.fulfill({
      status,
      contentType: 'application/json',
      headers: corsHeaders,
      body: JSON.stringify(payload),
    });
  };

  const handlePreflight = async (route) => {
    if (route.request().method() !== 'OPTIONS') return false;
    await route.fulfill({ status: 204, headers: corsHeaders, body: '' });
    return true;
  };

  let orders = createSeedOrders();

  await page.route('**/api/canteens', async (route) => {
    if (await handlePreflight(route)) return;

    await fulfillJson(route, {
      data: [{ _id: 'canteen-1', name: 'Main Canteen' }],
    });
  });

  await page.route('**/api/orders/canteen/stale**', async (route) => {
    if (await handlePreflight(route)) return;

    await fulfillJson(route, {
      data: orders.filter(isStaleOrder),
    });
  });

  await page.route('**/api/orders/canteen/bulk-cancel', async (route) => {
    if (await handlePreflight(route)) return;

    const body = route.request().postDataJSON() || {};
    const ids = Array.isArray(body.orderIds) ? body.orderIds : [];

    orders = orders.map((order) => (ids.includes(order._id)
      ? {
          ...order,
          status: 'cancelled',
          payment: { ...(order.payment || {}), status: order.payment?.status || 'unpaid' },
        }
      : order));

    await fulfillJson(route, {
      message: `Cancelled ${ids.length} order(s)`,
    });
  });

  await page.route('**/api/orders/pickup-by-code', async (route) => {
    if (await handlePreflight(route)) return;

    const body = route.request().postDataJSON() || {};
    const code = String(body.pickupCode || '').trim().toUpperCase();
    const target = orders.find((order) => order.pickupCode === code && order.status === 'ready');

    if (!target) {
      await fulfillJson(route, { message: 'Pickup code not found' }, 400);
      return;
    }

    orders = orders.map((order) => (order._id === target._id
      ? { ...order, status: 'completed', pickupVerified: true, pickupVerifiedAt: new Date().toISOString() }
      : order));

    await fulfillJson(route, { message: 'Order marked as delivered' });
  });

  await page.route('**/api/orders/**/status', async (route) => {
    if (await handlePreflight(route)) return;

    const url = new URL(route.request().url());
    const orderId = parseOrderIdFromPath(url.pathname, '/status');
    const body = route.request().postDataJSON() || {};
    const nextStatus = body.status;

    orders = orders.map((order) => (order._id === orderId ? { ...order, status: nextStatus } : order));

    await fulfillJson(route, { message: 'Status updated' });
  });

  await page.route('**/api/orders/canteen**', async (route) => {
    if (await handlePreflight(route)) return;

    const url = new URL(route.request().url());
    if (url.pathname !== '/api/orders/canteen') {
      await route.fallback();
      return;
    }

    const status = url.searchParams.get('status');

    const filtered = status
      ? orders.filter((order) => order.status === status)
      : orders;

    await fulfillJson(route, { data: filtered });
  });
}

async function seedAdminSession(page) {
  await page.context().clearCookies();
  await page.addInitScript(() => {
    localStorage.clear();
    sessionStorage.clear();

    localStorage.setItem('token', 'test-token-admin');
    localStorage.setItem('user', JSON.stringify({
      _id: 'admin-1',
      name: 'Playwright Admin',
      email: 'admin@example.com',
      role: 'admin',
    }));
  });
}

module.exports = {
  installOrderManagementMocks,
  seedAdminSession,
};
