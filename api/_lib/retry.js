const { getNumberEnv } = require('./env');

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetry(fn, options = {}) {
  const retries = options.retries ?? getNumberEnv('AI_KITCHEN_RETRY_COUNT', 1);
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await fn(attempt);
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        await delay(options.delayMs ?? 600);
      }
    }
  }

  throw lastError;
}

async function fetchJson(url, options = {}) {
  const timeoutMs = options.timeoutMs ?? getNumberEnv('AI_KITCHEN_REQUEST_TIMEOUT_MS', 60000);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    const text = await response.text();
    const data = text ? JSON.parse(text) : {};

    if (!response.ok) {
      const error = new Error(data?.error?.message || data?.message || `Request failed: ${response.status}`);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } finally {
    clearTimeout(timer);
  }
}

module.exports = {
  fetchJson,
  withRetry,
};
