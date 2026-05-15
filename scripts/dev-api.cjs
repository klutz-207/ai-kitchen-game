const http = require('node:http');
const path = require('node:path');

const routes = {
  '/api/v1/guests': '../api/v1/guests.js',
  '/api/v1/guide': '../api/v1/guide.js',
  '/api/v1/dishes': '../api/v1/dishes.js',
  '/api/v1/fusions': '../api/v1/fusions.js',
  '/api/v1/feedback': '../api/v1/feedback.js',
  '/api/v1/sessions': '../api/v1/sessions.js',
  '/api/v1/health': '../api/v1/health.js',
};

const dynamicRoutes = [
  {
    pattern: /^\/api\/v1\/sessions\/([^/]+)\/rounds$/,
    file: '../api/v1/sessions/[id]/rounds.js',
  },
  {
    pattern: /^\/api\/v1\/sessions\/([^/]+)\/fusion$/,
    file: '../api/v1/sessions/[id]/fusion.js',
  },
  {
    pattern: /^\/api\/v1\/sessions\/([^/]+)\/feedback$/,
    file: '../api/v1/sessions/[id]/feedback.js',
  },
];

async function loadHandler(routePath) {
  const filePath = path.resolve(__dirname, routePath);
  delete require.cache[require.resolve(filePath)];
  const mod = require(filePath);
  return mod.default || mod;
}

function sendNotFound(res) {
  res.statusCode = 404;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify({ ok: false, error: { code: 'not_found', message: 'API route not found.' } }));
}

function handleOptions(res) {
  res.statusCode = 204;
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.end();
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method === 'OPTIONS') {
    handleOptions(res);
    return;
  }

  const url = new URL(req.url, 'http://127.0.0.1');
  let routePath = routes[url.pathname];
  const matchedDynamicRoute = dynamicRoutes.find((route) => route.pattern.test(url.pathname));

  if (!routePath && matchedDynamicRoute) {
    const match = url.pathname.match(matchedDynamicRoute.pattern);
    routePath = matchedDynamicRoute.file;
    req.query = { ...(req.query || {}), id: decodeURIComponent(match[1]) };
    req.params = { ...(req.params || {}), id: decodeURIComponent(match[1]) };
  }

  if (!routePath) {
    sendNotFound(res);
    return;
  }

  try {
    const handler = await loadHandler(routePath);
    handler(req, res);
  } catch (error) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({
      ok: false,
      error: {
        code: 'dev_server_error',
        message: error.message || 'Local API dev server failed.',
      },
    }));
  }
});

const port = Number(process.env.PORT || 3001);
server.listen(port, '127.0.0.1', () => {
  console.log(`AI Kitchen API dev server ready at http://127.0.0.1:${port}`);
});
