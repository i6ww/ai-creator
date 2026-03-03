<script setup>
import { ref, inject } from 'vue';
import { generateImage as apiGenerateImage } from '../api';
import { generateHistory } from '../utils/auth';

const user = inject('user');
const openAuth = inject('openAuth');

const prompt = ref('');
const imageUrl = ref('');
const isLoading = ref(false);
const error = ref('');

const generateImage = async () => {
  if (!prompt.value.trim()) return;
  
  if (!user.value) {
    openAuth();
    return;
  }
  
  isLoading.value = true;
  imageUrl.value = '';
  error.value = '';
  
  try {
    const response = await apiGenerateImage(prompt.value, 1, '1024x1024', 'url');
    console.log('图像生成响应完整结构:', response);
    
    // 检查不同可能的返回结构
    if (response.data && response.data[0]) {
      const imageData = response.data[0];
      
      // 检查是否有base64编码的图像数据
      if (imageData.b64_json) {
        console.log('使用base64格式');
        imageUrl.value = `data:image/png;base64,${imageData.b64_json}`;
      } 
      // 检查是否有URL
      else if (imageData.url) {
        console.log('使用URL格式:', imageData.url);
        imageUrl.value = imageData.url.replace(/https:\/\/grok2api-xings-projects-3a939220\.vercel\.app/g, 'https://www.371181668.xyz');
      } 
      else {
        throw new Error('无法解析图像数据');
      }
    } else if (response.choices && response.choices[0] && response.choices[0].message && response.choices[0].message.content) {
      console.log('使用聊天格式:', response.choices[0].message.content);
      imageUrl.value = response.choices[0].message.content.replace(/https:\/\/grok2api-xings-projects-3a939220\.vercel\.app/g, 'https://www.371181668.xyz');
    } else if (response.url) {
      console.log('使用直接URL格式:', response.url);
      imageUrl.value = response.url.replace(/https:\/\/grok2api-xings-projects-3a939220\.vercel\.app/g, 'https://www.371181668.xyz');
    } else if (typeof response === 'string') {
      console.log('使用字符串格式:', response);
      imageUrl.value = response.replace(/https:\/\/grok2api-xings-projects-3a939220\.vercel\.app/g, 'https://www.371181668.xyz');
    } else {
      throw new Error('无法解析图像URL');
    }
    
    generateHistory.add({
      type: 'image',
      prompt: prompt.value,
      url: imageUrl.value
    });
  } catch (err) {
    console.error('图像生成失败:', err);
    error.value = '图像生成失败，请稍后重试。';
  } finally {
    isLoading.value = false;
  }
};

const clearResult = () => {
  imageUrl.value = '';
  error.value = '';
};

const downloadImage = () => {
  if (!imageUrl.value) return;
  
  const link = document.createElement('a');
  link.href = imageUrl.value;
  link.download = `ai-generated-image-${Date.now()}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
</script>

<template>
  <div class="generator-wrapper">
    <div class="generator-header">
      <div class="header-icon">🎨</div>
      <div class="header-info">
        <h3>AI 图像生成</h3>
        <p>输入描述，让 AI 为您创作精美图像</p>
      </div>
    </div>
    
    <div class="generator-body">
      <div class="input-section">
        <label class="input-label">
          <span class="label-icon">✨</span>
          图像描述
        </label>
        <textarea 
          v-model="prompt"
          placeholder="描述您想要生成的图像，例如：一只在太空漂浮的猫，周围环绕着星星和星云..."
          rows="4"
          :disabled="isLoading"
          class="prompt-input"
        ></textarea>
        <div class="prompt-tips">
          <span class="tip">💡 提示：描述越详细，生成的图像效果越好</span>
        </div>
      </div>
      
      <button 
        @click="generateImage" 
        :disabled="isLoading || !prompt.trim()"
        class="generate-btn"
      >
        <span v-if="isLoading" class="spinner"></span>
        <span v-else>✨ 生成图像</span>
      </button>
      
      <div v-if="imageUrl || error" class="result-section">
        <div v-if="error" class="error-message">
          {{ error }}
        </div>
        <div v-else class="image-result">
          <div class="image-container">
            <img :src="imageUrl" alt="生成的图像" />
            <div class="image-overlay">
              <a :href="imageUrl" target="_blank" class="overlay-btn">
                🔍 查看原图
              </a>
              <button @click="downloadImage" class="overlay-btn">
                ⬇️ 下载图片
              </button>
            </div>
          </div>
        </div>
        <button @click="clearResult" class="clear-btn">
          🗑️ 清除结果
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.generator-wrapper {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  overflow: hidden;
}

.generator-header {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.3) 0%, rgba(139, 92, 246, 0.3) 100%);
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-icon {
  font-size: 32px;
  background: rgba(255, 255, 255, 0.2);
  width: 56px;
  height: 56px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
}

.header-info h3 {
  margin: 0;
  font-size: 1.4rem;
  font-weight: 600;
  color: white;
}

.header-info p {
  margin: 4px 0 0 0;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.7);
}

.generator-body {
  padding: 24px;
}

.input-section {
  margin-bottom: 20px;
}

.input-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1rem;
  font-weight: 500;
  color: white;
  margin-bottom: 12px;
}

.label-icon {
  font-size: 1.2rem;
}

.prompt-input {
  width: 100%;
  padding: 16px;
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.2);
  color: white;
  font-size: 1rem;
  line-height: 1.6;
  resize: vertical;
  transition: all 0.3s ease;
}

.prompt-input:focus {
  outline: none;
  border-color: rgba(99, 102, 241, 0.5);
  background: rgba(0, 0, 0, 0.3);
}

.prompt-input::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

.prompt-tips {
  margin-top: 8px;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.tip {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.6);
  background: rgba(255, 255, 255, 0.05);
  padding: 6px 12px;
  border-radius: 20px;
}

.generate-btn {
  width: 100%;
  padding: 16px 32px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3);
}

.generate-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
}

.generate-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.result-section {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.error-message {
  background: rgba(239, 68, 68, 0.2);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #fecaca;
  padding: 16px;
  border-radius: 12px;
  text-align: center;
}

.image-result {
  margin-bottom: 16px;
}

.image-container {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.2);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.image-container img {
  width: 100%;
  height: auto;
  display: block;
  transition: transform 0.3s ease;
}

.image-container:hover img {
  transform: scale(1.02);
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.image-container:hover .image-overlay {
  opacity: 1;
}

.overlay-btn {
  padding: 10px 20px;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  text-decoration: none;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.overlay-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
}

.clear-btn {
  width: 100%;
  padding: 12px 24px;
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.clear-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  color: white;
}
</style>