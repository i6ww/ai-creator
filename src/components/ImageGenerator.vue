<script setup>
import { ref, inject } from 'vue';
import { generateImage, generateImageFromImage } from '../api';
import { generateHistory } from '../utils/auth';

const user = inject('user');
const openAuth = inject('openAuth');

const activeMode = ref('text2img');
const prompt = ref('');
const negativePrompt = ref('');
const imageUrls = ref([]);
const batchImageUrls = ref([]);
const generatedImages = ref([]);
const isLoading = ref(false);
const error = ref('');
const imageCount = ref(1);
const selectedModel = ref('firefly-nano-banana-pro-1k-1x1');
const maxRefImages = 6;

const batchTasks = ref([
  { id: 1, images: [], prompt: '', status: 'pending', result: null, loading: false },
  { id: 2, images: [], prompt: '', status: 'pending', result: null, loading: false },
  { id: 3, images: [], prompt: '', status: 'pending', result: null, loading: false },
  { id: 4, images: [], prompt: '', status: 'pending', result: null, loading: false },
  { id: 5, images: [], prompt: '', status: 'pending', result: null, loading: false },
  { id: 6, images: [], prompt: '', status: 'pending', result: null, loading: false },
]);

const batchRatio = ref('16:9');
const batchResolution = ref('2K');
const batchModelBase = ref('firefly-nano-banana-pro');

const batchModelBases = [
  { value: 'firefly-nano-banana-pro', label: 'Firefly Nano Banana Pro' },
  { value: 'firefly-nano-banana', label: 'Firefly Nano Banana' },
  { value: 'firefly-nano-banana2', label: 'Firefly Nano Banana 2' },
];

const batchRatios = [
  { value: '1:1', label: '1:1 方形' },
  { value: '16:9', label: '16:9 横屏' },
  { value: '9:16', label: '9:16 竖屏' },
  { value: '4:3', label: '4:3' },
  { value: '3:4', label: '3:4' },
  { value: '21:9', label: '21:9 超宽' },
  { value: '5:4', label: '5:4' },
  { value: '4:5', label: '4:5' },
  { value: '3:2', label: '3:2' },
  { value: '2:3', label: '2:3' },
  { value: '8:1', label: '8:1' },
  { value: '1:4', label: '1:4' },
  { value: '1:8', label: '1:8' },
];

const batchResolutions = [
  { value: '1K', label: '1K' },
  { value: '2K', label: '2K' },
  { value: '4K', label: '4K' },
];

const applyBatchSettings = () => {
  const ratioMap = {
    '1:1': '1x1', '16:9': '16x9', '9:16': '9x16', '4:3': '4x3',
    '3:4': '3x4', '21:9': '21x9', '3:2': '3x2', '2:3': '2x3',
    '5:4': '5x4', '4:5': '4x5', '8:1': '8x1', '1:4': '1x4', '1:8': '1x8'
  };
  const ratioSuffix = ratioMap[batchRatio.value] || '1x1';
  const resLower = batchResolution.value.toLowerCase();
  selectedModel.value = `${batchModelBase.value}-${resLower}-${ratioSuffix}`;
};

const addBatchImage = (taskId, event) => {
  const files = event.target.files;
  if (!files || files.length === 0) return;
  
  const task = batchTasks.value.find(t => t.id === taskId);
  if (!task) return;
  
  const remaining = 3 - task.images.length;
  const toAdd = Math.min(files.length, remaining);
  
  for (let i = 0; i < toAdd; i++) {
    task.images.push(URL.createObjectURL(files[i]));
  }
};

const removeBatchImage = (taskId, imageIndex) => {
  const task = batchTasks.value.find(t => t.id === taskId);
  if (!task) return;
  task.images.splice(imageIndex, 1);
};

const removeBatchTask = (taskId) => {
  batchTasks.value = batchTasks.value.filter(t => t.id !== taskId);
};

const generateBatchTask = async (taskId) => {
  const task = batchTasks.value.find(t => t.id === taskId);
  if (!task || !task.prompt.trim() || task.images.length === 0) return;
  
  if (!user.value) {
    openAuth();
    return;
  }
  
  task.loading = true;
  task.status = 'running';
  task.result = null;
  
  try {
    const response = await generateImageFromImage(task.images, task.prompt, selectedModel.value, 1);
    
    let imgUrl = '';
    if (response.choices && response.choices[0]?.message?.content) {
      imgUrl = response.choices[0].message.content.replace(/https:\/\/grok2api-xings-projects-3a939220\.vercel\.app/g, 'https://www.371181668.xyz')
        .replace(/http:\/\/43\.165\.172\.5:6001/g, '');
    } else if (response.data && response.data[0]) {
      const imageData = response.data[0];
      if (imageData.b64_json) {
        imgUrl = `data:image/png;base64,${imageData.b64_json}`;
      } else if (imageData.url) {
        imgUrl = imageData.url.replace(/https:\/\/grok2api-xings-projects-3a939220\.vercel\.app/g, 'https://www.371181668.xyz')
          .replace(/http:\/\/43\.165\.172\.5:6001/g, '');
      }
    } else if (response.url) {
      imgUrl = response.url.replace(/https:\/\/grok2api-xings-projects-3a939220\.vercel\.app/g, 'https://www.371181668.xyz')
        .replace(/http:\/\/43\.165\.172\.5:6001/g, '');
    } else if (typeof response === 'string') {
      imgUrl = response.replace(/https:\/\/grok2api-xings-projects-3a939220\.vercel\.app/g, 'https://www.371181668.xyz')
        .replace(/http:\/\/43\.165\.172\.5:6001/g, '');
    }
    
    if (imgUrl) {
      task.result = imgUrl;
      task.status = 'completed';
      generateHistory.add({
        type: 'image',
        prompt: task.prompt,
        url: imgUrl,
        mode: 'batch',
        sourceImages: task.images,
        model: selectedModel.value
      });
    }
  } catch (err) {
    console.error('任务生成失败:', err);
    task.status = 'error';
  } finally {
    task.loading = false;
  }
};

