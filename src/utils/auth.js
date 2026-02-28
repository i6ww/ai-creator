const STORAGE_KEY = 'user';

export const getUser = () => {
  try {
    const userStr = localStorage.getItem(STORAGE_KEY);
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    console.error('获取用户信息失败:', error);
    return null;
  }
};

export const setUser = (user) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  } catch (error) {
    console.error('保存用户信息失败:', error);
  }
};

export const clearUser = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('清除用户信息失败:', error);
  }
};

export const isLoggedIn = () => {
  return !!getUser();
};

export const generateHistory = {
  get: (type = 'all') => {
    try {
      const historyStr = localStorage.getItem('generate_history');
      const history = historyStr ? JSON.parse(historyStr) : [];
      if (type === 'all') return history;
      return history.filter(item => item.type === type);
    } catch (error) {
      console.error('获取历史记录失败:', error);
      return [];
    }
  },
  
  add: (item) => {
    try {
      const history = generateHistory.get();
      history.unshift({
        ...item,
        id: Date.now(),
        timestamp: new Date().toISOString()
      });
      localStorage.setItem('generate_history', JSON.stringify(history.slice(0, 100)));
    } catch (error) {
      console.error('添加历史记录失败:', error);
    }
  },
  
  remove: (id) => {
    try {
      const history = generateHistory.get();
      const filtered = history.filter(item => item.id !== id);
      localStorage.setItem('generate_history', JSON.stringify(filtered));
    } catch (error) {
      console.error('删除历史记录失败:', error);
    }
  },
  
  clear: () => {
    try {
      localStorage.removeItem('generate_history');
    } catch (error) {
      console.error('清除历史记录失败:', error);
    }
  }
};
