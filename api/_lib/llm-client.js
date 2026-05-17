const { getEnv } = require('./env');
const { fetchJson, withRetry } = require('./retry');

function extractJson(text) {
  if (!text) throw new Error('GLM returned empty content.');

  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('GLM response did not contain JSON.');
    return JSON.parse(match[0]);
  }
}

async function callZhipu(messages, options = {}) {
  const apiKey = getEnv('ZHIPU_API_KEY');
  if (!apiKey) throw new Error('ZHIPU_API_KEY is required when AI_KITCHEN_USE_MOCK=false.');

  const baseUrl = getEnv('ZHIPU_BASE_URL', 'https://open.bigmodel.cn/api/paas/v4').replace(/\/$/, '');
  const model = getEnv('ZHIPU_MODEL', 'glm-4.7-flash');

  const data = await fetchJson(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: options.temperature ?? 0.7,
      response_format: { type: 'json_object' },
    }),
  });

  const content = data?.choices?.[0]?.message?.content;
  return extractJson(content);
}

async function callZhipuJson(messages, options = {}) {
  return withRetry(async (attempt) => {
    const nextMessages = attempt === 0
      ? messages
      : [
        ...messages,
        {
          role: 'user',
          content: '上一次输出无法解析为 JSON。请严格只输出一个合法 JSON 对象，不要 Markdown，不要解释。',
        },
      ];

    return callZhipu(nextMessages, options);
  }, { retries: 1 });
}

module.exports = {
  callZhipuJson,
  extractJson,
};
