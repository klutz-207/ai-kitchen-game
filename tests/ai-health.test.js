const assert = require('node:assert/strict');
const test = require('node:test');

process.env.AI_KITCHEN_USE_MOCK = 'true';
process.env.ZHIPU_API_KEY = 'sk-test-secret-value';
process.env.ZHIPU_MODEL = 'glm-4.7-flash';
process.env.IMAGE_PROVIDER = 'zhipu';
process.env.ZHIPU_IMAGE_MODEL = 'cogview-3-flash';
process.env.SD_WEBUI_BASE_URL = 'http://127.0.0.1:7860';
process.env.PIXELRTXL_CHECKPOINT = 'pixelrtxl-test';
process.env.SD_FUSION_CHECKPOINT = 'pixelrtxl-fusion-test';

const { getAiConfigStatus, getAiHealth } = require('../api/_lib/ai-health');

test('ai health config redacts API keys and exposes integration status', () => {
  const status = getAiConfigStatus();

  assert.equal(status.mode, 'mock');
  assert.equal(status.zhipu.configured, true);
  assert.equal(status.zhipu.apiKey.includes('secret'), false);
  assert.equal(status.zhipu.model, 'glm-4.7-flash');
  assert.equal(status.imageProvider.provider, 'zhipu');
  assert.equal(status.imageProvider.cloudReady, true);
  assert.equal(status.imageProvider.zhipu.model, 'cogview-3-flash');
  assert.equal(status.stableDiffusion.configured, false);
  assert.equal(status.stableDiffusion.pixelCheckpointConfigured, false);
  assert.equal(status.stableDiffusion.fusionCheckpointConfigured, false);
});

test('ai health skips remote calls unless live mode is requested', async () => {
  const health = await getAiHealth({ live: false });

  assert.equal(health.checks.zhipu.ok, null);
  assert.equal(health.checks.imageProvider.ok, null);
  assert.equal(health.checks.stableDiffusion.ok, null);
});
