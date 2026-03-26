import api from './api';

const expenseService = {
  getExpenses: async () => {
    const response = await api.get('/api/expenses/my');
    return response.data;
  },
  createExpense: async (expenseData) => {
    const response = await api.post('/api/expenses', expenseData);
    return response.data;
  },
  deleteExpense: async (id) => {
    const response = await api.delete(`/api/expenses/${id}`);
    return response.data;
  }
};

export default expenseService;
