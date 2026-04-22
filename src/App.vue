<script setup>
import { ref, onMounted, provide } from 'vue';
import ImageGenerator from './components/ImageGenerator.vue';
import UserMenu from './components/UserMenu.vue';
import AuthModal from './components/AuthModal.vue';
import HistoryPanel from './components/HistoryPanel.vue';
import { getUser, isLoggedIn } from './utils/auth';

const user = ref(null);
const showAuthModal = ref(false);
const showHistory = ref(false);

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
        <p class="header-subtitle">基于 Grok2API 的智能图像创作平台</p>
      </div>
      <UserMenu class="user-menu" @login="handleLogin" @openAuth="handleOpenAuth" @openHistory="handleOpenHistory" />
    </header>
    
    <main class="app-content">
      <div class="content-wrapper">
        <ImageGenerator />
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

/* Responsive */
@media (max-width: 640px) {
  .logo h1 {
    font-size: 2em;
  }
}
</style>