const { getEnv, useMock } = require('./env');
const { callQwenJson } = require('./llm-client');
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
  const qwenApiKey = getEnv('QWEN_API_KEY');
  const dashScopeApiKey = getEnv('DASHSCOPE_API_KEY') || qwenApiKey;
  const imageProvider = getImageProvider();
  const sdBaseUrl = getEnv('SD_WEBUI_BASE_URL', 'http://127.0.0.1:7860');
  const pixelCheckpoint = getEnv('PIXELRTXL_CHECKPOINT');
  const fusionCheckpoint = getEnv('SD_FUSION_CHECKPOINT');

  return {
    mode: useMock() ? 'mock' : 'real',
    mockEnabled: useMock(),
    qwen: {
      configured: Boolean(qwenApiKey),
      apiKey: hideSecret(qwenApiKey),
      baseUrl: getEnv('QWEN_BASE_URL', 'https://dashscope.aliyuncs.com/compatible-mode/v1'),
      model: getEnv('QWEN_MODEL', 'qwen-flash'),
    },
    imageProvider: {
      provider: imageProvider,
      configured: imageProvider === 'dashscope' ? Boolean(dashScopeApiKey) : Boolean(sdBaseUrl),
      cloudReady: imageProvider === 'dashscope' && Boolean(dashScopeApiKey),
      dashscope: {
        configured: Boolean(dashScopeApiKey),
        apiKey: hideSecret(dashScopeApiKey),
        baseUrl: getEnv('DASHSCOPE_BASE_URL', 'https://dashscope.aliyuncs.com/api/v1'),
        endpoint: getEnv('DASHSCOPE_IMAGE_ENDPOINT', '/services/aigc/multimodal-generation/generation'),
        model: getEnv('DASHSCOPE_IMAGE_MODEL', 'wan2.7-image'),
        size: getEnv('DASHSCOPE_IMAGE_SIZE', '1K'),
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

async function checkQwen() {
  const startedAt = Date.now();

  try {
    if (!getEnv('QWEN_API_KEY')) {
      throw new Error('QWEN_API_KEY is not configured.');
    }

    const result = await callQwenJson([
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
      message: result.message || 'Qwen API connected.',
    };
  } catch (error) {
    return {
      ok: false,
      latencyMs: Date.now() - startedAt,
      message: error.message || 'Qwen API health check failed.',
    };
  }
}

async function checkDashScopeImage() {
  const startedAt = Date.now();

  try {
    if (!getDashScopeApiKeyForHealth()) {
      throw new Error('DASHSCOPE_API_KEY or QWEN_API_KEY is not configured.');
    }

    return {
      ok: true,
      latencyMs: Date.now() - startedAt,
      message: 'DashScope image provider is configured. Image generation is validated by a real game run to avoid extra billing in health checks.',
      model: getEnv('DASHSCOPE_IMAGE_MODEL', 'wan2.7-image'),
    };
  } catch (error) {
    return {
      ok: false,
      latencyMs: Date.now() - startedAt,
      message: error.message || 'DashScope image provider health check failed.',
    };
  }
}

function getDashScopeApiKeyForHealth() {
  return getEnv('DASHSCOPE_API_KEY') || getEnv('QWEN_API_KEY');
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
  if (getImageProvider() === 'dashscope') {
    return checkDashScopeImage();
  }

  return checkStableDiffusion();
}

async function getAiHealth({ live = false } = {}) {
  const config = getAiConfigStatus();
  if (!live) {
    return {
      config,
      checks: {
        qwen: { ok: null, message: 'Pass live=true to test the remote API.' },
        imageProvider: { ok: null, message: 'Pass live=true to validate the selected image provider configuration.' },
        stableDiffusion: { ok: null, message: 'Pass live=true to test the local WebUI API when IMAGE_PROVIDER=sd-webui.' },
      },
    };
  }

  const [qwen, imageProvider] = await Promise.all([
    checkQwen(),
    checkImageProvider(),
  ]);

  return {
    config,
    checks: {
      qwen,
      imageProvider,
      stableDiffusion: imageProvider,
    },
  };
}

module.exports = {
  checkDashScopeImage,
  checkImageProvider,
  checkQwen,
  checkStableDiffusion,
  getAiConfigStatus,
  getAiHealth,
};
