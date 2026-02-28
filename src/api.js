import axios from 'axios';

const API_BASE_URL = 'https://your-worker-name.your-account.workers.dev'; // 这里需要替换为实际的Worker URL
const API_KEY = ''; // API密钥现在由Worker处理

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 聊天对话接口
export const chatCompletion = async (messages, model = 'grok-4', stream = false) => {
  try {
    const response = await api.post('/v1/chat/completions', {
      model,
      messages,
      stream
    });
    return response.data;
  } catch (error) {
    console.error('聊天对话API调用失败:', error);
    throw error;
  }
};

// 图像生成接口
export const generateImage = async (prompt, n = 1, size = '1024x1024', responseFormat = 'url') => {
  try {
    const response = await api.post('/v1/images/generations', {
      model: 'grok-imagine-1.0',
      prompt,
      n,
      size,
      response_format: responseFormat
    });
    return response.data;
  } catch (error) {
    console.error('图像生成API调用失败:', error);
    throw error;
  }
};

// 视频生成接口
export const generateVideo = async (prompt, videoConfig) => {
  try {
    const response = await api.post('/v1/chat/completions', {
      model: 'grok-imagine-1.0-video',
      messages: [{
        role: 'user',
        content: prompt
      }],
      video_config: videoConfig
    });
    return response.data;
  } catch (error) {
    console.error('视频生成API调用失败:', error);
    throw error;
  }
};

export default api;