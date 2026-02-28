<script setup>
import { ref } from 'vue';
import { generateVideo as apiGenerateVideo } from '../api';

const prompt = ref('');
const videoUrl = ref('');
const isLoading = ref(false);
const aspectRatio = ref('16:9');
const videoLength = ref(6);
const resolution = ref('720p');

const generateVideo = async () => {
  if (!prompt.value.trim()) return;
  
  isLoading.value = true;
  videoUrl.value = '';
  
  try {
    const videoConfig = {
      aspect_ratio: aspectRatio.value,
      video_length: videoLength.value,
      resolution_name: resolution.value
    };
    
    const response = await apiGenerateVideo(prompt.value, videoConfig);
    
    // 处理视频响应
    videoUrl.value = response.choices[0].message.content;
  } catch (error) {
    console.error('视频生成失败:', error);
    alert('视频生成失败，请稍后重试。');
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="video-generator">
    <h2>视频生成</h2>
    <div class="input-section">
      <textarea 
        v-model="prompt"
        placeholder="输入视频描述..."
        rows="4"
      ></textarea>
      <div class="video-config">
        <div class="config-item">
          <label>宽高比:</label>
          <select v-model="aspectRatio">
            <option value="16:9">16:9</option>
            <option value="9:16">9:16</option>
            <option value="1:1">1:1</option>
            <option value="2:3">2:3</option>
            <option value="3:2">3:2</option>
          </select>
        </div>
        <div class="config-item">
          <label>时长:</label>
          <select v-model="videoLength">
            <option value="6">6秒</option>
            <option value="10">10秒</option>
          </select>
        </div>
        <div class="config-item">
          <label>分辨率:</label>
          <select v-model="resolution">
            <option value="480p">480p</option>
            <option value="720p">720p</option>
          </select>
        </div>
      </div>
      <button @click="generateVideo" :disabled="isLoading">
        {{ isLoading ? '生成中...' : '生成视频' }}
      </button>
    </div>
    <div class="result-section" v-if="videoUrl">
      <h3>生成结果</h3>
      <div v-if="videoUrl.includes('http')">
        <video :src="videoUrl" controls class="generated-video"></video>
      </div>
      <div v-else>
        <div v-html="videoUrl"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.video-generator {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.video-generator h2 {
  color: #333;
  margin-bottom: 10px;
}

.input-section {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

textarea {
  padding: 15px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 16px;
  resize: vertical;
  min-height: 120px;
}

.video-config {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.config-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 150px;
}

.config-item label {
  font-size: 14px;
  color: #666;
}

.config-item select {
  padding: 8px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  font-size: 14px;
}

button {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  background-color: #4CAF50;
  color: white;
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.3s ease;
  align-self: flex-start;
}

button:hover {
  background-color: #45a049;
}

button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.result-section {
  margin-top: 20px;
  padding: 20px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background-color: #f9f9f9;
}

.result-section h3 {
  color: #333;
  margin-bottom: 15px;
}

.generated-video {
  max-width: 100%;
  max-height: 500px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}
</style>