const generateAllBatchTasks = async () => {
  const validTasks = batchTasks.value.filter(t => t.prompt.trim() && t.images.length > 0);
  if (validTasks.length === 0) return;
  
  if (!user.value) {
    openAuth();
    return;
  }
  
  for (const task of validTasks) {
    await generateBatchTask(task.id);
  }
};

const models = [
  {
    group: 'Firefly Nano Banana Pro',
    options: [
      { value: 'firefly-nano-banana-pro-1k-1x1', label: 'Firefly Nano Banana Pro (1K 1:1)' },
      { value: 'firefly-nano-banana-pro-1k-16x9', label: 'Firefly Nano Banana Pro (1K 16:9)' },
      { value: 'firefly-nano-banana-pro-1k-9x16', label: 'Firefly Nano Banana Pro (1K 9:16)' },
      { value: 'firefly-nano-banana-pro-1k-4x3', label: 'Firefly Nano Banana Pro (1K 4:3)' },
      { value: 'firefly-nano-banana-pro-1k-3x4', label: 'Firefly Nano Banana Pro (1K 3:4)' },
      { value: 'firefly-nano-banana-pro-1k-21x9', label: 'Firefly Nano Banana Pro (1K 21:9)' },
      { value: 'firefly-nano-banana-pro-1k-5x4', label: 'Firefly Nano Banana Pro (1K 5:4)' },
      { value: 'firefly-nano-banana-pro-1k-4x5', label: 'Firefly Nano Banana Pro (1K 4:5)' },
      { value: 'firefly-nano-banana-pro-2k-1x1', label: 'Firefly Nano Banana Pro (2K 1:1)' },
      { value: 'firefly-nano-banana-pro-2k-16x9', label: 'Firefly Nano Banana Pro (2K 16:9)' },
      { value: 'firefly-nano-banana-pro-2k-9x16', label: 'Firefly Nano Banana Pro (2K 9:16)' },
      { value: 'firefly-nano-banana-pro-2k-4x3', label: 'Firefly Nano Banana Pro (2K 4:3)' },
      { value: 'firefly-nano-banana-pro-2k-3x4', label: 'Firefly Nano Banana Pro (2K 3:4)' },
      { value: 'firefly-nano-banana-pro-2k-21x9', label: 'Firefly Nano Banana Pro (2K 21:9)' },
      { value: 'firefly-nano-banana-pro-2k-5x4', label: 'Firefly Nano Banana Pro (2K 5:4)' },
      { value: 'firefly-nano-banana-pro-2k-4x5', label: 'Firefly Nano Banana Pro (2K 4:5)' },
      { value: 'firefly-nano-banana-pro-4k-1x1', label: 'Firefly Nano Banana Pro (4K 1:1)' },
      { value: 'firefly-nano-banana-pro-4k-16x9', label: 'Firefly Nano Banana Pro (4K 16:9)' },
      { value: 'firefly-nano-banana-pro-4k-9x16', label: 'Firefly Nano Banana Pro (4K 9:16)' },
      { value: 'firefly-nano-banana-pro-4k-4x3', label: 'Firefly Nano Banana Pro (4K 4:3)' },
      { value: 'firefly-nano-banana-pro-4k-3x4', label: 'Firefly Nano Banana Pro (4K 3:4)' },
      { value: 'firefly-nano-banana-pro-4k-21x9', label: 'Firefly Nano Banana Pro (4K 21:9)' },
      { value: 'firefly-nano-banana-pro-4k-5x4', label: 'Firefly Nano Banana Pro (4K 5:4)' },
      { value: 'firefly-nano-banana-pro-4k-4x5', label: 'Firefly Nano Banana Pro (4K 4:5)' },
    ]
  },
  {
    group: 'Firefly Nano Banana',
    options: [
      { value: 'firefly-nano-banana-1k-1x1', label: 'Firefly Nano Banana (1K 1:1)' },
      { value: 'firefly-nano-banana-1k-16x9', label: 'Firefly Nano Banana (1K 16:9)' },
      { value: 'firefly-nano-banana-1k-9x16', label: 'Firefly Nano Banana (1K 9:16)' },
      { value: 'firefly-nano-banana-1k-4x3', label: 'Firefly Nano Banana (1K 4:3)' },
      { value: 'firefly-nano-banana-1k-3x4', label: 'Firefly Nano Banana (1K 3:4)' },
      { value: 'firefly-nano-banana-1k-21x9', label: 'Firefly Nano Banana (1K 21:9)' },
      { value: 'firefly-nano-banana-1k-5x4', label: 'Firefly Nano Banana (1K 5:4)' },
      { value: 'firefly-nano-banana-1k-4x5', label: 'Firefly Nano Banana (1K 4:5)' },
      { value: 'firefly-nano-banana-2k-1x1', label: 'Firefly Nano Banana (2K 1:1)' },
      { value: 'firefly-nano-banana-2k-16x9', label: 'Firefly Nano Banana (2K 16:9)' },
      { value: 'firefly-nano-banana-2k-9x16', label: 'Firefly Nano Banana (2K 9:16)' },
      { value: 'firefly-nano-banana-2k-4x3', label: 'Firefly Nano Banana (2K 4:3)' },
      { value: 'firefly-nano-banana-2k-3x4', label: 'Firefly Nano Banana (2K 3:4)' },
      { value: 'firefly-nano-banana-2k-21x9', label: 'Firefly Nano Banana (2K 21:9)' },
      { value: 'firefly-nano-banana-2k-5x4', label: 'Firefly Nano Banana (2K 5:4)' },
      { value: 'firefly-nano-banana-2k-4x5', label: 'Firefly Nano Banana (2K 4:5)' },
      { value: 'firefly-nano-banana-4k-1x1', label: 'Firefly Nano Banana (4K 1:1)' },
      { value: 'firefly-nano-banana-4k-16x9', label: 'Firefly Nano Banana (4K 16:9)' },
      { value: 'firefly-nano-banana-4k-9x16', label: 'Firefly Nano Banana (4K 9:16)' },
      { value: 'firefly-nano-banana-4k-4x3', label: 'Firefly Nano Banana (4K 4:3)' },
      { value: 'firefly-nano-banana-4k-3x4', label: 'Firefly Nano Banana (4K 3:4)' },
      { value: 'firefly-nano-banana-4k-21x9', label: 'Firefly Nano Banana (4K 21:9)' },
      { value: 'firefly-nano-banana-4k-5x4', label: 'Firefly Nano Banana (4K 5:4)' },
      { value: 'firefly-nano-banana-4k-4x5', label: 'Firefly Nano Banana (4K 4:5)' },
    ]
  },
  {
    group: 'Firefly Nano Banana 2',
    options: [
      { value: 'firefly-nano-banana2-1k-1x1', label: 'Firefly Nano Banana 2 (1K 1:1)' },
      { value: 'firefly-nano-banana2-1k-16x9', label: 'Firefly Nano Banana 2 (1K 16:9)' },
      { value: 'firefly-nano-banana2-1k-9x16', label: 'Firefly Nano Banana 2 (1K 9:16)' },
      { value: 'firefly-nano-banana2-1k-4x3', label: 'Firefly Nano Banana 2 (1K 4:3)' },
      { value: 'firefly-nano-banana2-1k-3x4', label: 'Firefly Nano Banana 2 (1K 3:4)' },
      { value: 'firefly-nano-banana2-1k-21x9', label: 'Firefly Nano Banana 2 (1K 21:9)' },
      { value: 'firefly-nano-banana2-1k-3x2', label: 'Firefly Nano Banana 2 (1K 3:2)' },
      { value: 'firefly-nano-banana2-1k-5x4', label: 'Firefly Nano Banana 2 (1K 5:4)' },
      { value: 'firefly-nano-banana2-1k-4x5', label: 'Firefly Nano Banana 2 (1K 4:5)' },
      { value: 'firefly-nano-banana2-1k-2x3', label: 'Firefly Nano Banana 2 (1K 2:3)' },
      { value: 'firefly-nano-banana2-1k-8x1', label: 'Firefly Nano Banana 2 (1K 8:1)' },
      { value: 'firefly-nano-banana2-1k-1x4', label: 'Firefly Nano Banana 2 (1K 1:4)' },
      { value: 'firefly-nano-banana2-1k-1x8', label: 'Firefly Nano Banana 2 (1K 1:8)' },
      { value: 'firefly-nano-banana2-2k-1x1', label: 'Firefly Nano Banana 2 (2K 1:1)' },
      { value: 'firefly-nano-banana2-2k-16x9', label: 'Firefly Nano Banana 2 (2K 16:9)' },
      { value: 'firefly-nano-banana2-2k-9x16', label: 'Firefly Nano Banana 2 (2K 9:16)' },
      { value: 'firefly-nano-banana2-2k-4x3', label: 'Firefly Nano Banana 2 (2K 4:3)' },
      { value: 'firefly-nano-banana2-2k-3x4', label: 'Firefly Nano Banana 2 (2K 3:4)' },
      { value: 'firefly-nano-banana2-2k-21x9', label: 'Firefly Nano Banana 2 (2K 21:9)' },
      { value: 'firefly-nano-banana2-2k-3x2', label: 'Firefly Nano Banana 2 (2K 3:2)' },
      { value: 'firefly-nano-banana2-2k-5x4', label: 'Firefly Nano Banana 2 (2K 5:4)' },
      { value: 'firefly-nano-banana2-2k-4x5', label: 'Firefly Nano Banana 2 (2K 4:5)' },
      { value: 'firefly-nano-banana2-2k-2x3', label: 'Firefly Nano Banana 2 (2K 2:3)' },
      { value: 'firefly-nano-banana2-2k-8x1', label: 'Firefly Nano Banana 2 (2K 8:1)' },
      { value: 'firefly-nano-banana2-2k-1x4', label: 'Firefly Nano Banana 2 (2K 1:4)' },
      { value: 'firefly-nano-banana2-2k-1x8', label: 'Firefly Nano Banana 2 (2K 1:8)' },
      { value: 'firefly-nano-banana2-4k-1x1', label: 'Firefly Nano Banana 2 (4K 1:1)' },
      { value: 'firefly-nano-banana2-4k-16x9', label: 'Firefly Nano Banana 2 (4K 16:9)' },
      { value: 'firefly-nano-banana2-4k-9x16', label: 'Firefly Nano Banana 2 (4K 9:16)' },
      { value: 'firefly-nano-banana2-4k-4x3', label: 'Firefly Nano Banana 2 (4K 4:3)' },
      { value: 'firefly-nano-banana2-4k-3x4', label: 'Firefly Nano Banana 2 (4K 3:4)' },
      { value: 'firefly-nano-banana2-4k-21x9', label: 'Firefly Nano Banana 2 (4K 21:9)' },
      { value: 'firefly-nano-banana2-4k-3x2', label: 'Firefly Nano Banana 2 (4K 3:2)' },
      { value: 'firefly-nano-banana2-4k-5x4', label: 'Firefly Nano Banana 2 (4K 5:4)' },
      { value: 'firefly-nano-banana2-4k-4x5', label: 'Firefly Nano Banana 2 (4K 4:5)' },
      { value: 'firefly-nano-banana2-4k-2x3', label: 'Firefly Nano Banana 2 (4K 2:3)' },
      { value: 'firefly-nano-banana2-4k-8x1', label: 'Firefly Nano Banana 2 (4K 8:1)' },
      { value: 'firefly-nano-banana2-4k-1x4', label: 'Firefly Nano Banana 2 (4K 1:4)' },
      { value: 'firefly-nano-banana2-4k-1x8', label: 'Firefly Nano Banana 2 (4K 1:8)' },
    ]
  }
];

