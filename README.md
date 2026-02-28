# AI创作平台

基于Vue 3和Cloudflare Pages开发的AI创作平台，集成Grok2API，支持聊天对话、图像生成和视频生成功能。

## 功能特性

- **聊天对话**：支持与AI进行文字对话，使用grok-4模型
- **图像生成**：支持通过提示词生成高质量图像，使用grok-imagine-1.0模型
- **视频生成**：支持通过提示词生成视频，使用grok-imagine-1.0-video模型
- **响应式设计**：适配不同屏幕尺寸
- **Cloudflare部署**：基于Cloudflare Pages和Workers部署，提供高可用性

## 技术栈

- **前端**：Vue 3 + Vite + Axios
- **后端**：Cloudflare Workers（API代理）
- **API**：Grok2API

## 安装部署

### 1. 克隆仓库

```bash
git clone https://github.com/i6ww/ai-creator.git
cd ai-creator
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置API代理

修改`worker/index.js`文件中的API密钥：

```javascript
// 添加API密钥（这里需要替换为实际的API密钥）
clonedRequest.headers.set('Authorization', 'Bearer your-api-key');
```

### 4. 部署Cloudflare Worker

1. 登录Cloudflare控制台
2. 导航到Workers & Pages
3. 点击"Create a Service"
4. 上传`worker/index.js`文件
5. 部署Worker

### 5. 更新API配置

修改`src/api.js`文件中的Worker URL：

```javascript
const API_BASE_URL = 'https://your-worker-name.your-account.workers.dev'; // 这里需要替换为实际的Worker URL
```

### 6. 构建项目

```bash
npm run build
```

### 7. 部署到Cloudflare Pages

1. 登录Cloudflare控制台
2. 导航到Pages
3. 点击"Create a project"
4. 选择您的GitHub仓库（i6ww/ai-creator）
5. 配置构建参数：
   - 框架：Vue
   - 构建命令：`npm run build`
   - 输出目录：`dist`
6. 点击"Deploy site"

## 使用说明

1. 访问部署后的Cloudflare Pages站点
2. 在导航栏选择需要使用的功能：
   - **聊天对话**：输入消息与AI进行对话
   - **图像生成**：输入提示词生成图像
   - **视频生成**：输入提示词并配置参数生成视频

## 项目结构

```
ai-creator/
├── src/
│   ├── components/
│   │   ├── ChatComponent.vue      # 聊天对话组件
│   │   ├── ImageGenerator.vue     # 图像生成组件
│   │   └── VideoGenerator.vue     # 视频生成组件
│   ├── api.js                     # API调用封装
│   ├── App.vue                    # 主应用组件
│   └── main.js                    # 应用入口
├── worker/
│   ├── index.js                   # Cloudflare Worker代码
│   └── wrangler.toml              # Worker配置文件
├── package.json                   # 项目依赖
└── vite.config.js                 # Vite配置
```

## 注意事项

- 请确保您的Grok2API密钥有效
- 视频生成可能需要较长时间，请耐心等待
- 部署前请确保修改所有必要的配置参数

## 许可证

MIT License
