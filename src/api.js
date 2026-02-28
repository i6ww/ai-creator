import axios from 'axios';

// 开发环境使用代理，生产环境使用Cloudflare Worker作为代理
const isDev = import.meta.env.DEV;
const API_BASE_URL = isDev ? '' : 'https://xycm.site';
const API_KEY = '123456'; // API密钥

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_KEY}`
  }
});

// 聊天对话接口
export const chatCompletion = async (messages, model = 'grok-4', stream = false) => {
  try {
    const url = isDev ? '/api/v1/chat/completions' : '/v1/chat/completions';
    const response = await api.post(url, {
      model,
      messages,
      stream
    });
    return response.data;
  } catch (error) {
    console.error('聊天对话API调用失败:', error);
    console.error('错误详情:', error.response?.data);
    console.error('状态码:', error.response?.status);
    throw error;
  }
};

// 图像生成接口
export const generateImage = async (prompt, n = 1, size = '1024x1024', responseFormat = 'url') => {
  try {
    const url = isDev ? '/api/v1/images/generations' : '/v1/images/generations';
    const response = await api.post(url, {
      model: 'grok-imagine-1.0',
      prompt,
      n,
      size,
      response_format: responseFormat
    });
    return response.data;
  } catch (error) {
    console.error('图像生成API调用失败:', error);
    console.error('错误详情:', error.response?.data);
    throw error;
  }
};

// 视频生成接口
export const generateVideo = async (prompt, videoConfig) => {
  try {
    const url = isDev ? '/api/v1/chat/completions' : '/v1/chat/completions';
    const response = await api.post(url, {
      model: 'grok-imagine-1.0-video',
      messages: [{
        role: 'user',
        content: prompt
      }],
      video_config: videoConfig,
      stream: false
    });
    return response.data;
  } catch (error) {
    console.error('视频生成API调用失败:', error);
    console.error('错误详情:', error.response?.data);
    throw error;
  }
};

export default api;