const modes = [
  { id: 'text2img', label: '文生图', icon: '✨' },
  { id: 'img2img', label: '图生图', icon: '🖼️' },
  { id: 'batch', label: '批量图生图', icon: '📦' }
];

const batchCounts = [
  { value: 1, label: '1张' },
  { value: 2, label: '2张' },
  { value: 4, label: '4张' },
  { value: 8, label: '8张' }
];

const handleImageUpload = (event) => {
  const files = event.target.files;
  if (!files || files.length === 0) return;
  
  const urls = [];
  for (let i = 0; i < Math.min(files.length, maxRefImages); i++) {
    urls.push(URL.createObjectURL(files[i]));
  }
  imageUrls.value = urls;
};

const removeImage = (index) => {
  imageUrls.value.splice(index, 1);
};

const generateSingleImage = async () => {
  if (!prompt.value.trim()) return;
  
  if (!user.value) {
    openAuth();
    return;
  }
  
  isLoading.value = true;
  generatedImages.value = [];
  error.value = '';
  
  try {
    const response = await generateImage(prompt.value, selectedModel.value, 1, 'url', 'url');
    
    let imgUrl = '';
    if (response.choices && response.choices[0]?.message?.content) {
      const content = response.choices[0].message.content;
      const urlMatch = content.match(/https?:\/\/[^\s"'<>`]+/);
      imgUrl = urlMatch ? urlMatch[0] : content;
    } else if (response.data && response.data[0]) {
      const imageData = response.data[0];
      if (imageData.b64_json) {
        imgUrl = `data:image/png;base64,${imageData.b64_json}`;
      } else if (imageData.url) {
        imgUrl = imageData.url;
      }
    } else if (response.url) {
      imgUrl = response.url;
    } else if (typeof response === 'string') {
      const urlMatch = response.match(/https?:\/\/[^\s"'<>]+/);
      imgUrl = urlMatch ? urlMatch[0] : response;
    } else {
      throw new Error('无法解析图像URL');
    }
    
    if (imgUrl && !imgUrl.startsWith('data:')) {
      imgUrl = imgUrl.replace(/https:\/\/grok2api-xings-projects-3a939220\.vercel\.app/g, 'https://www.371181668.xyz')
        .replace(/http:\/\/43\.165\.172\.5:6001/g, '');
    }
    
    if (imgUrl) {
      generatedImages.value = [imgUrl];
      generateHistory.add({
        type: 'image',
        prompt: prompt.value,
        url: imgUrl,
        mode: 'text2img',
        model: selectedModel.value
      });
    }
  } catch (err) {
    console.error('图像生成失败:', err);
    error.value = '图像生成失败，请稍后重试。';
  } finally {
    isLoading.value = false;
  }
};

const generateImageToImage = async () => {
  if (!prompt.value.trim() || imageUrls.value.length === 0) return;
  
  if (!user.value) {
    openAuth();
    return;
  }
  
  isLoading.value = true;
  generatedImages.value = [];
  error.value = '';
  
  try {
    const response = await generateImageFromImage(imageUrls.value, prompt.value, selectedModel.value, 1);
    
    let imgUrl = '';
    if (response.choices && response.choices[0]?.message?.content) {
      const content = response.choices[0].message.content;
      const urlMatch = content.match(/https?:\/\/[^\s"'<>`]+/);
      imgUrl = urlMatch ? urlMatch[0] : content;
    } else if (response.data && response.data[0]) {
      const imageData = response.data[0];
      if (imageData.b64_json) {
        imgUrl = `data:image/png;base64,${imageData.b64_json}`;
      } else if (imageData.url) {
        imgUrl = imageData.url;
      }
    } else if (response.url) {
      imgUrl = response.url;
    } else if (typeof response === 'string') {
      const urlMatch = response.match(/https?:\/\/[^\s"'<>]+/);
      imgUrl = urlMatch ? urlMatch[0] : response;
    } else {
      throw new Error('无法解析图像URL');
    }
    
    if (imgUrl && !imgUrl.startsWith('data:')) {
      imgUrl = imgUrl.replace(/https:\/\/grok2api-xings-projects-3a939220\.vercel\.app/g, 'https://www.371181668.xyz')
        .replace(/http:\/\/43\.165\.172\.5:6001/g, '');
    }
    
    if (imgUrl) {
      generatedImages.value = [imgUrl];
      generateHistory.add({
        type: 'image',
        prompt: prompt.value,
        url: imgUrl,
        mode: 'img2img',
        sourceImages: imageUrls.value,
        model: selectedModel.value
      });
    }
  } catch (err) {
    console.error('图生图失败:', err);
    error.value = '图生图失败，请稍后重试。';
  } finally {
    isLoading.value = false;
  }
};

const generateBatchImages = async () => {
  if (!prompt.value.trim()) return;
  
  if (!user.value) {
    openAuth();
    return;
  }
  
  isLoading.value = true;
  generatedImages.value = [];
  error.value = '';
  
  try {
    const results = [];
    for (let i = 0; i < batchTasks.value.length; i++) {
      const task = batchTasks.value[i];
      if (!task.prompt.trim() || task.images.length === 0) continue;
      
      const response = await generateImageFromImage(task.images, task.prompt, selectedModel.value, 1);
      
      let imgUrl = '';
      if (response.choices && response.choices[0]?.message?.content) {
        const content = response.choices[0].message.content;
        const urlMatch = content.match(/https?:\/\/[^\s"'<>`]+/);
        imgUrl = urlMatch ? urlMatch[0] : content;
      } else if (response.data && response.data[0]) {
        const imageData = response.data[0];
        if (imageData.b64_json) {
          imgUrl = `data:image/png;base64,${imageData.b64_json}`;
        } else if (imageData.url) {
          imgUrl = imageData.url;
        }
      } else if (response.url) {
        imgUrl = response.url;
      } else if (typeof response === 'string') {
        const urlMatch = response.match(/https?:\/\/[^\s"'<>]+/);
        imgUrl = urlMatch ? urlMatch[0] : response;
      }
      
      if (imgUrl && !imgUrl.startsWith('data:')) {
        imgUrl = imgUrl.replace(/https:\/\/grok2api-xings-projects-3a939220\.vercel\.app/g, 'https://www.371181668.xyz')
          .replace(/http:\/\/43\.165\.172\.5:6001/g, '');
      }
      
      if (imgUrl) {
        results.push(imgUrl);
        generateHistory.add({
          type: 'image',
          prompt: task.prompt,
          url: imgUrl,
          mode: 'batch',
          sourceImages: task.images,
          model: selectedModel.value
        });
      }
    }
    
    generatedImages.value = results;
  } catch (err) {
    console.error('批量图生图失败:', err);
    error.value = '批量图生图失败，请稍后重试。';
  } finally {
    isLoading.value = false;
  }
};

const handleGenerate = () => {
  if (activeMode.value === 'batch') {
    generateAllBatchTasks();
  } else if (activeMode.value === 'text2img') {
    generateSingleImage();
  } else {
    generateImageToImage();
  }
};

const clearResult = () => {
  generatedImages.value = [];
  error.value = '';
};

const downloadImage = (url, index) => {
  if (!url) return;
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `ai-generated-image-${Date.now()}-${index}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const canGenerate = () => {
  if (!prompt.value.trim()) return false;
  if (activeMode.value === 'img2img' && imageUrls.value.length === 0) return false;
  return true;
};
</script>

<template>
  <div class="generator-wrapper">
    <div class="generator-header">
      <div class="header-icon">🎨</div>
      <div class="header-info">
        <h3>AI 图像生成</h3>
        <p>支持文生图、图生图、批量图生图</p>
      </div>
    </div>
    
    <div class="mode-tabs">
      <button
        v-for="mode in modes"
        :key="mode.id"
        :class="['mode-btn', { active: activeMode === mode.id }]"
        @click="activeMode = mode.id"
        :disabled="isLoading"
      >
        <span class="mode-icon">{{ mode.icon }}</span>
        <span class="mode-label">{{ mode.label }}</span>
      </button>
    </div>
    
    <div class="generator-body">
      <div class="input-section">
        <label class="input-label">
          <span class="label-icon">✨</span>
          图像描述
        </label>
        <textarea 
          v-model="prompt"
          :placeholder="activeMode === 'text2img' ? '描述您想要生成的图像，例如：一只在太空漂浮的猫，周围环绕着星星和星云...' : '描述您想要转换的图像效果，例如：转换成油画风格...'"
          rows="4"
          :disabled="isLoading"
          class="prompt-input"
        ></textarea>
        
        <div class="negative-prompt" v-if="activeMode === 'text2img'">
          <label class="input-label">
            <span class="label-icon">🚫</span>
            反向提示词（可选）
          </label>
          <input 
            v-model="negativePrompt"
            placeholder="不想要的内容，例如：模糊、低质量..."
            :disabled="isLoading"
            class="negative-input"
          />
        </div>
      </div>
      
      <div class="upload-section" v-if="activeMode === 'img2img'">
        <label class="input-label">
          <span class="label-icon">📁</span>
          上传参考图片（最多{{ maxRefImages }}张）
        </label>
        <div class="upload-area">
          <input 
            type="file" 
            accept="image/*" 
            multiple
            @change="handleImageUpload($event, false)"
            :disabled="isLoading"
            class="file-input"
            id="image-upload"
          />
          <label for="image-upload" class="upload-label">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            <span>点击上传图片</span>
          </label>
        </div>
        
        <div class="image-preview-grid" v-if="imageUrls.length > 0">
          <div v-for="(url, index) in imageUrls" :key="index" class="preview-item">
            <img :src="url" :alt="`参考图${index + 1}`" />
            <button class="remove-btn" @click="removeImage(index, false)">×</button>
          </div>
        </div>
      </div>
      
      <div class="batch-section" v-if="activeMode === 'batch'">
        <div class="batch-unified-settings">
          <div class="unified-header">
            <span class="unified-icon">⚙️</span>
            <span>统一设置</span>
          </div>
          <div class="unified-controls">
            <select v-model="batchModelBase" class="unified-select">
              <option v-for="m in batchModelBases" :key="m.value" :value="m.value">{{ m.label }}</option>
            </select>
            <select v-model="batchRatio" class="unified-select">
              <option v-for="r in batchRatios" :key="r.value" :value="r.value">{{ r.label }}</option>
            </select>
            <select v-model="batchResolution" class="unified-select">
              <option v-for="r in batchResolutions" :key="r.value" :value="r.value">{{ r.label }}</option>
            </select>
            <button @click="applyBatchSettings" class="apply-btn">应用全部</button>
          </div>
        </div>
        
        <div class="batch-tasks-grid">
          <div v-for="task in batchTasks" :key="task.id" class="batch-task-card">
            <div class="task-header">
              <div class="task-title">
                <span>任务 {{ task.id }}</span>
                <span class="task-status" :class="task.status">{{ task.status === 'pending' ? '待开始' : task.status === 'running' ? '生成中' : task.status === 'completed' ? '已完成' : '失败' }}</span>
              </div>
              <button class="task-close" @click="removeBatchTask(task.id)" :disabled="task.loading">×</button>
            </div>
            
            <div class="task-image-slots">
              <div v-for="slotIndex in 3" :key="slotIndex" class="image-slot">
                <template v-if="task.images[slotIndex - 1]">
                  <img :src="task.images[slotIndex - 1]" :alt="`参考图${slotIndex}`" />
                  <button class="slot-remove" @click="removeBatchImage(task.id, slotIndex - 1)">×</button>
                </template>
                <label v-else class="slot-add" :for="`task-${task.id}-upload`">
                  <span>+</span>
                </label>
                <input 
                  type="file" 
                  accept="image/*" 
                  :id="`task-${task.id}-upload`"
                  @change="addBatchImage(task.id, $event)"
                  :disabled="task.loading || task.images.length >= 3"
                  class="file-input"
                />
              </div>
            </div>
            
            <textarea 
              v-model="task.prompt"
              placeholder="输入提示词..."
              rows="2"
              :disabled="task.loading"
              class="task-prompt-input"
            ></textarea>
            
            <button 
              @click="generateBatchTask(task.id)" 
              :disabled="task.loading || !task.prompt.trim() || task.images.length === 0"
              class="task-generate-btn"
            >
              <span v-if="task.loading" class="btn-content">
                <span class="spinner-small"></span>
                生成中...
              </span>
              <span v-else>开始</span>
            </button>
            
            <div v-if="task.result" class="task-result">
              <img :src="task.result" alt="生成结果" />
              <a :href="task.result" target="_blank" class="result-overlay-btn">查看原图</a>
            </div>
          </div>
        </div>
        
        <button 
          @click="generateAllBatchTasks" 
          :disabled="batchTasks.every(t => !t.prompt.trim() || t.images.length === 0)"
          class="generate-all-btn"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
          全部生成
        </button>
      </div>
      
      <div class="settings-section" v-if="activeMode !== 'batch'">
        <label class="input-label">
          <span class="label-icon">⚙️</span>
          生成设置
        </label>
        
        <div class="settings-grid">
          <div class="setting-group">
            <span class="setting-label">选择模型</span>
            <select v-model="selectedModel" :disabled="isLoading" class="model-select">
              <optgroup v-for="group in models" :key="group.group" :label="group.group">
                <option v-for="option in group.options" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </optgroup>
            </select>
          </div>
          
          <div class="setting-group" v-if="activeMode === 'text2img'">
            <span class="setting-label">生成数量</span>
            <div class="count-options">
              <button
                v-for="count in batchCounts"
                :key="count.value"
                :class="['count-btn', { active: imageCount === count.value }]"
                @click="imageCount = count.value"
                :disabled="isLoading"
              >
                {{ count.label }}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <button 
        v-if="activeMode !== 'batch'"
        @click="handleGenerate" 
        :disabled="isLoading || !canGenerate()"
        class="generate-btn"
      >
        <span v-if="isLoading" class="btn-content">
          <span class="spinner"></span>
          创作中...
        </span>
        <span v-else class="btn-content">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
          {{ activeMode === 'text2img' ? '开始创作' : '开始转换' }}
        </span>
      </button>
    </div>
    
    <Transition name="fade">
      <div v-if="generatedImages.length > 0 || error" class="result-section">
        <div class="result-header">
          <h4>{{ error ? '生成失败' : `创作完成 (${generatedImages.length}张)` }}</h4>
          <button @click="clearResult" class="clear-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
        
        <div v-if="error" class="error-message">
          <span class="error-icon">⚠️</span>
          {{ error }}
        </div>
        
        <div v-else class="image-results">
          <div v-for="(img, index) in generatedImages" :key="index" class="result-item">
            <div class="image-container">
              <img :src="img" :alt="`生成的图像${index + 1}`" />
              <div class="image-overlay">
                <div class="overlay-buttons">
                  <a :href="img" target="_blank" class="overlay-btn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                      <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                    </svg>
                    查看原图
                  </a>
                  <button @click="downloadImage(img, index)" class="overlay-btn download-btn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                      <polyline points="7 10 12 15 17 10"/>
                      <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                    下载图片
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.generator-wrapper {
  background: var(--card-bg);
  backdrop-filter: blur(20px);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-card);
}

.generator-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px;
  background: rgba(255, 255, 255, 0.03);
  border-bottom: 1px solid var(--card-border);
}

.header-icon {
  font-size: 2.5em;
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--secondary-gradient);
  border-radius: var(--radius-md);
}

.header-info h3 {
  font-size: 1.3em;
  font-weight: 600;
  margin-bottom: 4px;
}

.header-info p {
  color: var(--text-muted);
  font-size: 14px;
}

.mode-tabs {
  display: flex;
  gap: 8px;
  padding: 16px 24px;
  background: rgba(255, 255, 255, 0.02);
  border-bottom: 1px solid var(--card-border);
}

.mode-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition);
}

.mode-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(102, 126, 234, 0.5);
}

.mode-btn.active {
  background: var(--secondary-gradient);
  border-color: transparent;
  color: white;
  box-shadow: 0 4px 15px rgba(240, 147, 251, 0.4);
}

.mode-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.mode-icon {
  font-size: 1.2em;
}

.generator-body {
  padding: 24px;
}

.input-section {
  margin-bottom: 20px;
}

.input-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: 10px;
}

.label-icon {
  font-size: 1.2em;
}

.prompt-input {
  width: 100%;
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: 15px;
  line-height: 1.6;
  resize: vertical;
  min-height: 120px;
  transition: var(--transition);
  font-family: inherit;
}

.prompt-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
}

.prompt-input::placeholder {
  color: var(--text-muted);
}

.prompt-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.negative-prompt {
  margin-top: 16px;
}

.negative-input {
  width: 100%;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: 14px;
  transition: var(--transition);
  font-family: inherit;
}

.negative-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
}

.negative-input::placeholder {
  color: var(--text-muted);
}

.upload-section {
  margin-bottom: 20px;
}

.upload-area {
  border: 2px dashed var(--card-border);
  border-radius: var(--radius-md);
  padding: 32px;
  text-align: center;
  transition: var(--transition);
  cursor: pointer;
}

.upload-area:hover {
  border-color: #667eea;
  background: rgba(102, 126, 234, 0.05);
}

.file-input {
  display: none;
}

.upload-label {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: var(--text-secondary);
  cursor: pointer;
}

.upload-label svg {
  color: #667eea;
}

.image-preview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
  margin-top: 16px;
}

.preview-item {
  position: relative;
  border-radius: var(--radius-md);
  overflow: hidden;
  aspect-ratio: 1;
}

.preview-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.single-preview {
  position: relative;
  margin-top: 16px;
  border-radius: var(--radius-md);
  overflow: hidden;
  max-width: 400px;
}

.single-preview img {
  width: 100%;
  display: block;
}

.remove-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.7);
  border: none;
  border-radius: 50%;
  color: white;
  font-size: 18px;
  cursor: pointer;
  transition: var(--transition);
}

.remove-btn:hover {
  background: rgba(239, 68, 68, 0.9);
}

.settings-section {
  margin-bottom: 20px;
}

.settings-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.setting-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.setting-label {
  font-size: 13px;
  color: var(--text-muted);
  font-weight: 500;
}

.model-select {
  width: 100%;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: 14px;
  cursor: pointer;
  transition: var(--transition);
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23667eea' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 16px center;
  padding-right: 40px;
}

.model-select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
}

.model-select:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.model-select option {
  background: #1e1e28;
  color: var(--text-primary);
  padding: 8px;
}

.model-select optgroup {
  color: var(--text-muted);
  font-weight: 600;
}

.size-options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.size-btn {
  padding: 10px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  font-size: 13px;
  cursor: pointer;
  transition: var(--transition);
}

.size-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(102, 126, 234, 0.5);
}

.size-btn.active {
  background: rgba(102, 126, 234, 0.2);
  border-color: #667eea;
  color: var(--text-primary);
}

.size-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.count-options {
  display: flex;
  gap: 8px;
}

.count-btn {
  flex: 1;
  padding: 10px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  font-size: 13px;
  cursor: pointer;
  transition: var(--transition);
}

.count-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(102, 126, 234, 0.5);
}

.count-btn.active {
  background: rgba(102, 126, 234, 0.2);
  border-color: #667eea;
  color: var(--text-primary);
}

.count-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.generate-btn {
  width: 100%;
  padding: 16px 24px;
  background: var(--secondary-gradient);
  border: none;
  border-radius: var(--radius-md);
  color: white;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition);
  box-shadow: 0 4px 15px rgba(240, 147, 251, 0.4);
}

.generate-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(240, 147, 251, 0.6);
}

.generate-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.result-section {
  margin: 0 24px 24px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-md);
  animation: fadeIn 0.4s ease;
}

.result-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.result-header h4 {
  font-size: 1em;
  font-weight: 600;
}

.clear-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  cursor: pointer;
  transition: var(--transition);
}

.clear-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  color: var(--text-primary);
}

.error-message {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: var(--radius-md);
  color: #ef4444;
}

.error-icon {
  font-size: 1.2em;
}

.image-results {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.result-item {
  border-radius: var(--radius-md);
  overflow: hidden;
}

.image-container {
  position: relative;
  background: rgba(0, 0, 0, 0.3);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.image-container img {
  width: 100%;
  height: auto;
  display: block;
  transition: transform 0.3s ease;
}

.image-container:hover img {
  transform: scale(1.02);
}

.image-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.image-container:hover .image-overlay {
  opacity: 1;
}

.overlay-buttons {
  display: flex;
  gap: 12px;
}

.overlay-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: white;
  border: none;
  border-radius: var(--radius-md);
  color: #333;
  font-weight: 500;
  font-size: 14px;
  text-decoration: none;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.overlay-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
}

.download-btn {
  background: var(--secondary-gradient);
  color: white;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

.batch-section {
  padding: 0 24px 24px;
}

.batch-unified-settings {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-md);
  padding: 16px 20px;
  margin-bottom: 20px;
}

.unified-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  color: var(--text-primary);
  font-weight: 600;
  font-size: 14px;
}

.unified-icon {
  font-size: 16px;
}

.unified-controls {
  display: flex;
  gap: 12px;
  align-items: center;
}

.unified-select {
  flex: 1;
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-size: 13px;
  cursor: pointer;
  transition: var(--transition);
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23667eea' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 32px;
}

.unified-select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
}

.unified-select option {
  background: #1e1e28;
  color: var(--text-primary);
}

.apply-btn {
  padding: 10px 20px;
  background: var(--secondary-gradient);
  border: none;
  border-radius: var(--radius-sm);
  color: white;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition);
  white-space: nowrap;
}

.apply-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(240, 147, 251, 0.4);
}

.batch-tasks-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.batch-task-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-md);
  padding: 16px;
  transition: var(--transition);
}

.batch-task-card:hover {
  border-color: rgba(102, 126, 234, 0.3);
}

.task-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.task-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.task-status {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 500;
}

.task-status.pending {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-muted);
}

.task-status.running {
  background: rgba(102, 126, 234, 0.2);
  color: #667eea;
}

.task-status.completed {
  background: rgba(76, 175, 80, 0.2);
  color: #4caf50;
}

.task-status.error {
  background: rgba(244, 67, 54, 0.2);
  color: #f44336;
}

.task-close {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 18px;
  cursor: pointer;
  border-radius: 4px;
  transition: var(--transition);
}

.task-close:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-primary);
}

.task-close:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.task-image-slots {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.image-slot {
  flex: 1;
  aspect-ratio: 1;
  border: 1px dashed var(--card-border);
  border-radius: var(--radius-sm);
  overflow: hidden;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.02);
}

.image-slot img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.slot-add {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--text-muted);
  font-size: 20px;
  transition: var(--transition);
}

.slot-add:hover {
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-primary);
}

.slot-remove {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.6);
  border: none;
  border-radius: 50%;
  color: white;
  font-size: 14px;
  cursor: pointer;
  transition: var(--transition);
}

.slot-remove:hover {
  background: rgba(244, 67, 54, 0.8);
}

.task-prompt-input {
  width: 100%;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-size: 13px;
  resize: vertical;
  transition: var(--transition);
  margin-bottom: 12px;
}

.task-prompt-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
}

.task-prompt-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.task-generate-btn {
  width: 100%;
  padding: 10px;
  background: var(--secondary-gradient);
  border: none;
  border-radius: var(--radius-sm);
  color: white;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition);
}

.task-generate-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(240, 147, 251, 0.4);
}

.task-generate-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.task-result {
  margin-top: 12px;
  position: relative;
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.task-result img {
  width: 100%;
  display: block;
  border-radius: var(--radius-sm);
}

.result-overlay-btn {
  position: absolute;
  bottom: 8px;
  right: 8px;
  padding: 4px 10px;
  background: rgba(0, 0, 0, 0.7);
  border-radius: 4px;
  color: white;
  font-size: 11px;
  text-decoration: none;
  transition: var(--transition);
}

.result-overlay-btn:hover {
  background: rgba(102, 126, 234, 0.8);
}

.generate-all-btn {
  width: 100%;
  padding: 14px 24px;
  background: var(--secondary-gradient);
  border: none;
  border-radius: var(--radius-md);
  color: white;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  box-shadow: 0 4px 15px rgba(240, 147, 251, 0.4);
}

.generate-all-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(240, 147, 251, 0.6);
}

.generate-all-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.spinner-small {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  display: inline-block;
}

@media (max-width: 640px) {
  .batch-tasks-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .unified-controls {
    flex-wrap: wrap;
  }
  
  .unified-select {
    min-width: 120px;
  }
  
  .generator-header {
    padding: 20px;
  }
  
  .generator-body {
    padding: 20px;
  }
  
  .mode-tabs {
    padding: 12px 20px;
  }
  
  .mode-btn {
    padding: 10px 12px;
    font-size: 13px;
  }
  
  .mode-label {
    display: none;
  }
  
  .result-section {
    margin: 0 20px 20px;
  }
  
  .image-results {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .batch-tasks-grid {
    grid-template-columns: 1fr;
  }
}
</style>