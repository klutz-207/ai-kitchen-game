const { handleApi, isNonEmptyArray, validationError } = require('../_lib/http');
const { generateDish } = require('../_lib/mock-service');

module.exports = (req, res) => {
  handleApi(req, res, 'POST', (body) => {
    if (!body.guestId) throw validationError('guestId is required.');
    if (!isNonEmptyArray(body.answers)) throw validationError('answers must include at least one item.');

    return {
      dish: generateDish({
        guestId: body.guestId,
        answers: body.answers,
        index: body.index,
      }),
    };
  });
};
