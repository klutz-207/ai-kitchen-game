async function parseBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') return JSON.parse(req.body || '{}');

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }

  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
}

function sendJson(res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify({ ok: true, data }));
}

function sendError(res, status, code, message) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify({ ok: false, error: { code, message } }));
}

function requireMethod(req, res, method) {
  if (req.method === method) return true;
  res.setHeader('Allow', method);
  sendError(res, 405, 'method_not_allowed', `Use ${method} for this endpoint.`);
  return false;
}

function isNonEmptyArray(value) {
  return Array.isArray(value) && value.length > 0;
}

async function handleApi(req, res, method, handler) {
  if (!requireMethod(req, res, method)) return;

  try {
    const body = method === 'GET' ? {} : await parseBody(req);
    const data = await handler(body, req);
    sendJson(res, 200, data);
  } catch (error) {
    if (error && error.statusCode) {
      sendError(res, error.statusCode, error.code, error.message);
      return;
    }

    sendError(res, 500, 'internal_error', '厨房后端临时糊锅了，请稍后再试。');
  }
}

function validationError(message) {
  const error = new Error(message);
  error.statusCode = 400;
  error.code = 'validation_error';
  return error;
}

module.exports = {
  handleApi,
  isNonEmptyArray,
  validationError,
};
