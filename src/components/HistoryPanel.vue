<script setup>
import { ref, onMounted, inject } from 'vue';
import { generateHistory } from '../utils/auth';

const emit = defineEmits(['close']);

const isOpen = defineModel('isOpen', false);
const history = ref([]);
const filter = ref('all');

const user = inject('user');
const openAuth = inject('openAuth');

const filters = [
  { id: 'all', label: '全部', icon: '📋' },
  { id: 'chat', label: '对话', icon: '💬' },
  { id: 'image', label: '图像', icon: '🎨' },
  { id: 'video', label: '视频', icon: '🎬' }
];

onMounted(() => {
  loadHistory();
});

const loadHistory = () => {
  if (!user.value) {
    history.value = [];
    openAuth();
    return;
  }
  history.value = generateHistory.get(filter.value);
};

const handleFilterChange = (newFilter) => {
  filter.value = newFilter;
  loadHistory();
};

const handleDelete = (id) => {
  generateHistory.remove(id);
  loadHistory();
};

const handleClearAll = () => {
  if (confirm('确定要清空所有历史记录吗？')) {
    generateHistory.clear();
    loadHistory();
  }
};

const formatDate = (timestamp) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)} 天前`;
  
  return date.toLocaleDateString('zh-CN');
};
</script>

<template>
  <Transition name="slide">
    <div v-if="isOpen" class="history-panel">
      <div class="panel-header">
        <h2>历史记录</h2>
        <button class="close-btn" @click="isOpen = false">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>
      
      <div class="panel-filters">
        <button 
          v-for="item in filters"
          :key="item.id"
          :class="['filter-btn', { active: filter === item.id }]"
          @click="handleFilterChange(item.id)"
        >
          <span class="filter-icon">{{ item.icon }}</span>
          <span class="filter-label">{{ item.label }}</span>
        </button>
      </div>
      
      <div class="panel-content">
        <div v-if="history.length === 0" class="empty-state">
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
            <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <p>暂无历史记录</p>
        </div>
        
        <div v-else class="history-list">
          <div 
            v-for="item in history"
            :key="item.id"
            class="history-item"
          >
            <div class="item-header">
              <span class="item-type">
                {{ item.type === 'chat' ? '💬' : item.type === 'image' ? '🎨' : '🎬' }}
              </span>
              <span class="item-time">{{ formatDate(item.timestamp) }}</span>
            </div>
            
            <div class="item-content">
              <p class="item-prompt">{{ item.prompt }}</p>
              
              <div v-if="item.type === 'image' && item.url" class="item-preview">
                <img :src="item.url" :alt="item.prompt" />
              </div>
              
              <div v-if="item.type === 'video' && item.url" class="item-preview">
                <video :src="item.url" controls />
              </div>
            </div>
            
            <button class="delete-btn" @click="handleDelete(item.id)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      <div v-if="history.length > 0" class="panel-footer">
        <button class="clear-btn" @click="handleClearAll">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
          </svg>
          清空历史
        </button>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.history-panel {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 400px;
  background: rgba(30, 30, 40, 0.98);
  backdrop-filter: blur(20px);
  border-left: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: -10px 0 30px rgba(0, 0, 0, 0.3);
  z-index: 999;
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.panel-header h2 {
  color: white;
  font-size: 20px;
  font-weight: 600;
  margin: 0;
}

.close-btn {
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

.panel-filters {
  display: flex;
  gap: 8px;
  padding: 16px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  overflow-x: auto;
}

.filter-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.filter-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.filter-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: transparent;
  color: white;
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  color: rgba(255, 255, 255, 0.4);
}

.empty-state svg {
  margin-bottom: 16px;
}

.empty-state p {
  font-size: 14px;
  margin: 0;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.history-item {
  position: relative;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 16px;
  transition: all 0.3s ease;
}

.history-item:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.15);
}

.item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.item-type {
  font-size: 16px;
}

.item-time {
  color: rgba(255, 255, 255, 0.5);
  font-size: 12px;
}

.item-content {
  margin-bottom: 12px;
}

.item-prompt {
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  margin: 0 0 12px 0;
  line-height: 1.5;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.item-preview {
  border-radius: 8px;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.3);
}

.item-preview img,
.item-preview video {
  width: 100%;
  height: 200px;
  object-fit: cover;
  display: block;
}

.delete-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  background: rgba(255, 107, 107, 0.1);
  border: 1px solid rgba(255, 107, 107, 0.3);
  border-radius: 6px;
  padding: 6px;
  color: #ff6b6b;
  cursor: pointer;
  transition: all 0.3s ease;
  opacity: 0;
}

.history-item:hover .delete-btn {
  opacity: 1;
}

.delete-btn:hover {
  background: rgba(255, 107, 107, 0.2);
}

.panel-footer {
  padding: 16px 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.clear-btn {
  width: 100%;
  padding: 12px;
  background: rgba(255, 107, 107, 0.1);
  border: 1px solid rgba(255, 107, 107, 0.3);
  border-radius: 8px;
  color: #ff6b6b;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.clear-btn:hover {
  background: rgba(255, 107, 107, 0.2);
}

.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}

@media (max-width: 640px) {
  .history-panel {
    width: 100%;
  }
}
</style>
