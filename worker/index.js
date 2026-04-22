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
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  }
  
  // 处理 /generated/ 路径的图片请求
  if (path.startsWith('/generated/')) {
    const targetUrl = `http://43.165.172.5:6001${path}`;
    try {
      const response = await fetch(targetUrl);
      const clonedResponse = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: new Headers(response.headers)
      });
      clonedResponse.headers.set('Access-Control-Allow-Origin', '*');
      return clonedResponse;
    } catch (error) {
      return new Response('Image not found', { status: 404 });
    }
  }
  
  // 只处理POST请求
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }
  
  // 构建目标URL
  const targetUrl = `https://www.371181668.xyz${path}`;
  
  // 克隆请求
  const clonedRequest = new Request(targetUrl, {
    method: request.method,
    headers: new Headers(request.headers),
    body: request.body
  });
  
  // 前端已经设置了Authorization头，这里不需要重复设置
  
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