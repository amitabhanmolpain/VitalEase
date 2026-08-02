import apiClient from './api';

export const growingTreeAPI = {
  getState: async () => {
    const response = await apiClient.get('/growing-tree/state');
    return response.data;
  },
  generateTasks: async (playerStatement, isNewThread = false) => {
    const response = await apiClient.post('/growing-tree/generate-tasks', {
      player_statement: playerStatement,
      is_new_thread: isNewThread
    });
    return response.data;
  },
  completeTask: async (taskId, taskSize) => {
    const response = await apiClient.post('/growing-tree/complete-task', { task_id: taskId, task_size: taskSize || 1 });
    return response.data;
  },
  resetTree: async () => {
    const response = await apiClient.post('/growing-tree/reset');
    return response.data;
  }
};
