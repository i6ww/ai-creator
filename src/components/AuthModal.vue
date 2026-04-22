<script setup>
import { ref, watch, computed } from 'vue';
import { getUser, setUser, clearAllAuth, setTokensList, getTokensList, setNewApiUserId, setAccessToken } from '../utils/auth';
import { loginToNewApi, fetchTokens, setApiKey, getApiKey, generateAccessToken } from '../api';

const emit = defineEmits(['close', 'login']);

const isOpen = defineModel('isOpen', false);
const mode = ref('login');

const loginForm = ref({
  username: '',
  password: ''
});

const apiKeyInput = ref('');

const loading = ref(false);
const error = ref('');
const tokens = ref([]);
const selectedTokenId = ref(null);
const currentUser = ref(getUser());

const tokensCount = computed(() => tokens.value.length);

watch(isOpen, async (newVal) => {
  if (newVal) {
    const user = getUser();
    currentUser.value = user;
    if (user) {
      mode.value = 'profile';
      tokens.value = getTokensList();
      apiKeyInput.value = getApiKey();
      const currentToken = tokens.value.find(t => t.key === apiKeyInput.value);
      if (currentToken) {
        selectedTokenId.value = currentToken.id;
      }
    } else {
      mode.value = 'login';
    }
  }
});

const handleLogin = async () => {
  if (!loginForm.value.username || !loginForm.value.password) {
    error.value = '请填写用户名和密码';
    return;
  }

  loading.value = true;
  error.value = '';

  try {
    const loginRes = await loginToNewApi(loginForm.value.username, loginForm.value.password);
    const userId = loginRes.data.data?.id;
    if (userId) {
      setNewApiUserId(userId);
    }

    const tokenRes = await generateAccessToken();
    const accessToken = typeof tokenRes.data === 'string' ? tokenRes.data : tokenRes.data?.access_token || tokenRes.data?.token;
    if (accessToken) {
      setAccessToken(accessToken);
    }

    const tokensRes = await fetchTokens();
    const tokensList = tokensRes.data?.items || [];
    setTokensList(tokensList);
    tokens.value = tokensList;

    const enabledTokens = tokensList.filter(t => t.status === 1);
    if (enabledTokens.length > 0) {
      const firstToken = enabledTokens[0];
      selectedTokenId.value = firstToken.id;
    }

    const userData = {
      id: Date.now(),
      username: loginForm.value.username,
      avatar: loginForm.value.username.charAt(0).toUpperCase(),
      createdAt: new Date().toISOString()
    };
    setUser(userData);
    currentUser.value = userData;
    
    emit('login', userData);
    mode.value = 'profile';
    loginForm.value = { username: '', password: '' };
  } catch (err) {
    console.error('登录失败:', err);
    error.value = err.response?.data?.message || err.message || '登录失败，请检查用户名和密码';
  } finally {
    loading.value = false;
  }
};

const handleSaveApiKey = () => {
  if (apiKeyInput.value.trim()) {
    setApiKey(apiKeyInput.value.trim());
  }
};

const handleSelectToken = (token) => {
  selectedTokenId.value = token.id;
};

const handleLogout = () => {
  clearAllAuth();
  emit('login', null);
  isOpen.value = false;
  mode.value = 'login';
  tokens.value = [];
  selectedTokenId.value = null;
  apiKeyInput.value = '';
};

const formatQuota = (quota) => {
  if (quota === undefined || quota === null) return '-';
  return (quota / 500000).toFixed(2);
};

const formatUsedQuota = (usedQuota) => {
  if (usedQuota === undefined || usedQuota === null) return '0';
  return (usedQuota / 500000).toFixed(2);
};
</script>

<template>
  <Transition name="modal">
    <div v-if="isOpen" class="modal-overlay" @click.self="isOpen = false">
      <div class="modal-content" @click.stop>
        <button class="close-btn" @click="isOpen = false">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>

        <div class="modal-header">
          <h2 v-if="mode === 'login'">登录 New API</h2>
          <h2 v-else>个人中心</h2>
        </div>

        <div class="modal-body">
          <div v-if="mode === 'login'" class="login-section">
            <p class="login-desc">使用 New API 平台账号登录</p>
            
            <form @submit.prevent="handleLogin">
              <div class="form-group">
                <label>用户名</label>
                <input 
                  v-model="loginForm.username" 
                  type="text" 
                  placeholder="请输入用户名"
                  :disabled="loading"
                  autocomplete="username"
                />
              </div>

              <div class="form-group">
                <label>密码</label>
                <input 
                  v-model="loginForm.password" 
                  type="password" 
                  placeholder="请输入密码"
                  :disabled="loading"
                  autocomplete="current-password"
                />
              </div>

              <div v-if="error" class="error-message">
                {{ error }}
              </div>

              <button type="submit" class="submit-btn" :disabled="loading">
                <span v-if="loading" class="spinner"></span>
                <span v-else>登录</span>
              </button>
            </form>
          </div>

          <div v-if="mode === 'profile'" class="profile-section">
            <div class="user-info">
              <div class="avatar">{{ currentUser?.avatar }}</div>
              <div class="user-details">
                <h3>{{ currentUser?.username }}</h3>
                <p class="token-count">可用令牌: {{ tokensCount }}</p>
              </div>
            </div>

            <div class="api-key-section">
              <h4>API Key</h4>
              <p class="api-key-desc">请输入完整的 API Key（sk-开头）</p>
              <div class="api-key-input-group">
                <input 
                  v-model="apiKeyInput" 
                  type="text" 
                  placeholder="sk-xxxxxxxxxxxxxxxx"
                  @blur="handleSaveApiKey"
                />
                <button class="save-btn" @click="handleSaveApiKey">保存</button>
              </div>
            </div>

            <div class="tokens-section">
              <h4>我的令牌</h4>
              <div class="tokens-list">
                <div 
                  v-for="token in tokens" 
                  :key="token.id" 
                  :class="['token-item', { active: selectedTokenId === token.id }]"
                  @click="handleSelectToken(token)"
                >
                  <div class="token-info">
                    <div class="token-name">
                      <span class="token-label">{{ token.name || '未命名令牌' }}</span>
                      <span :class="['token-status', token.status === 1 ? 'enabled' : 'disabled']">
                        {{ token.status === 1 ? '已启用' : '已禁用' }}
                      </span>
                    </div>
                    <div class="token-quota">
                      <span>额度: {{ token.unlimited_quota ? '无限' : formatQuota(token.remain_quota) }}</span>
                      <span>已用: {{ formatUsedQuota(token.used_quota) }}</span>
                    </div>
                  </div>
                  <div class="token-check" v-if="selectedTokenId === token.id">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <div class="profile-actions">
              <button class="action-btn danger" @click="handleLogout">退出登录</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: rgba(30, 30, 40, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  padding: 40px;
  max-width: 480px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
  position: relative;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
}

