import apiClient from './api';

export const reframeAPI = {
  getDistortionTypes: async () => {
    const response = await apiClient.get('/reframe-game/distortion-types');
    return response.data;
  },
  
  judgeReframe: async ({ distortion_type, monster_statement, player_reframe }) => {
    const response = await apiClient.post('/reframe-game/judge-reframe', {
      distortion_type,
      monster_statement,
      player_reframe
    });
    return response.data;
  },

  speak: async (text, description = "") => {
    const response = await apiClient.post('/reframe-game/speak', { text, description }, { responseType: 'blob' });
    return response.data;
  },

  respondAffirmation: async (player_statement, session_id = "") => {
    const response = await apiClient.post('/affirmation-room/respond', { player_statement, session_id });
    return response.data;
  },

  respondReceptionist: async (player_statement) => {
    const response = await apiClient.post('/reframe-game/receptionist-respond', { player_statement });
    return response.data;
  }
};
