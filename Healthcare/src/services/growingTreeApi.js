import apiClient from './api';

export const growingTreeAPI = {
  getState: async () => {
    const response = await apiClient.get('/growing-tree/state');
    return response.data;
  },
  shareMood: async (mood) => {
    const response = await apiClient.post('/growing-tree/share-mood', { mood });
    return response.data;
  },
  completeTask: async (outcome) => {
    const response = await apiClient.post('/growing-tree/complete-task', { outcome });
    return response.data;
  }
};
