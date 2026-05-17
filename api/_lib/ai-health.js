const { getEnv, useMock } = require('./env');
const { callZhipuJson } = require('./llm-client');
const { fetchJson } = require('./retry');
const { getImageProvider } = require('./sd-client');

function hideSecret(value) {
  if (!value) return '';
  const text = String(value);
  if (text.length <= 8) return '***';
  return `${text.slice(0, 4)}...${text.slice(-4)}`;
}

function getSdAuthHeader() {
  const username = getEnv('SD_WEBUI_USERNAME');
  const password = getEnv('SD_WEBUI_PASSWORD');
  if (!username || !password) return {};

  return {
    Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,
  };
}

function getAiConfigStatus() {
  const zhipuApiKey = getEnv('ZHIPU_API_KEY');
  const imageProvider = getImageProvider();
  const sdBaseUrl = getEnv('SD_WEBUI_BASE_URL', 'http://127.0.0.1:7860');
  const pixelCheckpoint = getEnv('PIXELRTXL_CHECKPOINT');
  const fusionCheckpoint = getEnv('SD_FUSION_CHECKPOINT');

  return {
    mode: useMock() ? 'mock' : 'real',
    mockEnabled: useMock(),
    zhipu: {
      configured: Boolean(zhipuApiKey),
      apiKey: hideSecret(zhipuApiKey),
      baseUrl: getEnv('ZHIPU_BASE_URL', 'https://open.bigmodel.cn/api/paas/v4'),
      model: getEnv('ZHIPU_MODEL', 'glm-4.7-flash'),
    },
    imageProvider: {
      provider: imageProvider,
      configured: imageProvider === 'zhipu' ? Boolean(zhipuApiKey) : Boolean(sdBaseUrl),
      cloudReady: imageProvider === 'zhipu' && Boolean(zhipuApiKey),
      zhipu: {
        configured: Boolean(zhipuApiKey),
        apiKey: hideSecret(zhipuApiKey),
        model: getEnv('ZHIPU_IMAGE_MODEL', 'cogview-3-flash'),
        size: getEnv('ZHIPU_IMAGE_SIZE', '1024x1024'),
        quality: getEnv('ZHIPU_IMAGE_QUALITY', 'standard'),
      },
    },
    stableDiffusion: {
      configured: imageProvider === 'sd-webui' && Boolean(sdBaseUrl),
      baseUrl: sdBaseUrl,
      hasAuth: Boolean(getEnv('SD_WEBUI_USERNAME') && getEnv('SD_WEBUI_PASSWORD')),
      pixelCheckpointConfigured: imageProvider === 'sd-webui' && Boolean(pixelCheckpoint),
      fusionCheckpointConfigured: imageProvider === 'sd-webui' && Boolean(fusionCheckpoint),
      pixelCheckpoint: pixelCheckpoint || '',
      fusionCheckpoint: fusionCheckpoint || '',
    },
  };
}

async function checkZhipu() {
  const startedAt = Date.now();

  try {
    if (!getEnv('ZHIPU_API_KEY')) {
      throw new Error('ZHIPU_API_KEY is not configured.');
    }

    const result = await callZhipuJson([
      {
        role: 'system',
        content: '你是 AI Kitchen API health checker。必须只输出 JSON。',
      },
      {
        role: 'user',
        content: JSON.stringify({
          task: 'health_check',
          requiredJsonShape: {
            ok: true,
            message: '短中文状态',
          },
        }),
      },
    ], { temperature: 0 });

    return {
      ok: true,
      latencyMs: Date.now() - startedAt,
      message: result.message || 'Zhipu GLM API connected.',
    };
  } catch (error) {
    return {
      ok: false,
      latencyMs: Date.now() - startedAt,
      message: error.message || 'Zhipu GLM API health check failed.',
    };
  }
}

async function checkZhipuImage() {
  const startedAt = Date.now();

  try {
    if (!getEnv('ZHIPU_API_KEY')) {
      throw new Error('ZHIPU_API_KEY is not configured.');
    }

    return {
      ok: true,
      latencyMs: Date.now() - startedAt,
      message: 'Zhipu CogView image provider is configured. Image generation is validated by a real game run to avoid extra billing in health checks.',
      model: getEnv('ZHIPU_IMAGE_MODEL', 'cogview-3-flash'),
    };
  } catch (error) {
    return {
      ok: false,
      latencyMs: Date.now() - startedAt,
      message: error.message || 'Zhipu CogView image provider health check failed.',
    };
  }
}

async function checkStableDiffusion() {
  const startedAt = Date.now();
  const baseUrl = getEnv('SD_WEBUI_BASE_URL', 'http://127.0.0.1:7860').replace(/\/$/, '');

  try {
    const options = await fetchJson(`${baseUrl}/sdapi/v1/options`, {
      method: 'GET',
      headers: getSdAuthHeader(),
      timeoutMs: 5000,
    });

    let modelCount = 0;
    try {
      const models = await fetchJson(`${baseUrl}/sdapi/v1/sd-models`, {
        method: 'GET',
        headers: getSdAuthHeader(),
        timeoutMs: 5000,
      });
      modelCount = Array.isArray(models) ? models.length : 0;
    } catch {
      modelCount = 0;
    }

    return {
      ok: true,
      latencyMs: Date.now() - startedAt,
      message: 'Stable Diffusion WebUI API connected.',
      currentCheckpoint: options.sd_model_checkpoint || '',
      modelCount,
    };
  } catch (error) {
    return {
      ok: false,
      latencyMs: Date.now() - startedAt,
      message: error.message || 'Stable Diffusion WebUI health check failed.',
    };
  }
}

async function checkImageProvider() {
  if (getImageProvider() === 'zhipu') {
    return checkZhipuImage();
  }

  return checkStableDiffusion();
}

async function getAiHealth({ live = false } = {}) {
  const config = getAiConfigStatus();
  if (!live) {
    return {
      config,
      checks: {
        zhipu: { ok: null, message: 'Pass live=true to test the remote API.' },
        imageProvider: { ok: null, message: 'Pass live=true to validate the selected image provider configuration.' },
        stableDiffusion: { ok: null, message: 'Pass live=true to test the local WebUI API when IMAGE_PROVIDER=sd-webui.' },
      },
    };
  }

  const [zhipu, imageProvider] = await Promise.all([
    checkZhipu(),
    checkImageProvider(),
  ]);

  return {
    config,
    checks: {
      zhipu,
      imageProvider,
      stableDiffusion: imageProvider,
    },
  };
}

module.exports = {
  checkImageProvider,
  checkZhipu,
  checkZhipuImage,
  checkStableDiffusion,
  getAiConfigStatus,
  getAiHealth,
};
