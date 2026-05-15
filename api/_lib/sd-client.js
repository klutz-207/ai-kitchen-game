const { getEnv } = require('./env');
const { fetchJson, withRetry } = require('./retry');

function getImageProvider() {
  return getEnv('IMAGE_PROVIDER', 'sd-webui').toLowerCase();
}

function getAuthHeader() {
  const username = getEnv('SD_WEBUI_USERNAME');
  const password = getEnv('SD_WEBUI_PASSWORD');
  if (!username || !password) return {};

  const token = Buffer.from(`${username}:${password}`).toString('base64');
  return { Authorization: `Basic ${token}` };
}

function stripDataUrl(image) {
  if (!image) return '';
  return String(image).replace(/^data:image\/\w+;base64,/, '');
}

function toDataUrl(image) {
  if (!image) throw new Error('Image provider returned no image.');
  if (String(image).startsWith('data:image/')) return image;
  return `data:image/png;base64,${image}`;
}

function buildOverrideSettings(checkpoint) {
  return checkpoint
    ? {
      override_settings: {
        sd_model_checkpoint: checkpoint,
      },
      override_settings_restore_afterwards: true,
    }
    : {};
}

async function postSd(path, payload) {
  const baseUrl = getEnv('SD_WEBUI_BASE_URL', 'http://127.0.0.1:7860').replace(/\/$/, '');

  return fetchJson(`${baseUrl}${path}`, {
    method: 'POST',
    headers: {
      ...getAuthHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}

function getDashScopeApiKey() {
  return getEnv('DASHSCOPE_API_KEY') || getEnv('QWEN_API_KEY');
}

function getDashScopeHeaders() {
  const apiKey = getDashScopeApiKey();
  if (!apiKey) {
    throw new Error('DASHSCOPE_API_KEY or QWEN_API_KEY is not configured.');
  }

  return {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };
}

function getDashScopeUrl() {
  const baseUrl = getEnv('DASHSCOPE_BASE_URL', 'https://dashscope.aliyuncs.com/api/v1').replace(/\/$/, '');
  const endpoint = getEnv('DASHSCOPE_IMAGE_ENDPOINT', '/services/aigc/multimodal-generation/generation');
  return `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
}

function buildDashScopeText(prompt, negativePrompt) {
  const avoid = negativePrompt ? `\n\nAvoid: ${negativePrompt}` : '';
  return `${prompt}${avoid}`;
}

function buildDashScopeContent({ prompt, negativePrompt, imageUrls = [] }) {
  const images = imageUrls
    .filter(Boolean)
    .slice(0, Number(getEnv('DASHSCOPE_MAX_INPUT_IMAGES', '2')))
    .map((image) => ({ image }));

  return [
    ...images,
    { text: buildDashScopeText(prompt, negativePrompt) },
  ];
}

function extractDashScopeImage(data) {
  const choices = data?.output?.choices || [];
  for (const choice of choices) {
    const content = choice?.message?.content || [];
    const imageItem = content.find((item) => item?.image);
    if (imageItem?.image) return imageItem.image;
  }

  const resultUrl = data?.output?.results?.[0]?.url || data?.output?.results?.[0]?.image;
  if (resultUrl) return resultUrl;

  return '';
}

async function fetchImageAsDataUrl(imageUrl) {
  if (String(imageUrl).startsWith('data:image/')) return imageUrl;

  const timeoutMs = Number(getEnv('AI_KITCHEN_REQUEST_TIMEOUT_MS', '60000'));
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(imageUrl, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`Image download failed: ${response.status}`);
    }

    const contentType = response.headers.get('content-type') || 'image/png';
    const buffer = Buffer.from(await response.arrayBuffer());
    return `data:${contentType};base64,${buffer.toString('base64')}`;
  } finally {
    clearTimeout(timer);
  }
}

async function generateDashScopeImage({ prompt, negativePrompt, imageUrls = [] }) {
  const model = getEnv('DASHSCOPE_IMAGE_MODEL', 'wan2.7-image');
  const data = await fetchJson(getDashScopeUrl(), {
    method: 'POST',
    headers: getDashScopeHeaders(),
    body: JSON.stringify({
      model,
      input: {
        messages: [
          {
            role: 'user',
            content: buildDashScopeContent({ prompt, negativePrompt, imageUrls }),
          },
        ],
      },
      parameters: {
        size: getEnv('DASHSCOPE_IMAGE_SIZE', '1K'),
        n: 1,
        watermark: getEnv('DASHSCOPE_IMAGE_WATERMARK', 'false').toLowerCase() === 'true',
        thinking_mode: getEnv('DASHSCOPE_IMAGE_THINKING_MODE', 'false').toLowerCase() === 'true',
      },
    }),
  });

  const imageUrl = extractDashScopeImage(data);
  return {
    imageUrl: await fetchImageAsDataUrl(imageUrl),
    info: JSON.stringify({
      provider: 'dashscope',
      model,
      requestId: data?.request_id || '',
      usage: data?.usage || null,
    }),
  };
}

async function generateTextToImage({ prompt, negativePrompt, checkpoint }) {
  if (getImageProvider() === 'dashscope') {
    return withRetry(() => generateDashScopeImage({ prompt, negativePrompt }));
  }

  return withRetry(async () => {
    const data = await postSd('/sdapi/v1/txt2img', {
      prompt,
      negative_prompt: negativePrompt,
      width: Number(getEnv('SD_TXT2IMG_WIDTH', '1024')),
      height: Number(getEnv('SD_TXT2IMG_HEIGHT', '1024')),
      steps: Number(getEnv('SD_TXT2IMG_STEPS', '24')),
      cfg_scale: Number(getEnv('SD_TXT2IMG_CFG_SCALE', '7')),
      sampler_name: getEnv('SD_SAMPLER', 'DPM++ 2M Karras'),
      batch_size: 1,
      n_iter: 1,
      ...buildOverrideSettings(checkpoint || getEnv('PIXELRTXL_CHECKPOINT')),
    });

    return {
      imageUrl: toDataUrl(data.images?.[0]),
      info: data.info,
    };
  });
}

async function generateImageToImage({ prompt, negativePrompt, imageUrls, checkpoint }) {
  if (getImageProvider() === 'dashscope') {
    return withRetry(() => generateDashScopeImage({ prompt, negativePrompt, imageUrls }));
  }

  return withRetry(async () => {
    const initImage = imageUrls.map(stripDataUrl).find(Boolean);
    const data = await postSd('/sdapi/v1/img2img', {
      init_images: initImage ? [initImage] : [],
      prompt,
      negative_prompt: negativePrompt,
      width: Number(getEnv('SD_IMG2IMG_WIDTH', '1024')),
      height: Number(getEnv('SD_IMG2IMG_HEIGHT', '1024')),
      steps: Number(getEnv('SD_IMG2IMG_STEPS', '28')),
      cfg_scale: Number(getEnv('SD_IMG2IMG_CFG_SCALE', '7')),
      denoising_strength: Number(getEnv('SD_IMG2IMG_DENOISING', '0.58')),
      sampler_name: getEnv('SD_SAMPLER', 'DPM++ 2M Karras'),
      batch_size: 1,
      n_iter: 1,
      ...buildOverrideSettings(checkpoint || getEnv('SD_FUSION_CHECKPOINT')),
    });

    return {
      imageUrl: toDataUrl(data.images?.[0]),
      info: data.info,
    };
  });
}

module.exports = {
  generateImageToImage,
  generateTextToImage,
  getImageProvider,
  stripDataUrl,
  toDataUrl,
};
