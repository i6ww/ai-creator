addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  const path = url.pathname;
  
  // 处理CORS预检请求
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  }
  
  // 只处理POST请求
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }
  
  // 构建目标URL
  const targetUrl = `https://grok2api-xings-projects-3a939220.vercel.app${path}`;
  
  // 克隆请求
  const clonedRequest = new Request(targetUrl, {
    method: request.method,
    headers: new Headers(request.headers),
    body: request.body
  });
  
  // 添加API密钥（这里需要替换为实际的API密钥）
  clonedRequest.headers.set('Authorization', 'admin');
  
  try {
    // 发送请求到目标API
    const response = await fetch(clonedRequest);
    
    // 克隆响应
    const clonedResponse = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: new Headers(response.headers)
    });
    
    // 添加CORS响应头
    clonedResponse.headers.set('Access-Control-Allow-Origin', '*');
    
    return clonedResponse;
  } catch (error) {
    return new Response('Internal server error', { status: 500 });
  }
}