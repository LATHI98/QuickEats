import api from './api';

const mealPassService = {
  getMealPasses: async () => {
    const response = await api.get('/api/meal-passes');
    return response.data;
  },
  createMealPass: async (mealPassData) => {
    const response = await api.post('/api/meal-passes', mealPassData);
    return response.data;
  },
  updateMealPass: async (id, mealPassData) => {
    const response = await api.put(`/api/meal-passes/${id}`, mealPassData);
    return response.data;
  },
  deleteMealPass: async (id) => {
    const response = await api.delete(`/api/meal-passes/${id}`);
    return response.data;
  }
};

export default mealPassService;
