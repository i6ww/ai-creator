import axios from 'axios';
import { CookieJar } from 'tough-cookie';
import { wrapper } from 'axios-cookiejar-support';

const API_BASE = 'https://www.371181668.xyz';

const jar = new CookieJar();
const api = wrapper(axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  },
  jar,
  withCredentials: true
}));

async function test() {
  try {
    // 1. 登录
    console.log('=== 测试登录 ===');
    const loginRes = await api.post('/api/user/login', {
      username: process.argv[2],
      password: process.argv[3]
    });
    console.log('登录状态:', loginRes.status);
    console.log('登录响应:', JSON.stringify(loginRes.data, null, 2));
    console.log('Cookie:', jar.getCookieStringSync(API_BASE));

    // 获取用户 ID
    const userId = loginRes.data.data?.id;
    console.log('用户 ID:', userId);

    // 2. 获取令牌列表
    console.log('\n=== 测试获取令牌 ===');
    const tokenRes = await api.get('/api/token/', {
      headers: {
        'New-Api-User': String(userId)
      }
    });
    console.log('令牌状态:', tokenRes.status);
    console.log('令牌响应:', JSON.stringify(tokenRes.data, null, 2));
  } catch (error) {
    console.error('错误:', error.message);
    console.error('错误响应:', error.response?.data);
    console.error('错误状态:', error.response?.status);
  }
}

test();
