import axios from 'axios';
import config from '../config/config';

const api = axios.create({
  baseURL: config.API_URL,
  headers: { 'Content-Type': 'application/json' },
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
  getCanteenOrders: (params) => api.get('/api/orders/canteen', { params }),
  updateOrderStatus: (orderId, status) => api.patch(`/api/orders/${orderId}/status`, { status }),
  verifyPickup: (orderId) => api.post(`/api/orders/${orderId}/pickup-verify`),
  pickupByCode: (pickupCode) => api.post('/api/orders/pickup-by-code', { pickupCode }),
};

// ── Payment ───────────────────────────────────────────────────────────────────
export const paymentAPI = {
  submitCash: (orderId) => api.post(`/api/orders/${orderId}/payment/cash`),
  createStripeIntent: (orderId) => api.post(`/api/orders/${orderId}/payment/stripe/create-intent`),
  getPaymentStatus: (orderId) => api.get(`/api/orders/${orderId}/payment`),
  verifyPayment: (orderId) => api.patch(`/api/orders/${orderId}/payment/verify`),
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
};

export default api;
