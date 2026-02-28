<script setup>
import { ref, onMounted, provide } from 'vue';
import ChatComponent from './components/ChatComponent.vue';
import ImageGenerator from './components/ImageGenerator.vue';
import VideoGenerator from './components/VideoGenerator.vue';
import UserMenu from './components/UserMenu.vue';
import AuthModal from './components/AuthModal.vue';
import HistoryPanel from './components/HistoryPanel.vue';
import { getUser, isLoggedIn } from './utils/auth';

const activeTab = ref('chat');
const user = ref(null);
const showAuthModal = ref(false);
const showHistory = ref(false);

const tabs = [
  { id: 'chat', label: '聊天对话', icon: '💬' },
  { id: 'image', label: '图像生成', icon: '🎨' },
  { id: 'video', label: '视频生成', icon: '🎬' }
];

onMounted(() => {
  user.value = getUser();
});

const handleLogin = (userData) => {
  user.value = userData;
};

const handleOpenAuth = () => {
  showAuthModal.value = true;
};

const handleOpenHistory = () => {
  showHistory.value = true;
};

provide('user', user);
provide('openAuth', handleOpenAuth);
</script>

<template>
  <div class="app-wrapper">
    <header class="app-header">
      <div class="header-content">
        <div class="logo">
          <span class="logo-icon">✨</span>
          <h1 class="gradient-text">秃头邢AI创作平台</h1>
        </div>
        <p class="header-subtitle">基于 Grok2API 的智能创作助手</p>
      </div>
      <UserMenu class="user-menu" @login="handleLogin" @openAuth="handleOpenAuth" @openHistory="handleOpenHistory" />
    </header>
    
    <nav class="app-nav">
      <div class="nav-container">
        <button 
          v-for="tab in tabs"
          :key="tab.id"
          :class="['nav-btn', { active: activeTab === tab.id }]"
          @click="activeTab = tab.id"
        >
          <span class="nav-icon">{{ tab.icon }}</span>
          <span class="nav-label">{{ tab.label }}</span>
        </button>
      </div>
    </nav>
    
    <main class="app-content">
      <div class="content-wrapper">
        <Transition name="fade" mode="out-in">
          <ChatComponent v-if="activeTab === 'chat'" key="chat" />
          <ImageGenerator v-else-if="activeTab === 'image'" key="image" />
          <VideoGenerator v-else-if="activeTab === 'video'" key="video" />
        </Transition>
      </div>
    </main>
    
    <footer class="app-footer">
      <p>Powered by Grok2API & Vue 3</p>
    </footer>
    
    <AuthModal v-model:isOpen="showAuthModal" @login="handleLogin" />
    <HistoryPanel v-model:isOpen="showHistory" />
  </div>
</template>

<style scoped>
.app-wrapper {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  padding: 40px 20px 30px;
  text-align: center;
  position: relative;
}

.header-content {
  max-width: 600px;
  margin: 0 auto;
}

.user-menu {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 100;
}

.logo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 12px;
}

.logo-icon {
  font-size: 2.5em;
  animation: float 3s ease-in-out infinite;
}

.logo h1 {
  font-size: 2.8em;
  font-weight: 700;
  letter-spacing: -1px;
}

.header-subtitle {
  color: var(--text-secondary);
  font-size: 1.1em;
  font-weight: 400;
}

.app-nav {
  padding: 0 20px 30px;
}

.nav-container {
  display: flex;
  justify-content: center;
  gap: 12px;
  max-width: 600px;
  margin: 0 auto;
  padding: 6px;
  background: var(--card-bg);
  backdrop-filter: blur(20px);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-lg);
}

.nav-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border: none;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--text-secondary);
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition);
  flex: 1;
  justify-content: center;
}

.nav-btn:hover {
  color: var(--text-primary);
  background: rgba(255, 255, 255, 0.05);
}

.nav-btn.active {
  background: var(--primary-gradient);
  color: white;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.nav-icon {
  font-size: 1.2em;
}

.app-content {
  flex: 1;
  padding: 0 20px 40px;
}

.content-wrapper {
  max-width: 1000px;
  margin: 0 auto;
}

.app-footer {
  padding: 20px;
  text-align: center;
  color: var(--text-muted);
  font-size: 14px;
  border-top: 1px solid var(--card-border);
}

/* Transition animations */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Responsive */
@media (max-width: 640px) {
  .logo h1 {
    font-size: 2em;
  }
  
  .nav-container {
    flex-direction: column;
  }
  
  .nav-btn {
    width: 100%;
  }
}
</style>