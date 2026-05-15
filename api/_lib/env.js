const fs = require('node:fs');
const path = require('node:path');

let loaded = false;

function loadDotEnv() {
  if (loaded) return;
  loaded = true;

  const envPath = path.resolve(__dirname, '..', '..', '.env');
  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const index = trimmed.indexOf('=');
    if (index === -1) continue;

    const key = trimmed.slice(0, index).trim();
    const rawValue = trimmed.slice(index + 1).trim();
    const value = rawValue.replace(/^["']|["']$/g, '');

    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function getEnv(name, fallback = '') {
  loadDotEnv();
  return process.env[name] || fallback;
}

function getNumberEnv(name, fallback) {
  const value = Number(getEnv(name));
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function useMock() {
  const value = getEnv('AI_KITCHEN_USE_MOCK', 'true').toLowerCase();
  return value !== 'false';
}

module.exports = {
  getEnv,
  getNumberEnv,
  loadDotEnv,
  useMock,
};
