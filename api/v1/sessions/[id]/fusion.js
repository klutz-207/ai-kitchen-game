const { handleApi, validationError } = require('../../../_lib/http');
const { fuseSession } = require('../../../_lib/ai-pipeline');

function getSessionId(req) {
  return req.query?.id || req.params?.id;
}

module.exports = (req, res) => {
  handleApi(req, res, 'POST', () => {
    const sessionId = getSessionId(req);
    if (!sessionId) throw validationError('sessionId is required.');

    return fuseSession({ sessionId });
  });
};