.close-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.modal-header h2 {
  color: white;
  font-size: 24px;
  margin: 0 0 24px 0;
  font-weight: 600;
}

.login-desc {
  color: rgba(255, 255, 255, 0.5);
  font-size: 14px;
  margin-bottom: 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  margin-bottom: 8px;
  font-weight: 500;
}

.form-group input {
  width: 100%;
  padding: 14px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: white;
  font-size: 14px;
  transition: all 0.3s ease;
  box-sizing: border-box;
}

.form-group input:focus {
  outline: none;
  border-color: #667eea;
  background: rgba(255, 255, 255, 0.08);
}

.form-group input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.form-group input::placeholder {
  color: rgba(255, 255, 255, 0.3);
}

.error-message {
  color: #ff6b6b;
  font-size: 14px;
  margin-bottom: 20px;
  text-align: center;
  padding: 10px;
  background: rgba(255, 107, 107, 0.1);
  border-radius: 8px;
}

.submit-btn {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 12px;
  color: white;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
}

.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.user-info {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
}

.avatar {
  width: 50px;
  height: 50px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 600;
  color: white;
  flex-shrink: 0;
}

.user-details h3 {
  color: white;
  font-size: 16px;
  margin: 0 0 4px 0;
  font-weight: 600;
}

.token-count {
  color: rgba(255, 255, 255, 0.5);
  font-size: 13px;
  margin: 0;
}

.api-key-section {
  margin-bottom: 24px;
}

.api-key-section h4 {
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  margin: 0 0 8px 0;
  font-weight: 500;
}

.api-key-desc {
  color: rgba(255, 255, 255, 0.4);
  font-size: 12px;
  margin: 0 0 12px 0;
}

.api-key-input-group {
  display: flex;
  gap: 8px;
}

.api-key-input-group input {
  flex: 1;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: white;
  font-size: 14px;
  transition: all 0.3s ease;
}

.api-key-input-group input:focus {
  outline: none;
  border-color: #667eea;
  background: rgba(255, 255, 255, 0.08);
}

.api-key-input-group input::placeholder {
  color: rgba(255, 255, 255, 0.3);
}

.save-btn {
  padding: 12px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 12px;
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.save-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.3);
}

.tokens-section {
  margin-bottom: 24px;
}

.tokens-section h4 {
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  margin: 0 0 12px 0;
  font-weight: 500;
}

.tokens-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 300px;
  overflow-y: auto;
}

.token-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.token-item:hover {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(102, 126, 234, 0.3);
}

.token-item.active {
  background: rgba(102, 126, 234, 0.15);
  border-color: rgba(102, 126, 234, 0.5);
}

.token-info {
  flex: 1;
  min-width: 0;
}

.token-name {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.token-label {
  color: white;
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.token-status {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 500;
  flex-shrink: 0;
}

.token-status.enabled {
  background: rgba(76, 175, 80, 0.2);
  color: #4caf50;
}

.token-status.disabled {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.4);
}

.token-quota {
  display: flex;
  gap: 16px;
  color: rgba(255, 255, 255, 0.4);
  font-size: 12px;
}

.token-check {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #667eea;
  flex-shrink: 0;
}

.profile-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.action-btn {
  width: 100%;
  padding: 14px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: white;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.action-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.action-btn.danger {
  background: rgba(255, 107, 107, 0.1);
  border-color: rgba(255, 107, 107, 0.3);
}

.action-btn.danger:hover {
  background: rgba(255, 107, 107, 0.2);
}

.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

.modal-content::-webkit-scrollbar {
  width: 6px;
}

.modal-content::-webkit-scrollbar-track {
  background: transparent;
}

.modal-content::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

.modal-content::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}
</style>
