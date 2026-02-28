<script setup>
import { ref } from 'vue';
import { chatCompletion } from '../api';

const messages = ref([
  { role: 'assistant', content: '你好！我是AI助手，有什么可以帮助你的吗？' }
]);
const inputMessage = ref('');
const isLoading = ref(false);

const sendMessage = async () => {
  if (!inputMessage.value.trim()) return;
  
  // 添加用户消息
  messages.value.push({ role: 'user', content: inputMessage.value });
  const userMessage = inputMessage.value;
  inputMessage.value = '';
  
  isLoading.value = true;
  
  try {
    const response = await chatCompletion(messages.value, 'grok-4', false);
    
    // 添加助手回复
    messages.value.push({
      role: 'assistant',
      content: response.choices[0].message.content
    });
  } catch (error) {
    console.error('API调用失败:', error);
    messages.value.push({
      role: 'assistant',
      content: '抱歉，API调用失败，请稍后重试。'
    });
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="chat-container">
    <div class="chat-messages">
      <div 
        v-for="(msg, index) in messages" 
        :key="index"
        :class="['message', msg.role === 'user' ? 'user-message' : 'assistant-message']"
      >
        <div class="message-content">{{ msg.content }}</div>
      </div>
      <div v-if="isLoading" class="loading">正在思考...</div>
    </div>
    <div class="chat-input">
      <input 
        type="text" 
        v-model="inputMessage"
        placeholder="输入消息..."
        @keyup.enter="sendMessage"
      />
      <button @click="sendMessage" :disabled="isLoading">发送</button>
    </div>
  </div>
</template>

<style scoped>
.chat-container {
  display: flex;
  flex-direction: column;
  height: 600px;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
  margin-bottom: 20px;
}

.message {
  margin-bottom: 15px;
  max-width: 80%;
  padding: 10px 15px;
  border-radius: 18px;
}

.user-message {
  align-self: flex-end;
  background-color: #DCF8C6;
  margin-left: auto;
  border-bottom-right-radius: 4px;
}

.assistant-message {
  align-self: flex-start;
  background-color: #F1F0F0;
  margin-right: auto;
  border-bottom-left-radius: 4px;
}

.loading {
  text-align: center;
  color: #888;
  font-style: italic;
  margin: 10px 0;
}

.chat-input {
  display: flex;
  gap: 10px;
}

.chat-input input {
  flex: 1;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 20px;
  font-size: 16px;
}

.chat-input button {
  padding: 0 20px;
  border: none;
  border-radius: 20px;
  background-color: #4CAF50;
  color: white;
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.3s ease;
}

.chat-input button:hover {
  background-color: #45a049;
}

.chat-input button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}
</style>