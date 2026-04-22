const STORAGE_KEY = 'user';
const USER_ID_KEY = 'new_api_user_id';
const TOKEN_KEY = 'access_token';
const TOKENS_LIST_KEY = 'tokens_list';

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

export const setNewApiUserId = (userId) => {
  try {
    localStorage.setItem(USER_ID_KEY, String(userId));
  } catch (error) {
    console.error('保存用户 ID 失败:', error);
  }
};

export const getNewApiUserId = () => {
  try {
    return localStorage.getItem(USER_ID_KEY) || '';
  } catch (error) {
    console.error('获取用户 ID 失败:', error);
    return '';
  }
};

export const clearUser = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(USER_ID_KEY);
  } catch (error) {
    console.error('清除用户信息失败:', error);
  }
};

export const isLoggedIn = () => {
  return !!getUser();
};

export const setAccessToken = (token) => {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch (error) {
    console.error('保存 accessToken 失败:', error);
  }
};

export const getAccessToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY) || '';
  } catch (error) {
    console.error('获取 accessToken 失败:', error);
    return '';
  }
};

export const clearAccessToken = () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch (error) {
    console.error('清除 accessToken 失败:', error);
  }
};

export const setTokensList = (tokens) => {
  try {
    localStorage.setItem(TOKENS_LIST_KEY, JSON.stringify(tokens));
  } catch (error) {
    console.error('保存令牌列表失败:', error);
  }
};

export const getTokensList = () => {
  try {
    const tokensStr = localStorage.getItem(TOKENS_LIST_KEY);
    return tokensStr ? JSON.parse(tokensStr) : [];
  } catch (error) {
    console.error('获取令牌列表失败:', error);
    return [];
  }
};

export const clearTokensList = () => {
  try {
    localStorage.removeItem(TOKENS_LIST_KEY);
  } catch (error) {
    console.error('清除令牌列表失败:', error);
  }
};

export const clearAllAuth = () => {
  clearUser();
  clearAccessToken();
  clearTokensList();
  try {
    localStorage.removeItem('api_key');
  } catch (error) {
    console.error('清除 api_key 失败:', error);
  }
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
