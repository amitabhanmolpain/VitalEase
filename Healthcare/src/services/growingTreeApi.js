import apiClient from './api';

export const growingTreeAPI = {
  getState: async () => {
    const response = await apiClient.get('/growing-tree/state');
    return response.data;
  },
  generateTasks: async (playerStatement) => {
    const response = await apiClient.post('/growing-tree/generate-tasks', { player_statement: playerStatement });
    return response.data;
  },
  completeTask: async (taskId) => {
    const response = await apiClient.post('/growing-tree/complete-task', { task_id: taskId });
    return response.data;
  }
};
