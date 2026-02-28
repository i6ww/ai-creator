<script setup>
import { ref } from 'vue';
import ChatComponent from './components/ChatComponent.vue';
import ImageGenerator from './components/ImageGenerator.vue';
import VideoGenerator from './components/VideoGenerator.vue';

const activeTab = ref('chat');
</script>

<template>
  <div class="app-container">
    <header class="app-header">
      <h1>AI创作平台</h1>
    </header>
    
    <nav class="app-nav">
      <button 
        :class="{ active: activeTab === 'chat' }" 
        @click="activeTab = 'chat'"
      >
        聊天对话
      </button>
      <button 
        :class="{ active: activeTab === 'image' }" 
        @click="activeTab = 'image'"
      >
        图像生成
      </button>
      <button 
        :class="{ active: activeTab === 'video' }" 
        @click="activeTab = 'video'"
      >
        视频生成
      </button>
    </nav>
    
    <main class="app-content">
      <ChatComponent v-if="activeTab === 'chat'" />
      <ImageGenerator v-else-if="activeTab === 'image'" />
      <VideoGenerator v-else-if="activeTab === 'video'" />
    </main>
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: Arial, sans-serif;
  background-color: #f5f5f5;
}

.app-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.app-header {
  text-align: center;
  margin-bottom: 30px;
}

.app-header h1 {
  color: #333;
  font-size: 2.5em;
}

.app-nav {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-bottom: 30px;
}

.app-nav button {
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  background-color: #e0e0e0;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.3s ease;
}

.app-nav button:hover {
  background-color: #d0d0d0;
}

.app-nav button.active {
  background-color: #4CAF50;
  color: white;
}

.app-content {
  background-color: white;
  border-radius: 10px;
  padding: 30px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}
</style>
