const { handleApi } = require('../_lib/http');
const { getAiHealth } = require('../_lib/ai-health');

module.exports = (req, res) => {
  handleApi(req, res, 'GET', (_, request) => {
    const url = new URL(request.url, 'http://127.0.0.1');
    return getAiHealth({
      live: url.searchParams.get('live') === 'true',
    });
  });
};
