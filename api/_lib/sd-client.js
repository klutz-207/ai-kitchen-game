const { getEnv } = require('./env');
const { fetchJson, withRetry } = require('./retry');

function getImageProvider() {
  return getEnv('IMAGE_PROVIDER', 'zhipu').toLowerCase();
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

function getZhipuApiKey() {
  return getEnv('ZHIPU_API_KEY');
}

function getZhipuHeaders() {
  const apiKey = getZhipuApiKey();
  if (!apiKey) {
    throw new Error('ZHIPU_API_KEY is not configured.');
  }

  return {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };
}

function getZhipuImageUrl() {
  const baseUrl = getEnv('ZHIPU_BASE_URL', 'https://open.bigmodel.cn/api/paas/v4').replace(/\/$/, '');
  return `${baseUrl}/images/generations`;
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

async function generateZhipuImage({ prompt }) {
  const model = getEnv('ZHIPU_IMAGE_MODEL', 'cogview-3-flash');
  const size = getEnv('ZHIPU_IMAGE_SIZE', '1024x1024');
  const quality = getEnv('ZHIPU_IMAGE_QUALITY', 'standard');

  const data = await fetchJson(getZhipuImageUrl(), {
    method: 'POST',
    headers: getZhipuHeaders(),
    body: JSON.stringify({
      model,
      prompt,
      size,
      quality,
      n: 1,
    }),
  });

  const imageUrl = data?.data?.[0]?.url || '';
  if (!imageUrl) {
    throw new Error('Zhipu CogView returned no image URL.');
  }

  return {
    imageUrl: await fetchImageAsDataUrl(imageUrl),
    info: JSON.stringify({
      provider: 'zhipu',
      model,
      created: data?.created || '',
    }),
  };
}

async function generateTextToImage({ prompt, negativePrompt, checkpoint }) {
  if (getImageProvider() === 'zhipu') {
    return withRetry(() => generateZhipuImage({ prompt }));
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
  // TODO: Zhipu CogView-3-Flash 不直接支持图生图，需要后续选择图生图模型
  if (getImageProvider() === 'zhipu') {
    throw new Error('Zhipu CogView-3-Flash does not support image-to-image. Please use sd-webui or configure a different provider.');
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
