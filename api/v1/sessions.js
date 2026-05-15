const { handleApi } = require('../_lib/http');
const { startSession } = require('../_lib/ai-pipeline');

module.exports = (req, res) => {
  handleApi(req, res, 'POST', (body) => startSession({
    guestId: body.guestId,
  }));
};
