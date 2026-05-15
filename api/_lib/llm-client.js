const { getEnv } = require('./env');
const { fetchJson, withRetry } = require('./retry');

function extractJson(text) {
  if (!text) throw new Error('Qwen returned empty content.');

  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('Qwen response did not contain JSON.');
    return JSON.parse(match[0]);
  }
}

async function callQwen(messages, options = {}) {
  const apiKey = getEnv('QWEN_API_KEY');
  if (!apiKey) throw new Error('QWEN_API_KEY is required when AI_KITCHEN_USE_MOCK=false.');

  const baseUrl = getEnv('QWEN_BASE_URL', 'https://dashscope.aliyuncs.com/compatible-mode/v1').replace(/\/$/, '');
  const model = getEnv('QWEN_MODEL', 'qwen-flash');

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

async function callQwenJson(messages, options = {}) {
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

    return callQwen(nextMessages, options);
  }, { retries: 1 });
}

module.exports = {
  callQwenJson,
  extractJson,
};
