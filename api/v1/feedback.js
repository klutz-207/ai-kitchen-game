const { handleApi, validationError } = require('../_lib/http');
const { feedback } = require('../_lib/mock-service');

module.exports = (req, res) => {
  handleApi(req, res, 'POST', (body) => {
    if (!body.guestId) throw validationError('guestId is required.');
    if (!body.finalDish) throw validationError('finalDish is required.');

    return {
      feedback: feedback({
        guestId: body.guestId,
        answers: body.answers,
        finalDish: body.finalDish,
      }),
    };
  });
};
