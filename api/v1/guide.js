const { handleApi, validationError } = require('../_lib/http');
const { guide } = require('../_lib/mock-service');

module.exports = (req, res) => {
  handleApi(req, res, 'POST', (body) => {
    if (!body.guestId) throw validationError('guestId is required.');

    return guide({
      guestId: body.guestId,
      round: body.round,
    });
  });
};
