<script setup>
import { ref } from 'vue';
import { generateImage as apiGenerateImage } from '../api';

const prompt = ref('');
const imageUrl = ref('');
const isLoading = ref(false);

const generateImage = async () => {
  if (!prompt.value.trim()) return;
  
  isLoading.value = true;
  imageUrl.value = '';
  
  try {
    const response = await apiGenerateImage(prompt.value, 1, '1024x1024', 'url');
    
    imageUrl.value = response.data[0].url;
  } catch (error) {
    console.error('图像生成失败:', error);
    alert('图像生成失败，请稍后重试。');
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="image-generator">
    <h2>图像生成</h2>
    <div class="input-section">
      <textarea 
        v-model="prompt"
        placeholder="输入图像描述..."
        rows="4"
      ></textarea>
      <button @click="generateImage" :disabled="isLoading">
        {{ isLoading ? '生成中...' : '生成图像' }}
      </button>
    </div>
    <div class="result-section" v-if="imageUrl">
      <h3>生成结果</h3>
      <img :src="imageUrl" alt="生成的图像" class="generated-image" />
    </div>
  </div>
</template>

<style scoped>
.image-generator {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.image-generator h2 {
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

.generated-image {
  max-width: 100%;
  max-height: 500px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}
</style>