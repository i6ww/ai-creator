<script setup>
import { ref, nextTick, inject } from 'vue';
import { chatCompletion } from '../api';
import { generateHistory } from '../utils/auth';

const user = inject('user');
const openAuth = inject('openAuth');

const messages = ref([
  { role: 'assistant', content: '你好！我是AI助手，有什么可以帮助你的吗？' }
]);
const inputMessage = ref('');
const isLoading = ref(false);
const messagesContainer = ref(null);
const selectedModel = ref('grok-4');

const models = [
  { value: 'grok-3', label: 'Grok 3' },
  { value: 'grok-3-fast', label: 'Grok 3 Fast' },
  { value: 'grok-4', label: 'Grok 4' },
  { value: 'grok-4-mini', label: 'Grok 4 Mini' },
  { value: 'grok-4-fast', label: 'Grok 4 Fast' },
  { value: 'grok-4-heavy', label: 'Grok 4 Heavy' },
  { value: 'grok-4.1', label: 'Grok 4.1' },
  { value: 'grok-4.1-thinking', label: 'Grok 4.1 Thinking' },
  { value: 'grok-4.20-beta', label: 'Grok 4.20 Beta' }
];

const scrollToBottom = async () => {
  await nextTick();
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
};

const sendMessage = async () => {
  if (!inputMessage.value.trim() || isLoading.value) return;
  
  if (!user.value) {
    openAuth();
    return;
  }
  
  messages.value.push({ role: 'user', content: inputMessage.value });
  const userMessage = inputMessage.value;
  inputMessage.value = '';
  await scrollToBottom();
  
  isLoading.value = true;
  
  try {
    const response = await chatCompletion(messages.value, selectedModel.value, false);
    const assistantMessage = response.choices[0].message.content;
    messages.value.push({
      role: 'assistant',
      content: assistantMessage
    });
    
    generateHistory.add({
      type: 'chat',
      prompt: userMessage,
      response: assistantMessage,
      model: selectedModel.value
    });
  } catch (error) {
    console.error('API调用失败:', error);
    messages.value.push({
      role: 'assistant',
      content: '抱歉，API调用失败，请稍后重试。'
    });
  } finally {
    isLoading.value = false;
    await scrollToBottom();
  }
};
</script>

<template>
  <div class="chat-wrapper">
    <div class="chat-header">
      <div class="header-icon">💬</div>
      <div class="header-info">
        <h3>AI 助手</h3>
        <span class="status">
          <span class="status-dot"></span>
          在线
        </span>
      </div>
      <div class="model-selector">
        <select v-model="selectedModel" :disabled="isLoading">
          <option v-for="model in models" :key="model.value" :value="model.value">
            {{ model.label }}
          </option>
        </select>
      </div>
    </div>
    
    <div ref="messagesContainer" class="chat-messages">
      <TransitionGroup name="message">
        <div 
          v-for="(msg, index) in messages" 
          :key="index"
          :class="['message', msg.role === 'user' ? 'user-message' : 'assistant-message']"
        >
          <div class="message-avatar">
            {{ msg.role === 'user' ? '👤' : '🤖' }}
          </div>
          <div class="message-bubble">
            <div class="message-content">{{ msg.content }}</div>
            <div class="message-time">{{ new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) }}</div>
          </div>
        </div>
      </TransitionGroup>
      
      <div v-if="isLoading" class="typing-indicator">
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
      </div>
    </div>
    
    <div class="chat-input-area">
      <div class="input-wrapper">
        <input 
          type="text" 
          v-model="inputMessage"
          placeholder="输入消息..."
          @keyup.enter="sendMessage"
          :disabled="isLoading"
        />
        <button 
          @click="sendMessage" 
          :disabled="isLoading || !inputMessage.trim()"
          class="send-btn"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chat-wrapper {
  display: flex;
  flex-direction: column;
  height: 70vh;
  max-height: 800px;
  background: var(--card-bg);
  backdrop-filter: blur(20px);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-card);
}

.chat-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 24px;
  background: rgba(255, 255, 255, 0.03);
  border-bottom: 1px solid var(--card-border);
  justify-content: space-between;
}

.header-icon {
  font-size: 2em;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--primary-gradient);
  border-radius: var(--radius-md);
}

.header-info {
  flex: 1;
}

.header-info h3 {
  font-size: 1.1em;
  font-weight: 600;
  margin-bottom: 4px;
}

.status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--text-muted);
}

.status-dot {
  width: 8px;
  height: 8px;
  background: #10b981;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

.model-selector {
  min-width: 180px;
}

.model-selector select {
  width: 100%;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-size: 13px;
  transition: var(--transition);
  cursor: pointer;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3Csvg width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23ffffff' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
  background-size: 12px;
}

.model-selector select option {
  background: var(--dark-bg);
  color: var(--text-primary);
  padding: 8px 12px;
}

.model-selector select:hover:not(:disabled) {
  border-color: rgba(102, 126, 234, 0.5);
}

.model-selector select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
}

.model-selector select:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.message {
  display: flex;
  gap: 12px;
  animation: fadeIn 0.3s ease;
}

.user-message {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  font-size: 1.2em;
  flex-shrink: 0;
}

.message-bubble {
  max-width: 70%;
  padding: 14px 18px;
  border-radius: var(--radius-md);
  position: relative;
}

.assistant-message .message-bubble {
  background: rgba(255, 255, 255, 0.08);
  border-bottom-left-radius: 4px;
}

.user-message .message-bubble {
  background: var(--primary-gradient);
  border-bottom-right-radius: 4px;
}

.message-content {
  font-size: 15px;
  line-height: 1.6;
  word-wrap: break-word;
}

.message-time {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 6px;
  opacity: 0.7;
}

.user-message .message-time {
  color: rgba(255, 255, 255, 0.8);
}

.typing-indicator {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 18px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: var(--radius-md);
  width: fit-content;
  border-bottom-left-radius: 4px;
}

.typing-dot {
  width: 8px;
  height: 8px;
  background: var(--text-muted);
  border-radius: 50%;
  animation: typing 1.4s infinite ease-in-out both;
}

.typing-dot:nth-child(1) { animation-delay: -0.32s; }
.typing-dot:nth-child(2) { animation-delay: -0.16s; }

@keyframes typing {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.5; }
  40% { transform: scale(1); opacity: 1; }
}

.chat-input-area {
  padding: 20px 24px;
  background: rgba(255, 255, 255, 0.03);
  border-top: 1px solid var(--card-border);
}

.input-wrapper {
  display: flex;
  gap: 12px;
  align-items: center;
}

.input-wrapper input {
  flex: 1;
  padding: 14px 20px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: 15px;
  transition: var(--transition);
}

.input-wrapper input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
}

.input-wrapper input::placeholder {
  color: var(--text-muted);
}

.send-btn {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--primary-gradient);
  border: none;
  border-radius: var(--radius-md);
  color: white;
  cursor: pointer;
  transition: var(--transition);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.send-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.6);
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Message transition */
.message-enter-active,
.message-leave-active {
  transition: all 0.3s ease;
}

.message-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.message-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

/* Responsive */
@media (max-width: 640px) {
  .chat-wrapper {
    height: calc(100vh - 200px);
  }
  
  .chat-header {
    flex-wrap: wrap;
    gap: 10px;
  }
  
  .model-selector {
    min-width: 150px;
    order: 3;
    width: 100%;
  }
  
  .message-bubble {
    max-width: 85%;
  }
}
</style>