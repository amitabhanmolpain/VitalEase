import axios from 'axios';

const API_BASE_URL = '/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

apiClient.interceptors.request.use(
  (config) => {
    // Try both 'authToken' and 'token' for compatibility
    const token = localStorage.getItem('authToken') || localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const statsAPI = {
  async getStats() {
    const response = await apiClient.get('/stats');
    return response.data;
  },
  async updateStats({ game, win, xp }) {
    const response = await apiClient.post('/stats/update', { game, win, xp });
    return response.data;
  },
  async getAchievements() {
    const response = await apiClient.get('/stats/achievements');
    return response.data;
  },
  async getBadges() {
    const response = await apiClient.get('/stats/badges');
    return response.data;
  },
  async resetGameStats(game) {
    const response = await apiClient.post('/stats/reset-game', { game });
    return response.data;
  }
};
