const { getAiHealth } = require('../api/_lib/ai-health');

function statusLabel(value) {
  if (value === true) return 'OK';
  if (value === false) return 'FAIL';
  return 'SKIP';
}

async function main() {
  const live = process.argv.includes('--live');
  const health = await getAiHealth({ live });

  console.log('AI Kitchen API integration check\n');
  console.log(`Mode: ${health.config.mode}`);
  console.log(`Qwen: ${health.config.qwen.configured ? 'configured' : 'missing key'} (${health.config.qwen.model})`);
  console.log(`Qwen base URL: ${health.config.qwen.baseUrl}`);
  console.log(`SD WebUI: ${health.config.stableDiffusion.baseUrl}`);
  console.log(`PixelRTXL checkpoint: ${health.config.stableDiffusion.pixelCheckpoint || '(not set)'}`);
  console.log(`Fusion checkpoint: ${health.config.stableDiffusion.fusionCheckpoint || '(not set)'}`);

  console.log('\nChecks:');
  for (const [name, check] of Object.entries(health.checks)) {
    const latency = Number.isFinite(check.latencyMs) ? ` ${check.latencyMs}ms` : '';
    console.log(`${statusLabel(check.ok)} ${name}${latency} - ${check.message}`);
  }

  if (live) {
    const failed = Object.values(health.checks).some((check) => check.ok === false);
    process.exitCode = failed ? 1 : 0;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
