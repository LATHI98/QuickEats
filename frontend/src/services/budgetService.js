import api from './api';

const budgetService = {
  getBudget: async () => {
    const response = await api.get('/api/budgets/my');
    return response.data;
  },
  setBudget: async (budgetData) => {
    const response = await api.post('/api/budgets', budgetData);
    return response.data;
  }
};

export default budgetService;
