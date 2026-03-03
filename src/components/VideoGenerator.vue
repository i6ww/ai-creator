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
const aspectRatio = ref('16:9');
const videoLength = ref(6);
const resolution = ref('720p');

const aspectRatios = [
  { value: '16:9', label: '16:9 宽屏', icon: '🖥️' },
  { value: '9:16', label: '9:16 竖屏', icon: '📱' },
  { value: '1:1', label: '1:1 方形', icon: '⬜' },
  { value: '2:3', label: '2:3 竖版', icon: '📸' },
  { value: '3:2', label: '3:2 横版', icon: '📷' }
];

const videoLengths = [
  { value: 6, label: '6秒' },
  { value: 10, label: '10秒' }
];

const resolutions = [
  { value: '480p', label: '480p 标清' },
  { value: '720p', label: '720p 高清' }
];

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
    const videoConfig = {
      aspect_ratio: aspectRatio.value,
      video_length: videoLength.value,
      resolution_name: resolution.value
    };

    const response = await apiGenerateVideo(prompt.value, videoConfig);
    console.log('视频生成响应完整结构:', response);
    console.log('响应类型:', typeof response);
    console.log('响应键:', Object.keys(response));
    
    // 检查不同可能的返回结构
    let content = '';
    if (response.choices && response.choices[0] && response.choices[0].message && response.choices[0].message.content) {
      console.log('使用聊天格式:', response.choices[0].message.content);
      content = response.choices[0].message.content;
    } else if (response.data && response.data[0] && response.data[0].url) {
      console.log('使用标准格式:', response.data[0].url);
      content = response.data[0].url;
    } else if (response.url) {
      console.log('使用直接URL格式:', response.url);
      content = response.url;
    } else if (typeof response === 'string') {
      console.log('使用字符串格式:', response);
      content = response;
    } else {
      // 尝试将整个响应转换为字符串
      const responseStr = JSON.stringify(response);
      console.log('响应字符串:', responseStr);
      
      // 尝试从响应中提取URL
      const urlMatch = responseStr.match(/https?:\/\/[^"\']+/);
      if (urlMatch) {
        console.log('从响应中提取URL:', urlMatch[0]);
        content = urlMatch[0];
      } else {
        throw new Error('无法解析视频URL');
      }
    }
    
    // 将Vercel API地址替换为相对路径，以便通过代理访问
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
          placeholder="描述您想要生成的视频场景，例如：一只猫在太空漂浮，周围环绕着星星和星云..."
          rows="4"
          :disabled="isLoading"
          class="prompt-input"
        ></textarea>
      </div>

      <div class="config-section">
        <label class="input-label">
          <span class="label-icon">⚙️</span>
          视频设置
        </label>

        <div class="config-grid">
          <div class="config-group">
            <span class="config-label">宽高比</span>
            <div class="ratio-options">
              <button
                v-for="ratio in aspectRatios"
                :key="ratio.value"
                :class="['ratio-btn', { active: aspectRatio === ratio.value }]"
                @click="aspectRatio = ratio.value"
                :disabled="isLoading"
              >
                <span class="ratio-icon">{{ ratio.icon }}</span>
                <span class="ratio-text">{{ ratio.label }}</span>
              </button>
            </div>
          </div>

          <div class="config-row">
            <div class="config-group half">
              <span class="config-label">时长</span>
              <div class="option-buttons">
                <button
                  v-for="length in videoLengths"
                  :key="length.value"
                  :class="['option-btn', { active: videoLength === length.value }]"
                  @click="videoLength = length.value"
                  :disabled="isLoading"
                >
                  {{ length.label }}
                </button>
              </div>
            </div>

            <div class="config-group half">
              <span class="config-label">分辨率</span>
              <div class="option-buttons">
                <button
                  v-for="res in resolutions"
                  :key="res.value"
                  :class="['option-btn', { active: resolution === res.value }]"
                  @click="resolution = res.value"
                  :disabled="isLoading"
                >
                  {{ res.label }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <button
        @click="generateVideo"
        :disabled="isLoading || !prompt.trim()"
        class="generate-btn"
      >
        <span v-if="isLoading" class="btn-content">
          <span class="spinner"></span>
          创作中...
        </span>
        <span v-else class="btn-content">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="5 3 19 12 5 21 5 3"></polygon>
          </svg>
          开始创作
        </span>
      </button>
    </div>

    <Transition name="fade">
      <div v-if="videoUrl || error" class="result-section">
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

        <div v-else class="video-result">
          <div v-if="videoUrl.includes('http')" class="video-container">
            <video :src="videoUrl" controls class="generated-video"></video>
          </div>
          <div v-else class="video-html" v-html="videoUrl"></div>
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
  background: var(--accent-gradient);
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
  margin-bottom: 24px;
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
  min-height: 100px;
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

.config-section {
  margin-bottom: 24px;
}

.config-grid {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.config-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.config-group.half {
  flex: 1;
}

.config-row {
  display: flex;
  gap: 20px;
}

.config-label {
  font-size: 13px;
  color: var(--text-muted);
  font-weight: 500;
}

.ratio-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 10px;
}

.ratio-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 14px 10px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  cursor: pointer;
  transition: var(--transition);
}

.ratio-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(102, 126, 234, 0.5);
}

.ratio-btn.active {
  background: rgba(102, 126, 234, 0.2);
  border-color: #667eea;
  color: var(--text-primary);
}

.ratio-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.ratio-icon {
  font-size: 1.5em;
}

.ratio-text {
  font-size: 12px;
  font-weight: 500;
}

.option-buttons {
  display: flex;
  gap: 8px;
}

.option-btn {
  flex: 1;
  padding: 10px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  font-size: 13px;
  cursor: pointer;
  transition: var(--transition);
}

.option-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
}

.option-btn.active {
  background: rgba(102, 126, 234, 0.2);
  border-color: #667eea;
  color: var(--text-primary);
}

.option-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.generate-btn {
  width: 100%;
  padding: 16px 24px;
  background: var(--accent-gradient);
  border: none;
  border-radius: var(--radius-md);
  color: white;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition);
  box-shadow: 0 4px 15px rgba(79, 172, 254, 0.4);
}

.generate-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(79, 172, 254, 0.6);
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

.video-result {
  border-radius: var(--radius-md);
  overflow: hidden;
}

.video-container {
  background: rgba(0, 0, 0, 0.5);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.generated-video {
  width: 100%;
  max-height: 500px;
  display: block;
}

.video-html {
  padding: 20px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: var(--radius-md);
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

  .config-row {
    flex-direction: column;
  }

  .ratio-options {
    grid-template-columns: repeat(3, 1fr);
  }

  .result-section {
    margin: 0 20px 20px;
  }
}
</style>