import axios from 'axios';
import config from '../config/config';

const api = axios.create({
  baseURL: config.API_URL,
});


// Attach Bearer token to every request
api.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

// Auto-logout on 401 Unauthorized
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && !window.location.pathname.includes('/login')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ── Canteens & Menu ───────────────────────────────────────────────────────────
export const canteenAPI = {
  getAll: () => api.get('/api/canteens'),
  getById: (id) => api.get(`/api/canteens/${id}`),
  getMenu: (id, params) => api.get(`/api/canteens/${id}/menu`, { params }),
  verifyPassword: (id, canteenPassword) => api.post(`/api/canteens/${id}/verify-password`, { canteenPassword }),
  updateSettings: (id, data) => api.patch(`/api/canteens/${id}/settings`, data),
};

export const systemAPI = {
  getConfig: () => api.get('/api/system/config'),
  updateConfig: (data) => api.patch('/api/system/config', data),
};

// ── Cart ─────────────────────────────────────────────────────────────────────
export const cartAPI = {
  getCart: () => api.get('/api/cart'),
  addItem: (menuItemId, quantity) => api.post('/api/cart/items', { menuItemId, quantity }),
  updateItem: (menuItemId, quantity) => api.put(`/api/cart/items/${menuItemId}`, { quantity }),
  removeItem: (menuItemId) => api.delete(`/api/cart/items/${menuItemId}`),
  clearCart: () => api.delete('/api/cart'),
};

// ── Orders ────────────────────────────────────────────────────────────────────
export const orderAPI = {
  placeOrder: (data) => api.post('/api/orders', data),
  getMyOrders: (params) => api.get('/api/orders/my', { params }),
  getMyOrderById: (orderId) => api.get(`/api/orders/my/${orderId}`),
  cancelOrder: (orderId) => api.patch(`/api/orders/${orderId}/cancel`),
  // Staff
  getCanteenOrders: (params = {}) => api.get('/api/orders/canteen', { params: { ...params, _ts: Date.now() } }),
  updateOrderStatus: (orderId, status, reason = '', canteenId = '') => api.patch(`/api/orders/${orderId}/status`, { status, reason, canteenId }),
  verifyPickup: (orderId, payload) => api.post(`/api/orders/${orderId}/pickup-verify`, payload),
  pickupByCode: (pickupCode, qrValidated = true, canteenId = '') => api.post('/api/orders/pickup-by-code', { pickupCode, qrValidated, canteenId }),
  getStaleOrders: (params = {}) => api.get('/api/orders/canteen/stale', { params }),
  bulkCancelOrders: (orderIds, reason) => api.post('/api/orders/canteen/bulk-cancel', { orderIds, reason }),
  deleteCancelledOrders: (canteenId = '') => api.delete('/api/orders/canteen/cancelled', { params: canteenId ? { canteen: canteenId } : {} }),
};

// ── Payment ───────────────────────────────────────────────────────────────────
export const paymentAPI = {
  submitCash: (orderId) => api.post(`/api/orders/${orderId}/payment/cash`),
  regenerateCashCode: (orderId) => api.post(`/api/orders/${orderId}/payment/cash/regenerate`),
  createStripeIntent: (orderId) => api.post(`/api/orders/${orderId}/payment/stripe/create-intent`),
  getPaymentStatus: (orderId) => api.get(`/api/orders/${orderId}/payment`),
  verifyPayment: (orderId, payload) => api.patch(`/api/orders/${orderId}/payment/verify`, payload),
  rejectPayment: (orderId, reason) => api.patch(`/api/orders/${orderId}/payment/reject`, { reason }),
};

// ── Queue ─────────────────────────────────────────────────────────────────────
export const queueAPI = {
  getSlots: (canteenId) => api.get(`/api/queue/${canteenId}/slots`),
  getStatus: (canteenId) => api.get(`/api/queue/${canteenId}/status`),
  getMyPosition: (canteenId, orderId) => api.get(`/api/queue/${canteenId}/my-position/${orderId}`),
  getRecommendedSlots: (canteenId) => api.get(`/api/queue/${canteenId}/recommended-slots`),
  skipQueue: (orderId) => api.patch(`/api/queue/claim-priority/${orderId}`),
  setNowServing: (canteenId, currentlyServing) => api.patch(`/api/queue/${canteenId}/serving`, { currentlyServing }),
  callNext: (canteenId) => api.patch(`/api/queue/${canteenId}/call-next`),
};

