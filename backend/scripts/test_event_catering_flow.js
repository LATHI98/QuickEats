/*
  Manual smoke test for Event Catering flow.
  Usage:
    1) Set env vars in this shell:
       SET API_BASE_URL=http://localhost:5000
       SET STUDENT_TOKEN=...
       SET STAFF_TOKEN=...
       SET CANTEEN_ID=...
    2) Run:
       node scripts/test_event_catering_flow.js
*/

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';
const STUDENT_TOKEN = process.env.STUDENT_TOKEN;
const STAFF_TOKEN = process.env.STAFF_TOKEN;
const CANTEEN_ID = process.env.CANTEEN_ID;

const jsonHeaders = (token) => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token}`,
});

const request = async (path, method, token, body = null) => {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: jsonHeaders(token),
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`${method} ${path} failed: ${res.status} ${JSON.stringify(data)}`);
  }
  return data;
};

const ensureEnv = () => {
  if (!STUDENT_TOKEN || !STAFF_TOKEN || !CANTEEN_ID) {
    throw new Error('Missing required env vars: STUDENT_TOKEN, STAFF_TOKEN, CANTEEN_ID');
  }
};

const run = async () => {
  ensureEnv();

  const eventDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();

  const created = await request('/api/event-catering/requests', 'POST', STUDENT_TOKEN, {
    canteenId: CANTEEN_ID,
    eventName: 'QA Catering Test Event',
    eventDateTime: eventDate,
    headcount: 80,
    venue: 'Engineering Hall A',
    budget: 45000,
    notes: 'Automated smoke test request',
  });

  const requestId = created?.data?._id;
  if (!requestId) throw new Error('Request id not returned');
  console.log('Created request:', requestId);

  await request(`/api/event-catering/requests/${requestId}/quote`, 'PATCH', STAFF_TOKEN, {
    lineItems: [{ name: 'Buffet Package', quantity: 1, unitPrice: 40000 }],
    serviceFee: 2500,
    discount: 1000,
    notes: 'Includes serving team and setup',
  });
  console.log('Quote updated');

  await request(`/api/event-catering/requests/${requestId}/confirm-quote`, 'POST', STUDENT_TOKEN);
  console.log('Quote confirmed by student');

  await request(`/api/event-catering/requests/${requestId}/status`, 'PATCH', STAFF_TOKEN, { status: 'in_prep' });
  await request(`/api/event-catering/requests/${requestId}/status`, 'PATCH', STAFF_TOKEN, { status: 'ready' });
  await request(`/api/event-catering/requests/${requestId}/status`, 'PATCH', STAFF_TOKEN, { status: 'delivered' });

  const finalView = await request(`/api/event-catering/requests/my/${requestId}`, 'GET', STUDENT_TOKEN);
  console.log('Final status:', finalView?.data?.status);
  console.log('Flow completed successfully');
};

run().catch((err) => {
  console.error('[event-catering-smoke-test] failed:', err.message);
  process.exitCode = 1;
});
