import axios from 'axios';
import { getNewApiUserId, getAccessToken } from './utils/auth';

const isDev = import.meta.env.DEV;
const API_BASE_URL = isDev ? '' : 'https://xycm.site';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const getApiKey = () => {
  return localStorage.getItem('api_key') || '';
};

api.interceptors.request.use((config) => {
  const userId = getNewApiUserId();
  if (userId) {
    config.headers['New-Api-User'] = String(userId);
  }
  
  if (config.url.startsWith('/v1')) {
    const apiKey = getApiKey();
    if (apiKey) {
      config.headers['Authorization'] = `Bearer ${apiKey}`;
    }
  } else {
    const token = getAccessToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return config;
});

export const setApiKey = (key) => {
  localStorage.setItem('api_key', key);
};

export const loginToNewApi = async (username, password) => {
  try {
    const url = '/api/user/login';
    const response = await api.post(url, {
      username,
      password
    });
    console.log('登录响应状态:', response.status);
    console.log('登录响应头:', response.headers);
    console.log('登录响应数据:', response.data);
    
    return response;
  } catch (error) {
    console.error('登录失败:', error);
    console.error('登录错误状态:', error.response?.status);
    console.error('登录错误响应:', error.response?.data);
    console.error('登录错误消息:', error.message);
    throw error;
  }
};

export const generateAccessToken = async () => {
  try {
    const url = '/api/user/token';
    const response = await api.get(url);
    console.log('生成访问令牌完整响应:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('生成访问令牌失败:', error);
    console.error('生成访问令牌错误详情:', error.response?.data);
    throw error;
  }
};

export const fetchTokens = async () => {
  try {
    const url = '/api/token/';
    const response = await api.get(url);
    console.log('令牌列表响应:', response.data);
    return response.data;
  } catch (error) {
    console.error('获取令牌列表失败:', error);
    console.error('获取令牌错误详情:', error.response?.data);
    throw error;
  }
};

export const generateImage = async (prompt, model, n = 1, size = '1024x1024', responseFormat = 'url') => {
  try {
    const url = '/v1/images/generations';
    const response = await api.post(url, {
      model,
      prompt,
      n,
      size,
      response_format: responseFormat
    });
    return response.data;
  } catch (error) {
    console.error('图像生成API调用失败:', error);
    console.error('错误详情:', JSON.stringify(error.response?.data, null, 2));
    console.error('错误状态:', error.response?.status);
    console.error('错误头:', error.response?.headers);
    throw error;
  }
};

const imageUrlToBase64 = (imageUrl) => {
  return new Promise((resolve, reject) => {
    if (imageUrl.startsWith('data:')) {
      resolve(imageUrl);
      return;
    }
    
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const base64 = canvas.toDataURL('image/png');
      resolve(base64);
    };
    img.onerror = reject;
    img.src = imageUrl;
  });
};

export const generateImageFromImage = async (imageUrls, prompt, model, n = 1) => {
  try {
    const url = '/v1/chat/completions';
    
    const content = [
      { type: 'text', text: prompt }
    ];
    
    for (const imgUrl of imageUrls) {
      const base64Url = await imageUrlToBase64(imgUrl);
      content.push({
        type: 'image_url',
        image_url: { url: base64Url }
      });
    }
    
    const response = await api.post(url, {
      model,
      messages: [{
        role: 'user',
        content
      }]
    });
    console.log('图生图API响应:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('图生图API调用失败:', error);
    console.error('错误详情:', JSON.stringify(error.response?.data, null, 2));
    throw error;
  }
};

export default api;
