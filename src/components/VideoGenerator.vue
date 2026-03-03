<script setup>
import { ref, inject } from 'vue';
import { generateVideo as apiGenerateVideo } from '../api';
import { generateHistory } from '../utils/auth';

const user = inject('user');
const openAuth = inject('openAuth');

const prompt = ref('');
const videoUrl = ref('');
const isLoading = ref(false);
const error = ref('');
const duration = ref(5);
const aspectRatio = ref('16:9');

const generateVideo = async () => {
  if (!prompt.value.trim()) return;
  
  if (!user.value) {
    openAuth();
    return;
  }
  
  isLoading.value = true;
  videoUrl.value = '';
  error.value = '';
  
  try {
    const response = await apiGenerateVideo(prompt.value, duration.value, aspectRatio.value);
    console.log('视频生成响应完整结构:', response);
    console.log('响应类型:', typeof response);
    console.log('响应键:', Object.keys(response));
    
    let content = '';
    
    // 检查不同可能的返回结构
    if (response.choices && response.choices[0] && response.choices[0].message && response.choices[0].message.content) {
      console.log('使用聊天格式:', response.choices[0].message.content);
      content = response.choices[0].message.content;
    } else if (typeof response === 'string') {
      console.log('使用字符串格式:', response);
      content = response;
    } else {
      throw new Error('无法解析视频URL');
    }
    
    // 从HTML内容中提取视频URL
    const urlMatch = content.match(/https:\/\/[^\s"<>]+/);
    if (urlMatch) {
      console.log('从响应中提取URL:', urlMatch[0]);
      content = urlMatch[0];
    } else {
      throw new Error('无法解析视频URL');
    }
    
    // 将旧API地址替换为新地址
    videoUrl.value = content.replace(/https:\/\/www\.371181668\.xyz/g, 'https://www.371181668.xyz').replace(/https:\/\/grok2api-xings-projects-3a939220\.vercel\.app/g, 'https://www.371181668.xyz');
    
    generateHistory.add({
      type: 'video',
      prompt: prompt.value,
      url: videoUrl.value
    });
  } catch (err) {
    console.error('视频生成失败:', err);
    error.value = '视频生成失败，请稍后重试。';
  } finally {
    isLoading.value = false;
  }
};

const clearResult = () => {
  videoUrl.value = '';
  error.value = '';
};
</script>

<template>
  <div class="generator-wrapper">
    <div class="generator-header">
      <div class="header-icon">🎬</div>
      <div class="header-info">
        <h3>AI 视频生成</h3>
        <p>输入描述，让 AI 为您创作精彩视频</p>
      </div>
    </div>
    
    <div class="generator-body">
      <div class="input-section">
        <label class="input-label">
          <span class="label-icon">✨</span>
          视频描述
        </label>
        <textarea 
          v-model="prompt"
          placeholder="描述您想要生成的视频，例如：一只可爱的猫咪在草地上玩耍..."
          rows="4"
          :disabled="isLoading"
          class="prompt-input"
        ></textarea>
        <div class="prompt-tips">
          <span class="tip">💡 提示：描述越详细，生成的视频效果越好</span>
        </div>
      </div>
      
      <div class="config-section">
        <div class="config-item">
          <label>时长（秒）</label>
          <input 
            v-model.number="duration" 
            type="number" 
            min="5" 
            max="60"
            :disabled="isLoading"
          />
        </div>
        <div class="config-item">
          <label>宽高比</label>
          <select v-model="aspectRatio" :disabled="isLoading">
            <option value="16:9">16:9</option>
            <option value="9:16">9:16</option>
            <option value="1:1">1:1</option>
          </select>
        </div>
      </div>
      
      <button 
        @click="generateVideo" 
        :disabled="isLoading || !prompt.trim()"
        class="generate-btn"
      >
        <span v-if="isLoading" class="spinner"></span>
        <span v-else>🎬 生成视频</span>
      </button>
      
      <div v-if="videoUrl || error" class="result-section">
        <div v-if="error" class="error-message">
          {{ error }}
        </div>
        <div v-else class="video-result">
          <video 
            :src="videoUrl" 
            controls 
            class="video-player"
            preload="metadata"
          ></video>
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

.config-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 20px;
}

.config-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.config-item label {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
}

.config-item input,
.config-item select {
  padding: 12px;
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.2);
  color: white;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.config-item input:focus,
.config-item select:focus {
  outline: none;
  border-color: rgba(99, 102, 241, 0.5);
  background: rgba(0, 0, 0, 0.3);
}

.config-item input:disabled,
.config-item select:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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

.video-result {
  margin-bottom: 16px;
}

.video-player {
  width: 100%;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
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