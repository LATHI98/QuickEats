import api from './api';

const purchasedPassService = {
  createPurchase: async (purchaseData) => {
    const response = await api.post('/api/purchased-passes', purchaseData);
    return response.data;
  },
  getMyPasses: async () => {
    const response = await api.get('/api/purchased-passes/my');
    return response.data;
  },
  getAllPendingPasses: async () => {
    const response = await api.get('/api/purchased-passes/pending');
    return response.data;
  },
  getAllPurchasedPasses: async () => {
    const response = await api.get('/api/purchased-passes/all');
    return response.data;
  },
  approvePass: async (id) => {
    const response = await api.put(`/api/purchased-passes/approve/${id}`);
    return response.data;
  },
  rejectPass: async (id) => {
    const response = await api.put(`/api/purchased-passes/reject/${id}`);
    return response.data;
  },
  deletePass: async (id) => {
    const response = await api.delete(`/api/purchased-passes/${id}`);
    return response.data;
  }
};

export default purchasedPassService;
