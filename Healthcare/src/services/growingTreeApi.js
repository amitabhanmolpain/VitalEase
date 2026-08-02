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
  generateTasksStream: async (playerStatement, isNewThread, onChunk, onComplete, onError) => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch('/api/growing-tree/generate-tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          player_statement: playerStatement,
          is_new_thread: isNewThread
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.msg || `Server error: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop(); // Keep last incomplete line

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const chunk = line.slice(6);
            onChunk(chunk);
          } else if (line.startsWith("event: error")) {
            const dataIndex = line.indexOf("data: ");
            if (dataIndex !== -1) {
              const errorChunk = JSON.parse(line.slice(dataIndex + 6));
              throw new Error(errorChunk.msg || "Stream error");
            }
          }
        }
      }
      onComplete();
    } catch (err) {
      onError(err);
    }
  },
  completeTask: async (taskId, taskSize) => {
    const response = await apiClient.post('/growing-tree/complete-task', { task_id: taskId, task_size: taskSize || 1 });
    return response.data;
  },
  resetTree: async () => {
    const response = await apiClient.post('/growing-tree/reset');
    return response.data;
  },
  transcribeAudio: async (audioBlob) => {
    const formData = new FormData();
    formData.append("audio", audioBlob, "recording.wav");
    const response = await apiClient.post('/growing-tree/transcribe', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  }
};
