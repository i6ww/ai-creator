<script setup>
import { ref } from 'vue';
import { generateImage as apiGenerateImage } from '../api';

const prompt = ref('');
const imageUrl = ref('');
const isLoading = ref(false);
const error = ref('');

const generateImage = async () => {
  if (!prompt.value.trim()) return;
  
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
        imageUrl.value = imageData.url;
      } 
      else {
        throw new Error('无法解析图像数据');
      }
    } else if (response.choices && response.choices[0] && response.choices[0].message && response.choices[0].message.content) {
      console.log('使用聊天格式:', response.choices[0].message.content);
      imageUrl.value = response.choices[0].message.content;
    } else if (response.url) {
      console.log('使用直接URL格式:', response.url);
      imageUrl.value = response.url;
    } else if (typeof response === 'string') {
      console.log('使用字符串格式:', response);
      imageUrl.value = response;
    } else {
      throw new Error('无法解析图像URL');
    }
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
        <span v-if="isLoading" class="btn-content">
          <span class="spinner"></span>
          创作中...
        </span>
        <span v-else class="btn-content">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
          开始创作
        </span>
      </button>
    </div>
    
    <Transition name="fade">
      <div v-if="imageUrl || error" class="result-section">
        <div class="result-header">
          <h4>{{ error ? '生成失败' : '创作完成' }}</h4>
          <button @click="clearResult" class="clear-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
        
        <div v-if="error" class="error-message">
          <span class="error-icon">⚠️</span>
          {{ error }}
        </div>
        
        <div v-else class="image-result">
          <div class="image-container">
            <img :src="imageUrl" alt="生成的图像" />
            <div class="image-overlay">
              <div class="overlay-buttons">
                <a :href="imageUrl" target="_blank" class="overlay-btn">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                    <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                  </svg>
                  查看原图
                </a>
                <button @click="downloadImage" class="overlay-btn download-btn">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  下载图片
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.generator-wrapper {
  background: var(--card-bg);
  backdrop-filter: blur(20px);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-card);
}

.generator-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px;
  background: rgba(255, 255, 255, 0.03);
  border-bottom: 1px solid var(--card-border);
}

.header-icon {
  font-size: 2.5em;
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--secondary-gradient);
  border-radius: var(--radius-md);
}

.header-info h3 {
  font-size: 1.3em;
  font-weight: 600;
  margin-bottom: 4px;
}

.header-info p {
  color: var(--text-muted);
  font-size: 14px;
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
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: 10px;
}

.label-icon {
  font-size: 1.2em;
}

.prompt-input {
  width: 100%;
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: 15px;
  line-height: 1.6;
  resize: vertical;
  min-height: 120px;
  transition: var(--transition);
  font-family: inherit;
}

.prompt-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
}

.prompt-input::placeholder {
  color: var(--text-muted);
}

.prompt-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.prompt-tips {
  margin-top: 10px;
}

.tip {
  font-size: 13px;
  color: var(--text-muted);
}

.generate-btn {
  width: 100%;
  padding: 16px 24px;
  background: var(--secondary-gradient);
  border: none;
  border-radius: var(--radius-md);
  color: white;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition);
  box-shadow: 0 4px 15px rgba(240, 147, 251, 0.4);
}

.generate-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(240, 147, 251, 0.6);
}

.generate-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.result-section {
  margin: 0 24px 24px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-md);
  animation: fadeIn 0.4s ease;
}

.result-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.result-header h4 {
  font-size: 1em;
  font-weight: 600;
}

.clear-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  cursor: pointer;
  transition: var(--transition);
}

.clear-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  color: var(--text-primary);
}

.error-message {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: var(--radius-md);
  color: #ef4444;
}

.error-icon {
  font-size: 1.2em;
}

.image-result {
  border-radius: var(--radius-md);
  overflow: hidden;
}

.image-container {
  position: relative;
  background: rgba(0, 0, 0, 0.3);
  border-radius: var(--radius-md);
  overflow: hidden;
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
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.image-container:hover .image-overlay {
  opacity: 1;
}

.overlay-buttons {
  display: flex;
  gap: 12px;
}

.overlay-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: white;
  border: none;
  border-radius: var(--radius-md);
  color: #333;
  font-weight: 500;
  font-size: 14px;
  text-decoration: none;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.overlay-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
}

.download-btn {
  background: var(--secondary-gradient);
  color: white;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

/* Responsive */
@media (max-width: 640px) {
  .generator-header {
    padding: 20px;
  }
  
  .generator-body {
    padding: 20px;
  }
  
  .result-section {
    margin: 0 20px 20px;
  }
}
</style>