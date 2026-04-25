const ONE_HOUR_MS = 60 * 60 * 1000;

function formatDatetimeLocal(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

async function seedStudentSession(page) {
  await page.context().clearCookies();
  await page.addInitScript(() => {
    localStorage.clear();
    sessionStorage.clear();

    const user = {
      id: 'student-1',
      _id: 'student-1',
      name: 'Playwright Student',
      email: 'student@example.com',
      role: 'student',
    };

    localStorage.setItem('token', 'test-token-student');
    localStorage.setItem('user', JSON.stringify(user));
  });
}

async function installStudentFeatureMocks(page) {
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

  const canteens = [
    {
      _id: 'canteen-1',
      name: 'Main Canteen',
      location: 'Block A',
      ratings: 4.7,
      description: 'Fresh campus meals',
      openHours: '8:00 AM - 8:00 PM',
    },
  ];

  const menuByCanteen = {
    'canteen-1': [
      {
        _id: 'menu-1',
        name: 'Chicken Rice Bowl',
        category: 'Rice',
        price: 450,
        ratings: 4.6,
        isAvailable: true,
        description: 'Steamed rice with grilled chicken',
      },
      {
        _id: 'menu-2',
        name: 'Veggie Noodles',
        category: 'Noodles',
        price: 380,
        ratings: 4.4,
        isAvailable: true,
        description: 'Stir-fried vegetable noodles',
      },
    ],
  };

  const recommendedSlots = [
    {
      type: 'Optimized',
      label: 'Best time',
      description: 'Lowest queue wait time',
      time: new Date(Date.now() + 2 * ONE_HOUR_MS).toISOString(),
      timeLabel: 'In 2 hours',
    },
    {
      type: 'Soon',
      label: 'Soon',
      description: 'Quick pickup slot',
      time: new Date(Date.now() + 3 * ONE_HOUR_MS).toISOString(),
      timeLabel: 'In 3 hours',
    },
  ];

  const groupSessionState = {
    active: null,
  };

  const eventCateringState = {
    requests: [],
  };

  const paymentByOrderId = {};

  const cartState = {
    items: [],
    canteen: null,
    totalPrice: 0,
  };

  const recomputeCart = () => {
    cartState.totalPrice = cartState.items.reduce((sum, item) => sum + Number(item.unitPrice || 0) * Number(item.quantity || 0), 0);
  };

  const getCartPayload = () => ({
    data: {
      canteen: cartState.canteen,
      items: cartState.items,
      totalPrice: cartState.totalPrice,
    },
  });

  const findMenuItem = (menuItemId) => {
    for (const list of Object.values(menuByCanteen)) {
      const found = list.find((item) => item._id === menuItemId);
      if (found) return found;
    }
    return null;
  };

  await page.route('**/api/**', async (route) => {
    const req = route.request();
    const method = req.method();
    const url = new URL(req.url());
    const pathname = url.pathname;

    if (method === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: corsHeaders, body: '' });
      return;
    }

    // Auth
    if (method === 'GET' && pathname === '/api/auth/me') {
      await fulfillJson(route, {
        user: {
          id: 'student-1',
          _id: 'student-1',
          name: 'Playwright Student',
          email: 'student@example.com',
          role: 'student',
        },
      });
      return;
    }

    if (method === 'POST' && pathname === '/api/auth/login') {
      const body = req.postDataJSON() || {};
      const role = body.role || 'student';
      await fulfillJson(route, {
        token: `test-token-${role}`,
        user: {
          id: `${role}-1`,
          _id: `${role}-1`,
          name: `Playwright ${role}`,
          email: body.email || `${role}@example.com`,
          role,
        },
      });
      return;
    }

    // Canteens and menu
    if (method === 'GET' && pathname === '/api/canteens') {
      await fulfillJson(route, canteens);
      return;
    }

    if (method === 'GET' && pathname.startsWith('/api/canteens/') && pathname.endsWith('/menu')) {
      const canteenId = pathname.split('/')[3];
      await fulfillJson(route, { data: menuByCanteen[canteenId] || [] });
      return;
    }

    if (method === 'GET' && pathname.startsWith('/api/canteens/')) {
      const canteenId = pathname.split('/')[3];
      const canteen = canteens.find((item) => item._id === canteenId) || null;
      await fulfillJson(route, { data: canteen });
      return;
    }

    // Queue
    if (method === 'GET' && pathname.startsWith('/api/queue/') && pathname.endsWith('/recommended-slots')) {
      await fulfillJson(route, { data: recommendedSlots });
      return;
    }

    if (method === 'GET' && pathname.startsWith('/api/queue/') && pathname.endsWith('/status')) {
      await fulfillJson(route, {
        data: {
          estimatedWaitTime: 10,
          surgeAlert: false,
          grouped: { pending: [], preparing: [], ready: [] },
          totalActive: 0,
        },
      });
      return;
    }

    // Cart
    if (method === 'GET' && pathname === '/api/cart') {
      await fulfillJson(route, getCartPayload());
      return;
    }

    if (method === 'POST' && pathname === '/api/cart/items') {
      const body = req.postDataJSON() || {};
      const menuItem = findMenuItem(body.menuItemId);
      if (!menuItem) {
        await fulfillJson(route, { message: 'Menu item not found' }, 404);
        return;
      }

      if (!cartState.canteen) {
        cartState.canteen = { _id: 'canteen-1', name: 'Main Canteen' };
      }

      const existing = cartState.items.find((it) => (it.menuItem?._id || it.menuItem) === body.menuItemId);
      if (existing) {
        existing.quantity = Number(existing.quantity || 0) + Number(body.quantity || 1);
      } else {
        cartState.items.push({
          menuItem: menuItem._id,
          name: menuItem.name,
          unitPrice: menuItem.price,
          quantity: Number(body.quantity || 1),
        });
      }

      recomputeCart();
      await fulfillJson(route, { message: 'Added to cart' });
      return;
    }

    if (method === 'PUT' && pathname.startsWith('/api/cart/items/')) {
      const menuItemId = pathname.split('/')[4];
      const body = req.postDataJSON() || {};
      const qty = Number(body.quantity || 0);
      const item = cartState.items.find((it) => (it.menuItem?._id || it.menuItem) === menuItemId);
      if (!item) {
        await fulfillJson(route, { message: 'Item not in cart' }, 404);
        return;
      }
      if (qty <= 0) {
        cartState.items = cartState.items.filter((it) => (it.menuItem?._id || it.menuItem) !== menuItemId);
      } else {
        item.quantity = qty;
      }
      recomputeCart();
      await fulfillJson(route, { message: 'Cart updated' });
      return;
    }

    if (method === 'DELETE' && pathname.startsWith('/api/cart/items/')) {
      const menuItemId = pathname.split('/')[4];
      cartState.items = cartState.items.filter((it) => (it.menuItem?._id || it.menuItem) !== menuItemId);
      recomputeCart();
      await fulfillJson(route, { message: 'Item removed' });
      return;
    }

    if (method === 'DELETE' && pathname === '/api/cart') {
      cartState.items = [];
      cartState.totalPrice = 0;
      cartState.canteen = null;
      await fulfillJson(route, { message: 'Cart cleared' });
      return;
    }

    // Orders and payment
    if (method === 'POST' && pathname === '/api/orders') {
      const orderId = `order-${900 + eventCateringState.requests.length + 1}`;
      paymentByOrderId[orderId] = {
        status: 'unpaid',
      };
      await fulfillJson(route, {
        data: {
          _id: orderId,
          queueNumber: 321,
          totalPrice: cartState.totalPrice || 450,
        },
      });
      return;
    }

    if (method === 'GET' && /^\/api\/orders\/[^/]+\/payment$/.test(pathname)) {
      const orderId = pathname.split('/')[3];
      await fulfillJson(route, { data: paymentByOrderId[orderId] || { status: 'unpaid' } });
      return;
    }

    if (pathname.includes('/payment')) {
      await fulfillJson(route, { data: { ok: true } });
      return;
    }

    // Group sessions
    if (method === 'GET' && pathname === '/api/group-sessions/my/active') {
      await fulfillJson(route, { success: true, data: groupSessionState.active });
      return;
    }

    if (method === 'POST' && pathname === '/api/group-sessions') {
      const body = req.postDataJSON() || {};
      const canteen = canteens.find((item) => item._id === body.canteenId) || canteens[0];
      groupSessionState.active = {
        _id: 'group-1',
        name: body.name || 'My Group',
        shareCode: 'GRP123',
        status: 'open',
        paymentMode: body.paymentMode || 'pay_separately',
        creator: { _id: 'student-1', name: 'Playwright Student' },
        canteen,
        qrCodeData: 'data:image/png;base64,placeholder',
        members: [
          { _id: 'student-1', name: 'Playwright Student', role: 'creator' },
          { _id: 'student-2', name: 'Friend One', role: 'member' },
        ],
      };
      await fulfillJson(route, { success: true, data: groupSessionState.active });
      return;
    }

    if (method === 'GET' && pathname === '/api/group-sessions/group-1/member-status') {
      await fulfillJson(route, {
        data: [
          { _id: 'student-1', name: 'Playwright Student', hasItems: true },
          { _id: 'student-2', name: 'Friend One', hasItems: true },
        ],
      });
      return;
    }

    if (method === 'DELETE' && pathname === '/api/group-sessions/group-1') {
      groupSessionState.active = null;
      await fulfillJson(route, { success: true });
      return;
    }

    if (method === 'PATCH' && pathname === '/api/group-sessions/group-1') {
      const body = req.postDataJSON() || {};
      groupSessionState.active = {
        ...(groupSessionState.active || {}),
        ...body,
      };
      await fulfillJson(route, { success: true, data: groupSessionState.active });
      return;
    }

    // Event catering
    if (method === 'GET' && pathname === '/api/event-catering/requests/my') {
      await fulfillJson(route, { data: eventCateringState.requests.slice().reverse() });
      return;
    }

    if (method === 'GET' && pathname === '/api/event-catering/packages') {
      await fulfillJson(route, {
        data: [
          {
            _id: 'pkg-1',
            name: 'Conference Package',
            basePrice: 120000,
            description: 'Buffet and beverage package',
          },
        ],
      });
      return;
    }

    if (method === 'POST' && pathname === '/api/event-catering/requests') {
      const body = req.postDataJSON() || {};
      const requestId = `event-${eventCateringState.requests.length + 1}`;
      eventCateringState.requests.push({
        _id: requestId,
        eventName: body.eventName,
        status: 'requested',
        quote: { totalQuoted: 150000 },
        payment: { totalPayable: 150000, amountPaid: 0, amountDue: 150000 },
      });
      await fulfillJson(route, {
        data: { _id: requestId },
      });
      return;
    }

    // Default success response for non-essential API calls.
    await fulfillJson(route, { ok: true, data: [] });
  });
}

module.exports = {
  installStudentFeatureMocks,
  seedStudentSession,
  formatDatetimeLocal,
};