// ── Group Session ────────────────────────────────────────────────────────────
export const groupSessionAPI = {
  createSession: (data) => api.post('/api/group-sessions', data),
  joinSession: (shareCode) => api.post('/api/group-sessions/join', { shareCode }),
  getSession: (id) => api.get(`/api/group-sessions/${id}`),
  lockSession: (id) => api.patch(`/api/group-sessions/${id}/lock`),
  editSession: (id, params) => api.patch(`/api/group-sessions/${id}`, params),
  removeMember: (id, memberId) => api.delete(`/api/group-sessions/${id}/members/${memberId}`),
  leaveSession: (id, memberId) => api.delete(`/api/group-sessions/${id}/members/${memberId}`),
  deleteSession: (id) => api.delete(`/api/group-sessions/${id}`),
  getActiveSession: () => api.get('/api/group-sessions/my/active'),
  getMergedCart: (id) => api.get(`/api/group-sessions/${id}/merged-cart`),
  getMemberStatus: (id) => api.get(`/api/group-sessions/${id}/member-status`),
};

// ── Crowd Monitoring ─────────────────────────────────────────────────────────
export const crowdAPI = {
  getLatest: () => api.get('/api/crowd'),
  create: (count, timestamp = new Date().toISOString()) => api.post('/api/crowd', { count, timestamp }),
};

// ── Event Catering ───────────────────────────────────────────────────────────
export const eventCateringAPI = {
  // Student side
  createRequest: (payload) => api.post('/api/event-catering/requests', payload),
  getMyRequests: (params) => api.get('/api/event-catering/requests/my', { params }),
  getMyRequestById: (requestId) => api.get(`/api/event-catering/requests/my/${requestId}`),
  confirmQuote: (requestId) => api.post(`/api/event-catering/requests/${requestId}/confirm-quote`),

  // Staff/Admin side
  getCanteenRequests: (params) => api.get('/api/event-catering/requests/canteen', { params }),
  updateQuote: (requestId, payload) => api.patch(`/api/event-catering/requests/${requestId}/quote`, payload),
  updateStatus: (requestId, status, reason = '') => api.patch(`/api/event-catering/requests/${requestId}/status`, { status, reason }),
  updatePayment: (requestId, payload) => api.patch(`/api/event-catering/requests/${requestId}/payment`, payload),
  verifyPaymentSubmission: (requestId, payload) => api.patch(`/api/event-catering/requests/${requestId}/payment/verify`, payload),
  createPaymentPortal: (requestId) => api.post(`/api/event-catering/requests/${requestId}/payment/portal`),
  confirmPaymentPortal: (requestId, sessionId) => api.post(`/api/event-catering/requests/${requestId}/payment/portal/confirm`, { sessionId }),
  createStripeIntent: (requestId) => api.post(`/api/event-catering/requests/${requestId}/payment/stripe/create-intent`),
  confirmStripePayment: (requestId, paymentIntentId) => api.post(`/api/event-catering/requests/${requestId}/payment/stripe/confirm`, { paymentIntentId }),
  uploadReceipt: (requestId, formData) => api.post(`/api/event-catering/requests/${requestId}/payment/receipt`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),

  // Package management
  getPackages: (params) => api.get('/api/event-catering/packages', { params }),
  createPackage: (payload) => api.post('/api/event-catering/packages', payload),
  updatePackage: (packageId, payload) => api.patch(`/api/event-catering/packages/${packageId}`, payload),
};

// ── Support / Help / Tickets ───────────────────────────────────────────────
export const supportAPI = {
  getHelpContent: (params = {}) => api.get('/api/support/help', { params }),
  getTickets: (params = {}) => api.get('/api/support/tickets', { params }),
  createTicket: (payload) => api.post('/api/support/tickets', payload),
  getTicketById: (ticketId) => api.get(`/api/support/tickets/${ticketId}`),
  addTicketMessage: (ticketId, payload) => api.post(`/api/support/tickets/${ticketId}/messages`, payload),
  updateTicketStatus: (ticketId, payload) => api.patch(`/api/support/tickets/${ticketId}/status`, payload),
  chatSupport: (payload) => api.post('/api/support/chat', payload),
  broadcastStaffNotification: (payload) => api.post('/api/support/notify-staff', payload),
};

// ── Reviews ──────────────────────────────────────────────────────────────────
export const reviewAPI = {
  create: (data) => api.post('/api/reviews', data),
  getByTarget: (type, targetId) => api.get(`/api/reviews/${type}/${targetId}`),
  getAll: (params) => api.get('/api/reviews', { params }),
};

export default api;
