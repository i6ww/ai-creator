<script setup>
import { ref, watch } from 'vue';
import { getUser, setUser, clearUser } from '../utils/auth';

const emit = defineEmits(['close', 'login']);

const isOpen = defineModel('isOpen', false);
const mode = ref('login');

const formData = ref({
  username: '',
  email: '',
  password: '',
  confirmPassword: ''
});

const loading = ref(false);
const error = ref('');

watch(isOpen, (newVal) => {
  if (newVal) {
    const user = getUser();
    if (user) {
      mode.value = 'profile';
    }
  }
});

const handleSubmit = async () => {
  if (!formData.value.username || !formData.value.password) {
    error.value = '请填写所有必填字段';
    return;
  }
  
  if (mode.value === 'register') {
    if (formData.value.password !== formData.value.confirmPassword) {
      error.value = '两次输入的密码不一致';
      return;
    }
    if (formData.value.password.length < 6) {
      error.value = '密码长度至少为6位';
      return;
    }
  }
  
  loading.value = true;
  error.value = '';
  
  try {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const userData = {
      id: Date.now(),
      username: formData.value.username,
      email: formData.value.email,
      avatar: formData.value.username.charAt(0).toUpperCase(),
      createdAt: new Date().toISOString()
    };
    
    setUser(userData);
    emit('login', userData);
    isOpen.value = false;
    resetForm();
  } catch (err) {
    error.value = mode.value === 'register' ? '注册失败，请重试' : '登录失败，请重试';
  } finally {
    loading.value = false;
  }
};

const handleGitHubLogin = () => {
  window.location.href = `https://github.com/login/oauth/authorize?client_id=${import.meta.env.VITE_GITHUB_CLIENT_ID || 'demo'}&redirect_uri=${encodeURIComponent(window.location.origin + '/auth/github/callback')}&scope=user:email`;
};

const handleLogout = () => {
  clearUser();
  emit('login', null);
  isOpen.value = false;
  mode.value = 'login';
};

const resetForm = () => {
  formData.value = {
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  };
  error.value = '';
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
          <h2>{{ mode === 'login' ? '登录' : '个人中心' }}</h2>
        </div>
        
        <div class="modal-body">
          <div v-if="mode === 'login' || mode === 'register'">
            <div class="auth-forms">
              <div class="form-tabs">
                <button :class="['tab-btn', { active: mode === 'login' }]" @click="mode = 'login'">登录</button>
                <button :class="['tab-btn', { active: mode === 'register' }]" @click="mode = 'register'">注册</button>
              </div>
              
              <div v-if="mode === 'login'" class="form-section">
                <form @submit.prevent="handleSubmit">
                  <div class="form-group">
                    <label>用户名</label>
                    <input 
                      v-model="formData.username" 
                      type="text" 
                      placeholder="请输入用户名"
                      :disabled="loading"
                    />
                  </div>
                  
                  <div class="form-group">
                    <label>邮箱（可选）</label>
                    <input 
                      v-model="formData.email" 
                      type="email" 
                      placeholder="请输入邮箱"
                      :disabled="loading"
                    />
                  </div>
                  
                  <div class="form-group">
                    <label>密码</label>
                    <input 
                      v-model="formData.password" 
                      type="password" 
                      placeholder="请输入密码"
                      :disabled="loading"
                    />
                  </div>
                  
                  <div v-if="error" class="error-message">
                    {{ error }}
                  </div>
                  
                  <button type="submit" class="submit-btn" :disabled="loading">
                    <span v-if="loading" class="spinner"></span>
                    <span v-else>{{ loading ? '登录中...' : '登录' }}</span>
                  </button>
                </form>
                
                <div class="divider">
                  <span>或</span>
                </div>
                
                <button class="github-btn" @click="handleGitHubLogin" :disabled="loading">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  GitHub 登录
                </button>
              </div>

              <div v-else-if="mode === 'register'" class="form-section">
                <form @submit.prevent="handleSubmit">
                  <div class="form-group">
                    <label>用户名 <span class="required">*</span></label>
                    <input 
                      v-model="formData.username" 
                      type="text" 
                      placeholder="请输入用户名（至少3个字符）"
                      :disabled="loading"
                    />
                  </div>
                  
                  <div class="form-group">
                    <label>邮箱（可选）</label>
                    <input 
                      v-model="formData.email" 
                      type="email" 
                      placeholder="请输入邮箱"
                      :disabled="loading"
                    />
                  </div>
                  
                  <div class="form-group">
                    <label>密码 <span class="required">*</span></label>
                    <input 
                      v-model="formData.password" 
                      type="password" 
                      placeholder="请输入密码（至少6位）"
                      :disabled="loading"
                    />
                  </div>
                  
                  <div class="form-group">
                    <label>确认密码 <span class="required">*</span></label>
                    <input 
                      v-model="formData.confirmPassword" 
                      type="password" 
                      placeholder="请再次输入密码"
                      :disabled="loading"
                    />
                  </div>
                  
                  <div v-if="error" class="error-message">
                    {{ error }}
                  </div>
                  
                  <button type="submit" class="submit-btn" :disabled="loading">
                    <span v-if="loading" class="spinner"></span>
                    <span v-else>{{ loading ? '注册中...' : '注册' }}</span>
                  </button>
                </form>
              </div>
            </div>
          </div>
          
          <div v-if="mode === 'profile'" class="profile-section">
            <div class="user-info">
              <div class="avatar">{{ getUser()?.avatar }}</div>
              <div class="user-details">
                <h3>{{ getUser()?.username }}</h3>
                <p>{{ getUser()?.email || '未设置邮箱' }}</p>
              </div>
            </div>
            
            <div class="profile-actions">
              <button class="action-btn" @click="mode = 'settings'">设置</button>
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
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 24px;
  padding: 40px;
  max-width: 420px;
  width: 100%;
  position: relative;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
}

.close-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.7);
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
  font-size: 28px;
  margin: 0 0 30px 0;
  font-weight: 600;
}

.form-tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 30px;
}

.tab-btn {
  flex: 1;
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
}

.tab-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.tab-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: transparent;
  color: white;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  margin-bottom: 8px;
  font-weight: 500;
}

.form-group label .required {
  color: #ff6b6b;
  margin-left: 2px;
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
  color: rgba(255, 255, 255, 0.4);
}

.error-message {
  color: #ff6b6b;
  font-size: 14px;
  margin-bottom: 20px;
  text-align: center;
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

.divider {
  display: flex;
  align-items: center;
  margin: 30px 0;
  color: rgba(255, 255, 255, 0.4);
  font-size: 14px;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
}

.divider span {
  padding: 0 15px;
}

.github-btn {
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
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.github-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
  transform: translateY(-2px);
}

.github-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 30px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
}

.avatar {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 600;
  color: white;
}

.user-details h3 {
  color: white;
  font-size: 18px;
  margin: 0 0 5px 0;
  font-weight: 600;
}

.user-details p {
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
  margin: 0;
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
</style>
