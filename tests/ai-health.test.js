const assert = require('node:assert/strict');
const test = require('node:test');

process.env.AI_KITCHEN_USE_MOCK = 'true';
process.env.QWEN_API_KEY = 'sk-test-secret-value';
process.env.QWEN_MODEL = 'qwen-flash';
process.env.IMAGE_PROVIDER = 'dashscope';
process.env.DASHSCOPE_IMAGE_MODEL = 'wan2.7-image';
process.env.SD_WEBUI_BASE_URL = 'http://127.0.0.1:7860';
process.env.PIXELRTXL_CHECKPOINT = 'pixelrtxl-test';
process.env.SD_FUSION_CHECKPOINT = 'pixelrtxl-fusion-test';

const { getAiConfigStatus, getAiHealth } = require('../api/_lib/ai-health');

test('ai health config redacts API keys and exposes integration status', () => {
  const status = getAiConfigStatus();

  assert.equal(status.mode, 'mock');
  assert.equal(status.qwen.configured, true);
  assert.equal(status.qwen.apiKey.includes('secret'), false);
  assert.equal(status.qwen.model, 'qwen-flash');
  assert.equal(status.imageProvider.provider, 'dashscope');
  assert.equal(status.imageProvider.cloudReady, true);
  assert.equal(status.imageProvider.dashscope.model, 'wan2.7-image');
  assert.equal(status.stableDiffusion.configured, false);
  assert.equal(status.stableDiffusion.pixelCheckpointConfigured, false);
  assert.equal(status.stableDiffusion.fusionCheckpointConfigured, false);
});

test('ai health skips remote calls unless live mode is requested', async () => {
  const health = await getAiHealth({ live: false });

  assert.equal(health.checks.qwen.ok, null);
  assert.equal(health.checks.imageProvider.ok, null);
  assert.equal(health.checks.stableDiffusion.ok, null);
});
