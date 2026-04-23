import api from './api';

const budgetService = {
  getBudget: async () => {
    const response = await api.get('/api/budgets/my');
    return response.data;
  },
  setBudget: async (budgetData) => {
    const response = await api.post('/api/budgets', budgetData);
    return response.data;
  },
  archiveBudget: async () => {
    const response = await api.post('/api/budgets/archive');
    return response.data;
  },
  getBudgetHistory: async () => {
    const response = await api.get('/api/budgets/history');
    return response.data;
  },
  deleteBudgetHistory: async (id) => {
    const response = await api.delete(`/api/budgets/history/${id}`);
    return response.data;
  }
};


export default budgetService;
